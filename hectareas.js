
const PAGINA_LOGIN = "login.html"; // Cambiar por el nombre real de tu página
const MAX_HECTAREAS = 4;

let usuario = null;
let mapa = null;
let marcadores = [];
let marcadorNuevo = null;
let puntoElegido = null;


// 1. CARGAR USUARIO

function cargarUsuario() {

    const datos = sessionStorage.getItem("user");

    if (!datos) return null;

    const u = JSON.parse(datos);

    // Convertimos las coordenadas recibidas del servidor en una lista
    u.fields = [];

    for (let i = 1; i <= MAX_HECTAREAS; i++) {

        const numero = i === 1 ? "" : i;

        const lat = u[`fieldCoordenatesLat${numero}`];
        const lng = u[`fieldCoordenatesLng${numero}`];

        if (lat != null && lng != null) {

            u.fields.push({
                lat: Number(lat),
                lng: Number(lng)
            });

        }
    }

    return u;
}


// 2. ACTUALIZAR SESIÓN

function guardarSesion() {

    sessionStorage.setItem("user", JSON.stringify(usuario));

}


// 3. MOSTRAR LISTA DE HECTÁREAS

function mostrarHectareas() {

    const lista = document.getElementById("lista-hectareas");
    const botonAgregar = document.getElementById("btn-agregar");

    // Borramos los botones anteriores para evitar duplicados
    lista.innerHTML = "";

    usuario.fields.forEach((punto, indice) => {

        const boton = document.createElement("button");

        boton.className = "hct_btn";
        boton.textContent = `Hectárea ${indice + 1}`;

        boton.addEventListener("click", () => {

            localStorage.setItem("hectareaActiva", indice);

            window.location.href = `coordenadas.html?id=${indice}`;

        });

        lista.appendChild(boton);

    });

    const completo = usuario.fields.length >= MAX_HECTAREAS;

    botonAgregar.disabled = completo;

    botonAgregar.textContent = completo
        ? "Máximo 4 hectáreas"
        : "Agregar hectárea";

}


// 4. INICIAR MAPA

function iniciarMapa() {

    const ultimoPunto = usuario.fields[usuario.fields.length - 1];

    const centro = ultimoPunto
        ? [ultimoPunto.lat, ultimoPunto.lng]
        : [-34.6037, -58.3816];

    mapa = L.map("mapa-nuevo").setView(centro, 14);

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


    // Buscador de ubicaciones

    L.Control.geocoder({
        defaultMarkGeocode: false,
        placeholder: "Buscar calle o dirección...",
        geocoder: L.Control.Geocoder.nominatim({
            geocodingQueryParams: {
                countrycodes: "ar"
            }
        })
    })

    .on("markgeocode", (e) => {

        mapa.fitBounds(e.geocode.bbox);

    })

    .addTo(mapa);


    // Seleccionar punto haciendo clic

    mapa.on("click", (e) => {

        puntoElegido = {
            lat: e.latlng.lat,
            lng: e.latlng.lng
        };

        if (marcadorNuevo) {

            marcadorNuevo.setLatLng(e.latlng);

        } else {

            marcadorNuevo = L.marker(e.latlng).addTo(mapa);

        }

        document.getElementById("btn-confirmar-mapa").disabled = false;

        document.getElementById("modal-mapa-texto").textContent =
            `Punto elegido: ${puntoElegido.lat.toFixed(5)}, ${puntoElegido.lng.toFixed(5)}`;

    });

}


// 5. MOSTRAR PUNTOS EXISTENTES

function mostrarPuntosExistentes() {

    marcadores.forEach(m => mapa.removeLayer(m));

    marcadores = [];

    usuario.fields.forEach((punto, indice) => {

        const marcador = L.circleMarker(
            [punto.lat, punto.lng],
            {
                radius: 8,
                color: "#fff",
                fillColor: "#0f6b1a",
                fillOpacity: 1
            }
        )
        .addTo(mapa)
        .bindTooltip(`Hectárea ${indice + 1}`, {
            permanent: true,
            direction: "top"
        });

        marcadores.push(marcador);

    });

}


// 6. ABRIR MAPA

function abrirMapa() {

    if (usuario.fields.length >= MAX_HECTAREAS) {

        alert("Llegaste al máximo de 4 hectáreas.");

        return;

    }

    puntoElegido = null;

    document.getElementById("btn-confirmar-mapa").disabled = true;

    document.getElementById("modal-mapa-texto").textContent =
        "Hacé clic en el mapa para elegir tu nueva hectárea";

    document.getElementById("modal-mapa").classList.add("active");

    setTimeout(() => {

        if (!mapa) {

            iniciarMapa();

        } else {

            mapa.invalidateSize();

        }

        if (marcadorNuevo) {

            mapa.removeLayer(marcadorNuevo);

            marcadorNuevo = null;

        }

        mostrarPuntosExistentes();

    }, 100);

}


// 7. CERRAR MAPA

function cerrarMapa() {

    document.getElementById("modal-mapa").classList.remove("active");

}


// 8. AGREGAR HECTÁREA AL SERVIDOR

async function confirmarHectarea() {

    if (!puntoElegido) return;

    if (usuario.fields.length >= MAX_HECTAREAS) {

        alert("Ya alcanzaste el máximo de 4 hectáreas.");

        return;

    }

    const boton = document.getElementById("btn-confirmar-mapa");

    boton.disabled = true;

    try {

        const response = await fetch(
            "http://localhost:3000/api/agregarHectareas",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    email: usuario.email,

                    fieldCoordenatesLng: puntoElegido.lng,

                    fieldCoordenatesLat: puntoElegido.lat

                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(data.mensaje);

            return;

        }


        // Actualizamos el usuario con las coordenadas confirmadas

        const numero = usuario.fields.length + 1;

        usuario[`fieldCoordenatesLng${numero}`] = puntoElegido.lng;

        usuario[`fieldCoordenatesLat${numero}`] = puntoElegido.lat;

        usuario.fields.push({
            lat: puntoElegido.lat,
            lng: puntoElegido.lng
        });


        // Actualizamos la sesión temporal

        guardarSesion();

        // Actualizamos la interfaz

        mostrarHectareas();

        mostrarPuntosExistentes();

        cerrarMapa();

        puntoElegido = null;

        console.log(data.mensaje);

    } catch (error) {

        console.error("Error al agregar hectárea:", error);

        alert("No se pudo conectar con el servidor.");

    } finally {

        boton.disabled = false;

    }

}


// 9. INICIAR PÁGINA

document.addEventListener("DOMContentLoaded", () => {

    usuario = cargarUsuario();

    if (!usuario) {

        window.location.href = PAGINA_LOGIN;

        return;

    }

    mostrarHectareas();

    document.getElementById("btn-agregar")
        .addEventListener("click", abrirMapa);

    document.getElementById("btn-cerrar-mapa")
        .addEventListener("click", cerrarMapa);

    document.getElementById("btn-confirmar-mapa")
        .addEventListener("click", confirmarHectarea);

    document.getElementById("modal-mapa")
        .addEventListener("click", (e) => {

            if (e.target.id === "modal-mapa") {

                cerrarMapa();

            }

        });

});
