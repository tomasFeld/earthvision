const API = "http://localhost:3000";
const CLASE_BOTON = "hct_btn";
const MAX_HECTAREAS = 4;
const DISTANCIA_MINIMA_M = 100;
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

let user = null;
let mapa = null;
let marcador = null;
let puntoElegido = null;

const $ = (id) => document.getElementById(id);
const mensajeMapa = (texto) => { $("mapa-mensaje").textContent = texto; };

function cargarUsuario() {
  const u = JSON.parse(localStorage.getItem("user"));
  return u && Array.isArray(u.fields) ? u : null;
}

function distanciaMetros(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

async function guardarEnServidor(punto) {
  let res;
  try {
    res = await fetch(`${API}/api/agregarHectareas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        fieldCoordenatesLng: punto.lng,
        fieldCoordenatesLat: punto.lat,
      }),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.mensaje || `Error ${res.status}`);
}

function renderLista() {
  const lista = $("lista-hectareas");
  const btnAgregar = $("btn-agregar");

  lista.querySelectorAll(`.${CLASE_BOTON}`).forEach((el) => el.remove());

  user.fields.forEach((f, i) => {
    const boton = document.createElement("button");
    boton.className = CLASE_BOTON;
    boton.textContent = `Hectarea ${i + 1}`;
    boton.addEventListener("click", () => {
      localStorage.setItem("hectareaActiva", i);
      window.location.href = `coordenadas.html?id=${i}`;
    });
    lista.insertBefore(boton, btnAgregar);
  });

  const lleno = user.fields.length >= MAX_HECTAREAS;
  btnAgregar.disabled = lleno;
  btnAgregar.textContent = lleno ? "Máximo 4 hectáreas" : "Agregar hectareas";
}

function elegirPunto(e) {
  const { lat, lng } = e.latlng;
  const cerca = user.fields.findIndex((f) => distanciaMetros(f, { lat, lng }) < DISTANCIA_MINIMA_M);

  if (cerca !== -1) {
    puntoElegido = null;
    $("btn-confirmar-mapa").disabled = true;
    mensajeMapa(`Muy cerca de la Hectarea ${cerca + 1}. Elegí otra ubicación.`);
    return;
  }

  puntoElegido = { lat, lng };
  if (marcador) marcador.setLatLng(e.latlng);
  else marcador = L.marker(e.latlng).addTo(mapa);
  $("btn-confirmar-mapa").disabled = false;
  mensajeMapa(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
}

function abrirMapa() {
  $("map-modal").classList.add("active");
  puntoElegido = null;
  $("btn-confirmar-mapa").disabled = true;
  mensajeMapa("");

  if (!mapa) {
    const base = user.fields[user.fields.length - 1] || { lat: -34.6037, lng: -58.3816 };
    setTimeout(() => {
      mapa = L.map("map-container").setView([base.lat, base.lng], 15);
      L.tileLayer(ESRI, { attribution: "Tiles © Esri", maxZoom: 19 }).addTo(mapa);

      L.Control.geocoder({
        defaultMarkGeocode: false,
        placeholder: "Buscar calle o dirección...",
        geocoder: L.Control.Geocoder.nominatim({ geocodingQueryParams: { countrycodes: "ar" } }),
      })
        .on("markgeocode", (e) => mapa.fitBounds(e.geocode.bbox))
        .addTo(mapa);

      mapa.on("click", elegirPunto);
    }, 100);
  } else {
    if (marcador) { mapa.removeLayer(marcador); marcador = null; }
    setTimeout(() => mapa.invalidateSize(), 100);
  }
}

function cerrarMapa() {
  $("map-modal").classList.remove("active");
}

async function confirmarHectarea() {
  if (!puntoElegido) return;
  const boton = $("btn-confirmar-mapa");
  boton.disabled = true;

  try {
    await guardarEnServidor(puntoElegido);
    user.fields.push(puntoElegido);
    localStorage.setItem("user", JSON.stringify(user));
    renderLista();
    cerrarMapa();
  } catch (error) {
    mensajeMapa(error.message);
    boton.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  user = cargarUsuario();
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  renderLista();

  $("btn-agregar").addEventListener("click", abrirMapa);
  $("btn-cerrar-mapa").addEventListener("click", cerrarMapa);
  $("btn-confirmar-mapa").addEventListener("click", confirmarHectarea);
  $("map-modal").addEventListener("click", (e) => {
    if (e.target === $("map-modal")) cerrarMapa();
  });
});