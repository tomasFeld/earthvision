const selectorCampo = document.getElementById("selector-campo");

const usuario = JSON.parse(sessionStorage.getItem("user"));
console.log(usuario);

const campos = [];

// cargamos y seleccionamos hectareas
for (let i = 1; i <= 4; i++) {
    console.log(campos);

    let numero = "";

    if (i !== 1) {
        numero = i;
    }

    const lat = usuario["fieldCoordenatesLat" + numero];
    const lng = usuario["fieldCoordenatesLng" + numero];

    if (lat != null && lng != null) {

        campos.push({
            lat: Number(lat),
            lng: Number(lng)
        });

    }

}

campos.forEach((campo, indice) => {

    const opcion = document.createElement("option");

    opcion.value = indice;

    opcion.textContent = "Hectárea " + (indice + 1);

    selectorCampo.appendChild(opcion);

});

selectorCampo.addEventListener("change", function() {

    const indice = Number(selectorCampo.value);

    const campoSeleccionado = campos[indice];

    console.log(campoSeleccionado);
    obtenerClima(campoSeleccionado);

});

const campoInicial = campos[Number(selectorCampo.value)];

obtenerClima(campoInicial);


// el fetcheo con open meteo


async function obtenerClima(campo) {
const url = `https://api.open-meteo.com/v1/forecast?latitude=${campo.lat}&longitude=${campo.lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=4&timezone=auto`;


const respuesta = await fetch(url);

const datos = await respuesta.json();

console.log(datos);
const climaActual = datos.current;


// mostramos en pantalla la informacion con diferntes variables de climaactual

document.getElementById("hoy-icono").textContent =
    obtenerIconoClima(climaActual.weather_code);

console.log(climaActual.temperature_2m);

document.getElementById("hoy-temp").textContent =
    Math.round(climaActual.temperature_2m) + "°C";





document.getElementById("hoy-viento").textContent =
    "💨 " + climaActual.wind_speed_10m + " KMH";


document.getElementById("hoy-lluvia").textContent =
    "🌧️ " + climaActual.precipitation + " MM";


document.getElementById("hoy-humedad").textContent =
    "💧 " + climaActual.relative_humidity_2m + "%";




// proximos tres dias
const pronostico = datos.daily;
console.log(pronostico);


for (let i = 1; i <= 3; i++) {

    console.log(pronostico.time[i]);
    console.log(pronostico.temperature_2m_max[i]);
    console.log(pronostico.temperature_2m_min[i]);

    const tarjeta = document.getElementById("dia-" + i);
    tarjeta.innerHTML = '<span class="dia-nombre"></span>';


    const fecha = new Date(pronostico.time[i] + "T12:00:00");

const nombreDia = fecha.toLocaleDateString("es-AR", {
    weekday: "long"
});

tarjeta.querySelector(".dia-nombre").textContent = nombreDia;



const maxima = pronostico.temperature_2m_max[i];
const minima = pronostico.temperature_2m_min[i];

const codigoClima = pronostico.weather_code[i];

const icono = obtenerIconoClima(codigoClima);

const iconoHTML = document.createElement("span");

iconoHTML.classList.add("dia-icono");

iconoHTML.textContent = icono;

tarjeta.appendChild(iconoHTML);

tarjeta.innerHTML += `
    <div class="dia-temps">
        ${Math.round(maxima)}° / ${Math.round(minima)}°
    </div>
`;

}

// convertimos los numeros que nos da open meteo en emojis para mostrar

function obtenerIconoClima(codigo) {

    if (codigo === 0) return "☀️";

    if (codigo <= 3) return "🌤️";

    if (codigo === 45 || codigo === 48) return "🌫️";

    if ([51, 53, 55, 56, 57].includes(codigo)) return "🌦️";

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(codigo)) return "🌧️";

    if ([71, 73, 75, 77, 85, 86].includes(codigo)) return "❄️";

    if ([95, 96, 99].includes(codigo)) return "⛈️";

    return "🌡️";
}



}