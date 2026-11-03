const API = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const pageWrapper = document.getElementById("pageWrapper");
  const triggerSignup = document.getElementById("triggerSignup");
  const loginTab = document.getElementById("loginTab");

  const emailInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const repeatInput = document.getElementById("repeat-password");

  const btnLoginSubmit = document.getElementById("btnLoginSubmit");
  const btnSignupSubmit = document.getElementById("btnSignupSubmit");
  const responseText = document.getElementById("response");

  const btnOpenMap = document.getElementById("btn-open-map");
  const btnCloseMap = document.getElementById("btn-close-map");
  const mapModal = document.getElementById("map-modal");
  const fieldAreaInput = document.getElementById("field-area");
  const fieldCoordsInput = document.getElementById("field-coordinates");

  let map = null;
  let marker = null;
  let selectedLat = null;
  let selectedLng = null;

  const mostrar = (texto) => {
    if (responseText) responseText.textContent = texto;
  };

  // 1. Animación: expandir tarjeta (modo registro)
  if (triggerSignup && pageWrapper) {
    triggerSignup.addEventListener("click", () => pageWrapper.classList.add("expanded"));
  }
  if (loginTab && pageWrapper) {
    loginTab.addEventListener("click", () => pageWrapper.classList.remove("expanded"));
  }

  // 2. LOGIN
  if (btnLoginSubmit) {
    btnLoginSubmit.addEventListener("click", async () => {
      try {
        const res = await fetch(`${API}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passwordInput.value,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          mostrar(data.mensaje || "Error al iniciar sesión");
          return;
        }

        const u = data.usuario;

        // Hectárea 1: la que guarda el servidor
        const principal = { lat: u.fieldCoordenatesLat, lng: u.fieldCoordenatesLng };

        // Hectáreas 2, 3 y 4: las guardadas en este navegador
        let extras = [];
        try {
          extras = JSON.parse(localStorage.getItem(`extraFields:${u.email}`)) || [];
        } catch (e) {}

        localStorage.setItem(
          "user",
          JSON.stringify({
            email: u.email,
            password: passwordInput.value,
            fields: [principal, ...extras],
          })
        );
        localStorage.removeItem("hectareaActiva");

        window.location.href = "hectareas.html";
      } catch (err) {
        console.error(err);
        mostrar("No se pudo conectar con el servidor (¿está encendido en el puerto 3000?)");
      }
    });
  }

  // 3. REGISTRO
  if (btnSignupSubmit) {
    btnSignupSubmit.addEventListener("click", async () => {
      if (!emailInput.value.trim() || !passwordInput.value) {
        mostrar("Completá email y contraseña");
        return;
      }
      if (passwordInput.value !== repeatInput.value) {
        mostrar("Las contraseñas no coinciden");
        return;
      }
      if (selectedLat === null || selectedLng === null) {
        mostrar("Seleccioná tu campo en el mapa");
        return;
      }

      try {
        const res = await fetch(`${API}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passwordInput.value,
            fieldCoordenatesLat: selectedLat,
            fieldCoordenatesLng: selectedLng,
          }),
        });
        const data = await res.json();
        mostrar(data.mensaje);

        if (res.ok) {
          pageWrapper.classList.remove("expanded");
          passwordInput.value = "";
          repeatInput.value = "";
        }
      } catch (err) {
        console.error(err);
        mostrar("No se pudo conectar con el servidor");
      }
    });
  }

  // 4. MAPA (Leaflet)
  if (btnOpenMap && mapModal && btnCloseMap) {
    btnOpenMap.addEventListener("click", () => {
      mapModal.classList.add("active");

      if (!map) {
        setTimeout(() => {
          map = L.map("map-container").setView([-34.6037, -58.3816], 13);

          L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            { attribution: "Tiles © Esri", maxZoom: 19 }
          ).addTo(map);

          L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 19 }
          ).addTo(map);

          L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 19 }
          ).addTo(map);

          L.Control.geocoder({
            defaultMarkGeocode: false,
            placeholder: "Buscar calle o dirección...",
            geocoder: L.Control.Geocoder.nominatim({
              geocodingQueryParams: { countrycodes: "ar" },
            }),
          })
            .on("markgeocode", (e) => map.fitBounds(e.geocode.bbox))
            .addTo(map);

          map.on("click", (e) => {
            const { lat, lng } = e.latlng;
            selectedLat = lat;
            selectedLng = lng;

            if (marker) marker.setLatLng(e.latlng);
            else marker = L.marker(e.latlng).addTo(map);

            // Estos campos pueden no existir en el HTML nuevo
            if (fieldCoordsInput) fieldCoordsInput.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            if (fieldAreaInput) fieldAreaInput.value = "360000 m²";

            mostrar(`Campo seleccionado: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);

            setTimeout(() => mapModal.classList.remove("active"), 600);
          });
        }, 100);
      } else {
        setTimeout(() => map.invalidateSize(), 100);
      }
    });

    btnCloseMap.addEventListener("click", () => mapModal.classList.remove("active"));
    mapModal.addEventListener("click", (e) => {
      if (e.target === mapModal) mapModal.classList.remove("active");
    });
  }
});