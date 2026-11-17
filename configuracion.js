

// Recuperar usuario de la sesión
const user = JSON.parse(sessionStorage.getItem("user"));

// Si no hay usuario, volver al login
if (!user) {
    window.location.href = PAGINA_LOGIN;
}


// ---------- FUNCIONES GENERALES ----------

function abrirModal(id) {
    document.getElementById(id).classList.add("activo");
}

function cerrarModal(id) {
    document.getElementById(id).classList.remove("activo");
}


// ---------- USUARIO ----------

const nombreUsuario = document.getElementById("nombre-usuario");
const emailUsuario = document.getElementById("email-usuario");
const passwordUsuario = document.getElementById("password-usuario");
const mensajeUsuario = document.getElementById("mensaje-usuario");

// Recuperar nombre guardado
const nombreGuardado = localStorage.getItem(
    `profileName:${user.email}`
);

nombreUsuario.value = nombreGuardado || "";
emailUsuario.value = user.email || "";




// Abrir ventana de usuario
document.getElementById("abrir-info").addEventListener("click", () => {
    abrirModal("modal-info");
});


// Abrir ventana de usuario
document.getElementById("abrir-usuario").addEventListener("click", () => {
    abrirModal("modal-usuario");
});


// Guardar cambios
document.getElementById("guardar-usuario").addEventListener("click", () => {

    const nombre = nombreUsuario.value.trim();
    const nuevaPassword = passwordUsuario.value;

    if (!nombre) {
        mensajeUsuario.textContent = "Ingresá un nombre de usuario.";
        return;
    }

    // Guardar nombre en el navegador
    localStorage.setItem(`profileName:${user.email}`, nombre);

    // La contraseña no se guarda localmente.
    if (nuevaPassword !== "") {
        mensajeUsuario.textContent =
            "El nombre se guardó. Para cambiar la contraseña necesitamos conectar el backend.";
    } else {
        mensajeUsuario.textContent = "Nombre guardado correctamente.";
    }

    passwordUsuario.value = "";
});


// ---------- IDIOMA ----------

const selectorIdioma = document.getElementById("seleccionar-idioma");

// Recuperar idioma guardado
selectorIdioma.value = localStorage.getItem("idioma") || "es";


// Abrir ventana de idioma
document.getElementById("abrir-idioma").addEventListener("click", () => {
    abrirModal("modal-idioma");
});


// Guardar idioma
document.getElementById("guardar-idioma").addEventListener("click", () => {

    localStorage.setItem("idioma", selectorIdioma.value);

    cerrarModal("modal-idioma");
});


// ---------- CERRAR SESIÓN ----------

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


// ---------- CERRAR VENTANAS ----------

// Botones con data-cerrar
document.querySelectorAll("[data-cerrar]").forEach((boton) => {

    boton.addEventListener("click", () => {

        const id = boton.getAttribute("data-cerrar");

        cerrarModal(id);
    });
});


// Cerrar tocando afuera de la ventana
document.querySelectorAll(".modal-overlay").forEach((modal) => {

    modal.addEventListener("click", (evento) => {

        if (evento.target === modal) {
            modal.classList.remove("activo");
        }

    });
});


// Cerrar con Escape
document.addEventListener("keydown", (evento) => {

    if (evento.key === "Escape") {

        document.querySelectorAll(".modal-overlay").forEach((modal) => {
            modal.classList.remove("activo");
        });

    }

});
