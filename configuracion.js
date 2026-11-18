


const user = JSON.parse(sessionStorage.getItem("user"));


if (!user) {
    window.location.href = "login.html";
}


function abrirModal(id) {
    document.getElementById(id).classList.add("activo");
}

function cerrarModal(id) {
    document.getElementById(id).classList.remove("activo");
}




const nombreUsuario = document.getElementById("nombre-usuario");
const emailUsuario = document.getElementById("email-usuario");
const passwordUsuario = document.getElementById("password-usuario");
const mensajeUsuario = document.getElementById("mensaje-usuario");


const nombreGuardado = localStorage.getItem(
    `profileName:${user.email}`
);

nombreUsuario.value = nombreGuardado || "";
emailUsuario.value = user.email || "";





document.getElementById("abrir-info").addEventListener("click", () => {
    abrirModal("modal-info");
});



document.getElementById("abrir-usuario").addEventListener("click", () => {
    abrirModal("modal-usuario");
});



document.getElementById("guardar-usuario").addEventListener("click", () => {

    const nombre = nombreUsuario.value.trim();
    const nuevaPassword = passwordUsuario.value;

    if (!nombre) {
        mensajeUsuario.textContent = "Ingresá un nombre de usuario.";
        return;
    }


    localStorage.setItem(`profileName:${user.email}`, nombre);

  
    if (nuevaPassword !== "") {
        mensajeUsuario.textContent =
            "El nombre se guardó. Para cambiar la contraseña necesitamos conectar el backend.";
    } else {
        mensajeUsuario.textContent = "Nombre guardado correctamente.";
    }

    passwordUsuario.value = "";
});




const selectorIdioma = document.getElementById("seleccionar-idioma");


selectorIdioma.value = localStorage.getItem("idioma") || "es";



document.getElementById("abrir-idioma").addEventListener("click", () => {
    abrirModal("modal-idioma");
});



document.getElementById("guardar-idioma").addEventListener("click", () => {

    localStorage.setItem("idioma", selectorIdioma.value);

    cerrarModal("modal-idioma");
});




document.getElementById("abrir-modal").addEventListener("click", () => {
    abrirModal("modal-cerrar-sesion");
});

document.getElementById("cancelar-sesion").addEventListener("click", () => {
    cerrarModal("modal-cerrar-sesion");
});

document.getElementById("cancelar-x").addEventListener("click", () => {
    cerrarModal("modal-cerrar-sesion");
});

document.getElementById("confirmar-sesion").addEventListener("click", () => {

    sessionStorage.removeItem("user");

    localStorage.removeItem("hectareaActiva");

    window.location.href = 'login.html';
});



document.querySelectorAll("[data-cerrar]").forEach((boton) => {

    boton.addEventListener("click", () => {

        const id = boton.getAttribute("data-cerrar");

        cerrarModal(id);
    });
});





document.addEventListener("keydown", (evento) => {

    if (evento.key === "Escape") {

        document.querySelectorAll(".modal-overlay").forEach((modal) => {
            modal.classList.remove("activo");
        });

    }

});
