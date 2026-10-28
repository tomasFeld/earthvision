const CLASE_BOTON = "hct_btn";
const MAX_HECTAREAS = 4;            // cambialo si querés permitir más

let user = null;
let mapa = null;
let marcadores = [];
let marcadorNuevo = null;
let puntoElegido = null;

// ---------- Datos ----------
function cargarUsuario() {
  const u = JSON.parse(localStorage.getItem("user"));
  if (!u) return null;

  // Sesión vieja con una sola coordenada
  if (!Array.isArray(u.fields) && u.fieldCoordenatesLat !== undefined) {
    u.fields = [{ lat: u.fieldCoordenatesLat, lng: u.fieldCoordenatesLng }];
  }
  if (!Array.isArray(u.fields)) u.fields = [];
  return u;
}

function guardarUsuario() {
  localStorage.setItem("user", JSON.stringify(user));
  // La primera hectárea vive en el server; las demás, solo en este navegador.
  // El login vuelve a leerlas de esta clave.
  localStorage.setItem(`extraFields:${user.email}`, JSON.stringify(user.fields.slice(1)));
}

// ---------- Lista de botones ----------
function renderLista() {
  const lista = document.getElementById("lista-hectareas");
  lista.innerHTML = "";

  if (user.fields.length === 0) {
    lista.textContent = "Todavía no tenés hectáreas registradas.";
    return;
  }

  user.fields.forEach((f, i) => {
    const boton = document.createElement("button");
    boton.className = CLASE_BOTON;
    boton.textContent = `Hectarea ${i + 1}`;
    boton.addEventListener("click", () => {
      window.location.href = `coordenadas.html?id=${i}`;
    });
    lista.appendChild(boton);
  });
}

// ---------- Mapa para elegir una hectárea ----------
function dibujarExistentes() {
  marcadores.forEach((m) => mapa.removeLayer(m));
  marcadores = user.fields.map((f, i) =>
    L.circleMarker([f.lat, f.lng], { radius: 8, color: "#fff", fillColor: "#0f6b1a", fillOpacity: 1 })
      .addTo(mapa)
      .bindTooltip(`Hectarea ${i + 1}`, { permanent: true, direction: "top" })
  );
}

function iniciarMapa() {
  const centro = user.fields.length
    ? [user.fields[user.fields.length - 1].lat, user.fields[user.fields.length - 1].lng]
    : [-34.6037, -58.3816];

  mapa = L.map("mapa-nuevo").setView(centro, 14);

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri", maxZoom: 19 }
  ).addTo(mapa);
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19 }
  ).addTo(mapa);

  L.Control.geocoder({
    defaultMarkGeocode: false,
    placeholder: "Buscar calle o dirección...",
    geocoder: L.Control.Geocoder.nominatim({ geocodingQueryParams: { countrycodes: "ar" } }),
  })
    .on("markgeocode", (e) => mapa.fitBounds(e.geocode.bbox))
    .addTo(mapa);

  mapa.on("click", (e) => {
    puntoElegido = { lat: e.latlng.lat, lng: e.latlng.lng };
    if (marcadorNuevo) marcadorNuevo.setLatLng(e.latlng);
    else marcadorNuevo = L.marker(e.latlng).addTo(mapa);

    document.getElementById("btn-confirmar-mapa").disabled = false;
    document.getElementById("modal-mapa-texto").textContent =
      `Punto elegido: ${puntoElegido.lat.toFixed(5)}, ${puntoElegido.lng.toFixed(5)}`;
  });
}

function abrirModal() {
  if (user.fields.length >= MAX_HECTAREAS) {
    alert(`Llegaste al máximo de ${MAX_HECTAREAS} hectáreas.`);
    return;
  }

  puntoElegido = null;
  document.getElementById("btn-confirmar-mapa").disabled = true;
  document.getElementById("modal-mapa-texto").textContent =
    "Hacé clic en el mapa para elegir tu nueva hectárea";
  document.getElementById("modal-mapa").classList.add("active");

  // Leaflet necesita que el contenedor sea visible para medir su tamaño
  setTimeout(() => {
    if (!mapa) iniciarMapa();
    else mapa.invalidateSize();

    if (marcadorNuevo) {
      mapa.removeLayer(marcadorNuevo);
      marcadorNuevo = null;
    }
    dibujarExistentes();
  }, 100);
}

function cerrarModal() {
  document.getElementById("modal-mapa").classList.remove("active");
}

function confirmarHectarea() {
  if (!puntoElegido) return;

  user.fields.push(puntoElegido);
  guardarUsuario();
  renderLista();
  cerrarModal();
}

// ---------- Inicio ----------
document.addEventListener("DOMContentLoaded", () => {
  user = cargarUsuario();
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  renderLista();

  document.getElementById("btn-agregar").addEventListener("click", abrirModal);
  document.getElementById("btn-cerrar-mapa").addEventListener("click", cerrarModal);
  document.getElementById("btn-confirmar-mapa").addEventListener("click", confirmarHectarea);
  document.getElementById("modal-mapa").addEventListener("click", (e) => {
    if (e.target.id === "modal-mapa") cerrarModal();
  });
});