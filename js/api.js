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

async function obtenerMovimientosPokemonUsuario(usuarioPokemonId) {
    try {
        return await fetchAuth(`${API_BASE}/usuario/pokemon/${encodeURIComponent(usuarioPokemonId)}/movimientos`);
    } catch (error) {
        if (error.code === "NO_TOKEN" || error.code === "UNAUTHORIZED") {
            return { ok: false, movimientos: [], equipados: [] };
        }
        console.error("Error en obtenerMovimientosPokemonUsuario:", error);
        throw error;
    }
}

async function equiparMovimientoPokemonUsuario(usuarioPokemonId, movimientoId, slot) {
    try {
        return await fetchAuth(`${API_BASE}/usuario/pokemon/${encodeURIComponent(usuarioPokemonId)}/movimientos/equipar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                movimiento_id: Number(movimientoId),
                slot: Number(slot)
            })
        });
    } catch (error) {
        console.error("Error en equiparMovimientoPokemonUsuario:", error);
        throw error;
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

/* =========================================================
   MAPS / PRESENCIA / WEBSOCKET
========================================================= */

function getApiBase() {
    return String(API_BASE || "").replace(/\/+$/, "");
}

function getMapsWsBase() {
    const base = getApiBase();

    if (base.startsWith("https://")) {
        return base.replace(/^https:\/\//i, "wss://");
    }

    if (base.startsWith("http://")) {
        return base.replace(/^http:\/\//i, "ws://");
    }

    return base;
}

function buildMapsWsUrl() {
    const token = getAccessToken();
    const wsBase = getMapsWsBase();

    if (!token) {
        throw new Error("NO_TOKEN");
    }

    const url = new URL(`${wsBase}/ws/maps`);
    url.searchParams.set("token", token);
    return url.toString();
}

async function obtenerPresenciaMapa(zonaId) {
    try {
        return await fetchAuth(`${API_BASE}/maps/presencia/${encodeURIComponent(zonaId)}`);
    } catch (error) {
        if (error.code === "NO_TOKEN" || error.code === "UNAUTHORIZED") {
            return {
                ok: false,
                zona_id: Number(zonaId),
                ttl_segundos: 0,
                jugadores: []
            };
        }

        console.error("Error en obtenerPresenciaMapa:", error);
        return {
            ok: false,
            zona_id: Number(zonaId),
            ttl_segundos: 0,
            jugadores: []
        };
    }
}

async function actualizarPresenciaMapa(zonaId, nodoId) {
    try {
        return await fetchAuth(`${API_BASE}/maps/presencia`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                zona_id: Number(zonaId),
                nodo_id: String(nodoId || "").trim().toLowerCase()
            })
        });
    } catch (error) {
        console.error("Error en actualizarPresenciaMapa:", error);
        throw error;
    }
}

async function eliminarPresenciaMapa() {
    try {
        return await fetchAuth(`${API_BASE}/maps/presencia`, {
            method: "DELETE"
        });
    } catch (error) {
        if (error.code === "NO_TOKEN" || error.code === "UNAUTHORIZED") {
            return {
                ok: false,
                mensaje: "Sin sesión"
            };
        }

        console.error("Error en eliminarPresenciaMapa:", error);
        return {
            ok: false,
            mensaje: error.message || "No se pudo eliminar la presencia"
        };
    }
}

function normalizarMensajeSocketMaps(data) {
    if (!data || typeof data !== "object") {
        return {
            type: "unknown"
        };
    }

    return {
        ...data,
        type: String(data.type || "").trim().toLowerCase()
    };
}

function crearConexionTiempoRealMaps(opciones = {}) {
    let socket = null;
    let manualClose = false;
    let reconnectTimer = null;
    let pingTimer = null;
    let joinPayloadActual = null;

    const estado = {
        conectado: false,
        reconectando: false,
        intentos: 0
    };

    const config = {
        reconnectDelayBase: 1500,
        reconnectDelayMax: 8000,
        pingIntervalMs: 12000,
        onOpen: typeof opciones.onOpen === "function" ? opciones.onOpen : () => {},
        onClose: typeof opciones.onClose === "function" ? opciones.onClose : () => {},
        onError: typeof opciones.onError === "function" ? opciones.onError : () => {},
        onMessage: typeof opciones.onMessage === "function" ? opciones.onMessage : () => {},
        onReconnect: typeof opciones.onReconnect === "function" ? opciones.onReconnect : () => {}
    };

    function limpiarTimers() {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        if (pingTimer) {
            clearInterval(pingTimer);
            pingTimer = null;
        }
    }

    function iniciarPing() {
        if (pingTimer) {
            clearInterval(pingTimer);
        }

        pingTimer = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                try {
                    socket.send(JSON.stringify({ action: "ping" }));
                } catch (error) {
                    console.warn("No se pudo enviar ping de Maps:", error);
                }
            }
        }, config.pingIntervalMs);
    }

    function calcularDelayReconnect() {
        const delay = config.reconnectDelayBase * Math.max(1, estado.intentos);
        return Math.min(delay, config.reconnectDelayMax);
    }

    function enviar(data) {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return false;
        }

        try {
            socket.send(JSON.stringify(data));
            return true;
        } catch (error) {
            console.error("Error enviando mensaje por WebSocket Maps:", error);
            return false;
        }
    }

    function join(zonaId, nodoId) {
        joinPayloadActual = {
            zona_id: Number(zonaId),
            nodo_id: String(nodoId || "").trim().toLowerCase()
        };

        return enviar({
            action: "join",
            zona_id: joinPayloadActual.zona_id,
            nodo_id: joinPayloadActual.nodo_id
        });
    }

    function move(nodoId) {
        const nodo = String(nodoId || "").trim().toLowerCase();
        if (!nodo) return false;

        if (joinPayloadActual) {
            joinPayloadActual.nodo_id = nodo;
        }

        return enviar({
            action: "move",
            nodo_id: nodo
        });
    }

    function leave() {
        const enviado = enviar({
            action: "leave"
        });

        joinPayloadActual = null;
        return enviado;
    }

    function cerrarSocketInterno() {
        try {
            if (socket) {
                socket.onopen = null;
                socket.onmessage = null;
                socket.onerror = null;
                socket.onclose = null;
                socket.close();
            }
        } catch (error) {
            console.warn("Error cerrando WebSocket Maps:", error);
        } finally {
            socket = null;
        }
    }

    function programarReconnect() {
        if (manualClose) return;
        if (reconnectTimer) return;

        estado.reconectando = true;
        estado.intentos += 1;

        const delay = calcularDelayReconnect();

        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            config.onReconnect({
                intentos: estado.intentos,
                delay
            });
            conectar();
        }, delay);
    }

    function conectar() {
        limpiarTimers();
        cerrarSocketInterno();

        let wsUrl = "";
        try {
            wsUrl = buildMapsWsUrl();
        } catch (error) {
            config.onError(error);
            return;
        }

        manualClose = false;

        try {
            socket = new WebSocket(wsUrl);
        } catch (error) {
            config.onError(error);
            programarReconnect();
            return;
        }

        socket.onopen = () => {
            estado.conectado = true;
            estado.reconectando = false;
            estado.intentos = 0;

            iniciarPing();
            config.onOpen();

            if (joinPayloadActual) {
                join(joinPayloadActual.zona_id, joinPayloadActual.nodo_id);
            }
        };

        socket.onmessage = (event) => {
            let data = null;

            try {
                data = JSON.parse(event.data);
            } catch (error) {
                console.warn("Mensaje WS Maps no válido:", event.data);
                return;
            }

            config.onMessage(normalizarMensajeSocketMaps(data));
        };

        socket.onerror = (event) => {
            config.onError(event);
        };

        socket.onclose = (event) => {
            estado.conectado = false;
            limpiarTimers();
            config.onClose(event);

            if (!manualClose) {
                programarReconnect();
            }
        };
    }

    function disconnect() {
        manualClose = true;
        estado.conectado = false;
        estado.reconectando = false;
        limpiarTimers();

        try {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ action: "leave" }));
            }
        } catch (error) {
            console.warn("No se pudo enviar leave antes de cerrar:", error);
        }

        joinPayloadActual = null;
        cerrarSocketInterno();
    }

    function getEstado() {
        return {
            ...estado,
            readyState: socket ? socket.readyState : WebSocket.CLOSED,
            zona_id: joinPayloadActual?.zona_id ?? null,
            nodo_id: joinPayloadActual?.nodo_id ?? null
        };
    }

    return {
        connect: conectar,
        disconnect,
        send: enviar,
        join,
        move,
        leave,
        getEstado
    };
}
/* =========================================================
   PATCH PARA api.js
   Agrega estas funciones al final del archivo
========================================================= */

async function obtenerEstadoBossMundo() {
    try {
        return await fetchAuth(`${API_BASE}/battle/boss/estado`);
    } catch (error) {
        console.error("Error en obtenerEstadoBossMundo:", error);
        throw error;
    }
}

async function iniciarBossMundo(usuarioPokemonIds = null, guardarEquipo = true) {
    try {
        return await fetchAuth(`${API_BASE}/battle/boss/iniciar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_pokemon_ids: Array.isArray(usuarioPokemonIds) ? usuarioPokemonIds : null,
                guardar_equipo: Boolean(guardarEquipo)
            })
        });
    } catch (error) {
        console.error("Error en iniciarBossMundo:", error);
        throw error;
    }
}

async function reclamarBossMundo(bossSessionToken, damageTotal = 0, bossDerrotado = false, turnos = 0) {
    try {
        return await fetchAuth(`${API_BASE}/battle/boss/recompensa`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                boss_session_token: String(bossSessionToken || ""),
                damage_total: Number(damageTotal) || 0,
                boss_derrotado: Boolean(bossDerrotado),
                turnos: Number(turnos) || 0
            })
        });
    } catch (error) {
        console.error("Error en reclamarBossMundo:", error);
        throw error;
    }
}

async function obtenerRankingBossMundo(limit = 20) {
    try {
        return await fetchAuth(`${API_BASE}/battle/boss/ranking?limit=${encodeURIComponent(limit)}`);
    } catch (error) {
        console.error("Error en obtenerRankingBossMundo:", error);
        throw error;
    }
}

async function obtenerEstadoIdle() {
    try {
        return await fetchAuth(`${API_BASE}/battle/idle/estado`);
    } catch (error) {
        console.error("Error en obtenerEstadoIdle:", error);
        throw error;
    }
}

async function iniciarModoIdle(tierCodigo = "ruta", duracionSegundos = 3600, usuarioPokemonIds = null, guardarEquipo = true) {
    try {
        return await fetchAuth(`${API_BASE}/battle/idle/iniciar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                tier_codigo: String(tierCodigo || "ruta"),
                duracion_segundos: Number(duracionSegundos) || 3600,
                usuario_pokemon_ids: Array.isArray(usuarioPokemonIds) ? usuarioPokemonIds : null,
                guardar_equipo: Boolean(guardarEquipo)
            })
        });
    } catch (error) {
        console.error("Error en iniciarModoIdle:", error);
        throw error;
    }
}

async function reclamarModoIdle() {
    try {
        return await fetchAuth(`${API_BASE}/battle/idle/reclamar`, {
            method: "POST"
        });
    } catch (error) {
        console.error("Error en reclamarModoIdle:", error);
        throw error;
    }
}

async function cancelarModoIdle(idleSessionToken = "") {
    try {
        return await fetchAuth(`${API_BASE}/battle/idle/cancelar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                idle_session_token: String(idleSessionToken || "")
            })
        });
    } catch (error) {
        console.error("Error en cancelarModoIdle:", error);
        throw error;
    }
}
