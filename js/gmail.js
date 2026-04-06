let googleUserToken = null;

function parseJwt(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(function(c) {
                    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join("")
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("Error al leer token:", error);
        return null;
    }
}

function refrescarVistaUsuario() {
    if (typeof cargarEstadoCapturas === "function") {
        cargarEstadoCapturas();
    }

    if (typeof cargarTienda === "function") {
        cargarTienda();
    }

    if (typeof cargarMisPokemon === "function") {
        cargarMisPokemon();
    }
}

function mostrarLoginMenu() {
    const loginContainer = document.getElementById("loginMenuContainer");
    const usuarioMenu = document.getElementById("usuarioMenu");
    const nombreUsuario = document.getElementById("nombreUsuario");

    const loginContainerMobile = document.getElementById("loginMenuContainerMobile");
    const usuarioMenuMobile = document.getElementById("usuarioMenuMobile");
    const nombreUsuarioMobile = document.getElementById("nombreUsuarioMobile");

    if (loginContainer) loginContainer.classList.remove("oculto");
    if (usuarioMenu) usuarioMenu.classList.add("oculto");
    if (nombreUsuario) nombreUsuario.textContent = "";

    if (loginContainerMobile) loginContainerMobile.classList.remove("oculto");
    if (usuarioMenuMobile) usuarioMenuMobile.classList.add("oculto");
    if (nombreUsuarioMobile) nombreUsuarioMobile.textContent = "";
}

function mostrarUsuarioEnMenu(nombre) {
    const nombreFinal = nombre || "Entrenador";

    const loginContainer = document.getElementById("loginMenuContainer");
    const usuarioMenu = document.getElementById("usuarioMenu");
    const nombreUsuario = document.getElementById("nombreUsuario");

    const loginContainerMobile = document.getElementById("loginMenuContainerMobile");
    const usuarioMenuMobile = document.getElementById("usuarioMenuMobile");
    const nombreUsuarioMobile = document.getElementById("nombreUsuarioMobile");

    if (loginContainer) loginContainer.classList.add("oculto");
    if (usuarioMenu) usuarioMenu.classList.remove("oculto");
    if (nombreUsuario) nombreUsuario.textContent = "👤 " + nombreFinal;

    if (loginContainerMobile) loginContainerMobile.classList.add("oculto");
    if (usuarioMenuMobile) usuarioMenuMobile.classList.remove("oculto");
    if (nombreUsuarioMobile) nombreUsuarioMobile.textContent = "👤 " + nombreFinal;
}

function actualizarUIUsuarioGlobal(usuario) {
    if (usuario && usuario.nombre) {
        mostrarUsuarioEnMenu(usuario.nombre);
    } else {
        mostrarLoginMenu();
    }
}

window.handleCredentialResponse = async function(response) {
    try {
        if (!response || !response.credential) {
            console.error("No se recibió credential de Google");
            return;
        }

        googleUserToken = response.credential;

        const googlePayload = parseJwt(response.credential);
        if (googlePayload) {
            const usuarioTemporal = {
                nombre: googlePayload.name || "Entrenador",
                correo: googlePayload.email || "",
                foto: googlePayload.picture || "",
                avatar_id: getAvatarIdLocal ? getAvatarIdLocal() : "steven"
            };

            localStorage.setItem("usuario", JSON.stringify(usuarioTemporal));
            actualizarUIUsuarioGlobal(usuarioTemporal);
        }

        const data = await loginConGoogleCredential(response.credential);

        if (!data || !data.usuario || !data.access_token) {
            throw new Error("Respuesta inválida del login");
        }

        actualizarUIUsuarioGlobal(data.usuario);
        refrescarVistaUsuario();
    } catch (error) {
        console.error("Error login Google:", error);
        limpiarSesion();
        alert("No se pudo iniciar sesión con Google.");
        mostrarLoginMenu();
        refrescarVistaUsuario();
    }
};

function cerrarSesion() {
    googleUserToken = null;
    limpiarSesion();

    if (typeof pokemonsCapturados !== "undefined") pokemonsCapturados = [];
    if (typeof pokemonsShinyCapturados !== "undefined") pokemonsShinyCapturados = [];

    if (typeof limpiarCacheUsuarioTienda === "function") {
        limpiarCacheUsuarioTienda();
    }

    actualizarUIUsuarioGlobal(null);
    refrescarVistaUsuario();
}

document.addEventListener("DOMContentLoaded", async () => {
    const btnCerrar = document.getElementById("cerrarSesionMenu");
    const btnCerrarMobile = document.getElementById("cerrarSesionMenuMobile");
    const token = getAccessToken();

    if (btnCerrar) {
        btnCerrar.addEventListener("click", cerrarSesion);
    }

    if (btnCerrarMobile) {
        btnCerrarMobile.addEventListener("click", cerrarSesion);
    }

    const usuarioLocal = getUsuarioLocal();
    if (usuarioLocal) {
        actualizarUIUsuarioGlobal(usuarioLocal);
    } else {
        actualizarUIUsuarioGlobal(null);
    }

    if (!token) {
        return;
    }

    try {
        const data = await obtenerAuthMe();

        if (data && data.usuario) {
            guardarSesion({ usuario: data.usuario }, { emitirEvento: false });
            actualizarUIUsuarioGlobal(data.usuario);
            return;
        }

        actualizarUIUsuarioGlobal(usuarioLocal || null);
    } catch (error) {
        console.error("Error validando sesión:", error);

        if (error.code === "UNAUTHORIZED" || error.code === "NO_TOKEN") {
            cerrarSesion();
            return;
        }

        actualizarUIUsuarioGlobal(usuarioLocal || null);
    }
});