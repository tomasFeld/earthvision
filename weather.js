// 1. Cada número del clima se traduce a un emoji
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


function poner(id, valor) {
  document.getElementById(id).textContent = valor;
}


async function cargarClima(lat, lng) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&timezone=auto&forecast_days=4`;

  try {
    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    const hoy = datos.current;
    const dias = datos.daily;


    poner("hoy-icono", icono(hoy.weather_code));
    poner("hoy-temp", Math.round(hoy.temperature_2m) + "°C");
    poner("hoy-viento", "💨 " + Math.round(hoy.wind_speed_10m) + " KMH");
    poner("hoy-lluvia", "🌧️ " + Math.round(dias.precipitation_sum[0]) + " MM");
    poner("hoy-humedad", "💧 " + hoy.relative_humidity_2m + "%");

  
    for (let i = 1; i <= 3; i++) {
      const fecha = new Date(dias.time[i] + "T00:00:00");
      const nombre = fecha.toLocaleDateString("es-AR", { weekday: "short" });

      document.getElementById("dia-" + i).innerHTML =
        `<span class="dia-nombre">${nombre}</span>` +
        `<span class="dia-icono">${icono(dias.weather_code[i])}</span>` +
        `<span class="dia-temps">${Math.round(dias.temperature_2m_max[i])}°-${Math.round(dias.temperature_2m_min[i])}°</span>`;
    }
  } catch (error) {
    console.error(error);
    poner("hoy-temp", "--°C");
    poner("hoy-viento", "No se pudo cargar el clima");
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "index.html";
    return;
  }

 
  const campos = user.fields || [
    { lat: user.fieldCoordenatesLat, lng: user.fieldCoordenatesLng },
  ];


  const id = Number(
    new URLSearchParams(window.location.search).get("id") ??
      localStorage.getItem("hectareaActiva") ??
      0
  );
  const campo = campos[id] || campos[0];

  poner("campo-nombre", "Campo " + (campos.indexOf(campo) + 1));
  cargarClima(campo.lat, campo.lng);
});