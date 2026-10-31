// Catálogos y base de datos de demostración (ZMG).
// Los anuncios generados aquí son SIMULADOS para la demo: precios y ubicaciones
// aproximadas por colonia. Los anuncios reales entran por los conectores de carga.

const MUNICIPIOS = [
  "Guadalajara", "Zapopan", "San Pedro Tlaquepaque", "Tonalá", "Tlajomulco de Zúñiga",
  "El Salto", "Juanacatlán", "Ixtlahuacán de los Membrillos", "Zapotlanejo", "Acatlán de Juárez"
];

const TIPOS = ["casa", "departamento", "local", "terreno"];
const USOS = ["habitacional", "comercial"];
const OPERACIONES = ["venta", "renta"];

// Clasificación de vivienda SHF, de menor a mayor calidad.
const CLASES = ["mínima", "económica", "interés social", "media", "semilujo", "residencial", "residencial plus"];
// Vida útil total estimada por clase (años).
const VUT = { "mínima": 40, "económica": 50, "interés social": 50, "media": 60, "semilujo": 60, "residencial": 70, "residencial plus": 70 };

const CONSERVACION = ["nuevo", "remodelado", "bueno", "regular", "malo"];
const UBICACIONES = ["medio", "esquina", "cabecera"];

// Colonias de referencia: centroide aproximado, precio de venta de referencia por m² de construcción y clases predominantes.
const COLONIAS = [
  ["Guadalajara", "Providencia", 20.6970, -103.3800, 38000, ["residencial", "semilujo"]],
  ["Guadalajara", "Americana", 20.6740, -103.3700, 30000, ["media", "semilujo"]],
  ["Guadalajara", "Chapalita", 20.6640, -103.4010, 32000, ["semilujo", "residencial"]],
  ["Guadalajara", "Jardines del Bosque", 20.6600, -103.3880, 30000, ["semilujo", "media"]],
  ["Guadalajara", "Centro", 20.6767, -103.3475, 18000, ["media", "económica"]],
  ["Guadalajara", "Oblatos", 20.6950, -103.3000, 15000, ["interés social", "económica"]],
  ["Zapopan", "Puerta de Hierro", 20.7110, -103.4140, 45000, ["residencial plus", "residencial"]],
  ["Zapopan", "Valle Real", 20.7360, -103.4290, 40000, ["residencial plus", "residencial"]],
  ["Zapopan", "Ciudad Granja", 20.6800, -103.4450, 22000, ["media", "económica"]],
  ["Zapopan", "Las Águilas", 20.6450, -103.4130, 25000, ["media", "semilujo"]],
  ["Zapopan", "Santa Margarita", 20.7380, -103.4000, 24000, ["media"]],
  ["Zapopan", "Solares", 20.6400, -103.4650, 26000, ["semilujo", "media"]],
  ["San Pedro Tlaquepaque", "Centro Tlaquepaque", 20.6400, -103.3110, 20000, ["media", "económica"]],
  ["San Pedro Tlaquepaque", "Las Juntas", 20.6170, -103.3420, 13000, ["interés social", "económica"]],
  ["Tonalá", "Centro Tonalá", 20.6240, -103.2340, 13000, ["económica", "media"]],
  ["Tonalá", "Loma Dorada", 20.6380, -103.2600, 14000, ["interés social", "económica"]],
  ["Tlajomulco de Zúñiga", "Hacienda Santa Fe", 20.5240, -103.3770, 11000, ["interés social", "mínima"]],
  ["Tlajomulco de Zúñiga", "Bosques de Santa Anita", 20.5550, -103.4520, 20000, ["media", "semilujo"]],
  ["El Salto", "Centro El Salto", 20.5180, -103.1820, 10000, ["interés social", "económica"]],
  ["Juanacatlán", "Centro Juanacatlán", 20.5090, -103.1700, 9500, ["económica", "interés social"]],
  ["Ixtlahuacán de los Membrillos", "Centro Ixtlahuacán", 20.3510, -103.1900, 9000, ["interés social", "económica"]],
  ["Zapotlanejo", "Centro Zapotlanejo", 20.6230, -103.0690, 11000, ["económica", "media"]],
  ["Acatlán de Juárez", "Centro Acatlán", 20.4230, -103.5910, 9000, ["económica", "interés social"]]
];

// Generador pseudoaleatorio con semilla para que la demo sea reproducible.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generarDemo() {
  const rnd = mulberry32(20261031);
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const between = (a, b) => a + rnd() * (b - a);
  const out = [];
  let n = 1;
  for (const [municipio, colonia, lat, lng, base, clases] of COLONIAS) {
    for (let i = 0; i < 7; i++) {
      const r = rnd();
      const tipo = r < 0.5 ? "casa" : r < 0.62 ? "departamento" : r < 0.82 ? "local" : "terreno";
      const uso = tipo === "local" ? "comercial" : tipo === "terreno" ? (rnd() < 0.35 ? "comercial" : "habitacional") : "habitacional";
      const operacion = rnd() < 0.75 ? "venta" : "renta";
      const clase = tipo === "terreno" ? null : pick(clases);
      const supT = Math.round(tipo === "departamento" ? between(60, 160) : tipo === "terreno" ? between(120, 600) : between(90, 400));
      const supC = tipo === "terreno" ? 0 : Math.round(tipo === "departamento" ? supT : supT * between(0.8, 1.6));
      const edad = tipo === "terreno" ? null : Math.round(between(0, 45));
      const conservacion = tipo === "terreno" ? null : edad < 3 ? "nuevo" : rnd() < 0.2 ? "remodelado" : edad < 20 ? "bueno" : rnd() < 0.6 ? "regular" : "bueno";
      const ubicacion = rnd() < 0.2 ? "esquina" : "medio";
      // Precio de referencia con ajustes de mercado más ruido.
      const rankDiff = clase ? CLASES.indexOf(clase) - CLASES.indexOf(clases[0]) : 0;
      let unit = base * Math.pow(1.08, rankDiff) * between(0.88, 1.12);
      if (tipo === "terreno") unit *= 0.45;
      if (uso === "comercial") unit *= 1.2;
      if (edad != null) unit *= Math.max(0.6, 1 - edad * 0.008);
      if (conservacion === "remodelado") unit *= 1.06;
      if (conservacion === "regular") unit *= 0.9;
      if (ubicacion === "esquina" && uso === "comercial") unit *= 1.05;
      const sup = tipo === "terreno" ? supT : supC;
      let precio = unit * sup;
      if (operacion === "renta") precio = precio * 0.0055;
      precio = operacion === "renta" ? Math.round(precio / 100) * 100 : Math.round(precio / 10000) * 10000;
      out.push({
        id: "DEMO-" + String(n++).padStart(4, "0"),
        operacion, tipo, uso, municipio, colonia,
        lat: +(lat + between(-0.012, 0.012)).toFixed(5),
        lng: +(lng + between(-0.012, 0.012)).toFixed(5),
        precio, sup_terreno: supT, sup_construccion: supC,
        con_construccion: tipo !== "terreno",
        edad, clase, conservacion, ubicacion,
        remodelada: conservacion === "remodelado",
        fuente: "demo (simulado)", url: "", fecha: "2026-10-31"
      });
    }
  }
  return out;
}
