const API = "http://localhost:3000";
const DIAS_ATRAS = 100; // provisorio: el clima de Earth Engine llega con retraso

let mapa = null;

function diaDelAnio(f) {
    const hoy = Date.UTC(f.getFullYear(), f.getMonth(), f.getDate());
    return (hoy - Date.UTC(f.getFullYear(), 0, 0)) / 86400000;
}

async function calcularDatos(lat, lng, fecha) {
    const params = new URLSearchParams({
        fieldCoordenatesLat: lat,
        fieldCoordenatesLng: lng,
        day: diaDelAnio(fecha),
        year: fecha.getFullYear(),
    });

    let res;
    try {
        res = await fetch(`${API}/api/calculateData?${params}`);
    } catch {
        throw new Error("No se pudo conectar con el servidor");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.mensaje || `Error ${res.status}`);
    return data.datosObtenidos;
}

// FÓRMULA PROVISORIA: NDVI y NDMI miden vegetación y humedad, no nutrientes del suelo
function calcularFertilidad({ ndvi, ndmi, temperature }) {
    if (typeof ndvi !== "number" && typeof ndmi !== "number") return null;
    const escala = (v, min, max) => Math.max(0, Math.min(1, (v - min) / (max - min)));

    const partes = [];
    if (typeof ndvi === "number") partes.push([0.5, escala(ndvi, 0.1, 0.8)]);
    if (typeof ndmi === "number") partes.push([0.3, escala(ndmi, -0.2, 0.5)]);
    if (typeof temperature === "number") {
        const t = temperature < 15 ? escala(temperature, 0, 15)
            : temperature > 28 ? 1 - escala(temperature, 28, 40) : 1;
        partes.push([0.2, t]);
    }
    const peso = partes.reduce((s, [p]) => s + p, 0);
    const suma = partes.reduce((s, [p, v]) => s + p * v, 0);
    return Math.round((suma / peso) * 100);
}

function nivelFertilidad(p) {
    if (p === null) return "Sin datos";
    return p >= 66 ? "Alta" : p >= 33 ? "Media" : "Baja";
}

function poner(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}

function formatear(valor, decimales, unidad = "") {
    return typeof valor === "number" ? `${valor.toFixed(decimales)}${unidad}` : "--";
}

function mostrarDatos(datos, fechaTxt) {
    const fert = calcularFertilidad(datos);
    poner("fertilidad-valor", fert === null ? "Fertility: --" : `Fertility: ${fert}%`);
    poner("dato-ndvi", `NDVI: ${formatear(datos.ndvi, 2)}`);
    poner("dato-ndmi", `NDMI: ${formatear(datos.ndmi, 2)}`);
    poner("dato-temp", `Temp: ${formatear(datos.temperature, 1, " °C")}`);
    poner("dato-prec", `Lluvia: ${formatear(datos.precipitation, 1, " mm")}`);
    poner("dato-nivel", `Nivel: ${nivelFertilidad(fert)}`);
    poner("dato-fecha", fechaTxt);
    return fert;
}

async function cargarDatos(field) {
    const ref = new Date();
    ref.setDate(ref.getDate() - DIAS_ATRAS);
    const fechaTxt = ref.toISOString().slice(0, 10);
    const clave = `datos:${field.lat.toFixed(5)}:${field.lng.toFixed(5)}:${fechaTxt}`;

    const guardado = localStorage.getItem(clave);
    if (guardado) {
        mostrarDatos(JSON.parse(guardado), fechaTxt);
        return;
    }

    poner("fertilidad-valor", "Fertility: ...");
    try {
        const datos = await calcularDatos(field.lat, field.lng, ref);
        if (mostrarDatos(datos, fechaTxt) !== null) {
            localStorage.setItem(clave, JSON.stringify(datos));
        }
    } catch (error) {
        console.error(error);
        poner("fertilidad-valor", "Fertility: --");
        poner("dato-nivel", "Nivel: Error");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !Array.isArray(user.fields)) {
        window.location.href = "login.html";
        return;
    }

    const fields = user.fields;
    const idUrl = new URLSearchParams(window.location.search).get("id");
    const idGuardado = localStorage.getItem("hectareaActiva");
    let id = Number(idUrl ?? idGuardado ?? 0);
    if (!fields[id]) id = 0;

    const field = fields[id];

    document.getElementById("hectarea-titulo").textContent = `Hectarea ${id + 1}`;
    document.getElementById("mapa-titulo").textContent = `Hectarea ${id + 1}`;

    document.getElementById("btn-ver-clima").addEventListener("click", () => {
        window.location.href = `weather.html?id=${id}`;
    });

    document.getElementById("btn-ver-analytics").addEventListener("click", () => {
        window.location.href = `analytics.html?id=${id}`;
    });

    if (!field) return;

    poner("dato-lat", `Lat: ${field.lat.toFixed(5)}`);
    poner("dato-lng", `Lng: ${field.lng.toFixed(5)}`);

    mapa = L.map("mapa-campo").setView([field.lat, field.lng], 16);

    L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles © Esri", maxZoom: 19 }
    ).addTo(mapa);

    L.circleMarker([field.lat, field.lng], {
        radius: 12,
        color: "#fff",
        fillColor: "#0f6b1a",
        fillOpacity: 0.9,
    }).addTo(mapa).bindTooltip(`Hectarea ${id + 1}`, { permanent: true, direction: "top" });

    cargarDatos(field);
});