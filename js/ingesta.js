// Conectores de carga de anuncios:
//  1. CSV / JSON (exportaciones de portales, inmobiliarias o captura propia)
//  2. Texto de anuncio → Claude extrae y clasifica (tipo, uso, clase SHF, edad, conservación)
//  3. EasyBroker API (inventario oficial de inmobiliarias; requiere API key)

const CAMPOS = ["id", "operacion", "tipo", "uso", "municipio", "colonia", "lat", "lng", "precio",
  "sup_terreno", "sup_construccion", "edad", "clase", "conservacion", "ubicacion", "url", "fuente", "fecha"];

function normalizar(r) {
  const num = v => (v === "" || v == null ? null : Number(String(v).replace(/[$,\s]/g, "")));
  const txt = v => (v == null ? "" : String(v).trim().toLowerCase());
  const tipo = txt(r.tipo);
  const x = {
    id: r.id || "IMP-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    operacion: txt(r.operacion) || "venta",
    tipo,
    uso: txt(r.uso) || (tipo === "local" ? "comercial" : "habitacional"),
    municipio: r.municipio ? String(r.municipio).trim() : "",
    colonia: r.colonia ? String(r.colonia).trim() : "",
    lat: num(r.lat), lng: num(r.lng),
    precio: num(r.precio),
    sup_terreno: num(r.sup_terreno) ?? 0,
    sup_construccion: num(r.sup_construccion) ?? 0,
    edad: num(r.edad),
    clase: r.clase ? txt(r.clase) : null,
    conservacion: r.conservacion ? txt(r.conservacion) : null,
    ubicacion: txt(r.ubicacion) || "medio",
    url: r.url || "",
    fuente: r.fuente || "importado",
    fecha: r.fecha || new Date().toISOString().slice(0, 10)
  };
  x.con_construccion = x.sup_construccion > 0;
  x.remodelada = x.conservacion === "remodelado";
  return x;
}

function parseCSV(texto) {
  const filas = [];
  let fila = [], campo = "", comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (ch === '"') comillas = false;
      else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === ",") { fila.push(campo); campo = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo); filas.push(fila); fila = []; campo = "";
    } else campo += ch;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const [enc, ...datos] = filas.filter(f => f.some(c => c.trim() !== ""));
  const keys = enc.map(h => h.trim().toLowerCase());
  return datos.map(f => Object.fromEntries(keys.map((k, i) => [k, f[i]])));
}

function importarArchivo(nombre, texto) {
  const crudos = nombre.toLowerCase().endsWith(".json") ? JSON.parse(texto) : parseCSV(texto);
  return (Array.isArray(crudos) ? crudos : [crudos]).map(normalizar);
}

const PROMPT_EXTRACCION = `Eres un perito valuador en la Zona Metropolitana de Guadalajara, México.
Extrae los datos del anuncio inmobiliario y clasifícalo. Responde SOLO con un objeto JSON con estas llaves:
operacion ("venta"|"renta"), tipo ("casa"|"departamento"|"local"|"terreno"), uso ("habitacional"|"comercial"),
municipio (uno de: ${MUNICIPIOS.join(", ")}), colonia, lat, lng (coordenadas aproximadas del centro de la colonia),
precio (número MXN; si es renta, mensual), sup_terreno (m²), sup_construccion (m², 0 si es terreno),
edad (años estimados; null si es terreno), clase (clasificación SHF: ${CLASES.join(", ")}; null si es terreno),
conservacion (${CONSERVACION.join(", ")}; null si es terreno), ubicacion ("medio"|"esquina"|"cabecera"),
justificacion (una frase sobre por qué asignaste la clase y la conservación).
Si un dato no aparece, estímalo con criterio de valuador y menciónalo en justificacion.`;

async function extraerConClaude(textoAnuncio, apiKey, modelo) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 1024,
      system: PROMPT_EXTRACCION,
      messages: [{ role: "user", content: textoAnuncio }]
    })
  });
  if (!res.ok) throw new Error("Claude API " + res.status + ": " + (await res.text()).slice(0, 300));
  const data = await res.json();
  const texto = data.content.map(b => b.text || "").join("");
  const json = texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1);
  const r = JSON.parse(json);
  const x = normalizar({ ...r, fuente: "Claude (anuncio pegado)" });
  x.justificacion = r.justificacion || "";
  return x;
}

// EasyBroker: https://dev.easybroker.com — devuelve inventario publicado de la inmobiliaria dueña de la API key.
// Las propiedades vienen sin clase SHF; se marcan para clasificar después.
async function importarEasyBroker(apiKey, paginas = 2) {
  const out = [];
  for (let p = 1; p <= paginas; p++) {
    const res = await fetch(`https://api.easybroker.com/v1/properties?page=${p}&limit=50`, {
      headers: { "X-Authorization": apiKey, accept: "application/json" }
    });
    if (!res.ok) throw new Error("EasyBroker " + res.status);
    const data = await res.json();
    for (const it of data.content || []) {
      for (const op of it.operations || []) {
        const tipoEB = String(it.property_type || "").toLowerCase();
        out.push(normalizar({
          id: "EB-" + it.public_id + "-" + op.type,
          operacion: op.type === "rental" ? "renta" : "venta",
          tipo: tipoEB.includes("terreno") ? "terreno" : tipoEB.includes("local") ? "local" : tipoEB.includes("depart") ? "departamento" : "casa",
          colonia: it.location || "",
          precio: op.amount,
          sup_terreno: it.lot_size, sup_construccion: it.construction_size,
          url: it.public_url || "", fuente: "EasyBroker"
        }));
      }
    }
    if (!data.pagination || !data.pagination.next_page) break;
  }
  return out;
}
