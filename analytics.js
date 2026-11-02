const API_GRANOS = "https://granosar.lfcaucino.workers.dev/api/v1";
const CACHE_MIN = 5;

const BOTONES = {
  "btn-soja": "soja",
  "btn-maiz": "maiz",
  "btn-trigo": "trigo",
  "btn-girasol": "girasol",
};

const NOMBRES = { soja: "Soja", maiz: "Maíz", trigo: "Trigo", girasol: "Girasol" };

let pizarra = null;
let historico = null;

const $ = (id) => document.getElementById(id);

function dolares(n) {
  return `U$S ${Number(n).toLocaleString("es-AR", { maximumFractionDigits: 1 })} /tn`;
}

function formatoVariacion(pct) {
  const flecha = pct > 0 ? "▲" : pct < 0 ? "▼" : "=";
  const signo = pct > 0 ? "+" : "";
  return `${flecha} ${signo}${pct.toFixed(2)} %`;
}

function colorear(pct) {
  $("inc-valor").classList.remove("sube", "baja");
  if (pct > 0) $("inc-valor").classList.add("sube");
  if (pct < 0) $("inc-valor").classList.add("baja");
}

async function pedir(ruta) {
  const clave = `granos:${ruta}`;
  try {
    const guardado = JSON.parse(sessionStorage.getItem(clave));
    if (guardado && Date.now() - guardado.t < CACHE_MIN * 60000) return guardado.data;
  } catch (e) {}

  const res = await fetch(`${API_GRANOS}${ruta}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const data = json.data ?? json;

  try {
    sessionStorage.setItem(clave, JSON.stringify({ t: Date.now(), data }));
  } catch (e) {}
  return data;
}

function variacion30dias(grano) {
  if (!historico) return null;

  const lista = Array.isArray(historico)
    ? historico
    : historico.serie ?? historico.historico ?? historico.datos ?? [];

  const valores = lista
    .map((item) => {
      const v = item?.granos?.[grano] ?? item?.[grano];
      return typeof v === "number" ? v : v?.usd_tn;
    })
    .filter((n) => typeof n === "number" && n > 0);

  if (valores.length < 2) return null;
  return ((valores[valores.length - 1] - valores[0]) / valores[0]) * 100;
}

function mostrar(grano) {
  $("mercado-titulo").textContent = NOMBRES[grano];
  $("precio-usd").textContent = "";

  const g = pizarra?.granos?.[grano];

  if (!g || g.usd_tn == null) {
    $("precio-ars").textContent = "Sin cotización";
    $("mercado-fecha").textContent = "No hay precio de pizarra hoy";
    $("inc-valor").textContent = "--";
    $("inc-30d").textContent = "";
    colorear(0);
    return;
  }

  $("precio-ars").textContent = dolares(g.usd_tn);
  $("mercado-fecha").textContent = pizarra.fecha
    ? `Pizarra Rosario · ${pizarra.fecha}`
    : "Pizarra Rosario";

  const v = g.variacion_pct_vs_rueda_anterior;
  if (typeof v === "number") {
    $("inc-valor").textContent = formatoVariacion(v);
    colorear(v);
  } else {
    $("inc-valor").textContent = "--";
    colorear(0);
  }

  const v30 = variacion30dias(grano);
  $("inc-30d").textContent = v30 === null ? "" : `Últimos 30 días: ${formatoVariacion(v30)}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  Object.keys(BOTONES).forEach((idBoton) => {
    const btn = $(idBoton);
    if (!btn) return;

    btn.addEventListener("click", () => {
      Object.keys(BOTONES).forEach((otro) => $(otro)?.classList.remove("active"));
      btn.classList.add("active");
      if (pizarra) mostrar(BOTONES[idBoton]);
    });
  });

  try {
    pizarra = await pedir("/pizarra");
  } catch (err) {
    console.error("Error pizarra:", err);
    $("precio-ars").textContent = "No se pudo cargar";
    $("mercado-fecha").textContent = "Revisá tu conexión";
    return;
  }

  try {
    historico = await pedir("/pizarra/historico?dias=30");
  } catch (err) {
    console.warn("Sin histórico:", err);
  }

  mostrar("soja");
});