// Motor de comparables y homologación por enfoque de mercado, siguiendo los
// factores que usa la metodología SHF. Los parámetros son editables en la
// pestaña Configuración; los valores por defecto deben validarse por el valuador.

const CONFIG_DEFAULT = {
  factorNegociacion: 0.95,   // oferta → precio probable de cierre
  exponenteSuperficie: 0.125, // Fsup = (Scomp / Ssuj) ^ n
  pasoCalidad: 0.08,         // diferencia de valor entre clases contiguas
  rangoMin: 0.80,            // factor resultante aceptable
  rangoMax: 1.20,
  numComparables: 6,
  minComparables: 4,
  radioKm: 5
};

const K_CONSERVACION = { "nuevo": 1.00, "remodelado": 1.00, "bueno": 0.95, "regular": 0.85, "malo": 0.70 };
const K_UBICACION = { "medio": 1.00, "esquina": 1.05, "cabecera": 1.03 };

function km(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function superficieBase(x) {
  return x.tipo === "terreno" ? x.sup_terreno : x.sup_construccion;
}

function precioUnitario(x) {
  const s = superficieBase(x);
  return s > 0 ? x.precio / s : NaN;
}

// Puntaje de disimilitud: menor es más comparable.
function disimilitud(s, c) {
  const d = km(s, c);
  let score = d / 2;
  score += Math.abs(Math.log(superficieBase(c) / superficieBase(s))) / 0.3;
  if (s.tipo !== "terreno") {
    score += Math.abs((c.edad ?? 0) - (s.edad ?? 0)) / 10;
    score += Math.abs(CLASES.indexOf(c.clase) - CLASES.indexOf(s.clase)) * 1.5;
  }
  if (c.municipio !== s.municipio) score += 1;
  return { score, distanciaKm: d };
}

function buscarComparables(sujeto, base, cfg) {
  const candidatos = base
    .filter(c => c.operacion === sujeto.operacion && c.tipo === sujeto.tipo && c.uso === sujeto.uso)
    .filter(c => superficieBase(c) > 0 && c.precio > 0 && Number.isFinite(c.lat) && Number.isFinite(c.lng))
    .map(c => ({ ...c, ...disimilitud(sujeto, c) }));
  const cercanos = candidatos.filter(c => c.distanciaKm <= cfg.radioKm);
  const pool = cercanos.length >= cfg.minComparables ? cercanos : candidatos;
  return pool.sort((a, b) => a.score - b.score).slice(0, cfg.numComparables);
}

function homologar(sujeto, comp, cfg, fzona = 1) {
  const f = {};
  f.negociacion = cfg.factorNegociacion;
  f.zona = fzona;
  f.ubicacion = (K_UBICACION[sujeto.ubicacion] ?? 1) / (K_UBICACION[comp.ubicacion] ?? 1);
  f.superficie = Math.pow(superficieBase(comp) / superficieBase(sujeto), cfg.exponenteSuperficie);
  if (sujeto.tipo !== "terreno") {
    const vut = VUT[sujeto.clase] ?? 60;
    const remS = Math.max(vut - (sujeto.edad ?? 0), vut * 0.2);
    const remC = Math.max(vut - (comp.edad ?? 0), vut * 0.2);
    f.edad = remS / remC;
    f.conservacion = (K_CONSERVACION[sujeto.conservacion] ?? 1) / (K_CONSERVACION[comp.conservacion] ?? 1);
    f.calidad = Math.pow(1 + cfg.pasoCalidad, CLASES.indexOf(sujeto.clase) - CLASES.indexOf(comp.clase));
  }
  const resultante = Object.values(f).reduce((a, b) => a * b, 1);
  const unit = precioUnitario(comp);
  return {
    factores: f,
    resultante,
    unitario: unit,
    homologado: unit * resultante,
    dentroDeRango: resultante >= cfg.rangoMin && resultante <= cfg.rangoMax
  };
}

function concluir(sujeto, filas) {
  const usadas = filas.filter(r => r.incluir);
  if (!usadas.length) return null;
  const vals = usadas.map(r => r.h.homologado);
  const prom = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - prom) ** 2, 0) / Math.max(vals.length - 1, 1));
  const sup = superficieBase(sujeto);
  const redondeo = sujeto.operacion === "renta" ? 100 : 1000;
  return {
    n: usadas.length,
    unitarioPromedio: prom,
    min: Math.min(...vals),
    max: Math.max(...vals),
    cv: prom ? sd / prom : 0,
    superficie: sup,
    valor: Math.round(prom * sup / redondeo) * redondeo
  };
}
