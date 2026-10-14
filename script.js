document.addEventListener('DOMContentLoaded', () => {
  // 1. ELEMENTOS DE AUTENTICACIÓN (Tu nuevo HTML)
  const btnLoginSubmit = document.getElementById('btnLoginSubmit'); 
  const btnSignupSubmit = document.getElementById('btnSignupSubmit'); 
  const userInput = document.getElementById('username'); // Input de E-Mail
  const passwordInput = document.getElementById('password'); // Input de Password
  const responseText = document.getElementById('response'); // Tu h3 para mensajes
  
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

  const BACKEND_URL = 'http://localhost:3000';

  // ==========================================
  // 1. LOGIN ACCIÓN (Petición HTTP GET a Java)
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
              const url = `BACKENDURL/api/login?email={encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
              const response = await fetch(url);
              const data = await response.json();

              if (response.status === 200) {
                  responseText.textContent = data.mensaje;
                  // Guardamos la configuración del productor para la app principal
                  localStorage.setItem('userFieldLat', data.usuario.fieldCoordenatesLat);
                  localStorage.setItem('userFieldLng', data.usuario.fieldCoordenatesLng);
                  
                  // Redirección directa al panel de agroindustria
                  window.location.href = 'app.html'; 
              } else {
                  responseText.textContent = data.mensaje || "Error al iniciar sesión";
              }
          } catch (error) {
              responseText.textContent = "Error de conexión con el servidor Java (revisar CORS).";
              console.error(error);
          }
      });
  }

  // ==========================================
  // 2. SIGN-UP ACCIÓN (Petición HTTP GET a Java)
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
              // Mapeo milimétrico de parámetros para Java: fieldCoordenatesLng y fieldCoordenatesLat
              const url = `BACKENDURL/api/register?email={encodeURIComponent(email)}&password=encodeURIComponent(password)&fieldCoordenatesLng={selectedLng}&fieldCoordenatesLat=${selectedLat}`;
              const response = await fetch(url);
              const data = await response.json();

              if (response.status === 200) {
                  responseText.textContent = "¡Usuario guardado en records.txt con éxito! Ya puedes loguearte.";
                  // Opcional: Podés disparar un clic en tu loginTab para que el usuario vuelva visualmente al login
                  document.getElementById('loginTab')?.click();
              } else {
                  responseText.textContent = data.mensaje || "Error en el registro.";
              }
          } catch (error) {
              responseText.textContent = "Error al conectar con el servidor de registro Java.";
              console.error(error);
          }
      });
  }

  // ==========================================
  // 3. CONTROL DEL MAPA LEAFLET Y CONSULTA AGTECH
  // ==========================================
  if (btnOpenMap && mapModal && btnCloseMap) {

      btnOpenMap.addEventListener('click', () => {
          mapModal.classList.add('active'); // Muestra el overlay configurado en tu login.css

          if (!map) {
              setTimeout(() => {
                  // Inicialización apuntando a Buenos Aires por defecto
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
                      
                      // Variables de fecha requeridas por tu compañero en /api/calculateData
                      const currentDay = 180; 
                      const currentYear = 2024;

                      try {
                          // Respetando minuciosamente la variable de consulta: fieldCoordenateslng (todo en minúsculas)
                          const urlCalculo = `BACKENDURL/api/calculateData?fieldCoordenateslng={lng}&fieldCoordenatesLat=lat&day={currentDay}&year=${currentYear}`;
                          const response = await fetch(urlCalculo);
                          const data = await response.json();

                          if (response.status === 200) {
                              const datos = data.datosObtenidos;
                              // Colocamos los resultados en el input visible del formulario
                              fieldAreaInput.value = `NDVI: ${datos.ndvi} | NDMI: ${datos.ndmi}`;
                              responseText.textContent = `Suelo analizado correctamente. Temp ambiente: ${datos.temperature}°C`;
                          }
                      } catch (error) {
                          console.error("Error al calcular métricas de suelo:", error);
                          fieldAreaInput.value = "Error al conectar con índices.";
                      }
                  });
              }, 150); // Pequeño margen para asegurar que el contenedor de Leaflet se despliegue bien
          } else {
              setTimeout(() => map.invalidateSize(), 100);
          }
      });

      // Cerrar el modal al hacer clic en la "X"
      btnCloseMap.addEventListener('click', () => {
          mapModal.classList.remove('active');
      });
      
      // Cerrar si hacen clic fuera de la tarjeta del mapa
      mapModal.addEventListener('click', (e) => {
          if (e.target === mapModal) {
              mapModal.classList.remove('active');
          }
      });
  }
});

