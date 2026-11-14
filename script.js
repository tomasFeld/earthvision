
const emailInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("btnLoginSubmit");
const signupButton = document.getElementById("btnSignupSubmit");

const responseText = document.getElementById("response");


const openMapButton = document.getElementById("btn-open-map");
const closeMapButton = document.getElementById("btn-close-map");
const mapModal = document.getElementById("map-modal");


const pageWrapper = document.getElementById("pageWrapper");

async function register(email, password, lng, lat) {
 const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email: email,
            password: password,
            fieldCoordenatesLng: lng,
            fieldCoordenatesLat: lat
        })
    });

 const data = await response.json();

responseText.textContent = data.mensaje;

if (response.ok) {
    pageWrapper.classList.remove("expanded");
}


}


async function login(email, password) {


  const response = await fetch("http://localhost:3000/api/login", {
    method: "POST",

    headers: {
        "Content-Type": "application/json"
    },

    body: JSON.stringify({
        email: email,
        password: password
    })

  
});

const data = await response.json();

responseText.textContent = data.mensaje;

console.log(data);

if (response.ok) {

  
    sessionStorage.setItem("user", JSON.stringify(data.usuario));

    window.location.href = "hectareas.html";


    
}
 



console.log(data);
}

signupButton.addEventListener("click", function() {


  console.log("Enviando registro al servidor...");
    const email = emailInput.value;
    const password = passwordInput.value;

    console.log("Email:", email);
console.log("Password:", password);

if (lat === null || lng === null) {
    responseText.textContent = "Primero seleccioná un punto en el mapa.";
    return;
}

register(email, password, lng, lat);

});

loginButton.addEventListener("click", function() {

    const email = emailInput.value;
    const password = passwordInput.value;

    login(email, password);

});





let lng = null;
let lat = null;


const map = L.map("map-container").setView([-34.6037, -58.3816], 10);

// Imágenes satelitales de Esri
L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Tiles © Esri",
        maxZoom: 19
    }
).addTo(map);


// Nombres de lugares y límites geográficos
L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {
        maxZoom: 19
    }
).addTo(map);

let marker;

const selectedCoordinates = document.getElementById("selected-coordinates");

function selectPoint(point) {

    lat = point.lat;
    lng = point.lng;

    if (marker) {
        map.removeLayer(marker);
    }

    marker = L.marker([lat, lng]).addTo(map);

    selectedCoordinates.textContent =
        "Latitud: " + lat.toFixed(6) +
        " | Longitud: " + lng.toFixed(6);

    console.log("Punto seleccionado:", lat, lng);

    mapModal.classList.remove("active");
}

map.on("click", function(event) {
    selectPoint(event.latlng);
});


L.Control.geocoder({
    defaultMarkGeocode: false,
    placeholder: "Buscar campo o ubicación..."
})

.on("markgeocode", function(event) {

    const point = event.geocode.center;

    map.setView(point, 17);

})

.addTo(map);

openMapButton.addEventListener("click", function() {

    mapModal.classList.add("active");

    setTimeout(function() {
        map.invalidateSize();
    }, 350);

    

});

closeMapButton.addEventListener("click", function() {

    mapModal.classList.remove("active");

});