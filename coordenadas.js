const API = "http://localhost:3000";

// Fecha "base" desde la que se retrocede. ERA5 tiene retraso,
// así que la base no es hoy. Si aplicaste el arreglo del server, podés bajarlo.
const DIAS_ATRAS_BASE = 120;

let mapa = null;
let marcador = null;
let cuadro = null;
let pedidoActual = 0; // evita que una respuesta lenta pise a una más nueva

function diaDelAnio(fecha) {
  const inicio = new Date(fecha.getFullYear(), 0, 0);
  return Math.round((fecha - inicio) / 86400000);
}

function formatear(valor, decimales, unidad = "") {
  if (valor === null || valor === undefined) return "Sin datos";
  return `${Number(valor).toFixed(decimales)}${unidad}`;
}

function estimarFertilidad(ndvi, ndmi) {
  if (ndvi === null || ndmi === null) return "Sin datos";
  let puntos = 0;
  if (ndvi > 0.6) puntos += 2;
  else if (ndvi > 0.3) puntos += 1;
  if (ndmi > 0.3) puntos += 2;
  else if (ndmi > 0.1) puntos += 1;
  if (puntos >= 3) return "Alta";
  if (puntos === 2) return "Media";
  return "Baja";
}

function crearFila(texto, info) {
  const fila = document.createElement("div");
  fila.className = "tabla-fila";

  const izq = document.createElement("div");
  izq.className = "col-izquierda";
  const spanIzq = document.createElement("span");
  spanIzq.className = "caja-gris";
  spanIzq.textContent = texto;
  izq.appendChild(spanIzq);

  const der = document.createElement("div");
  der.className = "col-derecha";
  const spanDer = document.createElement("span");
  spanDer.className = "caja-gris";
  spanDer.textContent = info;
  der.appendChild(spanDer);

  fila.appendChild(izq);
  fila.appendChild(der);
  return fila;
}

// ---------- MAPA ----------
function iniciarMapa(lat, lng) {
  mapa = L.map("mapa-campo").setView([lat, lng], 15);

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri", maxZoom: 19 }
  ).addTo(mapa);

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19 }
  ).addTo(mapa);

  marcador = L.marker([lat, lng]).addTo(mapa).bindPopup("Tu campo");

  // El backend analiza un cuadrado de 600 m x 600 m (buffer de 300 m)
  const dLat = 300 / 111320;
  const dLng = 300 / (111320 * Math.cos((lat * Math.PI) / 180));
  cuadro = L.rectangle(
    [[lat - dLat, lng - dLng], [lat + dLat, lng + dLng]],
    { color: "#7CFC00", weight: 2, fillOpacity: 0.1 }
  ).addTo(mapa);
}

// ---------- DATOS ----------
async function cargarDatos(user, diasRetroceso) {
  const idPedido = ++pedidoActual;

  const tabla = document.getElementById("tabla-datos");
  const fertilidad = document.getElementById("fertilidad-valor");
  const etiquetaFecha = document.getElementById("mapa-fecha");

  // Fecha consultada = base (hoy - retraso) menos los días del botón
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - DIAS_ATRAS_BASE - diasRetroceso);

  etiquetaFecha.textContent = `Datos del ${fecha.toLocaleDateString("es-AR")}`;
  fertilidad.textContent = "Cargando...";

  const params = new URLSearchParams({
    fieldCoordenatesLat: user.fieldCoordenatesLat,
    fieldCoordenatesLng: user.fieldCoordenatesLng,
    day: diaDelAnio(fecha),
    year: fecha.getFullYear(),
  });

  try {
    const res = await fetch(`${API}/api/calculateData?${params}`);
    const data = await res.json();
    if (idPedido !== pedidoActual) return; // llegó una respuesta más nueva

    if (!res.ok) {
      fertilidad.textContent = "Error";
      console.error(data.mensaje, data.detalle);
      return;
    }

    const d = data.datosObtenidos;
    fertilidad.textContent = estimarFertilidad(d.ndvi, d.ndmi);

    tabla.innerHTML = "";
    tabla.appendChild(crearFila("NDVI (vegetación)", formatear(d.ndvi, 3)));
    tabla.appendChild(crearFila("NDMI (humedad)", formatear(d.ndmi, 3)));
    tabla.appendChild(crearFila("Temperatura", formatear(d.temperature, 1, " °C")));
    tabla.appendChild(crearFila("Precipitación", formatear(d.precipitation, 1, " mm")));
  } catch (err) {
    if (idPedido !== pedidoActual) return;
    console.error(err);
    fertilidad.textContent = "Sin conexión con el servidor";
  }
}

// ---------- INICIO ----------
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const lat = Number(user.fieldCoordenatesLat);
  const lng = Number(user.fieldCoordenatesLng);

  document.getElementById("hectarea-coords").textContent =
    `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  iniciarMapa(lat, lng);

  const botones = document.querySelectorAll(".btn-map");
  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      botones.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      cargarDatos(user, Number(btn.dataset.dias));
    });
  });

  // Carga inicial con el botón que arranca activo (7-Days)
  const activo = document.querySelector(".btn-map.active");
  cargarDatos(user, activo ? Number(activo.dataset.dias) : 7);
});