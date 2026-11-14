
const API = "http://localhost:3000";
const PAGINA_LOGIN = "index.html";

const DIAS_ATRAS_BASE = 95;

let mapa = null;
let pedidoActual = 0;

const $ = (id) => document.getElementById(id);


// Escribe un texto en un elemento. Si el id no existe, avisa y sigue.
function poner(id, valor) {
  const el = $(id);
  if (el) el.textContent = valor;
  else console.warn("Falta este id en el HTML:", id);
}


function diaDelAnio(fecha) {
  const inicio = new Date(fecha.getFullYear(), 0, 0);
  return Math.round((fecha - inicio) / 86400000);
}


function formatear(valor, decimales, unidad = "") {
  if (valor === null || valor === undefined) return "Sin datos";
  return `${Number(valor).toFixed(decimales)}${unidad}`;
}


function limitar(x) {
  return Math.max(0, Math.min(1, x));
}


function estimarFertilidad(ndvi, ndmi) {
  if (ndvi === null || ndmi === null) return "Sin datos";

  const puntajeNdvi = limitar(ndvi / 0.7);
  const puntajeNdmi = limitar((ndmi + 0.2) / 0.6);

  const puntaje = 0.65 * puntajeNdvi + 0.35 * puntajeNdmi;

  if (puntaje >= 0.6) return "Alta";
  if (puntaje >= 0.3) return "Media";

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

  if (!$("mapa-campo")) {
    console.warn("Falta el div con id mapa-campo");
    return;
  }

  mapa = L.map("mapa-campo").setView([lat, lng], 15);

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles © Esri",
      maxZoom: 19
    }
  ).addTo(mapa);

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19
    }
  ).addTo(mapa);

  L.marker([lat, lng]).addTo(mapa).bindPopup("Tu campo");

  // El backend analiza un cuadrado de 600 m x 600 m (buffer de 300 m)
  const dLat = 300 / 111320;
  const dLng = 300 / (111320 * Math.cos((lat * Math.PI) / 180));

  L.rectangle(
    [[lat - dLat, lng - dLng], [lat + dLat, lng + dLng]],
    {
      color: "#7CFC00",
      weight: 2,
      fillOpacity: 0.1
    }
  ).addTo(mapa);
}


// ---------- DATOS ----------

async function cargarDatos(field, diasRetroceso) {

  const idPedido = ++pedidoActual;

  const fecha = new Date();
  fecha.setDate(fecha.getDate() - DIAS_ATRAS_BASE - diasRetroceso);

  poner("mapa-fecha", `Datos del ${fecha.toLocaleDateString("es-AR")}`);
  poner("fertilidad-valor", "Cargando...");


  const params = new URLSearchParams({
    fieldCoordenatesLat: field.lat,
    fieldCoordenatesLng: field.lng,
    day: diaDelAnio(fecha),
    year: fecha.getFullYear()
  });


  try {

    const res = await fetch(`${API}/api/calculateData?${params}`);

    const data = await res.json();

    if (idPedido !== pedidoActual) return;


    if (!res.ok) {

      poner("fertilidad-valor", "Error");

      console.error(data.mensaje, data.detalle);

      return;
    }


    const d = data.datosObtenidos;

    poner("fertilidad-valor", estimarFertilidad(d.ndvi, d.ndmi));


    const tabla = $("tabla-datos");

    if (tabla) {

      tabla.innerHTML = "";

      tabla.appendChild(crearFila("NDVI (vegetación)", formatear(d.ndvi, 3)));

      tabla.appendChild(crearFila("NDMI (humedad)", formatear(d.ndmi, 3)));

      
    }

  } catch (err) {

    if (idPedido !== pedidoActual) return;

    console.error(err);

    poner("fertilidad-valor", "Sin conexión con el servidor");

  }

}


// ---------- INICIO ----------

document.addEventListener("DOMContentLoaded", () => {

  // CORRECCIÓN: recuperar el usuario desde sessionStorage
  const user = JSON.parse(sessionStorage.getItem("user"));

  if (!user) {
    window.location.href = PAGINA_LOGIN;
    return;
  }


  // Recuperar las hectáreas del usuario
  const campos = [];

for (let i = 1; i <= 4; i++) {

    let numero = "";

    if (i !== 1) {
        numero = i;
    }

    const lat = user["fieldCoordenatesLat" + numero];
    const lng = user["fieldCoordenatesLng" + numero];

    if (lat != null && lng != null) {

        campos.push({
            lat: Number(lat),
            lng: Number(lng)
        });

    }
}


  // Qué hectárea mostrar: la de la URL (?id=1),
  // la última abierta, o la primera
  const idUrl = new URLSearchParams(window.location.search).get("id");

  let id = Number(idUrl ?? localStorage.getItem("hectareaActiva") ?? 0);

  if (!campos || !campos[id]) {
    id = 0;
  }


  // Guardar la hectárea seleccionada
  localStorage.setItem("hectareaActiva", id);


  // Obtener coordenadas de la hectárea elegida
  const field = campos[id];

  const lat = Number(field.lat);
  const lng = Number(field.lng);


  console.log("Hectárea mostrada:", id + 1, field);


  // Mostrar nombre y coordenadas
  poner("hectarea-nombre", `Hectarea-${id + 1}`);

  

  // Iniciar mapa
  iniciarMapa(lat, lng);


  window.addEventListener("resize", () => mapa && mapa.invalidateSize());


  // Botones para seleccionar períodos
  const botones = document.querySelectorAll(".btn-map");

  botones.forEach((btn) => {

    btn.addEventListener("click", () => {

      if (!btn.dataset.dias) return;

      botones.forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");

      cargarDatos(field, Number(btn.dataset.dias));

    });

  });


  // Cargar el período inicial
  const activo = document.querySelector(".btn-map.active");

  cargarDatos(
    field,
    activo && activo.dataset.dias ? Number(activo.dataset.dias) : 7
  );

});
