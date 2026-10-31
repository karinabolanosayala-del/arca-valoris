// Vista Google: mapa satelital con sujeto y comparables + Street View, usando la Maps JavaScript API.
// La API key se captura en Configuración y se guarda solo en el navegador del usuario.
// Restringe la key en Google Cloud a los dominios de la app (HTTP referrers).

const LS_GKEY = "arca-valoris-gmaps-key";
let gm = null; // { map, pano, svc, marcadores }

function leerGKey() {
  try { return localStorage.getItem(LS_GKEY) || ""; } catch (e) { return ""; }
}
function guardarGKey(k) {
  try { k ? localStorage.setItem(LS_GKEY, k) : localStorage.removeItem(LS_GKEY); } catch (e) { /* sin almacenamiento */ }
}

function cargarGoogleMaps(key) {
  if (window.google && google.maps) return Promise.resolve();
  return new Promise((resolve, reject) => {
    window.__gmListo = resolve;
    // Google avisa de una key inválida después de cargar, así que el aviso se muestra aparte.
    window.gm_authFailure = () => {
      const msg = "Google rechazó la API key: revisa que esté activa la Maps JavaScript API, la facturación y las restricciones de dominio.";
      document.getElementById("g-estado").textContent = msg;
      const out = document.getElementById("gkey-out");
      if (out) out.textContent = msg;
      reject(new Error(msg));
    };
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&language=es&region=MX&callback=__gmListo`;
    s.async = true;
    s.onerror = () => reject(new Error("No se pudo cargar Google Maps."));
    document.head.appendChild(s);
  });
}

async function iniciarGoogle() {
  const key = leerGKey();
  const card = document.getElementById("gcard");
  if (!key) { card.hidden = true; return false; }
  card.hidden = false;
  const estado = document.getElementById("g-estado");
  try {
    await cargarGoogleMaps(key);
    if (!gm) {
      const centro = { lat: 20.66, lng: -103.35 };
      const map = new google.maps.Map(document.getElementById("gmap"), {
        center: centro, zoom: 12, mapTypeId: "hybrid", streetViewControl: false, fullscreenControl: true
      });
      const pano = new google.maps.StreetViewPanorama(document.getElementById("gpano"), {
        position: centro, pov: { heading: 0, pitch: 0 }, addressControl: true, fullscreenControl: true
      });
      gm = { map, pano, svc: new google.maps.StreetViewService(), marcadores: [] };
    }
    estado.textContent = "Google Maps conectado. Clic en un marcador o en “Ver fachada” para abrir Street View.";
    return true;
  } catch (e) {
    estado.textContent = e.message;
    return false;
  }
}

function gmLimpiar() {
  if (!gm) return;
  gm.marcadores.forEach(m => m.setMap(null));
  gm.marcadores = [];
}

function gmMarcador(pos, etiqueta, color, titulo) {
  const m = new google.maps.Marker({
    position: pos, map: gm.map, title: titulo,
    label: { text: etiqueta, color: "#111", fontWeight: "600", fontSize: "12px" },
    icon: { path: google.maps.SymbolPath.CIRCLE, scale: 11, fillColor: color, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 }
  });
  m.addListener("click", () => gmStreetView(pos.lat, pos.lng, titulo));
  gm.marcadores.push(m);
  return m;
}

// Pinta sujeto y comparables y abre Street View del sujeto.
function gmMostrar(sujeto, filas) {
  if (!gm) return;
  gmLimpiar();
  const b = new google.maps.LatLngBounds();
  const ps = { lat: sujeto.lat, lng: sujeto.lng };
  gmMarcador(ps, "S", "#e8894a", "Sujeto");
  b.extend(ps);
  for (const r of filas) {
    const p = { lat: r.c.lat, lng: r.c.lng };
    gmMarcador(p, String(r.n), "#c8a46a", `#${r.n} ${r.c.colonia}`);
    b.extend(p);
  }
  gm.map.fitBounds(b, 60);
  gmStreetView(sujeto.lat, sujeto.lng, "Sujeto");
}

// Busca la panorámica más cercana (hasta 80 m) y orienta la cámara hacia el punto.
function gmStreetView(lat, lng, titulo) {
  if (!gm) return;
  const estado = document.getElementById("g-estado");
  const destino = new google.maps.LatLng(lat, lng);
  gm.svc.getPanorama({ location: destino, radius: 80, source: google.maps.StreetViewSource.OUTDOOR }, (data, status) => {
    if (status !== google.maps.StreetViewStatus.OK) {
      estado.textContent = `${titulo}: no hay Street View a menos de 80 m.`;
      return;
    }
    const origen = data.location.latLng;
    gm.pano.setPano(data.location.pano);
    gm.pano.setPov({ heading: google.maps.geometry ? google.maps.geometry.spherical.computeHeading(origen, destino) : rumbo(origen, destino), pitch: 0 });
    gm.pano.setVisible(true);
    estado.textContent = `Street View: ${titulo}`;
  });
}

function rumbo(a, b) {
  const r = Math.PI / 180;
  const y = Math.sin((b.lng() - a.lng()) * r) * Math.cos(b.lat() * r);
  const x = Math.cos(a.lat() * r) * Math.sin(b.lat() * r) - Math.sin(a.lat() * r) * Math.cos(b.lat() * r) * Math.cos((b.lng() - a.lng()) * r);
  return (Math.atan2(y, x) / r + 360) % 360;
}
