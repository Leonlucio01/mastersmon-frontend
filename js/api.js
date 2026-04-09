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

function obtenerFirmaUsuarioSesion(usuario) {
    const normalizado = normalizarUsuarioSesion(usuario);
    if (!normalizado) return "";

    return [
        Number(normalizado.id || 0),
        String(normalizado.nombre || "").trim(),
        String(normalizado.correo || "").trim().toLowerCase(),
        String(normalizado.foto || "").trim(),
        String(normalizado.avatar_id || AVATAR_DEFAULT_ID).trim().toLowerCase()
    ].join("|");
}

function emitirEventoSesion(usuario = null) {
    document.dispatchEvent(new CustomEvent("usuarioSesionActualizada", {
        detail: { usuario }
    }));
}

function guardarSesion(data, options = {}) {
    if (!data) return;

    const {
        emitirEvento = true,
        forceEmit = false
    } = options || {};

    const tokenAnterior = localStorage.getItem("access_token") || "";
    const usuarioAnterior = getUsuarioLocal();
    const firmaAnterior = obtenerFirmaUsuarioSesion(usuarioAnterior);

    if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
    }

    let usuarioNormalizado = null;
    if (data.usuario) {
        usuarioNormalizado = normalizarUsuarioSesion(data.usuario);

        localStorage.setItem("usuario", JSON.stringify(usuarioNormalizado));
        localStorage.setItem("google_logged_in", "true");
        localStorage.setItem("google_user_name", usuarioNormalizado.nombre || "");
        localStorage.setItem("usuario_correo", usuarioNormalizado.correo || "");
        localStorage.setItem("usuario_foto", usuarioNormalizado.foto || "");
        localStorage.setItem("usuario_avatar_id", usuarioNormalizado.avatar_id || AVATAR_DEFAULT_ID);

        if (usuarioNormalizado.id != null) {
            localStorage.setItem("usuario_id", String(usuarioNormalizado.id));
        }
    }

    if (!emitirEvento) return;

    const tokenActual = localStorage.getItem("access_token") || "";
    const firmaActual = obtenerFirmaUsuarioSesion(usuarioNormalizado || getUsuarioLocal());
    const huboCambioReal = forceEmit || tokenAnterior !== tokenActual || firmaAnterior !== firmaActual;

    if (huboCambioReal) {
        emitirEventoSesion(usuarioNormalizado || getUsuarioLocal());
    }
}

function limpiarSesion() {
    const habiaSesion = Boolean(
        localStorage.getItem("access_token") ||
        localStorage.getItem("usuario") ||
        localStorage.getItem("usuario_id") ||
        localStorage.getItem("google_logged_in")
    );

    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("google_logged_in");
    localStorage.removeItem("google_user_name");
    localStorage.removeItem("usuario_correo");
    localStorage.removeItem("usuario_foto");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("usuario_avatar_id");

    if (habiaSesion) {
        emitirEventoSesion(null);
    }
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
        if (error?.name === "AbortError") {
            const abortError = new Error(`ABORTED - ${url}`);
            abortError.code = "ABORTED";
            throw abortError;
        }

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
            guardarSesion({ usuario }, { emitirEvento: false });
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

async function obtenerOnboardingActual() {
    try {
        return await fetchAuth(`${API_BASE}/onboarding/me`);
    } catch (error) {
        if (error.code === "NO_TOKEN" || error.code === "UNAUTHORIZED") {
            return { ok: false, habilitado: false, misiones: [], recompensas_aplicadas: [] };
        }
        console.error("Error en obtenerOnboardingActual:", error);
        return { ok: false, habilitado: false, misiones: [], recompensas_aplicadas: [] };
    }
}

async function marcarBienvenidaOnboardingVista(vista = true) {
    try {
        return await fetchAuth(`${API_BASE}/onboarding/me/bienvenida`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                vista: !!vista
            })
        });
    } catch (error) {
        console.error("Error en marcarBienvenidaOnboardingVista:", error);
        throw error;
    }
}


const ONBOARDING_REWARD_TOAST_SEEN_KEY = "mastersmon_onboarding_reward_toast_seen_v1";

function obtenerTituloMisionOnboardingToast(codigo = "") {
    const valor = String(codigo || "").trim().toLowerCase();
    if (valor === "capturas") return typeof t === "function" ? t("onboarding_mission_catch_title") : "Capture 6 Pokémon";
    if (valor === "equipo") return typeof t === "function" ? t("onboarding_mission_team_title") : "Build your 6-Pokémon team";
    if (valor === "batalla") return typeof t === "function" ? t("onboarding_mission_battle_title") : "Win your first Battle IA";
    return typeof t === "function" ? t("onboarding_complete_title") : "Starter Journey completed";
}

function obtenerTextoRecompensaOnboardingToast(recompensa = {}) {
    const partes = [];

    const pokedolares = Number(recompensa?.pokedolares || 0);
    if (pokedolares > 0) {
        partes.push(`+${pokedolares} Pokédollars`);
    }

    const items = Array.isArray(recompensa?.items) ? recompensa.items : [];
    if (items.length) {
        partes.push(items.map((item) => {
            const cantidad = Number(item?.cantidad || 0);
            const nombre = item?.nombre || item?.item_codigo || "Item";
            return `${cantidad}x ${nombre}`;
        }).join(", "));
    }

    return partes.join(" · ");
}

function obtenerFirmaRecompensaOnboardingToast(recompensa = {}) {
    const codigo = String(recompensa?.codigo || "");
    const pokedolares = Number(recompensa?.pokedolares || 0);
    const items = Array.isArray(recompensa?.items) ? recompensa.items : [];
    const itemsFirma = items.map((item) => {
        const itemId = item?.item_id ?? item?.item_codigo ?? item?.nombre ?? "item";
        return `${itemId}:${Number(item?.cantidad || 0)}`;
    }).join("|");
    return `${codigo}|${pokedolares}|${itemsFirma}`;
}

function consumirRecompensasNuevasOnboarding(onboardingData, { persistir = true } = {}) {
    const recompensas = Array.isArray(onboardingData?.recompensas_aplicadas) ? onboardingData.recompensas_aplicadas : [];
    if (!recompensas.length) return [];

    let memoria = {};
    if (persistir) {
        try {
            memoria = JSON.parse(sessionStorage.getItem(ONBOARDING_REWARD_TOAST_SEEN_KEY) || "{}") || {};
        } catch (error) {
            memoria = {};
        }
    }

    const nuevas = recompensas.filter((recompensa) => {
        const firma = obtenerFirmaRecompensaOnboardingToast(recompensa);
        if (!persistir) return true;
        if (memoria[firma]) return false;
        memoria[firma] = Date.now();
        return true;
    });

    if (persistir) {
        try {
            sessionStorage.setItem(ONBOARDING_REWARD_TOAST_SEEN_KEY, JSON.stringify(memoria));
        } catch (error) {
            console.warn("No se pudo guardar memoria de recompensas onboarding:", error);
        }
    }

    return nuevas;
}

function asegurarStackToastsOnboarding() {
    let stack = document.getElementById("onboardingToastStack");
    if (stack) return stack;

    stack = document.createElement("div");
    stack.id = "onboardingToastStack";
    stack.className = "onboarding-toast-stack";
    document.body.appendChild(stack);
    return stack;
}

function mostrarToastRecompensasOnboarding(onboardingData, opciones = {}) {
    const recompensas = consumirRecompensasNuevasOnboarding(onboardingData, opciones);
    if (!recompensas.length) return [];

    const stack = asegurarStackToastsOnboarding();
    const toasts = [];

    recompensas.forEach((recompensa, index) => {
        const esFinal = String(recompensa?.codigo || "") === "final";
        const toast = document.createElement("div");
        toast.className = `onboarding-toast ${esFinal ? "is-final" : ""}`;

        const titulo = esFinal
            ? (typeof t === "function" ? t("onboarding_toast_final_title") : "Welcome route completed")
            : (typeof t === "function" ? t("onboarding_toast_mission_complete") : "Mission completed");

        const subtitulo = obtenerTituloMisionOnboardingToast(recompensa?.codigo);
        const recompensaTexto = obtenerTextoRecompensaOnboardingToast(recompensa);
        const botonTexto = typeof t === "function" ? t("onboarding_toast_open_home") : "View progress in Pokedex";

        toast.innerHTML = `
            <div class="onboarding-toast-head">
                <span class="onboarding-toast-kicker">${titulo}</span>
                <button class="onboarding-toast-close" type="button" aria-label="Close">×</button>
            </div>
            <strong class="onboarding-toast-title">${subtitulo}</strong>
            <p class="onboarding-toast-reward-label">${typeof t === "function" ? t("onboarding_toast_reward_label") : "Reward added"}</p>
            <p class="onboarding-toast-reward-text">${recompensaTexto}</p>
            <a class="onboarding-toast-link" href="index.html">${botonTexto}</a>
        `;

        stack.appendChild(toast);
        toasts.push(toast);

        const cerrar = () => {
            toast.classList.add("is-leaving");
            setTimeout(() => toast.remove(), 220);
        };

        const closeBtn = toast.querySelector(".onboarding-toast-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", cerrar);
        }

        setTimeout(() => toast.classList.add("is-visible"), 30 + (index * 70));
        setTimeout(cerrar, esFinal ? 7800 : 6200);
    });

    return recompensas;
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


function normalizarTrainerSetupColor(color) {
    const valor = String(color || "").trim().toLowerCase();
    return ["green", "red", "blue"].includes(valor) ? valor : null;
}

function obtenerStarterCodeDesdeColorTrainerSetup(color) {
    const valor = normalizarTrainerSetupColor(color);
    if (valor === "green") return "bulbasaur";
    if (valor === "red") return "charmander";
    if (valor === "blue") return "squirtle";
    return null;
}

function normalizarRespuestaTrainerSetup(data = {}) {
    const usuario = normalizarUsuarioSesion(data?.usuario || getUsuarioLocal() || null);
    const teamColor = normalizarTrainerSetupColor(
        data?.team_color || usuario?.trainer_team_color || null
    );
    const starterCode = String(
        data?.starter_code ||
        usuario?.trainer_starter_code ||
        obtenerStarterCodeDesdeColorTrainerSetup(teamColor) ||
        ""
    ).trim().toLowerCase() || null;

    return {
        ok: data?.ok !== false,
        supported: data?.supported !== false,
        avatar_id: normalizarAvatarIdLocal(data?.avatar_id || usuario?.avatar_id || AVATAR_DEFAULT_ID),
        team_color: teamColor,
        starter_code: starterCode,
        setup_completed: Boolean(data?.setup_completed || usuario?.trainer_setup_completed),
        setup_completed_at: data?.setup_completed_at || usuario?.trainer_setup_completed_at || null,
        usuario: usuario || null
    };
}

async function obtenerTrainerSetupUsuarioActual() {
    try {
        const data = await fetchAuth(`${API_BASE}/usuario/me/trainer-setup`);
        if (data?.usuario) {
            guardarSesion({ usuario: data.usuario }, { emitirEvento: false });
        }
        return normalizarRespuestaTrainerSetup(data || {});
    } catch (error) {
        if (error.code === "NO_TOKEN" || error.code === "UNAUTHORIZED") {
            return normalizarRespuestaTrainerSetup({
                ok: false,
                supported: false,
                avatar_id: getAvatarIdLocal(),
                team_color: null,
                starter_code: null,
                setup_completed: false,
                setup_completed_at: null,
                usuario: getUsuarioLocal()
            });
        }
        console.error("Error en obtenerTrainerSetupUsuarioActual:", error);
        throw error;
    }
}

async function actualizarTrainerSetupUsuarioActual(payload = {}) {
    try {
        const data = await fetchAuth(`${API_BASE}/usuario/me/trainer-setup`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload || {})
        });

        if (data?.usuario) {
            guardarSesion({ usuario: data.usuario });
        }

        return normalizarRespuestaTrainerSetup(data || {});
    } catch (error) {
        console.error("Error en actualizarTrainerSetupUsuarioActual:", error);
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

const GLOBAL_STATE_CACHE_TTL_MS = 45000;
const globalStateCache = {
    boss: { data: null, expiresAt: 0, promise: null, sessionKey: "" },
    idle: { data: null, expiresAt: 0, promise: null, sessionKey: "" }
};

function obtenerSesionCacheGlobalKey() {
    const usuarioId = typeof getUsuarioIdLocal === "function" ? getUsuarioIdLocal() : null;
    const token = typeof getAccessToken === "function" ? getAccessToken() : "";
    return `${usuarioId || 0}|${String(token || "").slice(0, 24)}`;
}

async function obtenerEstadoGlobalCacheado(cacheKey, url) {
    const cache = globalStateCache[cacheKey];
    const sessionKey = obtenerSesionCacheGlobalKey();
    const now = Date.now();

    if (!cache) {
        return await fetchAuth(url);
    }

    if (cache.sessionKey !== sessionKey) {
        cache.data = null;
        cache.expiresAt = 0;
        cache.promise = null;
        cache.sessionKey = sessionKey;
    }

    if (cache.data && cache.expiresAt > now) {
        return cache.data;
    }

    if (cache.promise) {
        return await cache.promise;
    }

    cache.promise = fetchAuth(url)
        .then((data) => {
            cache.data = data;
            cache.expiresAt = Date.now() + GLOBAL_STATE_CACHE_TTL_MS;
            cache.sessionKey = sessionKey;
            return data;
        })
        .catch((error) => {
            cache.data = null;
            cache.expiresAt = 0;
            throw error;
        })
        .finally(() => {
            cache.promise = null;
        });

    return await cache.promise;
}

async function obtenerEstadoBossMundo() {
    try {
        return await obtenerEstadoGlobalCacheado("boss", `${API_BASE}/battle/boss/estado`);
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
        return await obtenerEstadoGlobalCacheado("idle", `${API_BASE}/battle/idle/estado`);
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



/* =========================================================
   GYMS
========================================================= */

async function obtenerCatalogoGyms() {
    try {
        return await fetchAuth(`${API_BASE}/battle/gyms/catalogo`);
    } catch (error) {
        console.error("Error en obtenerCatalogoGyms:", error);
        throw error;
    }
}

async function obtenerProgresoGyms() {
    try {
        return await fetchAuth(`${API_BASE}/battle/gyms/progreso`);
    } catch (error) {
        console.error("Error en obtenerProgresoGyms:", error);
        throw error;
    }
}

async function iniciarGymBattle(gymCodigo = "", usuarioPokemonIds = null, guardarEquipo = true) {
    try {
        return await fetchAuth(`${API_BASE}/battle/gyms/iniciar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                gym_codigo: String(gymCodigo || "").trim(),
                usuario_pokemon_ids: Array.isArray(usuarioPokemonIds) ? usuarioPokemonIds : null,
                guardar_equipo: Boolean(guardarEquipo)
            })
        });
    } catch (error) {
        console.error("Error en iniciarGymBattle:", error);
        throw error;
    }
}

async function reclamarGymBattle(gymSessionToken = "", victoria = false, turnos = 0) {
    try {
        return await fetchAuth(`${API_BASE}/battle/gyms/recompensa`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                gym_session_token: String(gymSessionToken || "").trim(),
                victoria: Boolean(victoria),
                turnos: Number(turnos) || 0
            })
        });
    } catch (error) {
        console.error("Error en reclamarGymBattle:", error);
        throw error;
    }
}

async function cancelarGymBattle(gymSessionToken = "") {
    try {
        return await fetchAuth(`${API_BASE}/battle/gyms/cancelar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                gym_session_token: String(gymSessionToken || "").trim()
            })
        });
    } catch (error) {
        console.error("Error en cancelarGymBattle:", error);
        throw error;
    }
}

/* =========================================================
   PAYMENTS / MONETIZATION
========================================================= */

async function obtenerCatalogoPagos() {
    return await fetchAuth(`${API_BASE}/payments/catalogo`);
}

async function obtenerBeneficiosActivos() {
    return await fetchAuth(`${API_BASE}/payments/beneficios/activos`);
}

async function obtenerComprasPagos() {
    return await fetchAuth(`${API_BASE}/payments/compras`);
}

async function crearOrdenPaypalPago({
    productCode,
    quantity = 1,
    confirmacionAceptada = true,
    versionTerminos = "v1"
}) {
    if (!productCode) {
        throw new Error("PRODUCT_CODE_REQUIRED");
    }

    return await fetchAuth(`${API_BASE}/payments/paypal/order/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            product_code: productCode,
            quantity,
            confirmacion_aceptada: !!confirmacionAceptada,
            version_terminos: versionTerminos
        })
    });
}

async function capturarOrdenPaypalPago({
    compraId,
    paypalOrderId
}) {
    if (!compraId) {
        throw new Error("COMPRA_ID_REQUIRED");
    }

    if (!paypalOrderId) {
        throw new Error("PAYPAL_ORDER_ID_REQUIRED");
    }

    return await fetchAuth(`${API_BASE}/payments/paypal/order/capture`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            compra_id: Number(compraId),
            paypal_order_id: String(paypalOrderId)
        })
    });
}

async function usarBoosterPago(itemCode) {
    if (!itemCode) {
        throw new Error("ITEM_CODE_REQUIRED");
    }

    return await fetchAuth(`${API_BASE}/payments/booster/usar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            item_code: itemCode
        })
    });
}

function obtenerPaypalOrderIdDesdeURL(url = window.location.href) {
    try {
        const params = new URL(url).searchParams;
        return (
            params.get("token") ||
            params.get("order_id") ||
            params.get("orderId") ||
            ""
        );
    } catch (error) {
        console.warn("No se pudo leer paypal order id desde URL:", error);
        return "";
    }
}

function obtenerPaypalPayerIdDesdeURL(url = window.location.href) {
    try {
        const params = new URL(url).searchParams;
        return (
            params.get("PayerID") ||
            params.get("payerId") ||
            ""
        );
    } catch (error) {
        console.warn("No se pudo leer payer id desde URL:", error);
        return "";
    }
}

async function buscarCompraPorPaypalOrderId(paypalOrderId) {
    if (!paypalOrderId) return null;

    const data = await obtenerComprasPagos();
    const compras = Array.isArray(data?.compras) ? data.compras : [];

    return compras.find(compra =>
        String(compra?.paypal_order_id || "") === String(paypalOrderId)
    ) || null;
}