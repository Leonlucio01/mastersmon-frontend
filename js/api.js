const API_BASE = "https://mastersmon-api.onrender.com";
const AVATAR_DEFAULT_ID = "steven";

function getAccessToken() {
    return localStorage.getItem("access_token") || "";
}

function getAvatarIdLocal() {
    return localStorage.getItem("usuario_avatar_id") || AVATAR_DEFAULT_ID;
}

function normalizarAvatarIdLocal(avatarId) {
    const valor = String(avatarId || "").trim().toLowerCase();
    return valor || AVATAR_DEFAULT_ID;
}

function normalizarUsuarioSesion(usuario) {
    if (!usuario || typeof usuario !== "object") return null;

    return {
        ...usuario,
        avatar_id: normalizarAvatarIdLocal(usuario.avatar_id || AVATAR_DEFAULT_ID)
    };
}

function emitirEventoSesion(usuario = null) {
    document.dispatchEvent(new CustomEvent("usuarioSesionActualizada", {
        detail: { usuario }
    }));
}

function guardarSesion(data) {
    if (!data) return;

    if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
    }

    if (data.usuario) {
        const usuarioNormalizado = normalizarUsuarioSesion(data.usuario);

        localStorage.setItem("usuario", JSON.stringify(usuarioNormalizado));
        localStorage.setItem("google_logged_in", "true");
        localStorage.setItem("google_user_name", usuarioNormalizado.nombre || "");
        localStorage.setItem("usuario_correo", usuarioNormalizado.correo || "");
        localStorage.setItem("usuario_foto", usuarioNormalizado.foto || "");
        localStorage.setItem("usuario_avatar_id", usuarioNormalizado.avatar_id || AVATAR_DEFAULT_ID);

        if (usuarioNormalizado.id != null) {
            localStorage.setItem("usuario_id", String(usuarioNormalizado.id));
        }

        emitirEventoSesion(usuarioNormalizado);
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
    localStorage.removeItem("usuario_avatar_id");

    emitirEventoSesion(null);
}

function getUsuarioLocal() {
    try {
        const raw = localStorage.getItem("usuario");
        if (!raw) return null;

        const usuario = JSON.parse(raw);
        if (!usuario) return null;

        const usuarioNormalizado = normalizarUsuarioSesion(usuario);

        if (JSON.stringify(usuario) !== JSON.stringify(usuarioNormalizado)) {
            localStorage.setItem("usuario", JSON.stringify(usuarioNormalizado));
            localStorage.setItem("usuario_avatar_id", usuarioNormalizado.avatar_id || AVATAR_DEFAULT_ID);

            if (usuarioNormalizado.id != null) {
                localStorage.setItem("usuario_id", String(usuarioNormalizado.id));
            }
        }

        return usuarioNormalizado;
    } catch (error) {
        console.warn("No se pudo leer usuario local:", error);
        return null;
    }
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

async function obtenerMensajeError(response, url) {
    try {
        const data = await response.json();
        return data?.detail || data?.mensaje || `HTTP ${response.status} - ${url}`;
    } catch (error) {
        return `HTTP ${response.status} - ${url}`;
    }
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        const mensaje = await obtenerMensajeError(response, url);
        throw new Error(mensaje);
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
        const mensaje = await obtenerMensajeError(response, url);
        const httpError = new Error(mensaje);
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
        const usuario = await fetchAuth(`${API_BASE}/usuario/me`);
        if (usuario) {
            guardarSesion({ usuario });
        }
        return normalizarUsuarioSesion(usuario);
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

async function actualizarAvatarUsuarioActual(avatarId) {
    try {
        const data = await fetchAuth(`${API_BASE}/usuario/me/avatar`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                avatar_id: avatarId
            })
        });

        if (data && data.usuario) {
            guardarSesion({ usuario: data.usuario });
        }

        return data;
    } catch (error) {
        console.error("Error en actualizarAvatarUsuarioActual:", error);
        throw error;
    }
}

async function obtenerRankingEntrenadores(limit = 10) {
    try {
        return await fetchJson(`${API_BASE}/ranking/entrenadores?limit=${encodeURIComponent(limit)}`);
    } catch (error) {
        console.error("Error en obtenerRankingEntrenadores:", error);
        return [];
    }
}

async function obtenerRankingPokemonExperiencia(limit = 10) {
    try {
        return await fetchJson(`${API_BASE}/ranking/pokemon/experiencia?limit=${encodeURIComponent(limit)}`);
    } catch (error) {
        console.error("Error en obtenerRankingPokemonExperiencia:", error);
        return [];
    }
}

async function obtenerRankingPokemonVictorias(limit = 10) {
    try {
        return await fetchJson(`${API_BASE}/ranking/pokemon/victorias?limit=${encodeURIComponent(limit)}`);
    } catch (error) {
        console.error("Error en obtenerRankingPokemonVictorias:", error);
        return [];
    }
}

async function obtenerRankingCapturasUnicas(limit = 10) {
    try {
        return await fetchJson(`${API_BASE}/ranking/capturas-unicas?limit=${encodeURIComponent(limit)}`);
    } catch (error) {
        console.error("Error en obtenerRankingCapturasUnicas:", error);
        return {
            meta_pokedex: {
                total_pokemon_tabla: 0,
                total_variantes_por_pokemon: 0,
                total_pokedex: 0,
                variantes_disponibles: []
            },
            ranking: []
        };
    }
}

async function obtenerRankingResumen(limit = 10) {
    try {
        return await fetchJson(`${API_BASE}/ranking/resumen?limit=${encodeURIComponent(limit)}`);
    } catch (error) {
        console.error("Error en obtenerRankingResumen:", error);
        return {
            meta_pokedex: {
                total_pokemon_tabla: 0,
                total_variantes_por_pokemon: 0,
                total_pokedex: 0,
                variantes_disponibles: []
            },
            capturas_unicas: [],
            entrenadores: [],
            pokemon_experiencia: [],
            pokemon_victorias: []
        };
    }
}