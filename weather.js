// Código WMO de Open-Meteo -> ícono
function icono(codigo) {
  if (codigo === 0) return "☀️";
  if (codigo === 1) return "🌤️";
  if (codigo === 2) return "⛅";
  if (codigo === 3) return "☁️";
  if (codigo === 45 || codigo === 48) return "🌫️";
  if (codigo >= 51 && codigo <= 57) return "🌦️";
  if (codigo >= 61 && codigo <= 67) return "🌧️";
  if (codigo >= 71 && codigo <= 77) return "❄️";
  if (codigo >= 80 && codigo <= 82) return "🌧️";
  if (codigo === 85 || codigo === 86) return "❄️";
  if (codigo >= 95) return "⛈️";
  return "❔";
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mier", "Jue", "Vie", "Sab"];

function nombreDia(fechaISO) {
  const [a, m, d] = fechaISO.split("-").map(Number);
  return DIAS_SEMANA[new Date(a, m - 1, d).getDay()];
}

function texto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function mostrarError(mensaje) {
  texto("hoy-icono", "⚠️");
  texto("hoy-temp", "--°C");
  texto("hoy-viento", mensaje);
  texto("hoy-lluvia", "");
  texto("hoy-humedad", "");
}

async function cargarClima(lat, lng) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: "auto",
    forecast_days: 4,
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // ----- Hoy -----
    const c = data.current;
    const d = data.daily;
    texto("hoy-icono", icono(c.weather_code));
    texto("hoy-temp", `${Math.round(c.temperature_2m)}°C`);
    texto("hoy-viento", `💨 ${Math.round(c.wind_speed_10m)} KMH`);
    texto("hoy-lluvia", `🌧️ ${Math.round(d.precipitation_sum[0])} MM`);
    texto("hoy-humedad", `💧 ${c.relative_humidity_2m}%`);

    // ----- Próximos 3 días (el índice 0 es hoy) -----
    for (let i = 1; i <= 3; i++) {
      const card = document.getElementById(`dia-${i}`);
      if (!card) continue;
      card.innerHTML = "";

      const nombre = document.createElement("span");
      nombre.className = "dia-nombre";
      nombre.textContent = nombreDia(d.time[i]);

      const ico = document.createElement("span");
      ico.className = "dia-icono";
      ico.textContent = icono(d.weather_code[i]);

      const temps = document.createElement("span");
      temps.className = "dia-temps";
      temps.textContent = `${Math.round(d.temperature_2m_max[i])}°-${Math.round(d.temperature_2m_min[i])}°`;

      card.appendChild(nombre);
      card.appendChild(ico);
      card.appendChild(temps);
    }
  } catch (err) {
    console.error("Error de clima:", err);
    mostrarError("No se pudo cargar el clima");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Compatibilidad con la sesión vieja (una sola coordenada)
  let fields = user.fields;
  if (!Array.isArray(fields) && user.fieldCoordenatesLat !== undefined) {
    fields = [{ lat: user.fieldCoordenatesLat, lng: user.fieldCoordenatesLng }];
  }
  fields = fields || [];

  // Hectárea seleccionada: ?id=N en la URL, o la última que abriste, o la 1
  const idUrl = new URLSearchParams(window.location.search).get("id");
  const idGuardado = localStorage.getItem("hectareaActiva");
  let id = Number(idUrl ?? idGuardado ?? 0);
  if (!fields[id]) id = 0;

  const field = fields[id];
  if (!field) {
    texto("campo-nombre", "Sin hectáreas");
    mostrarError("Registrá una hectárea primero");
    return;
  }

  texto("campo-nombre", `Campo ${id + 1}`);
  cargarClima(Number(field.lat), Number(field.lng));
});