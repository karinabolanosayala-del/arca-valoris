// Catálogos y base de datos de demostración (ZMG).
// Los anuncios generados aquí son SIMULADOS para la demo: precios y ubicaciones
// aproximadas por colonia. Los anuncios reales entran por los conectores de carga.

const MUNICIPIOS = [
  "Guadalajara", "Zapopan", "San Pedro Tlaquepaque", "Tonalá", "Tlajomulco de Zúñiga",
  "El Salto", "Juanacatlán", "Ixtlahuacán de los Membrillos", "Zapotlanejo", "Acatlán de Juárez"
];

const TIPOS = ["casa", "departamento", "local", "oficina", "bodega", "terreno"];
const USOS = ["habitacional", "comercial", "industrial", "mixto"];
const OPERACIONES = ["venta", "renta"];

// Clasificación de vivienda SHF, de menor a mayor calidad.
const CLASES = ["mínima", "económica", "interés social", "media", "semilujo", "residencial", "residencial plus"];
// Vida útil total estimada por clase (años).
const VUT = { "mínima": 40, "económica": 50, "interés social": 50, "media": 60, "semilujo": 60, "residencial": 70, "residencial plus": 70 };

const CONSERVACION = ["nuevo", "remodelado", "bueno", "regular", "malo"];
const UBICACIONES = ["medio", "esquina", "cabecera"];

// Colonias de referencia: municipio, colonia, centroide aproximado, precio de venta de referencia
// por m² de construcción (MXN), clases predominantes y perfil ("c" corredor comercial, "i" industrial).
const COLONIAS = [
  ["Guadalajara", "Providencia", 20.6970, -103.3800, 38000, ["residencial", "semilujo"], "c"],
  ["Guadalajara", "Country Club", 20.7020, -103.3680, 36000, ["residencial plus", "residencial"], ""],
  ["Guadalajara", "Americana", 20.6740, -103.3700, 30000, ["media", "semilujo"], "c"],
  ["Guadalajara", "Lafayette", 20.6730, -103.3800, 34000, ["semilujo", "residencial"], "c"],
  ["Guadalajara", "Ladrón de Guevara", 20.6850, -103.3720, 33000, ["semilujo", "residencial"], ""],
  ["Guadalajara", "Chapalita", 20.6640, -103.4010, 32000, ["semilujo", "residencial"], "c"],
  ["Guadalajara", "Jardines del Bosque", 20.6600, -103.3880, 30000, ["semilujo", "media"], ""],
  ["Guadalajara", "Colinas de la Normal", 20.6990, -103.3520, 26000, ["semilujo", "media"], ""],
  ["Guadalajara", "Santa Teresita", 20.6820, -103.3600, 22000, ["media"], "c"],
  ["Guadalajara", "Mezquitán Country", 20.6950, -103.3550, 20000, ["media", "económica"], ""],
  ["Guadalajara", "Jardines Alcalde", 20.7080, -103.3480, 20000, ["media", "económica"], ""],
  ["Guadalajara", "Centro", 20.6767, -103.3475, 18000, ["media", "económica"], "c"],
  ["Guadalajara", "Libertad", 20.6640, -103.3220, 15000, ["económica", "interés social"], "c"],
  ["Guadalajara", "Oblatos", 20.6950, -103.3000, 15000, ["interés social", "económica"], ""],
  ["Guadalajara", "Polanco", 20.6380, -103.3480, 14000, ["interés social", "económica"], ""],
  ["Guadalajara", "Miravalle", 20.6230, -103.3550, 12000, ["interés social", "mínima"], "i"],
  ["Zapopan", "Puerta de Hierro", 20.7110, -103.4140, 45000, ["residencial plus", "residencial"], "c"],
  ["Zapopan", "Real Acueducto", 20.7120, -103.4060, 48000, ["residencial plus"], "c"],
  ["Zapopan", "Colinas de San Javier", 20.6990, -103.4000, 42000, ["residencial plus", "residencial"], ""],
  ["Zapopan", "Valle Real", 20.7360, -103.4290, 40000, ["residencial plus", "residencial"], ""],
  ["Zapopan", "El Bajío", 20.6780, -103.4680, 35000, ["residencial", "semilujo"], ""],
  ["Zapopan", "Bugambilias", 20.6180, -103.4370, 30000, ["residencial", "semilujo"], ""],
  ["Zapopan", "Ciudad del Sol", 20.6510, -103.4060, 28000, ["semilujo", "media"], "c"],
  ["Zapopan", "Jardines Universidad", 20.6710, -103.4250, 27000, ["semilujo", "media"], ""],
  ["Zapopan", "Solares", 20.6400, -103.4650, 26000, ["semilujo", "media"], ""],
  ["Zapopan", "Las Águilas", 20.6450, -103.4130, 25000, ["media", "semilujo"], "c"],
  ["Zapopan", "Santa Margarita", 20.7380, -103.4000, 24000, ["media"], ""],
  ["Zapopan", "Ciudad Granja", 20.6800, -103.4450, 22000, ["media", "económica"], "i"],
  ["Zapopan", "Zapopan Centro", 20.7210, -103.3910, 20000, ["media", "económica"], "c"],
  ["Zapopan", "Arcos de Zapopan", 20.7440, -103.4140, 15000, ["interés social", "económica"], ""],
  ["Zapopan", "Tabachines", 20.7470, -103.3830, 13000, ["interés social", "económica"], ""],
  ["San Pedro Tlaquepaque", "Centro Tlaquepaque", 20.6400, -103.3110, 20000, ["media", "económica"], "c"],
  ["San Pedro Tlaquepaque", "Fracc. Revolución", 20.6280, -103.3080, 15000, ["económica", "interés social"], ""],
  ["San Pedro Tlaquepaque", "Las Juntas", 20.6170, -103.3420, 13000, ["interés social", "económica"], "i"],
  ["San Pedro Tlaquepaque", "Parques del Bosque", 20.6070, -103.3250, 13000, ["interés social"], ""],
  ["Tonalá", "Centro Tonalá", 20.6240, -103.2340, 13000, ["económica", "media"], "c"],
  ["Tonalá", "Loma Dorada", 20.6380, -103.2600, 14000, ["interés social", "económica"], ""],
  ["Tonalá", "Rancho de la Cruz", 20.6430, -103.2420, 12000, ["interés social", "económica"], ""],
  ["Tonalá", "Jauja", 20.6050, -103.2550, 11000, ["interés social", "mínima"], ""],
  ["Tlajomulco de Zúñiga", "Valle de Tejeda", 20.5480, -103.4230, 21000, ["media", "semilujo"], ""],
  ["Tlajomulco de Zúñiga", "Bosques de Santa Anita", 20.5550, -103.4520, 20000, ["media", "semilujo"], ""],
  ["Tlajomulco de Zúñiga", "Cajititlán", 20.4270, -103.3150, 14000, ["media", "económica"], ""],
  ["Tlajomulco de Zúñiga", "Centro Tlajomulco", 20.4740, -103.4440, 13000, ["económica", "media"], "c"],
  ["Tlajomulco de Zúñiga", "Hacienda Santa Fe", 20.5240, -103.3770, 11000, ["interés social", "mínima"], "i"],
  ["Tlajomulco de Zúñiga", "Chulavista", 20.5130, -103.3790, 10500, ["interés social", "mínima"], ""],
  ["El Salto", "Las Pintitas", 20.5700, -103.3000, 11000, ["interés social", "económica"], "i"],
  ["El Salto", "Centro El Salto", 20.5180, -103.1820, 10000, ["interés social", "económica"], "i"],
  ["Juanacatlán", "Centro Juanacatlán", 20.5090, -103.1700, 9500, ["económica", "interés social"], ""],
  ["Ixtlahuacán de los Membrillos", "Centro Ixtlahuacán", 20.3510, -103.1900, 9000, ["interés social", "económica"], ""],
  ["Ixtlahuacán de los Membrillos", "Los Olivos", 20.3950, -103.2180, 9500, ["interés social", "mínima"], ""],
  ["Zapotlanejo", "Centro Zapotlanejo", 20.6230, -103.0690, 11000, ["económica", "media"], "c"],
  ["Acatlán de Juárez", "Centro Acatlán", 20.4230, -103.5910, 9000, ["económica", "interés social"], ""]
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

const POR_COLONIA = 14;

function generarDemo() {
  const rnd = mulberry32(20261031);
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const between = (a, b) => a + rnd() * (b - a);
  const elegirTipo = perfil => {
    const pesos = perfil === "i"
      ? { casa: 30, departamento: 5, local: 10, oficina: 5, bodega: 30, terreno: 20 }
      : perfil === "c"
        ? { casa: 30, departamento: 18, local: 20, oficina: 15, bodega: 4, terreno: 13 }
        : { casa: 50, departamento: 20, local: 8, oficina: 5, bodega: 3, terreno: 14 };
    let r = rnd() * Object.values(pesos).reduce((a, b) => a + b, 0);
    for (const [t, p] of Object.entries(pesos)) { if ((r -= p) < 0) return t; }
    return "casa";
  };
  const hoy = new Date("2026-10-31");
  const out = [];
  let n = 1;
  for (const [municipio, colonia, lat, lng, base, clases, perfil] of COLONIAS) {
    for (let i = 0; i < POR_COLONIA; i++) {
      const tipo = elegirTipo(perfil);
      const uso = {
        casa: rnd() < 0.08 ? "mixto" : "habitacional",
        departamento: "habitacional",
        local: rnd() < 0.15 ? "mixto" : "comercial",
        oficina: "comercial",
        bodega: "industrial",
        terreno: perfil === "i" && rnd() < 0.5 ? "industrial" : rnd() < 0.3 ? "comercial" : "habitacional"
      }[tipo];
      const operacion = rnd() < (tipo === "oficina" || tipo === "bodega" || tipo === "local" ? 0.45 : 0.75) ? "venta" : "renta";
      const clase = tipo === "terreno" ? null : tipo === "bodega" ? pick(["económica", "media"]) : pick(clases);

      let supT, supC;
      if (tipo === "departamento") { supC = Math.round(between(55, 220)); supT = supC; }
      else if (tipo === "terreno") { supT = Math.round(uso === "industrial" ? between(1000, 8000) : between(120, 900)); supC = 0; }
      else if (tipo === "bodega") { supT = Math.round(between(400, 4000)); supC = Math.round(supT * between(0.6, 0.95)); }
      else if (tipo === "oficina") { supC = Math.round(between(45, 450)); supT = rnd() < 0.7 ? supC : Math.round(supC * between(0.5, 0.9)); }
      else if (tipo === "local") { supC = Math.round(between(30, 350)); supT = Math.round(supC * between(0.8, 1.3)); }
      else { supT = Math.round(between(90, 500)); supC = Math.round(supT * between(0.8, 1.7)); }

      const edad = tipo === "terreno" ? null : Math.round(rnd() < 0.15 ? between(0, 2) : between(2, 50));
      const conservacion = tipo === "terreno" ? null
        : edad <= 2 ? "nuevo"
        : rnd() < 0.18 ? "remodelado"
        : edad < 15 ? (rnd() < 0.85 ? "bueno" : "regular")
        : edad < 35 ? pick(["bueno", "bueno", "regular"])
        : pick(["regular", "regular", "malo", "bueno"]);
      const ubicacion = rnd() < (uso === "comercial" ? 0.3 : 0.15) ? "esquina" : rnd() < 0.05 ? "cabecera" : "medio";

      // Precio de referencia con ajustes de mercado más ruido.
      const rankDiff = clase ? CLASES.indexOf(clase) - CLASES.indexOf(clases[0]) : 0;
      let unit = base * Math.pow(1.08, rankDiff) * between(0.85, 1.15);
      if (tipo === "departamento") unit *= 1.08;
      if (tipo === "oficina") unit *= 1.1;
      if (tipo === "bodega") unit *= 0.5;
      if (tipo === "terreno") unit *= uso === "industrial" ? 0.22 : 0.45;
      if (uso === "comercial") unit *= 1.2;
      if (uso === "mixto") unit *= 1.1;
      if (edad != null) unit *= Math.max(0.55, 1 - edad * 0.008);
      unit *= { nuevo: 1.05, remodelado: 1.06, bueno: 1, regular: 0.88, malo: 0.72 }[conservacion] ?? 1;
      if (ubicacion === "esquina" && uso !== "habitacional") unit *= 1.05;
      const sup = tipo === "terreno" ? supT : supC;
      let precio = unit * sup;
      if (operacion === "renta") precio *= tipo === "casa" || tipo === "departamento" ? 0.0055 : 0.007;
      precio = operacion === "renta" ? Math.round(precio / 100) * 100 : Math.round(precio / 10000) * 10000;

      const vivienda = tipo === "casa" || tipo === "departamento";
      const recamaras = vivienda ? Math.max(1, Math.min(6, Math.round(supC / 70 + between(-0.5, 0.8)))) : null;
      const fecha = new Date(hoy.getTime() - Math.floor(between(0, 120)) * 86400000).toISOString().slice(0, 10);

      out.push({
        id: "DEMO-" + String(n++).padStart(4, "0"),
        operacion, tipo, uso, municipio, colonia,
        lat: +(lat + between(-0.013, 0.013)).toFixed(5),
        lng: +(lng + between(-0.013, 0.013)).toFixed(5),
        precio, sup_terreno: supT, sup_construccion: supC,
        con_construccion: tipo !== "terreno",
        edad, clase, conservacion, ubicacion,
        remodelada: conservacion === "remodelado",
        recamaras,
        banos: vivienda ? Math.max(1, Math.round(recamaras * between(0.7, 1.3) * 2) / 2) : tipo === "terreno" ? null : Math.max(1, Math.round(supC / 150)),
        estacionamientos: tipo === "terreno" ? null : Math.max(0, Math.round(supC / (vivienda ? 110 : 60) + between(-0.6, 0.6))),
        niveles: tipo === "terreno" ? null : tipo === "departamento" ? 1 : supC > supT * 1.05 ? 2 : 1,
        fuente: "demo (simulado)", url: "", fecha
      });
    }
  }
  return out;
}
