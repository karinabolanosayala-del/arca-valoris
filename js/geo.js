// Geocodificación de domicilios con OpenStreetMap (Nominatim), acotada a la ZMG.
// Uso moderado: una búsqueda por acción del usuario (política de Nominatim: máx. 1 por segundo).

const NOMINATIM = "https://nominatim.openstreetmap.org";
const VIEWBOX_ZMG = "-103.75,20.85,-102.95,20.30";

const sinAcentos = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function municipioDe(address) {
  const cands = [address.city, address.town, address.municipality, address.county, address.village, address.city_district]
    .filter(Boolean).map(sinAcentos);
  for (const m of MUNICIPIOS) {
    const nm = sinAcentos(m);
    const clave = nm.replace(/^san pedro /, "").split(" de ")[0];
    if (cands.some(c => c.includes(clave) || nm.includes(c))) return m;
  }
  return null;
}

function coloniaDe(address) {
  return address.neighbourhood || address.suburb || address.quarter || address.residential || address.hamlet || "";
}

function calleDe(address) {
  return [address.road, address.house_number].filter(Boolean).join(" ");
}

async function geocodificar({ calle, colonia, cp, municipio }) {
  const intentos = [
    [calle, colonia, cp, municipio, "Jalisco", "México"],
    [calle, municipio, "Jalisco", "México"],
    [colonia, cp, municipio, "Jalisco", "México"]
  ];
  for (let i = 0; i < intentos.length; i++) {
    const q = intentos[i].filter(Boolean).join(", ");
    if (!q) continue;
    const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=mx&accept-language=es` +
      `&viewbox=${VIEWBOX_ZMG}&bounded=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Servicio de mapas no disponible (" + res.status + ")");
    const data = await res.json();
    if (data.length) {
      return data.map(d => ({
        lat: +d.lat, lng: +d.lon,
        etiqueta: d.display_name,
        municipio: municipioDe(d.address || {}),
        colonia: coloniaDe(d.address || {}),
        cp: (d.address || {}).postcode || "",
        aproximado: i > 0 || !(d.address || {}).house_number
      }));
    }
  }
  return [];
}

async function geocodificarInverso(lat, lng) {
  const url = `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=es&lat=${lat}&lon=${lng}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const d = await res.json();
  if (!d.address) return null;
  return {
    calle: calleDe(d.address),
    colonia: coloniaDe(d.address),
    cp: d.address.postcode || "",
    municipio: municipioDe(d.address),
    etiqueta: d.display_name
  };
}
