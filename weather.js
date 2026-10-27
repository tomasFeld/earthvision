document.addEventListener("DOMContentLoaded", async () => {
    const contenedorClima = document.querySelector(".weather-info");
  
    try {
      // Pedimos la temperatura al nuevo endpoint del backend
      const respuesta = await fetch("http://localhost:3000/api/temperatura-actual?ciudad=Buenos_Aires");
      if (!respuesta.ok) throw new Error("Error en el servidor");
      
      const datos = await respuesta.json();
      
      // Modificamos el HTML insertando directamente los grados
      if (contenedorClima) {
        contenedorClima.innerHTML = `
          <h2>Informacion de clima</h2>
          <p style="font-size: 32px; font-weight: 600; margin-top: 15px; color: #fff;">
            ${datos.temperatura.toFixed(1)}°C
          </p>
        `;
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      if (contenedorClima) {
        contenedorClima.innerHTML = `
          <h2>Informacion de clima</h2>
          <p style="color: #ff6b6b; margin-top: 10px;">Error al cargar temperatura</p>
        `;
      }
    }
  });
  