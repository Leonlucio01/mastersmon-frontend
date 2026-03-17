const API_BASE = "https://mastersmon-api.onrender.com";

function getAccessToken() {
    return localStorage.getItem("access_token") || "";
}

function guardarSesion(data) {
    if (!data) return;

    if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
    }

    if (data.usuario) {
        localStorage.setItem("usuario", JSON.stringify(data.usuario));
        localStorage.setItem("google_logged_in", "true");
        localStorage.setItem("google_user_name", data.usuario.nombre || "");
        localStorage.setItem("usuario_correo", data.usuario.correo || "");
        localStorage.setItem("usuario_foto", data.usuario.foto || "");

        if (data.usuario.id != null) {
            localStorage.setItem("usuario_id", String(data.usuario.id));
        }
    }
}

function limpiarSesion() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("google_logged_in");
    localStorage.removeItem("google_user_name");
    localStorage.removeItem("usuario_correo");
    localStorage.removeItem("usuario_foto");
    localStorage.removeItem("usuario_id");
}

function getUsuarioIdLocal() {
    const directo = localStorage.getItem("usuario_id");
    if (directo) return Number(directo);

    const usuario = getUsuarioLocal();
    if (usuario && usuario.id != null) {
        localStorage.setItem("usuario_id", String(usuario.id));
        return Number(usuario.id);
    }

    return null;
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${url}`);
    }

    return await response.json();
}

async function fetchAuth(url, options = {}) {
    const token = getAccessToken();

    if (!token) {
        const error = new Error("NO_TOKEN");
        error.code = "NO_TOKEN";
        throw error;
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    let response;
    try {
        response = await fetch(url, {
            ...options,
            headers
        });
    } catch (error) {
        const networkError = new Error(`NETWORK_ERROR - ${url}`);
        networkError.code = "NETWORK_ERROR";
        throw networkError;
    }

    if (response.status === 401) {
        limpiarSesion();
        const authError = new Error(`HTTP 401 - ${url}`);
        authError.code = "UNAUTHORIZED";
        throw authError;
    }

    if (!response.ok) {
        const httpError = new Error(`HTTP ${response.status} - ${url}`);
        httpError.code = "HTTP_ERROR";
        throw httpError;
    }

    return await response.json();
}

async function loginConGoogleCredential(credential) {
    const data = await fetchJson(`${API_BASE}/auth/google-login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ credential })
    });

    guardarSesion(data);
    return data;
}

async function obtenerAuthMe() {
    return await fetchAuth(`${API_BASE}/auth/me`);
}

async function obtenerPokemon() {
    try {
        return await fetchJson(`${API_BASE}/pokemon`);
    } catch (error) {
        console.error("Error en obtenerPokemon:", error);
        return [];
    }
}

async function obtenerPokemonMeta() {
    try {
        const lista = await obtenerPokemon();
        const maxId = lista.length > 0
            ? Math.max(...lista.map(p => Number(p.id) || 0))
            : 0;

        return {
            total_pokemon: lista.length,
            max_id: maxId
        };
    } catch (error) {
        console.error("Error en obtenerPokemonMeta:", error);
        return null;
    }
}

async function obtenerEvoluciones(id) {
    try {
        return await fetchJson(`${API_BASE}/pokemon/${id}/evoluciones`);
    } catch (error) {
        console.error("Error en obtenerEvoluciones:", error);
        return [];
    }
}

async function obtenerDetalleEvolucion(id) {
    try {
        return await fetchJson(`${API_BASE}/pokemon/${id}/detalle-evolucion`);
    } catch (error) {
        console.error("Error en obtenerDetalleEvolucion:", error);
        return [];
    }
}

async function obtenerEvolucionesCacheGlobal() {
    try {
        return await fetchJson(`${API_BASE}/pokemon/evoluciones-cache`);
    } catch (error) {
        console.error("Error en obtenerEvolucionesCacheGlobal:", error);
        return {};
    }
}

async function obtenerPokemonUsuarioActual() {
    try {
        return await fetchAuth(`${API_BASE}/usuario/me/pokemon`);
    } catch (error) {
        if (error.code === "NO_TOKEN" || error.code === "UNAUTHORIZED") {
            return [];
        }
        console.error("Error en obtenerPokemonUsuarioActual:", error);
        return [];
    }
}

async function obtenerUsuarioActual() {
    try {
        return await fetchAuth(`${API_BASE}/usuario/me`);
    } catch (error) {
        if (error.code === "NO_TOKEN" || error.code === "UNAUTHORIZED") {
            return null;
        }
        console.error("Error en obtenerUsuarioActual:", error);
        return null;
    }
}

async function obtenerItemsUsuarioActual() {
    try {
        return await fetchAuth(`${API_BASE}/usuario/me/items`);
    } catch (error) {
        if (error.code === "NO_TOKEN" || error.code === "UNAUTHORIZED") {
            return [];
        }
        console.error("Error en obtenerItemsUsuarioActual:", error);
        return [];
    }
}

function getUsuarioLocal() {
    try {
        const raw = localStorage.getItem("usuario");
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn("No se pudo leer usuario local:", error);
        return null;
    }
}