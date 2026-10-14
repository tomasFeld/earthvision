document.addEventListener('DOMContentLoaded', () => {
    // 1. ELEMENTOS DE AUTENTICACIÓN
    const btnLoginSubmit = document.getElementById('btnLoginSubmit');
    const btnSignupSubmit = document.getElementById('btnSignupSubmit');
    const userInput = document.getElementById('username'); // Input de E-Mail
    const passwordInput = document.getElementById('password'); // Input de Password
    const responseText = document.getElementById('response'); // H3 para mensajes

    // 2. ELEMENTOS DEL MAPA Y MODAL
    const btnOpenMap = document.getElementById('btn-open-map');
    const btnCloseMap = document.getElementById('btn-close-map');
    const mapModal = document.getElementById('map-modal');
    const fieldAreaInput = document.getElementById('field-area');
    const fieldCoordsInput = document.getElementById('field-coordinates');

    let map = null;
    let marker = null;
    let selectedLat = null;
    let selectedLng = null;

    // Dirección de tu servidor npm corriendo en el puerto 3000
    const BACKEND_URL = 'http://localhost:3000';

    // ==========================================
    // 1. LOGIN ACCIÓN (Petición GET a npm)
    // ==========================================
    if (btnLoginSubmit) {
        btnLoginSubmit.addEventListener('click', async () => {
            const email = userInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                responseText.textContent = "Faltan datos requeridos (email y password)";
                return;
            }

            try {
                // CORREGIDO: faltaban los $ en el template literal
                const url = `BACKENDURL/api/login?email={encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
                const response = await fetch(url);
                const data = await response.json();

                if (response.ok) {
                    responseText.textContent = data.mensaje;

                    // Guardamos la configuración del productor en el navegador si el backend la envía
                    if (data.usuario) {
                        localStorage.setItem('userFieldLat', data.usuario.fieldCoordenatesLat);
                        localStorage.setItem('userFieldLng', data.usuario.fieldCoordenatesLng);
                    }

                    // Redirección al panel de la app de agroindustria
                    setTimeout(() => {
                        window.location.href = 'app.html';
                    }, 1000);
                } else {
                    responseText.textContent = data.mensaje || "Error al iniciar sesión";
                }
            } catch (error) {
                responseText.textContent = "Error de conexión con el servidor npm.";
                console.error(error);
            }
        });
    }

    // ==========================================
    // 2. SIGN-UP ACCIÓN (Petición GET a npm)
    // ==========================================
    if (btnSignupSubmit) {
        btnSignupSubmit.addEventListener('click', async () => {
            const email = userInput.value.trim();
            const password = passwordInput.value;
            const repeatPassword = document.getElementById('repeat-password')?.value;

            if (!email || !password) {
                responseText.textContent = "Por favor, completa el email y la contraseña.";
                return;
            }

            if (password !== repeatPassword) {
                responseText.textContent = "Las contraseñas no coinciden.";
                return;
            }

            if (!selectedLat || !selectedLng) {
                responseText.textContent = "Por favor, selecciona tu zona productiva en el mapa primero.";
                return;
            }

            try {
                // CORREGIDO: faltaban los $ en el template literal
                const url = `BACKENDURL/api/register?email={encodeURIComponent(email)}&password=encodeURIComponent(password)&fieldCoordenatesLng={selectedLng}&fieldCoordenatesLat=${selectedLat}`;
                const response = await fetch(url);
                const data = await response.json();

                if (response.ok) {
                    responseText.textContent = data.mensaje || "¡Usuario guardado con éxito!";
                    // Simula clic en la pestaña de login si existe el elemento en tu HTML
                    document.getElementById('loginTab')?.click();
                } else {
                    responseText.textContent = data.mensaje || "Error en el registro.";
                }
            } catch (error) {
                responseText.textContent = "Error al conectar con el servidor npm.";
                console.error(error);
            }
        });
    }

    // ==========================================
    // 3. MAPA LEAFLET Y CONSULTA SATELITAL (Earth Engine)
    // ==========================================
    if (btnOpenMap && mapModal && btnCloseMap) {

        btnOpenMap.addEventListener('click', () => {
            mapModal.classList.add('active');

            if (!map) {
                setTimeout(() => {
                    // Inicialización por defecto en Buenos Aires
                    map = L.map('map-container').setView([-34.6037, -58.3816], 13);

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap'
                    }).addTo(map);

                    map.on('click', async (e) => {
                        const { lat, lng } = e.latlng;
                        selectedLat = lat;
                        selectedLng = lng;

                        if (marker) {
                            marker.setLatLng(e.latlng);
                        } else {
                            marker = L.marker(e.latlng).addTo(map);
                        }

                        fieldCoordsInput.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                        fieldAreaInput.value = "Calculando índices satelitales (NDVI)...";

                        // Variables por defecto solicitadas por tu API
                        const currentDay = 180;
                        const currentYear = 2024;

                        try {
                            // CORREGIDO: faltaban los $ en el template literal
                            const urlCalculo = `BACKENDURL/api/calculateData?fieldCoordenateslng={lng}&fieldCoordenatesLat=lat&day={currentDay}&year=${currentYear}`;
                            const response = await fetch(urlCalculo);
                            const data = await response.json();

                            if (response.ok && data.datosObtenidos) {
                                const datos = data.datosObtenidos;

                                // Formateamos los decimales para que el productor los lea limpios en la UI
                                const ndviFormateado = datos.ndvi != null ? datos.ndvi.toFixed(3) : 'N/D';
                                const ndmiFormateado = datos.ndmi != null ? datos.ndmi.toFixed(3) : 'N/D';
                                const tempFormateada = datos.temperature != null ? datos.temperature.toFixed(1) : 'N/D';
                                const precFormateada = datos.precipitation != null ? datos.precipitation.toFixed(1) : '0';

                                fieldAreaInput.value = `NDVI: ${ndviFormateado} | NDMI: ${ndmiFormateado}`;
                                responseText.textContent = `Suelo analizado. Temp: ${tempFormateada}°C | Prec: ${precFormateada} mm`;
                            } else {
                                fieldAreaInput.value = "Error al procesar índices en el servidor.";
                            }
                        } catch (error) {
                            console.error("Error al calcular métricas de suelo:", error);
                            fieldAreaInput.value = "Error de red con el servidor.";
                        }
                    });
                }, 150);
            } else {
                setTimeout(() => map.invalidateSize(), 100);
            }
        });

        btnCloseMap.addEventListener('click', () => {
            mapModal.classList.remove('active');
        });

        mapModal.addEventListener('click', (e) => {
            if (e.target === mapModal) {
                mapModal.classList.remove('active');
            }
        });
    }
});
