// Interfaz de Arca Valoris: estado, mapa, homologación, base de datos y carga.

const LS_BASE = "arca-valoris-base-v2";
const LS_CFG = "arca-valoris-cfg-v1";

const $ = s => document.querySelector(s);
const fmt = (n, d = 0) => (n == null || !isFinite(n) ? "—" : n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d }));
const money = n => "$" + fmt(n);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Enlaces a Google Maps (sin API key): mapa y Street View en una pestaña nueva.
const gmapsUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
const streetUrl = (lat, lng) => `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
const gLinks = (lat, lng) => `<span class="glinks"><a href="${gmapsUrl(lat, lng)}" target="_blank" rel="noopener">Google Maps</a> · <a href="${streetUrl(lat, lng)}" target="_blank" rel="noopener">Street View</a></span>`;

function cargarLS(k, def) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; }
}
function guardarLS(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: la app sigue en memoria */ }
}

let BASE = cargarLS(LS_BASE, null) || generarDemo();
let CFG = { ...CONFIG_DEFAULT, ...cargarLS(LS_CFG, {}) };
let filas = [];   // comparables homologados en pantalla
let sujetoActual = null;

// ---------- pestañas ----------
document.querySelectorAll("nav.tabs button").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll("nav.tabs button").forEach(x => x.classList.toggle("on", x === b));
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("on", t.id === "tab-" + b.dataset.tab));
  if (b.dataset.tab === "valuacion") setTimeout(() => map.invalidateSize(), 50);
  if (b.dataset.tab === "base") renderBase();
}));

function opciones(sel, arr, valor) {
  sel.innerHTML = arr.map(v => `<option${v === valor ? " selected" : ""}>${esc(v)}</option>`).join("");
}

// ---------- formulario sujeto ----------
const F = $("#sujeto");
opciones(F.operacion, OPERACIONES, "venta");
opciones(F.tipo, TIPOS, "casa");
opciones(F.uso, USOS, "habitacional");
opciones(F.municipio, MUNICIPIOS, "Guadalajara");
opciones(F.clase, CLASES, "semilujo");
opciones(F.conservacion, CONSERVACION, "bueno");
opciones(F.ubicacion, UBICACIONES, "medio");

function toggleTerreno() {
  const t = F.tipo.value === "terreno";
  document.querySelectorAll("#sujeto .nt").forEach(el => (el.style.display = t ? "none" : ""));
  F.sup_construccion.closest("label").style.display = t ? "none" : "";
}
F.tipo.addEventListener("change", () => {
  const usoPorTipo = { casa: "habitacional", departamento: "habitacional", local: "comercial", oficina: "comercial", bodega: "industrial" };
  if (usoPorTipo[F.tipo.value]) F.uso.value = usoPorTipo[F.tipo.value];
  toggleTerreno();
});
toggleTerreno();

function leerSujeto() {
  const n = k => Number(F[k].value);
  const tipo = F.tipo.value;
  return {
    operacion: F.operacion.value, tipo, uso: F.uso.value, municipio: F.municipio.value,
    calle: F.calle.value, colonia: F.colonia.value, cp: F.cp.value,
    lat: n("lat"), lng: n("lng"), sup_terreno: n("sup_terreno"),
    sup_construccion: tipo === "terreno" ? 0 : n("sup_construccion"),
    edad: tipo === "terreno" ? null : n("edad"),
    clase: tipo === "terreno" ? null : F.clase.value,
    conservacion: tipo === "terreno" ? null : F.conservacion.value,
    ubicacion: F.ubicacion.value
  };
}

// ---------- mapa ----------
const map = L.map("map").setView([20.66, -103.35], 11);
const capaOscura = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  maxZoom: 19, subdomains: "abcd", className: "tiles-dark", attribution: "© OpenStreetMap · © CARTO"
}).addTo(map);
// Satélite gratuito (Esri World Imagery) con calles y nombres encima; sin API key.
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/";
const capaSatelite = L.layerGroup([
  L.tileLayer(ESRI + "World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19, attribution: "Imágenes © Esri, Maxar, Earthstar Geographics"
  }),
  L.tileLayer(ESRI + "Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, opacity: 0.8 }),
  L.tileLayer(ESRI + "Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 })
]);
L.control.layers({ "Mapa": capaOscura, "Satélite": capaSatelite }, null, { position: "topright", collapsed: false }).addTo(map);
const capaBase = L.layerGroup().addTo(map);
const capaComp = L.layerGroup().addTo(map);
let marcadorSujeto = null;
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

function pintarBase() {
  capaBase.clearLayers();
  for (const x of BASE) {
    if (!Number.isFinite(x.lat) || !Number.isFinite(x.lng)) continue;
    L.circleMarker([x.lat, x.lng], { radius: 3, color: css("--base"), weight: 1, fillOpacity: 0.5 })
      .bindTooltip(`${x.tipo} · ${x.operacion} · ${x.colonia}<br>${money(x.precio)}`)
      .bindPopup(`<b>${esc(x.tipo)} · ${esc(x.operacion)}</b><br>${esc(x.colonia)}, ${esc(x.municipio)}<br>${money(x.precio)}<br>${gLinks(x.lat, x.lng)}`)
      .addTo(capaBase);
  }
}
const iconoSujeto = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:${css("--subj")};border:3px solid #fff;box-shadow:0 0 0 2px ${css("--subj")}"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10]
});
function pintarSujeto(centrar = false) {
  const s = leerSujeto();
  if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) return;
  if (marcadorSujeto) marcadorSujeto.remove();
  marcadorSujeto = L.marker([s.lat, s.lng], { icon: iconoSujeto, draggable: true, zIndexOffset: 1000 })
    .bindTooltip("Sujeto · arrástrame").addTo(map);
  marcadorSujeto.on("dragend", e => fijarUbicacion(e.target.getLatLng(), true));
  if (centrar) map.setView([s.lat, s.lng], 16);
}

// Coloca el sujeto en un punto; si viene del mapa, completa el domicilio por geocodificación inversa.
async function fijarUbicacion(ll, completarDomicilio) {
  F.lat.value = ll.lat.toFixed(6);
  F.lng.value = ll.lng.toFixed(6);
  pintarSujeto();
  if (!completarDomicilio) return;
  $("#geo-out").innerHTML = `<p class="muted">Buscando domicilio…</p>`;
  try {
    const d = await geocodificarInverso(ll.lat, ll.lng);
    if (!d) { $("#geo-out").innerHTML = ""; return; }
    if (d.calle) F.calle.value = d.calle;
    if (d.colonia) F.colonia.value = d.colonia;
    if (d.cp) F.cp.value = d.cp;
    if (d.municipio) F.municipio.value = d.municipio;
    $("#geo-out").innerHTML = `<p class="ok">📍 ${esc(d.etiqueta)}<br>${gLinks(ll.lat.toFixed(6), ll.lng.toFixed(6))}</p>`;
  } catch (e) { $("#geo-out").innerHTML = ""; }
}

map.on("click", e => fijarUbicacion(e.latlng, true));
F.lat.addEventListener("change", () => pintarSujeto(true));
F.lng.addEventListener("change", () => pintarSujeto(true));

async function ubicarDomicilio() {
  const s = leerSujeto();
  if (!s.calle && !s.colonia && !s.cp) { $("#geo-out").innerHTML = `<p class="err">Escribe al menos la calle, la colonia o el C.P.</p>`; return; }
  $("#geo-out").innerHTML = `<p class="muted">Buscando “${esc([s.calle, s.colonia, s.municipio].filter(Boolean).join(", "))}”…</p>`;
  try {
    const rs = await geocodificar(s);
    if (!rs.length) { $("#geo-out").innerHTML = `<p class="err">No encontré ese domicilio en la ZMG. Revisa la escritura o haz clic en el mapa.</p>`; return; }
    const elegir = r => {
      fijarUbicacion({ lat: r.lat, lng: r.lng }, false);
      if (r.municipio) F.municipio.value = r.municipio;
      if (r.colonia && !F.colonia.value) F.colonia.value = r.colonia;
      if (r.cp && !F.cp.value) F.cp.value = r.cp;
      map.setView([r.lat, r.lng], 17);
      if (gm) { gm.map.setCenter({ lat: r.lat, lng: r.lng }); gm.map.setZoom(18); gmStreetView(r.lat, r.lng, "Sujeto"); }
      $("#geo-out").innerHTML = `<p class="${r.aproximado ? "err" : "ok"}">📍 ${esc(r.etiqueta)}<br>${gLinks(r.lat, r.lng)}${r.aproximado
        ? "<br>Ubicación aproximada (no se encontró el número exacto): arrastra el marcador al predio." : ""}</p>`;
    };
    elegir(rs[0]);
    if (rs.length > 1) {
      $("#geo-out").insertAdjacentHTML("beforeend", `<p class="muted">¿No es este? Otras coincidencias:</p>` +
        rs.slice(1).map((r, i) => `<button type="button" data-i="${i + 1}">${esc(r.etiqueta)}</button>`).join(""));
      $("#geo-out").querySelectorAll("button").forEach(b => b.addEventListener("click", () => elegir(rs[+b.dataset.i])));
    }
  } catch (e) { $("#geo-out").innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}
$("#btn-ubicar").addEventListener("click", ubicarDomicilio);
[F.calle, F.colonia, F.cp].forEach(i => i.addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); ubicarDomicilio(); }
}));

// ---------- homologación ----------
F.addEventListener("submit", e => {
  e.preventDefault();
  sujetoActual = leerSujeto();
  if (!(superficieBase(sujetoActual) > 0)) { alert("Captura la superficie del sujeto."); return; }
  const comps = buscarComparables(sujetoActual, BASE, CFG);
  filas = comps.map((c, i) => {
    const h = homologar(sujetoActual, c, CFG, 1);
    return { n: i + 1, c, fz: 1, h, incluir: h.dentroDeRango };
  });
  pintarSujeto();
  capaComp.clearLayers();
  const pts = [[sujetoActual.lat, sujetoActual.lng]];
  for (const r of filas) {
    pts.push([r.c.lat, r.c.lng]);
    L.circleMarker([r.c.lat, r.c.lng], { radius: 8, color: css("--comp"), weight: 2, fillOpacity: 0.8 })
      .bindTooltip(`#${r.n} ${r.c.colonia}`, { permanent: true, direction: "top", className: "lbl" })
      .bindPopup(`<b>#${r.n} ${esc(r.c.colonia)}</b><br>${money(r.c.precio)} · ${fmt(superficieBase(r.c))} m²<br>${gLinks(r.c.lat, r.c.lng)}`)
      .addTo(capaComp);
  }
  if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
  renderHomologacion();
  gmMostrar(sujetoActual, filas);
});

function renderHomologacion() {
  const s = sujetoActual;
  const terreno = s.tipo === "terreno";
  for (const r of filas) r.h = homologar(s, r.c, CFG, r.fz);
  const unidad = terreno ? "m² terreno" : "m² construcción";
  const cols = terreno
    ? ["negociacion", "zona", "ubicacion", "superficie"]
    : ["negociacion", "zona", "ubicacion", "superficie", "edad", "conservacion", "calidad"];
  const nombres = { negociacion: "F.neg", zona: "F.zona", ubicacion: "F.ubic", superficie: "F.sup", edad: "F.edad", conservacion: "F.cons", calidad: "F.cal" };

  let html = `<thead><tr><th>#</th><th class="l">Colonia / municipio</th><th class="l">Clase · edad · cons.</th><th>Dist. km</th>
    <th>Precio</th><th>Sup.</th><th>$/${unidad}</th>${cols.map(k => `<th>${nombres[k]}</th>`).join("")}
    <th>F. resultante</th><th>$/m² homologado</th><th>Usar</th></tr></thead><tbody>`;
  for (const r of filas) {
    const c = r.c, f = r.h.factores;
    html += `<tr class="${r.h.dentroDeRango ? "" : "fuera"}">
      <td>${r.n}</td>
      <td class="l">${esc(c.colonia)}<br><span class="muted">${esc(c.municipio)} · ${esc(c.fuente)}</span><br>${gLinks(c.lat, c.lng)}${gm ? `<br><button type="button" class="gsv" data-n="${r.n}">Ver fachada</button>` : ""}</td>
      <td class="l">${terreno ? "—" : `${esc(c.clase)} · ${c.edad ?? "—"} a · ${esc(c.conservacion)}`}</td>
      <td>${fmt(c.distanciaKm, 1)}</td>
      <td>${money(c.precio)}</td>
      <td>${fmt(superficieBase(c))}</td>
      <td>${money(r.h.unitario)}</td>
      ${cols.map(k => k === "zona"
        ? `<td><input class="fz" type="number" step="0.01" value="${r.fz}" data-n="${r.n}"></td>`
        : `<td>${fmt(f[k], 3)}</td>`).join("")}
      <td><b>${fmt(r.h.resultante, 3)}</b></td>
      <td><b>${money(r.h.homologado)}</b></td>
      <td><input type="checkbox" class="inc" data-n="${r.n}" ${r.incluir ? "checked" : ""}></td>
    </tr>`;
  }
  $("#tabla-homo").innerHTML = html + "</tbody>";
  $("#tabla-homo").querySelectorAll("input.fz").forEach(i => i.addEventListener("change", e => {
    const r = filas.find(x => x.n == e.target.dataset.n); r.fz = Number(e.target.value) || 1; renderHomologacion();
  }));
  $("#tabla-homo").querySelectorAll("button.gsv").forEach(b => b.addEventListener("click", () => {
    const r = filas.find(x => x.n == b.dataset.n);
    gmStreetView(r.c.lat, r.c.lng, `#${r.n} ${r.c.colonia}`);
    $("#gcard").scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  $("#tabla-homo").querySelectorAll("input.inc").forEach(i => i.addEventListener("change", e => {
    filas.find(x => x.n == e.target.dataset.n).incluir = e.target.checked; renderHomologacion();
  }));

  const res = concluir(s, filas);
  const avisos = [];
  if (filas.length < CFG.minComparables) avisos.push(`Solo hay ${filas.length} comparables del mismo tipo, uso y operación; el mínimo configurado es ${CFG.minComparables}. Carga más anuncios.`);
  if (res && res.n < CFG.minComparables) avisos.push(`Se están usando ${res.n} comparables; el mínimo configurado es ${CFG.minComparables}.`);
  if (res && res.cv > 0.15) avisos.push(`Coeficiente de variación de ${fmt(res.cv * 100, 1)}%: dispersión alta, revisa comparables y factores.`);
  const fuera = filas.filter(r => !r.h.dentroDeRango).length;
  if (fuera) avisos.push(`${fuera} comparable(s) con factor resultante fuera de ${CFG.rangoMin}–${CFG.rangoMax}.`);
  $("#avisos").innerHTML = avisos.map(a => `<div class="aviso">${esc(a)}</div>`).join("");

  $("#kpis").innerHTML = res ? `
    <div class="kpi main"><span>Valor ${s.operacion === "renta" ? "de renta mensual" : "comercial"} (enfoque de mercado)</span><b>${money(res.valor)}</b></div>
    <div class="kpi"><span>$/${unidad} homologado</span><b>${money(res.unitarioPromedio)}</b></div>
    <div class="kpi"><span>Rango homologado</span><b>${money(res.min)} – ${money(res.max)}</b></div>
    <div class="kpi"><span>Coef. de variación</span><b>${fmt(res.cv * 100, 1)}%</b></div>
    <div class="kpi"><span>Comparables usados</span><b>${res.n} de ${filas.length}</b></div>`
    : `<div class="aviso">No hay comparables seleccionados.</div>`;
  $("#resultado").hidden = false;
}
$("#imprimir").addEventListener("click", () => window.print());

// ---------- base de datos ----------
const FILTROS = [["operacion", OPERACIONES], ["tipo", TIPOS], ["uso", USOS], ["municipio", MUNICIPIOS], ["clase", CLASES]];
$("#filtros").innerHTML = FILTROS.map(([k, arr]) =>
  `<label>${k}<select data-k="${k}"><option value="">Todos</option>${arr.map(v => `<option>${esc(v)}</option>`).join("")}</select></label>`).join("");
$("#filtros").addEventListener("change", renderBase);

function renderBase() {
  const f = {};
  $("#filtros").querySelectorAll("select").forEach(s => { if (s.value) f[s.dataset.k] = s.value; });
  const rows = BASE.filter(x => Object.entries(f).every(([k, v]) => x[k] === v));
  $("#conteo").textContent = `${fmt(rows.length)} de ${fmt(BASE.length)} inmuebles`;
  const head = ["id", "fecha", "operacion", "tipo", "uso", "municipio", "colonia", "precio", "sup_terreno", "sup_construccion",
    "edad", "clase", "conservacion", "recamaras", "banos", "estacionamientos", "fuente"];
  $("#tabla-base").innerHTML = `<thead><tr>${head.map(h => `<th class="l">${h}</th>`).join("")}</tr></thead><tbody>` +
    rows.slice(0, 400).map(x => `<tr>${head.map(h => `<td class="l">${h === "precio" ? money(x[h]) : esc(x[h] ?? "—")}</td>`).join("")}</tr>`).join("") + "</tbody>";
}

function aCSV(rows) {
  const q = v => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  return [CAMPOS.join(","), ...rows.map(r => CAMPOS.map(k => q(r[k])).join(","))].join("\n");
}
function descargar(nombre, texto) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
  a.download = nombre; a.click();
}
$("#exportar").addEventListener("click", () => descargar("arca-valoris-base.csv", aCSV(BASE)));

function agregar(nuevos) {
  const ids = new Set(nuevos.map(x => x.id));
  BASE = BASE.filter(x => !ids.has(x.id)).concat(nuevos);
  guardarLS(LS_BASE, BASE);
  pintarBase(); actualizarStats();
}

// ---------- carga ----------
$(".cols-list").textContent = CAMPOS.join(", ");
$("#plantilla").addEventListener("click", e => { e.preventDefault(); descargar("plantilla-arca-valoris.csv", aCSV(BASE.slice(0, 3))); });

$("#archivo").addEventListener("change", async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const nuevos = importarArchivo(file.name, await file.text());
    agregar(nuevos);
    $("#arch-out").innerHTML = `<p class="ok">${nuevos.length} inmuebles importados.</p>`;
  } catch (err) { $("#arch-out").innerHTML = `<p class="err">${esc(err.message)}</p>`; }
});

$("#btn-ia").addEventListener("click", async () => {
  const key = $("#ak").value.trim(), txt = $("#anuncio").value.trim();
  if (!key || !txt) { $("#ia-out").innerHTML = `<p class="err">Falta la API key o el anuncio.</p>`; return; }
  $("#ia-out").innerHTML = `<p class="muted">Analizando con Claude…</p>`;
  try {
    const lote = await extraerConClaude(txt, key, $("#modelo").value.trim());
    agregar(lote);
    $("#ia-out").innerHTML = `<p class="ok">${lote.length} anuncio(s) agregados a la base.</p>` + lote.map(x => `<div class="ficha">
      <b>${esc(x.id)}</b> · ${esc(x.operacion)} · ${esc(x.tipo)} · ${esc(x.uso)} · ${esc(x.colonia)}, ${esc(x.municipio)}<br>
      ${money(x.precio)} · terreno ${fmt(x.sup_terreno)} m² · construcción ${fmt(x.sup_construccion)} m²<br>
      Clase: <b>${esc(x.clase ?? "—")}</b> · edad ${x.edad ?? "—"} a · ${esc(x.conservacion ?? "—")}<br>
      <span class="muted">${esc(x.justificacion)}</span></div>`).join("");
  } catch (err) { $("#ia-out").innerHTML = `<p class="err">${esc(err.message)}</p>`; }
});

$("#btn-eb").addEventListener("click", async () => {
  const key = $("#ebk").value.trim();
  if (!key) { $("#eb-out").innerHTML = `<p class="err">Falta la API key.</p>`; return; }
  $("#eb-out").innerHTML = `<p class="muted">Sincronizando…</p>`;
  try {
    const nuevos = await importarEasyBroker(key);
    agregar(nuevos);
    $("#eb-out").innerHTML = `<p class="ok">${nuevos.length} operaciones importadas. Sin coordenadas ni clase SHF: complétalas antes de usarlas como comparables.</p>`;
  } catch (err) {
    $("#eb-out").innerHTML = `<p class="err">${esc(err.message)}. Si el navegador bloquea la conexión (CORS), la sincronización debe correr en servidor.</p>`;
  }
});

// ---------- configuración ----------
const ETIQ = {
  factorNegociacion: "Factor de negociación", exponenteSuperficie: "Exponente de superficie",
  pasoCalidad: "Paso entre clases (calidad)", rangoMin: "Factor resultante mínimo", rangoMax: "Factor resultante máximo",
  numComparables: "Comparables a buscar", minComparables: "Mínimo de comparables", radioKm: "Radio de búsqueda (km)"
};
$("#cfg").innerHTML = Object.keys(CONFIG_DEFAULT).map(k =>
  `<label>${ETIQ[k]}<input type="number" step="any" data-k="${k}" value="${CFG[k]}"></label>`).join("");
$("#cfg").addEventListener("change", e => {
  CFG[e.target.dataset.k] = Number(e.target.value);
  guardarLS(LS_CFG, CFG);
});
$("#reset-base").addEventListener("click", () => {
  BASE = generarDemo(); guardarLS(LS_BASE, BASE); pintarBase(); actualizarStats(); renderBase();
});

function actualizarStats() {
  const munis = new Set(BASE.map(x => x.municipio).filter(Boolean)).size;
  $("#stats").textContent = `${fmt(BASE.length)} inmuebles en la base · ${munis} municipios de la ZMG`;
  $("#stat-n").textContent = fmt(BASE.length);
  $("#stat-m").textContent = munis;
}

// ---------- Google Maps ----------
$("#gkey").value = leerGKey() ? "••••••••" : "";
$("#gkey-guardar").addEventListener("click", async () => {
  const k = $("#gkey").value.trim();
  if (!k || k.startsWith("•")) { $("#gkey-out").textContent = "Pega la API key."; return; }
  guardarGKey(k);
  $("#gkey").value = "••••••••";
  $("#gkey-out").textContent = "Conectando…";
  const ok = await iniciarGoogle();
  $("#gkey-out").textContent = ok ? "Conectado. Ve a Valuación y busca comparables." : $("#g-estado").textContent;
  if (ok && sujetoActual) { renderHomologacion(); gmMostrar(sujetoActual, filas); }
});
$("#gkey-borrar").addEventListener("click", () => {
  guardarGKey("");
  $("#gkey").value = "";
  $("#gkey-out").textContent = "Key eliminada de este navegador. Recarga la página.";
});

pintarBase();
pintarSujeto();
actualizarStats();
iniciarGoogle();
