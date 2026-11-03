const PAGINA_LOGIN = "index.html"; // cambialo si tu login se llama distinto

let pedidoActual = 0;

// Cada número del clima se traduce a un emoji
function icono(codigo) {
  if (codigo === 0) return "☀️";
  if (codigo <= 2) return "⛅";
  if (codigo === 3) return "☁️";
  if (codigo <= 48) return "🌫️";
  if (codigo <= 67) return "🌧️";
  if (codigo <= 77) return "❄️";
  if (codigo <= 82) return "🌧️";
  return "⛈️";
}

// Escribe un texto en un elemento del HTML
function poner(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function limpiar() {
  poner("hoy-icono", "⏳");
  poner("hoy-temp", "--°C");
  poner("hoy-viento", "💨 -- KMH");
  poner("hoy-lluvia", "🌧️ -- MM");
  poner("hoy-humedad", "💧 --%");
  for (let i = 1; i <= 3; i++) {
    const tarjeta = document.getElementById("dia-" + i);
    if (tarjeta) tarjeta.textContent = "...";
  }
}

// Pide el clima de una ubicación y lo muestra
async function cargarClima(lat, lng) {
  const idPedido = ++pedidoActual; // evita que una respuesta lenta pise a una más nueva
  limpiar();

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&timezone=auto&forecast_days=4`;

  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
    const datos = await respuesta.json();
    if (idPedido !== pedidoActual) return;

    const hoy = datos.current;
    const dias = datos.daily;

    // Hoy
    poner("hoy-icono", icono(hoy.weather_code));
    poner("hoy-temp", Math.round(hoy.temperature_2m) + "°C");
    poner("hoy-viento", "💨 " + Math.round(hoy.wind_speed_10m) + " KMH");
    poner("hoy-lluvia", "🌧️ " + Math.round(dias.precipitation_sum[0]) + " MM");
    poner("hoy-humedad", "💧 " + hoy.relative_humidity_2m + "%");

    // Los próximos 3 días (la posición 0 es hoy)
    for (let i = 1; i <= 3; i++) {
      const tarjeta = document.getElementById("dia-" + i);
      if (!tarjeta) continue;

      const fecha = new Date(dias.time[i] + "T00:00:00");
      const nombre = fecha.toLocaleDateString("es-AR", { weekday: "short" });

      tarjeta.innerHTML =
        `<span class="dia-nombre">${nombre}</span>` +
        `<span class="dia-icono">${icono(dias.weather_code[i])}</span>` +
        `<span class="dia-temps">${Math.round(dias.temperature_2m_max[i])}°-${Math.round(dias.temperature_2m_min[i])}°</span>`;
    }
  } catch (error) {
    if (idPedido !== pedidoActual) return;
    console.error(error);
    poner("hoy-temp", "--°C");
    poner("hoy-viento", "No se pudo cargar el clima");
  }
}

// Al abrir la página
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = PAGINA_LOGIN;
    return;
  }

  // Lista de hectáreas (acepta la sesión nueva y la vieja)
  const campos = Array.isArray(user.fields)
    ? user.fields
    : [{ lat: user.fieldCoordenatesLat, lng: user.fieldCoordenatesLng }];

  // Selector con una opción por hectárea
  const selector = document.getElementById("selector-campo");
  campos.forEach((c, i) => selector.add(new Option(`Campo ${i + 1}`, i)));

  // Hectárea inicial: la última que abriste, o la primera
  let id = Number(localStorage.getItem("hectareaActiva") ?? 0);
  if (!campos[id]) id = 0;
  selector.value = id;

  cargarClima(campos[id].lat, campos[id].lng);

  // Al cambiar el selector, se carga el clima de la otra hectárea
  selector.addEventListener("change", () => {
    const nuevo = Number(selector.value);
    localStorage.setItem("hectareaActiva", nuevo);
    cargarClima(campos[nuevo].lat, campos[nuevo].lng);
  });
});