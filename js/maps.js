let pokemonsCapturadosMaps = [];
let pokemonsShinyCapturadosMaps = [];
let listaPokemonUsuarioMaps = [];
 
let zonasCache = [];
let mapaInicio = 0;
let mapasPorVista = 4;
 
let zonaSeleccionadaActual = null;
let encuentroActual = null;
let itemsUsuarioMaps = [];
let movimientoEnCurso = false;
let resizeTimer = null;
let itemSeleccionadoMaps = null;
let encuentroRequestId = 0;
 
/* =========================================================
   TIEMPO REAL / PRESENCIA
========================================================= */
let mapsRealtimeConnection = null;
let jugadoresZonaMaps = new Map();
let presenciaZonaActivaId = null;
let ultimoNodoReportadoMaps = null;
 
const MAPS_ZONAS_CACHE_KEY = "mastersmon_maps_zonas_cache_v2";
const MAPS_AVATAR_POSICIONES_KEY = "mastersmon_maps_avatar_posiciones_v1";
const MAPS_AVATAR_DEFAULT_ID = "steven";
const MAPS_AVATAR_ID_REGEX = /^[a-z0-9_-]{1,60}$/;
 
/* =========================================================
   RUTA BASE DEL AVATAR
   - Primera versión del contorno caminable
   - Está en porcentajes para que sea responsive
========================================================= */
const RUTA_CONTORNO_BASE = {
    start: "n5",
    nodes: {
        /* =========================================================
           FILA INFERIOR
        ========================================================= */
        n1:  { x: 8,  y: 84, right: "n2" },
        n2:  { x: 18, y: 84, left: "n1", right: "n3", up: "n10" },
        n3:  { x: 28, y: 84, left: "n2", right: "n4", up: "n11" },
        n4:  { x: 38, y: 84, left: "n3", right: "n5", up: "n12" },
        n5:  { x: 50, y: 84, left: "n4", right: "n6", up: "n13" },
        n6:  { x: 62, y: 84, left: "n5", right: "n7", up: "n14" },
        n7:  { x: 72, y: 84, left: "n6", right: "n8", up: "n15" },
        n8:  { x: 82, y: 84, left: "n7", right: "n9", up: "n16" },
        n9:  { x: 92, y: 84, left: "n8" },

        /* =========================================================
           FILA 2
        ========================================================= */
        n10: { x: 12, y: 72, down: "n2", right: "n11", up: "n17" },
        n11: { x: 24, y: 72, left: "n10", down: "n3", right: "n12", up: "n18" },
        n12: { x: 36, y: 72, left: "n11", down: "n4", right: "n13", up: "n19" },
        n13: { x: 48, y: 72, left: "n12", down: "n5", right: "n14", up: "n20" },
        n14: { x: 60, y: 72, left: "n13", down: "n6", right: "n15", up: "n21" },
        n15: { x: 72, y: 72, left: "n14", down: "n7", right: "n16", up: "n22" },
        n16: { x: 84, y: 72, left: "n15", down: "n8", up: "n23" },

        /* =========================================================
           FILA 3
        ========================================================= */
        n17: { x: 10, y: 60, down: "n10", right: "n18" },
        n18: { x: 22, y: 60, left: "n17", down: "n11", right: "n19", up: "n24" },
        n19: { x: 34, y: 60, left: "n18", down: "n12", right: "n20", up: "n25" },
        n20: { x: 46, y: 60, left: "n19", down: "n13", right: "n21", up: "n26" },
        n21: { x: 58, y: 60, left: "n20", down: "n14", right: "n22", up: "n27" },
        n22: { x: 70, y: 60, left: "n21", down: "n15", right: "n23", up: "n28" },
        n23: { x: 82, y: 60, left: "n22", down: "n16", up: "n29" },

        /* =========================================================
           FILA 4
        ========================================================= */
        n24: { x: 16, y: 48, down: "n18", right: "n25" },
        n25: { x: 30, y: 48, left: "n24", down: "n19", right: "n26", up: "n30" },
        n26: { x: 44, y: 48, left: "n25", down: "n20", right: "n27", up: "n31" },
        n27: { x: 58, y: 48, left: "n26", down: "n21", right: "n28", up: "n32" },
        n28: { x: 72, y: 48, left: "n27", down: "n22", right: "n29", up: "n33" },
        n29: { x: 86, y: 48, left: "n28", down: "n23" },

        /* =========================================================
           FILA SUPERIOR
        ========================================================= */
        n30: { x: 26, y: 36, down: "n25", right: "n31" },
        n31: { x: 42, y: 36, left: "n30", down: "n26", right: "n32" },
        n32: { x: 58, y: 36, left: "n31", down: "n27", right: "n33" },
        n33: { x: 74, y: 36, left: "n32", down: "n28" }
    }
};

const MAPS_MAX_STEP_PERCENT = 6;

/* =========================================================
   GREEN FOREST
   - Ruta automática basada en grid
   - Todo lo libre se puede caminar
   - Solo se bloquean los rectángulos marcados en rojo
========================================================= */

const FOREST_GRID_STEP = 4.5;

const BLOQUEOS_GREEN_FOREST = [
    // Franja superior de árboles
    { x1: 0,   y1: 0,   x2: 100, y2: 14.5 },

    // Centro Pokémon
    { x1: 7.5, y1: 15,  x2: 31.5, y2: 30.5 },

    // Banco
    { x1: 46.5, y1: 18, x2: 57.5, y2: 24.5 },

    // Casa azul
    { x1: 58,  y1: 13.5, x2: 82,  y2: 24.8 },

    // Poste / flores derecha superior
    { x1: 80.5, y1: 14, x2: 89.5, y2: 30.5 },

    // Árboles esquina superior derecha
    { x1: 89.5, y1: 13, x2: 100, y2: 36.5 },

    // Árboles lado izquierdo
    { x1: 0,   y1: 37.5, x2: 13.5, y2: 100 },

    // Lago superior
    { x1: 12.5, y1: 49, x2: 43,   y2: 66.8 },

    // Lago inferior
    { x1: 12.5, y1: 74, x2: 47,   y2: 92.8 },

    // Cerca derecha superior
    { x1: 85.5, y1: 62.5, x2: 100, y2: 68.5 },

    // Árbol pequeño junto a la escalera
    { x1: 61.5, y1: 68, x2: 68.8, y2: 87 },

    // Arbusto pequeño a la derecha de la escalera
    { x1: 69, y1: 68, x2: 75.2, y2: 77.5 },

    // Árboles / cerca inferior derecha
    { x1: 75.5, y1: 82, x2: 100, y2: 95 },

    // Franja inferior de árboles
    { x1: 61.5, y1: 95, x2: 100, y2: 100 }
];

function puntoDentroDeRectangulo(x, y, rect) {
    return (
        x >= rect.x1 &&
        x <= rect.x2 &&
        y >= rect.y1 &&
        y <= rect.y2
    );
}

function puntoBloqueadoForest(x, y, rectangulos = []) {
    return rectangulos.some(rect => puntoDentroDeRectangulo(x, y, rect));
}

function obtenerNodoMasCercano(nodes, candidatos = []) {
    const ids = Object.keys(nodes || {});
    if (!ids.length) return null;

    let mejorId = ids[0];
    let mejorDist = Number.POSITIVE_INFINITY;

    for (const candidato of candidatos) {
        const cx = Number(candidato.x);
        const cy = Number(candidato.y);

        for (const [id, node] of Object.entries(nodes)) {
            const dx = Number(node.x) - cx;
            const dy = Number(node.y) - cy;
            const dist = Math.hypot(dx, dy);

            if (dist < mejorDist) {
                mejorDist = dist;
                mejorId = id;
            }
        }
    }

    return mejorId;
}

function construirRutaLibrePorGrid({
    xMin = 6,
    xMax = 94,
    yMin = 18,
    yMax = 94,
    step = FOREST_GRID_STEP,
    blockedRects = [],
    startCandidates = []
} = {}) {
    const nodes = {};
    const keyToId = new Map();

    const xs = [];
    const ys = [];

    for (let x = xMin; x <= xMax + 0.001; x += step) {
        xs.push(Number(x.toFixed(2)));
    }

    for (let y = yMin; y <= yMax + 0.001; y += step) {
        ys.push(Number(y.toFixed(2)));
    }

    ys.forEach((y, yi) => {
        xs.forEach((x, xi) => {
            if (puntoBloqueadoForest(x, y, blockedRects)) return;

            const id = `gf_${xi}_${yi}`;
            nodes[id] = { x, y };
            keyToId.set(`${xi}_${yi}`, id);
        });
    });

    ys.forEach((_, yi) => {
        xs.forEach((__, xi) => {
            const id = keyToId.get(`${xi}_${yi}`);
            if (!id || !nodes[id]) return;

            const rightId = keyToId.get(`${xi + 1}_${yi}`);
            const leftId = keyToId.get(`${xi - 1}_${yi}`);
            const upId = keyToId.get(`${xi}_${yi - 1}`);
            const downId = keyToId.get(`${xi}_${yi + 1}`);

            if (rightId) nodes[id].right = rightId;
            if (leftId) nodes[id].left = leftId;
            if (upId) nodes[id].up = upId;
            if (downId) nodes[id].down = downId;
        });
    });

    let start = obtenerNodoMasCercano(nodes, startCandidates);

    if (!start) {
        const ids = Object.keys(nodes);
        start = ids.length ? ids[0] : "gf_0_0";
    }

    return {
        start,
        nodes
    };
}

const RUTA_GREEN_FOREST = construirRutaLibrePorGrid({
    xMin: 6,
    xMax: 94,
    yMin: 18,
    yMax: 94,
    step: FOREST_GRID_STEP,
    blockedRects: BLOQUEOS_GREEN_FOREST,
    startCandidates: [
        { x: 48, y: 56 },
        { x: 50, y: 60 },
        { x: 44, y: 56 },
        { x: 54, y: 56 }
    ]
});

const MAPAS_RUTAS = {
    bosque: RUTA_GREEN_FOREST,
    cueva: RUTA_CONTORNO_BASE,
    lago: RUTA_CONTORNO_BASE,
    torre: RUTA_CONTORNO_BASE,
    default: RUTA_GREEN_FOREST
};
 
const MAPAS_CONFIG = {
    bosque: {
        card: "img/maps/cards/bosque_verde.png",
        escenario: "img/maps/escenarios/bosque_verde_1.png",
        clase: "zona-bosque"
    },
    cueva: {
        card: "img/maps/cards/cueva_roca.png",
        escenario: "img/maps/escenarios/caverna_roca_1.png",
        clase: "zona-cueva"
    },
    lago: {
        card: "img/maps/cards/lago_azul.png",
        escenario: "img/maps/escenarios/lago_azul_1.png",
        clase: "zona-lago"
    },
    torre: {
        card: "img/maps/cards/torre_batalla.png",
        escenario: "img/maps/escenarios/torre_batalla_1.png",
        clase: "zona-torre"
    },
    default: {
        card: "img/maps/cards/bosque_verde.png",
        escenario: "img/maps/escenarios/bosque_verde_1.png",
        clase: ""
    }
};
 
document.addEventListener("DOMContentLoaded", () => {
    configurarMenuMobile();
    configurarCarruselMaps();
    configurarEventosDelegados();
    configurarMovimientoTeclado();
    configurarSelectorIdiomaMaps();
    configurarEventosSesionMaps();
    configurarEventosLifecycleMaps();
    inicializarMaps();
 
    const btnCerrarModalResultado = document.getElementById("btnCerrarModalResultadoCaptura");
    if (btnCerrarModalResultado) {
        btnCerrarModalResultado.addEventListener("click", cerrarModalResultadoCaptura);
    }
 
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const anterior = mapasPorVista;
            mapasPorVista = obtenerMapasPorVista();
 
            if (anterior !== mapasPorVista) {
                renderizarZonas();
            }
 
            if (window.innerWidth > 900) {
                cerrarMenuMobile();
            }
        }, 40);
    });
 
    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
});
 
async function inicializarMaps() {
    mostrarCargaZonas();
 
    try {
        const usuario = getUsuarioLocal();
        if (usuario && usuario.id != null && !localStorage.getItem("usuario_id")) {
            localStorage.setItem("usuario_id", String(usuario.id));
        }
 
        await cargarZonas();
        renderizarZonas();
 
        if (zonasCache.length > 0) {
            const primeraZonaId = Number(zonasCache[0].id);
 
            const cargaSecundaria = Promise.allSettled([
                cargarPokemonUsuarioMaps(),
                cargarItemsUsuarioMaps()
            ]);
 
            await seleccionarZona(primeraZonaId);
 
            cargaSecundaria.then(() => {
                if (encuentroActual) {
                    renderEncuentroActual();
                }
            });
        }
    } catch (error) {
        console.error("Error iniciando Maps:", error);
        mostrarErrorZonas();
    }
}
 
/* =========================
   MENU MOBILE
========================= */
function configurarMenuMobile() {
    const menuToggle = document.getElementById("menuToggle");
    const menuMobile = document.getElementById("menuMobile");
 
    if (!menuToggle || !menuMobile) return;
 
    menuToggle.addEventListener("click", () => {
        menuMobile.classList.toggle("menu-open");
    });
}
 
function cerrarMenuMobile() {
    const menuMobile = document.getElementById("menuMobile");
    if (menuMobile) {
        menuMobile.classList.remove("menu-open");
    }
}
 
/* =========================
   IDIOMA
========================= */
function configurarSelectorIdiomaMaps() {
    const selectDesktop = document.getElementById("languageSelect");
    const selectMobile = document.getElementById("languageSelectMobile");
 
    const langActual = typeof getCurrentLang === "function" ? getCurrentLang() : "en";
 
    if (selectDesktop) selectDesktop.value = langActual;
    if (selectMobile) selectMobile.value = langActual;
 
    if (selectDesktop) {
        selectDesktop.addEventListener("change", (e) => {
            const nuevo = e.target.value;
            if (selectMobile) selectMobile.value = nuevo;
            setCurrentLang(nuevo);
        });
    }
 
    if (selectMobile) {
        selectMobile.addEventListener("change", (e) => {
            const nuevo = e.target.value;
            if (selectDesktop) selectDesktop.value = nuevo;
            setCurrentLang(nuevo);
        });
    }
 
    document.addEventListener("languageChanged", () => {
        if (typeof applyTranslations === "function") {
            applyTranslations();
        }
 
        if (zonasCache.length > 0) {
            renderizarZonas();
        }
 
        if (!zonaSeleccionadaActual) return;
 
        if (!usuarioAutenticadoMaps()) {
            renderBloqueoMapsSinSesion();
            return;
        }
 
        renderizarZonaExploracion();
 
        const encuentro = document.getElementById("encuentroContainer");
        if (encuentro) {
            encuentro.classList.remove("oculto");
        }
 
        renderizarJugadoresMapa();
 
        if (encuentroActual) {
            renderEncuentroActual();
        } else {
            renderPanelDerechoVacio();
        }
    });
}
 
/* =========================
   SESION / AVATAR
========================= */
function configurarEventosSesionMaps() {
    document.addEventListener("usuarioSesionActualizada", async (event) => {
        const usuario = event.detail?.usuario || null;
 
        sincronizarUsuarioLocalMaps(usuario);
 
        if (zonasCache.length > 0) {
            renderizarZonas();
        }
 
        if (!zonaSeleccionadaActual) return;
 
        if (!usuarioAutenticadoMaps()) {
            encuentroRequestId++;
            movimientoEnCurso = false;
            cerrarModalesSecundarios();
            limpiarMensajeMaps();
            limpiarEncuentroActual();
            limpiarJugadoresZonaMaps();
            await salirPresenciaMaps(true);
            renderBloqueoMapsSinSesion();
            return;
        }
 
        renderizarZonaExploracion();
 
        const encuentro = document.getElementById("encuentroContainer");
        if (encuentro) {
            encuentro.classList.remove("oculto");
        }
 
        try {
            await Promise.all([
                cargarPokemonUsuarioMaps(),
                cargarItemsUsuarioMaps(true),
                iniciarPresenciaZonaActual()
            ]);
        } catch (error) {
            console.warn("No se pudo refrescar la sesión en Maps:", error);
        }
 
        refrescarAvatarMapsEnPantalla();
 
        if (encuentroActual) {
            renderEncuentroActual();
        } else {
            renderPanelDerechoVacio();
        }
    });
 
    window.addEventListener("storage", async (event) => {
        if (
            event.key === "usuario" ||
            event.key === "usuario_id" ||
            event.key === "access_token" ||
            event.key === "usuario_avatar_id"
        ) {
            if (!usuarioAutenticadoMaps()) {
                encuentroRequestId++;
                movimientoEnCurso = false;
                cerrarModalesSecundarios();
                limpiarMensajeMaps();
                limpiarEncuentroActual();
                limpiarJugadoresZonaMaps();
                await salirPresenciaMaps(true);
 
                if (zonasCache.length > 0) {
                    renderizarZonas();
                }
 
                if (zonaSeleccionadaActual) {
                    renderBloqueoMapsSinSesion();
                }
                return;
            }
 
            refrescarAvatarMapsEnPantalla();
            await refrescarPresenciaZonaActual();
            sincronizarPresenciaLocalMaps();
        }
    });
 
    document.addEventListener("visibilitychange", async () => {
        if (!document.hidden) {
            if (!usuarioAutenticadoMaps()) {
                if (zonaSeleccionadaActual) {
                    renderBloqueoMapsSinSesion();
                }
                return;
            }
 
            refrescarAvatarMapsEnPantalla();
            await refrescarPresenciaZonaActual();
            sincronizarPresenciaLocalMaps();
        }
    });
}
 
function configurarEventosLifecycleMaps() {
    window.addEventListener("beforeunload", () => {
        salirPresenciaMaps(true);
    });
 
    window.addEventListener("pagehide", () => {
        salirPresenciaMaps(true);
    });
}
 
function sincronizarUsuarioLocalMaps(usuario) {
    if (!usuario || typeof usuario !== "object") return;
 
    try {
        localStorage.setItem("usuario", JSON.stringify(usuario));
        if (usuario.id != null) {
            localStorage.setItem("usuario_id", String(usuario.id));
        }
    } catch (error) {
        console.warn("No se pudo sincronizar usuario local en Maps:", error);
    }
}
 
function refrescarAvatarMapsEnPantalla() {
    if (!zonaSeleccionadaActual) return;
 
    const avatarWrap = document.getElementById("avatarMapa");
    if (!avatarWrap) return;
 
    renderizarAvatarMapa();
}
 
/* =========================
   EVENTOS DELEGADOS
========================= */
function configurarEventosDelegados() {
    const zonasContainer = document.getElementById("zonasContainer");
    const encuentroContainer = document.getElementById("encuentroContainer");
 
    if (zonasContainer) {
        zonasContainer.addEventListener("click", async (event) => {
            const btn = event.target.closest("[data-zona-id]");
            if (!btn) return;
 
            const zonaId = Number(btn.dataset.zonaId);
            await seleccionarZona(zonaId);
        });
    }
 
    if (encuentroContainer) {
        encuentroContainer.addEventListener("click", async (event) => {
            const moveBtn = event.target.closest("[data-move]");
            if (moveBtn) {
                const direccion = moveBtn.dataset.move;
                await moverEnMapa(direccion);
                return;
            }
 
            const capturarBtn = event.target.closest("#btnCapturarMapa");
            if (capturarBtn) {
                await intentarCapturaDesdeUI();
                return;
            }
 
            const huirBtn = event.target.closest("#btnHuirMapa");
            if (huirBtn) {
                cerrarModalesSecundarios();
                limpiarMensajeMaps();
                limpiarEncuentroActual();
                renderPanelDerechoVacio();
                return;
            }
        });
 
        encuentroContainer.addEventListener("change", (event) => {
            if (event.target.matches('input[name="pokeballSeleccionada"]')) {
                itemSeleccionadoMaps = Number(event.target.value);
                actualizarProbabilidadVisual(encuentroActual?.es_shiny === true);
            }
        });
    }
}
 
/* =========================
   CARRUSEL MAPAS
========================= */
function obtenerMapasPorVista() {
    const width = window.innerWidth;
 
    if (width <= 768) return 1;
    if (width <= 1100) return 2;
    if (width <= 1400) return 3;
    return 4;
}
 
function configurarCarruselMaps() {
    mapasPorVista = obtenerMapasPorVista();
 
    const btnPrev = document.getElementById("btnMapPrev");
    const btnNext = document.getElementById("btnMapNext");
 
    if (btnPrev) {
        btnPrev.addEventListener("click", () => moverCarrusel(-1));
    }
 
    if (btnNext) {
        btnNext.addEventListener("click", () => moverCarrusel(1));
    }
}
 
function moverCarrusel(direccion) {
    if (!zonasCache.length) return;
 
    mapaInicio += direccion;
 
    if (mapaInicio < 0) {
        mapaInicio = zonasCache.length - 1;
    }
 
    if (mapaInicio >= zonasCache.length) {
        mapaInicio = 0;
    }
 
    renderizarZonas();
}
 
function obtenerZonasVisibles() {
    if (!zonasCache.length) return [];
 
    const visibles = [];
 
    for (let i = 0; i < mapasPorVista; i++) {
        const index = (mapaInicio + i) % zonasCache.length;
        visibles.push(zonasCache[index]);
    }
 
    return visibles;
}
 
/* =========================
   CACHE SIMPLE
========================= */
function guardarCacheZonas(zonas) {
    try {
        sessionStorage.setItem(MAPS_ZONAS_CACHE_KEY, JSON.stringify(zonas));
    } catch (error) {
        console.warn("No se pudo guardar cache de zonas:", error);
    }
}
 
function leerCacheZonas() {
    try {
        const raw = sessionStorage.getItem(MAPS_ZONAS_CACHE_KEY);
        if (!raw) return null;
 
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        console.warn("No se pudo leer cache de zonas:", error);
        return null;
    }
}
 
/* =========================
   AVATAR / MOVIMIENTO EN MAPA
========================= */
function tMaps(key, fallback) {
    if (typeof t !== "function") return fallback;
    const valor = t(key);
    return valor && valor !== key ? valor : fallback;
}
 
function leerStorageJSON(clave, defecto = null) {
    try {
        const raw = localStorage.getItem(clave);
        return raw ? JSON.parse(raw) : defecto;
    } catch (error) {
        console.warn(`No se pudo leer ${clave}:`, error);
        return defecto;
    }
}
 
function guardarStorageJSON(clave, valor) {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
        console.warn(`No se pudo guardar ${clave}:`, error);
    }
}
 
function obtenerUsuarioMapsActual() {
    return getUsuarioLocal() || null;
}
 
function obtenerNombreEntrenadorMaps() {
    const usuario = obtenerUsuarioMapsActual();
    return usuario?.nombre || tMaps("maps_trainer_default", "Trainer");
}
 
function normalizarAvatarIdMaps(avatarId) {
    const valor = String(avatarId || "").trim().toLowerCase();
    if (!valor || !MAPS_AVATAR_ID_REGEX.test(valor)) {
        return MAPS_AVATAR_DEFAULT_ID;
    }
    return valor;
}
 
function obtenerAvatarIdUsuarioMaps() {
    const usuario = obtenerUsuarioMapsActual();
 
    if (usuario?.avatar_id) {
        return normalizarAvatarIdMaps(usuario.avatar_id);
    }
 
    if (typeof getAvatarIdLocal === "function") {
        return normalizarAvatarIdMaps(getAvatarIdLocal());
    }
 
    return MAPS_AVATAR_DEFAULT_ID;
}
 
function obtenerRutaAvatarMaps(avatarId = null) {
    const avatarNormalizado = normalizarAvatarIdMaps(avatarId || obtenerAvatarIdUsuarioMaps());
    return `img/avatars/${avatarNormalizado}.png`;
}
 
function obtenerRutaAvatarFallbackMaps() {
    return `img/avatars/${MAPS_AVATAR_DEFAULT_ID}.png`;
}
 
function obtenerClaveZonaActualMaps() {
    return obtenerClaveZona(zonaSeleccionadaActual?.nombre || "");
}
 
function obtenerRutaZonaActual() {
    const clave = obtenerClaveZonaActualMaps();
    return MAPAS_RUTAS[clave] || MAPAS_RUTAS.default;
}
 
function asegurarPosicionAvatarZona(zona = null) {
    const clave = obtenerClaveZona(zona?.nombre || "");
    const ruta = MAPAS_RUTAS[clave] || MAPAS_RUTAS.default;
    const posiciones = leerStorageJSON(MAPS_AVATAR_POSICIONES_KEY, {}) || {};
 
    if (!posiciones[clave] || !ruta.nodes[posiciones[clave]]) {
        posiciones[clave] = ruta.start;
        guardarStorageJSON(MAPS_AVATAR_POSICIONES_KEY, posiciones);
    }
}
 
function obtenerNodoActualAvatar() {
    const ruta = obtenerRutaZonaActual();
    const clave = obtenerClaveZonaActualMaps();
    const posiciones = leerStorageJSON(MAPS_AVATAR_POSICIONES_KEY, {}) || {};
    const nodeId = posiciones[clave] && ruta.nodes[posiciones[clave]]
        ? posiciones[clave]
        : ruta.start;
 
    return {
        id: nodeId,
        ...ruta.nodes[nodeId]
    };
}
 
function guardarNodoActualAvatar(nodeId) {
    const clave = obtenerClaveZonaActualMaps();
    const ruta = obtenerRutaZonaActual();
    if (!ruta.nodes[nodeId]) return;
 
    const posiciones = leerStorageJSON(MAPS_AVATAR_POSICIONES_KEY, {}) || {};
    posiciones[clave] = nodeId;
    guardarStorageJSON(MAPS_AVATAR_POSICIONES_KEY, posiciones);
}
 
function obtenerSiguienteNodoAvatar(direccion) {
    const actual = obtenerNodoActualAvatar();
    return actual?.[direccion] || null;
}
 
function puedeMoverAvatar(direccion) {
    return !!obtenerSiguienteNodoAvatar(direccion);
}
 
function renderizarAvatarMapa() {
    const avatarWrap = document.getElementById("avatarMapa");
    if (!avatarWrap || !zonaSeleccionadaActual) return;
 
    const nodo = obtenerNodoActualAvatar();
    const nombreEntrenador = obtenerNombreEntrenadorMaps();
    const avatarId = obtenerAvatarIdUsuarioMaps();
    const rutaAvatar = obtenerRutaAvatarMaps(avatarId);
    const rutaFallback = obtenerRutaAvatarFallbackMaps();
 
    avatarWrap.style.left = `${nodo.x}%`;
    avatarWrap.style.top = `${nodo.y}%`;
    avatarWrap.setAttribute("aria-label", nombreEntrenador);
    avatarWrap.dataset.avatarId = avatarId;
 
    avatarWrap.innerHTML = `
        <div class="avatar-mapa-sombra"></div>
        <img
            src="${rutaAvatar}"
            alt="${nombreEntrenador}"
            class="avatar-mapa-img"
            loading="eager"
            decoding="async"
            onerror="if(this.dataset.fallbackApplied==='1')return;this.dataset.fallbackApplied='1';this.src='${rutaFallback}';"
        >
    `;
 
    actualizarBotonesMovimientoDisponibles(false);
}
 
function actualizarBotonesMovimientoDisponibles(cargando = false) {
    const botones = document.querySelectorAll("[data-move]");
 
    botones.forEach(btn => {
        const direccion = btn.dataset.move;
        const disponible = zonaSeleccionadaActual && puedeMoverAvatar(direccion);
 
        btn.disabled = cargando || !disponible;
        btn.classList.toggle("move-bloqueado", !cargando && !disponible);
    });
}
 
function moverAvatarVisual(nodeId) {
    return new Promise((resolve) => {
        const avatarWrap = document.getElementById("avatarMapa");
        const ruta = obtenerRutaZonaActual();
        const nodo = ruta.nodes[nodeId];
 
        if (!avatarWrap || !nodo) {
            resolve();
            return;
        }
 
        requestAnimationFrame(() => {
            avatarWrap.style.left = `${nodo.x}%`;
            avatarWrap.style.top = `${nodo.y}%`;
            setTimeout(resolve, 40);
        });
    });
}
 
function configurarMovimientoTeclado() {
    if (window.__mapsKeyboardReady) return;
    window.__mapsKeyboardReady = true;
 
    window.addEventListener("keydown", async (event) => {
        const tag = document.activeElement?.tagName || "";
        const escribiendo = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);
 
        if (escribiendo) return;
        if (!zonaSeleccionadaActual) return;
        if (document.getElementById("modalShiny") && !document.getElementById("modalShiny").classList.contains("oculto")) return;
        if (document.getElementById("modalResultadoCaptura") && !document.getElementById("modalResultadoCaptura").classList.contains("oculto")) return;
 
        const mapa = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
            w: "up",
            W: "up",
            s: "down",
            S: "down",
            a: "left",
            A: "left",
            d: "right",
            D: "right"
        };
 
        const direccion = mapa[event.key];
        if (!direccion) return;
 
        event.preventDefault();
        await moverEnMapa(direccion);
    });
}
 
/* =========================
   TIEMPO REAL / PRESENCIA
========================= */
function obtenerLayerJugadoresMaps() {
    return document.getElementById("jugadoresMapaLayer");
}
 
function limpiarJugadoresZonaMaps() {
    jugadoresZonaMaps.clear();
    presenciaZonaActivaId = null;
    renderizarJugadoresMapa();
}
 
function obtenerNodoMapaPorId(nodeId) {
    const ruta = obtenerRutaZonaActual();
    if (!ruta || !ruta.nodes) return null;
    return ruta.nodes[nodeId] ? { id: nodeId, ...ruta.nodes[nodeId] } : null;
}
 
function obtenerInicialNombreJugador(nombre = "") {
    const limpio = String(nombre || "").trim();
    return limpio ? limpio.charAt(0).toUpperCase() : "T";
}
 
function esJugadorActualMaps(usuarioId) {
    const actual = getUsuarioIdLocal();
    return Number(actual) > 0 && Number(actual) === Number(usuarioId);
}
 
function crearHtmlJugadorMapa(jugador, nodo) {
    const nombre = jugador?.nombre || tMaps("maps_trainer_default", "Trainer");
    const avatarId = normalizarAvatarIdMaps(jugador?.avatar_id || MAPS_AVATAR_DEFAULT_ID);
    const rutaAvatar = obtenerRutaAvatarMaps(avatarId);
    const rutaFallback = obtenerRutaAvatarFallbackMaps();
    const inicial = obtenerInicialNombreJugador(nombre);
 
    return `
        <div
            class="jugador-mapa"
            data-usuario-id="${Number(jugador.usuario_id)}"
            style="left:${nodo.x}%; top:${nodo.y}%"
            aria-label="${nombre}"
            title="${nombre}"
        >
            <div class="jugador-mapa-etiqueta">${nombre}</div>
            <div class="jugador-mapa-sombra"></div>
            <img
                src="${rutaAvatar}"
                alt="${nombre}"
                class="jugador-mapa-img"
                loading="eager"
                decoding="async"
                onerror="if(this.dataset.fallbackApplied==='1')return;this.dataset.fallbackApplied='1';this.src='${rutaFallback}';"
            >
            <div class="jugador-mapa-inicial">${inicial}</div>
        </div>
    `;
}
 
function renderizarJugadoresMapa() {
    const layer = obtenerLayerJugadoresMaps();
    if (!layer) return;
 
    if (!zonaSeleccionadaActual || !usuarioAutenticadoMaps()) {
        layer.innerHTML = "";
        return;
    }
 
    const jugadores = Array.from(jugadoresZonaMaps.values())
        .filter(j => !esJugadorActualMaps(j.usuario_id))
        .filter(j => String(j.nodo_id || "").trim() !== "")
        .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), undefined, { sensitivity: "base" }));
 
    const html = jugadores.map((jugador) => {
        const nodo = obtenerNodoMapaPorId(jugador.nodo_id);
        if (!nodo) return "";
        return crearHtmlJugadorMapa(jugador, nodo);
    }).join("");
 
    layer.innerHTML = html;
}
 
function upsertJugadorZonaMaps(jugador) {
    if (!jugador || jugador.usuario_id == null) return;
    if (esJugadorActualMaps(jugador.usuario_id)) return;
 
    jugadoresZonaMaps.set(Number(jugador.usuario_id), {
        ...jugador,
        usuario_id: Number(jugador.usuario_id)
    });
 
    renderizarJugadoresMapa();
}
 
function quitarJugadorZonaMaps(usuarioId) {
    jugadoresZonaMaps.delete(Number(usuarioId));
    renderizarJugadoresMapa();
}
 
function asegurarConexionTiempoRealMaps() {
    if (mapsRealtimeConnection) return mapsRealtimeConnection;
    if (typeof crearConexionTiempoRealMaps !== "function") return null;
 
    mapsRealtimeConnection = crearConexionTiempoRealMaps({
        onOpen: () => {
            // La función de api.js reenvía automáticamente el último join al reconectar.
        },
        onClose: () => {
            // Mantener silencioso para no ensuciar la UI del mapa.
        },
        onError: (error) => {
            console.warn("WebSocket Maps:", error);
        },
        onReconnect: ({ intentos, delay }) => {
            console.warn(`Maps WS reconectando. Intento ${intentos}, espera ${delay}ms`);
        },
        onMessage: (data) => {
            procesarMensajeTiempoRealMaps(data);
        }
    });
 
    mapsRealtimeConnection.connect();
    return mapsRealtimeConnection;
}
 
function procesarMensajeTiempoRealMaps(data) {
    const type = String(data?.type || "").toLowerCase();
 
    if (!type) return;
 
    if (type === "connected") {
        return;
    }
 
    if (type === "pong") {
        return;
    }
 
    if (type === "snapshot") {
        const zonaId = Number(data?.zona_id || 0);
        if (!zonaSeleccionadaActual || Number(zonaSeleccionadaActual.id) !== zonaId) return;
 
        jugadoresZonaMaps.clear();
 
        if (Array.isArray(data.jugadores)) {
            data.jugadores.forEach((jugador) => {
                if (!esJugadorActualMaps(jugador.usuario_id)) {
                    jugadoresZonaMaps.set(Number(jugador.usuario_id), {
                        ...jugador,
                        usuario_id: Number(jugador.usuario_id)
                    });
                }
            });
        }
 
        renderizarJugadoresMapa();
        return;
    }
 
    if (type === "upsert") {
        const jugador = data?.jugador || null;
        if (!jugador) return;
 
        if (!zonaSeleccionadaActual) return;
        if (Number(jugador.zona_id || 0) !== Number(zonaSeleccionadaActual.id)) return;
 
        upsertJugadorZonaMaps(jugador);
        return;
    }
 
    if (type === "remove") {
        const usuarioId = Number(data?.usuario_id || 0);
        if (!usuarioId) return;
 
        quitarJugadorZonaMaps(usuarioId);
        return;
    }
 
    if (type === "ack") {
        const self = data?.self || null;
        if (self && Number(self.usuario_id || 0) === Number(getUsuarioIdLocal() || 0)) {
            ultimoNodoReportadoMaps = String(self.nodo_id || ultimoNodoReportadoMaps || "");
        }
        return;
    }
 
    if (type === "left") {
        return;
    }
 
    if (type === "error") {
        console.warn("Error WS Maps:", data?.message || data);
    }
}
 
async function refrescarPresenciaZonaActual() {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) return;
 
    try {
        const data = await obtenerPresenciaMapa(zonaSeleccionadaActual.id);
        if (!data || !Array.isArray(data.jugadores)) return;
        if (!zonaSeleccionadaActual || Number(data.zona_id || 0) !== Number(zonaSeleccionadaActual.id)) return;
 
        jugadoresZonaMaps.clear();
 
        data.jugadores.forEach((jugador) => {
            if (!esJugadorActualMaps(jugador.usuario_id)) {
                jugadoresZonaMaps.set(Number(jugador.usuario_id), {
                    ...jugador,
                    usuario_id: Number(jugador.usuario_id)
                });
            }
        });
 
        renderizarJugadoresMapa();
    } catch (error) {
        console.warn("No se pudo refrescar la presencia de la zona:", error);
    }
}
 
async function iniciarPresenciaZonaActual() {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) {
        limpiarJugadoresZonaMaps();
        return;
    }
 
    const nodoActual = obtenerNodoActualAvatar();
    const zonaId = Number(zonaSeleccionadaActual.id);
    const nodoId = String(nodoActual?.id || "").trim().toLowerCase();
 
    if (!zonaId || !nodoId) {
        limpiarJugadoresZonaMaps();
        return;
    }
 
    presenciaZonaActivaId = zonaId;
    ultimoNodoReportadoMaps = nodoId;
    jugadoresZonaMaps.clear();
    renderizarJugadoresMapa();
 
    try {
        const snapshot = await obtenerPresenciaMapa(zonaId);
        if (snapshot && Array.isArray(snapshot.jugadores) && zonaSeleccionadaActual && Number(zonaSeleccionadaActual.id) === zonaId) {
            snapshot.jugadores.forEach((jugador) => {
                if (!esJugadorActualMaps(jugador.usuario_id)) {
                    jugadoresZonaMaps.set(Number(jugador.usuario_id), {
                        ...jugador,
                        usuario_id: Number(jugador.usuario_id)
                    });
                }
            });
            renderizarJugadoresMapa();
        }
    } catch (error) {
        console.warn("No se pudo cargar snapshot de presencia:", error);
    }
 
    const conexion = asegurarConexionTiempoRealMaps();
 
    if (conexion) {
        conexion.join(zonaId, nodoId);
    } else {
        try {
            await actualizarPresenciaMapa(zonaId, nodoId);
        } catch (error) {
            console.warn("No se pudo actualizar la presencia inicial por HTTP:", error);
        }
    }
}
 
function sincronizarPresenciaMovimiento(nodoId) {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) return;
    if (!nodoId) return;
 
    const nodoNormalizado = String(nodoId).trim().toLowerCase();
    ultimoNodoReportadoMaps = nodoNormalizado;
 
    const conexion = asegurarConexionTiempoRealMaps();
 
    if (conexion) {
        const enviado = conexion.move(nodoNormalizado);
 
        if (!enviado) {
            actualizarPresenciaMapa(zonaSeleccionadaActual.id, nodoNormalizado)
                .catch((error) => {
                    console.warn("Fallback HTTP de movimiento falló:", error);
                });
        }
 
        return;
    }
 
    actualizarPresenciaMapa(zonaSeleccionadaActual.id, nodoNormalizado)
        .catch((error) => {
            console.warn("No se pudo actualizar presencia por HTTP:", error);
        });
}
 
function sincronizarPresenciaLocalMaps() {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) return;
 
    const nodoActual = obtenerNodoActualAvatar();
    const zonaId = Number(zonaSeleccionadaActual.id);
    const nodoId = String(nodoActual?.id || "").trim().toLowerCase();
 
    if (!zonaId || !nodoId) return;
 
    const conexion = asegurarConexionTiempoRealMaps();
    if (conexion) {
        conexion.join(zonaId, nodoId);
    }
}
 
async function salirPresenciaMaps(cerrarConexion = false) {
    try {
        if (mapsRealtimeConnection) {
            if (cerrarConexion) {
                mapsRealtimeConnection.disconnect();
            } else {
                mapsRealtimeConnection.leave();
            }
        }
    } catch (error) {
        console.warn("No se pudo hacer leave del WS Maps:", error);
    }
 
    try {
        if (usuarioAutenticadoMaps()) {
            await eliminarPresenciaMapa();
        }
    } catch (error) {
        console.warn("No se pudo eliminar presencia por HTTP:", error);
    }
 
    if (cerrarConexion && mapsRealtimeConnection) {
        mapsRealtimeConnection = null;
    }
 
    limpiarJugadoresZonaMaps();
}
 
/* =========================
   ENCUENTRO / SERVIDOR
========================= */
function obtenerImagenPokemonEncuentro(pokemon) {
    if (!pokemon) return "";
 
    if (pokemon.imagen) {
        return pokemon.imagen;
    }
 
    return pokemon.es_shiny
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.pokemon_id}.png`
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`;
}
 
async function solicitarEncuentroServidor(requestIdActual, zonaIdActual) {
    const usuarioId = getUsuarioIdLocal();
 
    const pokemon = await fetchAuth(`${API_BASE}/maps/encuentro`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            usuario_id: usuarioId,
            zona_id: zonaIdActual
        })
    });
 
    if (requestIdActual !== encuentroRequestId) return;
    if (!zonaSeleccionadaActual || Number(zonaSeleccionadaActual.id) !== zonaIdActual) return;
 
    if (!pokemon || pokemon.error) {
        throw new Error(pokemon?.error || t("maps_encounter_generate_error"));
    }
 
    if (!pokemon.pokemon_id) {
        throw new Error(t("maps_invalid_pokemon"));
    }
 
    const ttlSegundos = Number(
        pokemon.encuentro_ttl_segundos ??
        pokemon.ttl_segundos ??
        pokemon.ttl ??
        0
    );
 
    encuentroActual = {
        pokemon_id: Number(pokemon.pokemon_id),
        nombre: pokemon.nombre || t("maps_wild_pokemon_default"),
        tipo: pokemon.tipo || "—",
        imagen: pokemon.imagen || null,
        rareza: pokemon.rareza || null,
        generacion: pokemon.generacion || null,
        tiene_mega: !!pokemon.tiene_mega,
        ataque: Number(pokemon.ataque || 0),
        defensa: Number(pokemon.defensa || 0),
        hp: Number(pokemon.hp || pokemon.hp_max || 0),
        hp_max: Number(pokemon.hp_max || pokemon.hp || 0),
        velocidad: Number(pokemon.velocidad || 0),
        nivel: Number(pokemon.nivel || 1),
        es_shiny: pokemon.es_shiny === true || pokemon.es_shiny === 1,
        encuentro_token: pokemon.encuentro_token || null,
        encuentro_ttl_segundos: ttlSegundos,
        encuentro_expira_en_ms: ttlSegundos > 0 ? Date.now() + (ttlSegundos * 1000) : null
    };
 
    if (encuentroActual.es_shiny) {
        mostrarModalShiny();
    }
 
    renderEncuentroActual();
}
 
/* =========================
   USUARIO / DATA
========================= */
async function cargarPokemonUsuarioMaps() {
    if (!usuarioAutenticadoMaps()) {
        pokemonsCapturadosMaps = [];
        pokemonsShinyCapturadosMaps = [];
        listaPokemonUsuarioMaps = [];
        return;
    }
 
    try {
        const data = await obtenerPokemonUsuarioActual();
 
        listaPokemonUsuarioMaps = Array.isArray(data) ? data : [];
 
        pokemonsCapturadosMaps = [
            ...new Set(listaPokemonUsuarioMaps.filter(p => !p.es_shiny).map(p => Number(p.pokemon_id)))
        ];
 
        pokemonsShinyCapturadosMaps = [
            ...new Set(listaPokemonUsuarioMaps.filter(p => p.es_shiny).map(p => Number(p.pokemon_id)))
        ];
    } catch (error) {
        console.error("Error cargando Pokémon del usuario en Maps:", error);
        pokemonsCapturadosMaps = [];
        pokemonsShinyCapturadosMaps = [];
        listaPokemonUsuarioMaps = [];
    }
}
 
async function cargarItemsUsuarioMaps(forzar = false) {
    if (!usuarioAutenticadoMaps()) {
        itemsUsuarioMaps = [];
        return [];
    }
 
    if (!forzar && itemsUsuarioMaps.length > 0) {
        return itemsUsuarioMaps;
    }
 
    try {
        const items = await obtenerItemsUsuarioActual();
 
        if (Array.isArray(items)) {
            itemsUsuarioMaps = items;
        }
 
        return itemsUsuarioMaps;
    } catch (error) {
        console.error("Error cargando items del usuario en Maps:", error);
        return itemsUsuarioMaps;
    }
}
 
function usuarioAutenticadoMaps() {
    return !!getAccessToken();
}
 
function obtenerEstadoCapturaMapa(pokemonId, esShiny, listaPokemonUsuario = []) {
    const shinyActual = esShiny === true || esShiny === 1 || esShiny === "true";
 
    let cantidadExacta = 0;
    let cantidadTotal = 0;
 
    for (const p of listaPokemonUsuario) {
        if (Number(p.pokemon_id) !== Number(pokemonId)) continue;
 
        cantidadTotal += 1;
 
        const shinyPokemon = p.es_shiny === true || p.es_shiny === 1 || p.es_shiny === "true";
        if (shinyPokemon === shinyActual) {
            cantidadExacta += 1;
        }
    }
 
    if (cantidadExacta > 0) {
        return {
            capturado: true,
            variante: "exacto",
            cantidad: cantidadExacta,
            imagen: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
        };
    }
 
    if (cantidadTotal > 0) {
        return {
            capturado: true,
            variante: "otra-version",
            cantidad: cantidadTotal,
            imagen: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
        };
    }
 
    return {
        capturado: false,
        variante: "ninguno",
        cantidad: 0,
        imagen: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
    };
}
 
/* =========================
   ZONAS
========================= */
function obtenerClaveZona(nombreZona = "") {
    const nombre = String(nombreZona || "").toLowerCase().trim();
 
    if (nombre.includes("bosque") || nombre.includes("forest")) return "bosque";
    if (nombre.includes("cueva") || nombre.includes("cave")) return "cueva";
    if (nombre.includes("lago") || nombre.includes("lake")) return "lago";
    if (nombre.includes("torre") || nombre.includes("tower")) return "torre";
 
    return "default";
}
 
function obtenerConfigZona(nombreZona = "") {
    const clave = obtenerClaveZona(nombreZona);
    return MAPAS_CONFIG[clave] || MAPAS_CONFIG.default;
}
 
function obtenerNombreZonaTraducido(zona = null) {
    const nombreOriginal = typeof zona === "string"
        ? zona
        : (zona?.nombre || "");
 
    const clave = obtenerClaveZona(nombreOriginal);
 
    const mapa = {
        bosque: "maps_zone_bosque_name",
        cueva: "maps_zone_cueva_name",
        lago: "maps_zone_lago_name",
        torre: "maps_zone_torre_name"
    };
 
    const key = mapa[clave];
    const traducido = key ? t(key) : "";
 
    return traducido && traducido !== key
        ? traducido
        : nombreOriginal;
}
 
function obtenerDescripcionZonaTraducida(zona = null) {
    const nombreOriginal = typeof zona === "string"
        ? zona
        : (zona?.nombre || "");
 
    const descripcionOriginal = typeof zona === "object"
        ? (zona?.descripcion || "")
        : "";
 
    const clave = obtenerClaveZona(nombreOriginal);
 
    const mapa = {
        bosque: "maps_zone_bosque_desc",
        cueva: "maps_zone_cueva_desc",
        lago: "maps_zone_lago_desc",
        torre: "maps_zone_torre_desc"
    };
 
    const key = mapa[clave];
    const traducida = key ? t(key) : "";
 
    if (traducida && traducida !== key) {
        return traducida;
    }
 
    return descripcionOriginal || t("maps_default_zone_desc");
}
 
function traducirTipoPokemonMaps(tipo = "") {
    const mapa = {
        "Normal": "type_normal",
        "Fuego": "type_fire",
        "Agua": "type_water",
        "Planta": "type_grass",
        "Electrico": "type_electric",
        "Eléctrico": "type_electric",
        "Hielo": "type_ice",
        "Lucha": "type_fighting",
        "Veneno": "type_poison",
        "Tierra": "type_ground",
        "Volador": "type_flying",
        "Psiquico": "type_psychic",
        "Psíquico": "type_psychic",
        "Bicho": "type_bug",
        "Roca": "type_rock",
        "Fantasma": "type_ghost",
        "Dragon": "type_dragon",
        "Dragón": "type_dragon",
        "Acero": "type_steel",
        "Hada": "type_fairy"
    };
 
    return String(tipo || "")
        .split("/")
        .map(parte => {
            const limpio = parte.trim();
            const key = mapa[limpio];
            return key ? t(key) : limpio;
        })
        .join("/");
}
 
async function cargarZonas() {
    const cache = leerCacheZonas();
    if (cache && cache.length > 0) {
        zonasCache = cache;
        mapasPorVista = obtenerMapasPorVista();
        mapaInicio = Math.min(mapaInicio, Math.max(0, zonasCache.length - 1));
        renderizarZonas();
    }
 
    const zonas = await fetchJson(`${API_BASE}/zonas`);
    zonasCache = Array.isArray(zonas) ? zonas : [];
    guardarCacheZonas(zonasCache);
 
    mapasPorVista = obtenerMapasPorVista();
    mapaInicio = 0;
}
 
function mostrarCargaZonas() {
    const container = document.getElementById("zonasContainer");
    if (!container) return;
 
    let html = "";
    const total = obtenerMapasPorVista();
 
    for (let i = 0; i < total; i++) {
        html += `
            <article class="map-card">
                <div class="map-img-wrap"></div>
                <div class="map-info">
                    <h3>${t("maps_loading")}</h3>
                    <p>${t("maps_preparing_zone")}</p>
                    <div class="map-actions">
                        <span class="map-level">${t("maps_level_short")} —</span>
                        <button class="btn-map" type="button" disabled>${t("maps_view")}</button>
                    </div>
                </div>
            </article>
        `;
    }
 
    container.innerHTML = html;
}
 
function mostrarErrorZonas() {
    const container = document.getElementById("zonasContainer");
    if (!container) return;
 
    container.innerHTML = `
        <article class="map-card">
            <div class="map-info">
                <h3>${t("maps_zones_load_error")}</h3>
                <p>${t("maps_check_backend")}</p>
                <div class="map-actions">
                    <button class="btn-map" type="button" onclick="window.location.reload()">${t("maps_retry")}</button>
                </div>
            </div>
        </article>
    `;
}
 
function renderizarZonas() {
    const container = document.getElementById("zonasContainer");
    if (!container) return;
 
    const visibles = obtenerZonasVisibles();
 
    if (!visibles.length) {
        container.innerHTML = `
            <article class="map-card">
                <div class="map-info">
                    <h3>${t("maps_no_zones")}</h3>
                    <p>${t("maps_add_zones_db")}</p>
                </div>
            </article>
        `;
        return;
    }
 
    container.innerHTML = visibles.map(zona => {
        const config = obtenerConfigZona(zona.nombre);
        const activa = zonaSeleccionadaActual && Number(zonaSeleccionadaActual.id) === Number(zona.id);
 
        const nombreZonaUI = obtenerNombreZonaTraducido(zona);
        const descripcionZonaUI = obtenerDescripcionZonaTraducida(zona);
 
        return `
            <article class="map-card ${config.clase} ${activa ? "map-card-activa" : ""}">
                <div class="map-img-wrap">
                    <img src="${config.card}" alt="${nombreZonaUI}" class="map-img" loading="lazy" decoding="async">
                </div>
 
                <div class="map-info">
                    <h3>${nombreZonaUI}</h3>
                    <p>${descripcionZonaUI}</p>
 
                    <div class="map-actions">
                        <span class="map-level">${t("maps_level")} ${zona.nivel_min} - ${zona.nivel_max}</span>
                        <button class="btn-map ${activa ? "btn-map-activa" : ""}" type="button" data-zona-id="${zona.id}">
                            ${t("maps_view")}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}
 
async function seleccionarZona(zonaId) {
    const zona = zonasCache.find(z => Number(z.id) === Number(zonaId));
    if (!zona) return;
 
    zonaSeleccionadaActual = zona;
    asegurarPosicionAvatarZona(zona);
    jugadoresZonaMaps.clear();
 
    if (!usuarioAutenticadoMaps()) {
        encuentroRequestId++;
        movimientoEnCurso = false;
 
        renderizarZonas();
        limpiarMensajeMaps();
        cerrarModalesSecundarios();
        limpiarEncuentroActual();
        limpiarJugadoresZonaMaps();
        await salirPresenciaMaps(true);
        renderBloqueoMapsSinSesion();
 
        const encuentro = document.getElementById("encuentroContainer");
        if (encuentro) {
            encuentro.classList.remove("oculto");
 
            requestAnimationFrame(() => {
                setTimeout(() => {
                    scrollAlMapa();
                }, 40);
            });
        }
 
        return;
    }
 
    const esPrimeraCargaVisual = !encuentroActual;
 
    encuentroRequestId++;
    movimientoEnCurso = false;
    cerrarModalesSecundarios();
    limpiarMensajeMaps();
 
    renderizarZonas();
    renderizarZonaExploracion();
 
    const encuentro = document.getElementById("encuentroContainer");
    if (encuentro) {
        encuentro.classList.remove("oculto");
    }
 
    if (esPrimeraCargaVisual) {
        renderPanelDerechoVacio();
    }
 
    requestAnimationFrame(() => {
        setTimeout(() => {
            scrollAlMapa();
        }, 40);
    });
 
    try {
        await Promise.all([
            cargarItemsUsuarioMaps(),
            iniciarPresenciaZonaActual()
        ]);
    } catch (error) {
        console.warn("No se pudieron cargar datos al seleccionar zona:", error);
    }
 
    // El primer encuentro ahora aparece al moverte en el mapa.
}
 
function renderizarZonaExploracion() {
    if (!zonaSeleccionadaActual) return;
 
    const encuentro = document.getElementById("encuentroContainer");
    if (!encuentro) return;
 
    const config = obtenerConfigZona(zonaSeleccionadaActual.nombre);
    const claseZona = config.clase;
    const nombreZonaUI = obtenerNombreZonaTraducido(zonaSeleccionadaActual);
 
    encuentro.className = "encuentro-box";
    if (claseZona) {
        encuentro.classList.add(claseZona);
    }
 
    encuentro.innerHTML = `
        <div class="encuentro-layout-mapa">
            <div class="mapa-exploracion-panel">
                <div class="mapa-exploracion-header">
                    <h3>${nombreZonaUI}</h3>
                    <p>${t("maps_explore_hint")}</p>
                </div>
 
                <div class="mapa-exploracion-box">
                    <img
                        id="imgMapaExploracion"
                        src="${config.escenario}"
                        alt="${nombreZonaUI}"
                        loading="eager"
                        decoding="async"
                    >
 
                    <div id="jugadoresMapaLayer" class="jugadores-mapa-layer"></div>
 
                    <div
                        id="avatarMapa"
                        class="avatar-mapa"
                        aria-label="${obtenerNombreEntrenadorMaps()}"
                    ></div>
                </div>
 
                <div class="mapa-ui-inferior">
                    <div class="mapa-evento-box">
                        <div class="mapa-evento-titulo">${t("maps_zone_pokemon")}</div>
                        ${renderMiniaturasZona(zonaSeleccionadaActual)}
                    </div>
 
                    <div class="mapa-movimiento">
                        <button class="move-up" data-move="up" type="button" aria-label="${t("maps_move_up")}">
                            <img src="img/maps/move/north_able.png" alt="${t("maps_move_up")}">
                        </button>
 
                        <button class="move-left" data-move="left" type="button" aria-label="${t("maps_move_left")}">
                            <img src="img/maps/move/west_able.png" alt="${t("maps_move_left")}">
                        </button>
 
                        <div class="move-center">
                            <img src="img/maps/move/center.png" alt="${t("maps_center")}">
                        </div>
 
                        <button class="move-right" data-move="right" type="button" aria-label="${t("maps_move_right")}">
                            <img src="img/maps/move/east_able.png" alt="${t("maps_move_right")}">
                        </button>
 
                        <button class="move-down" data-move="down" type="button" aria-label="${t("maps_move_down")}">
                            <img src="img/maps/move/south_able.png" alt="${t("maps_move_down")}">
                        </button>
                    </div>
                </div>
            </div>
 
            <div class="encuentro-lateral">
                <div id="encuentroInfoPanel" class="encuentro-info-panel"></div>
                <div id="encuentroAccionPanel" class="encuentro-accion-panel"></div>
            </div>
        </div>
    `;
 
    renderizarAvatarMapa();
    renderizarJugadoresMapa();
}
 
function renderMiniaturasZona(zona = null) {
    const pokemonesZona = Array.isArray(zona?.pokemones) ? zona.pokemones : [];
 
    if (!pokemonesZona.length) {
        return `
            <div class="mini-zona-vacia">
                <span>${t("maps_no_pokemon_zone")}</span>
            </div>
        `;
    }
 
    const htmlCards = pokemonesZona.map((p, index) => `
        <div class="mini-zona-card" title="${p.nombre}" style="--delay:${index * 0.08}s;">
            <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemon_id}.png"
                alt="${p.nombre}"
                loading="lazy"
                decoding="async"
            >
            <span>${p.nombre}</span>
        </div>
    `).join("");
 
    if (pokemonesZona.length <= 6) {
        return `
            <div class="mini-zona-grid-fijo">
                ${htmlCards}
            </div>
        `;
    }
 
    return `
        <div class="mini-zona-carrusel animando">
            <div class="mini-zona-track">
                ${htmlCards}
                ${htmlCards}
            </div>
        </div>
    `;
}
 
/* =========================
   ENCUENTROS
========================= */
async function moverEnMapa(direccion, opciones = {}) {
    if (!zonaSeleccionadaActual || movimientoEnCurso) return;
 
    const { silencioso = false, soloEncuentro = false } = opciones;
    const usuarioId = getUsuarioIdLocal();
 
    if (!usuarioId) {
        mostrarMensajeMaps(t("maps_login_required"), "error");
        return;
    }
 
    const requestIdActual = ++encuentroRequestId;
    const zonaIdActual = Number(zonaSeleccionadaActual.id);
 
    let siguienteNodoId = null;
 
    if (!soloEncuentro) {
        siguienteNodoId = obtenerSiguienteNodoAvatar(direccion);
 
        if (!siguienteNodoId) {
            actualizarBotonesMovimientoDisponibles(false);
            return;
        }
    }
 
    movimientoEnCurso = true;
    cerrarModalesSecundarios();
    setEstadoMovimiento(true, direccion);
    limpiarMensajeMaps();
 
    if (!encuentroActual && !silencioso) {
        renderPanelDerechoVacio();
    }
 
    try {
        if (!soloEncuentro && siguienteNodoId) {
            guardarNodoActualAvatar(siguienteNodoId);
            await moverAvatarVisual(siguienteNodoId);
            sincronizarPresenciaMovimiento(siguienteNodoId);
        }
 
        if (encuentroActualExpiradoMaps()) {
            limpiarEncuentroActual();
            renderPanelDerechoVacio();
        }
 
        // Cada movimiento válido puede reemplazar el encuentro anterior.
        // El backend invalida el token previo y devuelve el nuevo encuentro activo.
        await solicitarEncuentroServidor(requestIdActual, zonaIdActual);
    } catch (error) {
        if (requestIdActual !== encuentroRequestId) return;
 
        console.error("Error explorando zona:", error);
        mostrarMensajeMaps(error.message || t("maps_encounter_generate_error"), "error");
 
        if (!encuentroActual) {
            renderPanelDerechoVacio();
        }
    } finally {
        if (requestIdActual === encuentroRequestId) {
            setEstadoMovimiento(false);
            movimientoEnCurso = false;
        }
    }
}
 
function renderEncuentroActual() {
    if (!encuentroActual || !zonaSeleccionadaActual) {
        renderPanelDerechoVacio();
        return;
    }
 
    const infoPanel = document.getElementById("encuentroInfoPanel");
    const accionPanel = document.getElementById("encuentroAccionPanel");
    if (!infoPanel || !accionPanel) return;
 
    const imagen = obtenerImagenPokemonEncuentro(encuentroActual);
 
    const estadoCaptura = obtenerEstadoCapturaMapa(
        encuentroActual.pokemon_id,
        encuentroActual.es_shiny,
        listaPokemonUsuarioMaps
    );
 
    infoPanel.innerHTML = `
        <h2>${t("maps_wild_found")}</h2>
 
        <div class="encuentro-top-status">
            <div class="captura-indicador-superior ${estadoCaptura.variante}">
                <img
                    src="${estadoCaptura.imagen}"
                    class="captura-ball-img ${estadoCaptura.variante === "ninguno" ? "gris" : ""} ${estadoCaptura.variante === "otra-version" ? "dorada" : ""}"
                    alt="${t("maps_capture_status")}"
                >
            </div>
 
            <div class="captura-cantidad-box">
                x${estadoCaptura.cantidad}
            </div>
        </div>
 
        <div class="encuentro-pokemon-showcase fondo-zona ${obtenerConfigZona(zonaSeleccionadaActual.nombre).clase}">
            <div class="encuentro-pokemon-aura ${encuentroActual.es_shiny ? "aura-shiny" : ""}"></div>
            <div class="encuentro-pokemon-plataforma"></div>
            <img src="${imagen}" alt="${encuentroActual.nombre}" class="encuentro-img" loading="eager" decoding="async">
        </div>
 
        <div class="encuentro-nombre-box">
            <h3>${encuentroActual.nombre}</h3>
            ${encuentroActual.es_shiny ? `<span class="encuentro-shiny-badge">✨ Shiny</span>` : ""}
        </div>
 
        <div class="encuentro-datos-grid">
            <div class="dato-mini">
                <span>${t("maps_type")}</span>
                <strong>${traducirTipoPokemonMaps(encuentroActual.tipo) || "—"}</strong>
            </div>
            <div class="dato-mini">
                <span>${t("maps_level")}</span>
                <strong>${encuentroActual.nivel ?? "—"}</strong>
            </div>
            <div class="dato-mini">
                <span>${t("maps_hp")}</span>
                <strong>${encuentroActual.hp ?? "—"}</strong>
            </div>
        </div>
    `;
 
    accionPanel.innerHTML = renderPanelAccionEncuentro();
    actualizarProbabilidadVisual(encuentroActual.es_shiny === true);
}
 
function renderBloqueoMapsSinSesion() {
    const encuentro = document.getElementById("encuentroContainer");
    if (!encuentro) return;
 
    encuentro.className = "encuentro-box";
    encuentro.classList.remove("oculto");
 
    encuentro.innerHTML = `
        <div class="maps-login-lock">
            <h3>${t("maps_login_to_explore")}</h3>
            <p>${t("maps_login_explore_text")}</p>
        </div>
    `;
}
 
function renderPanelDerechoVacio() {
    const infoPanel = document.getElementById("encuentroInfoPanel");
    const accionPanel = document.getElementById("encuentroAccionPanel");
 
    if (!infoPanel || !accionPanel) return;
 
    const nombreZonaUI = zonaSeleccionadaActual
        ? obtenerNombreZonaTraducido(zonaSeleccionadaActual)
        : t("maps_map_fallback");
 
    infoPanel.innerHTML = `
        <h2>${t("maps_area_ready")}</h2>
        <div class="encuentro-nombre-box">
            <h3>${nombreZonaUI}</h3>
        </div>
        <div class="encuentro-datos-grid">
            <div class="dato-mini">
                <span>${t("maps_area")}</span>
                <strong>${nombreZonaUI || "—"}</strong>
            </div>
            <div class="dato-mini">
                <span>${t("maps_status")}</span>
                <strong>${t("maps_free")}</strong>
            </div>
            <div class="dato-mini">
                <span>${t("maps_encounter")}</span>
                <strong>—</strong>
            </div>
        </div>
    `;
 
    accionPanel.innerHTML = `
        <h4>${t("maps_select_ball")}</h4>
        <div class="probabilidad-captura">
            ${t("maps_generate_encounter_hint")}
        </div>
    `;
}
 
function renderPanelAccionEncuentro() {
    const pokeballs = obtenerPokeballsDisponibles(itemsUsuarioMaps);
    const primeraDisponible = obtenerIndicePrimeraDisponible(pokeballs);
    const usuarioLogueado = usuarioAutenticadoMaps();
 
    let itemMarcadoId = null;
 
    if (itemSeleccionadoMaps !== null) {
        const itemGuardado = pokeballs.find(i =>
            Number(i.item_id) === Number(itemSeleccionadoMaps) && Number(i.cantidad) > 0
        );
 
        if (itemGuardado) {
            itemMarcadoId = Number(itemGuardado.item_id);
        }
    }
 
    if (itemMarcadoId === null && primeraDisponible !== -1 && pokeballs[primeraDisponible]) {
        itemMarcadoId = Number(pokeballs[primeraDisponible].item_id);
    }
 
    const htmlBalls = !usuarioLogueado
        ? `<p class="sin-balls">${t("maps_login_balls_text")}</p>`
        : pokeballs.length
            ? pokeballs.map((item) => `
                <label class="ball-option ${item.cantidad <= 0 ? "sin-stock" : ""}">
                    <input
                        type="radio"
                        name="pokeballSeleccionada"
                        value="${item.item_id}"
                        data-nombre="${item.nombre}"
                        ${Number(item.item_id) === Number(itemMarcadoId) ? "checked" : ""}
                        ${item.cantidad <= 0 ? "disabled" : ""}
                    >
                    <div class="ball-option-card">
                        <img src="${obtenerImagenBall(item.nombre)}" alt="${item.nombre}" loading="lazy" decoding="async">
                        <span class="ball-nombre">${item.nombre}</span>
                        <span class="ball-cantidad">x${item.cantidad}</span>
                    </div>
                </label>
            `).join("")
            : `<p class="sin-balls">${t("maps_no_balls")}</p>`;
 
    return `
        <h4>${t("maps_select_ball")}</h4>
 
        <div class="ball-selector-grid">
            ${htmlBalls}
        </div>
 
        <div id="probabilidadCaptura" class="probabilidad-captura">
            ${usuarioLogueado ? `${t("maps_capture_rate")}: —` : t("maps_capture_rate_hidden")}
        </div>
 
        <div class="encuentro-botones">
            <button class="btn-capturar" id="btnCapturarMapa" type="button" ${
                !usuarioLogueado ||
                itemMarcadoId === null ||
                !pokeballs.some(i => Number(i.item_id) === Number(itemMarcadoId) && Number(i.cantidad) > 0)
                    ? "disabled"
                    : ""
            }>
                ${t("maps_catch")}
            </button>
 
            <button class="btn-huir" id="btnHuirMapa" type="button">
                ${t("maps_run")}
            </button>
        </div>
    `;
}
 
function limpiarEncuentroActual() {
    encuentroActual = null;
}
 
function encuentroActualExpiradoMaps() {
    if (!encuentroActual) return false;
 
    if (!encuentroActual.encuentro_token) return true;
 
    const expiraMs = Number(encuentroActual.encuentro_expira_en_ms || 0);
    if (expiraMs > 0 && Date.now() >= expiraMs) {
        return true;
    }
 
    return false;
}
 
function esErrorEncuentroExpiradoMaps(error) {
    const mensaje = String(error?.message || "").toLowerCase();
    return (
        mensaje.includes("encuentro") && (
            mensaje.includes("expir") ||
            mensaje.includes("inválido") ||
            mensaje.includes("invalido") ||
            mensaje.includes("ya no es válido") ||
            mensaje.includes("ya no es valido") ||
            mensaje.includes("token")
        )
    );
}
 
async function intentarCapturaDesdeUI() {
    if (!encuentroActual) {
        mostrarMensajeMaps(t("maps_no_active_encounter"), "warning");
        return;
    }
 
    if (encuentroActualExpiradoMaps()) {
        mostrarMensajeMaps(
            tMaps("maps_encounter_expired", "The encounter expired. Move again to search for a new Pokémon."),
            "warning"
        );
        limpiarEncuentroActual();
        renderPanelDerechoVacio();
        return;
    }
 
    const seleccionada = document.querySelector('input[name="pokeballSeleccionada"]:checked');
 
    if (!seleccionada) {
        mostrarMensajeMaps(t("maps_choose_ball"), "error");
        return;
    }
 
    const itemId = Number(seleccionada.value);
    itemSeleccionadoMaps = itemId;
 
    await intentarCaptura(
        encuentroActual.pokemon_id,
        encuentroActual.nivel,
        encuentroActual.es_shiny,
        encuentroActual.hp,
        encuentroActual.hp_max || encuentroActual.hp,
        itemId,
        encuentroActual.encuentro_token
    );
}
 
async function intentarCaptura(pokemonId, nivel, esShiny, hpActual, hpMaximo, itemId, encuentroToken = null) {
    const usuarioId = getUsuarioIdLocal();
 
    if (!usuarioId) {
        mostrarMensajeMaps(t("maps_login_required"), "error");
        return;
    }
 
    const btnCapturar = document.getElementById("btnCapturarMapa");
    if (btnCapturar) btnCapturar.disabled = true;
 
    try {
        limpiarMensajeMaps();
 
        const data = await fetchAuth(`${API_BASE}/maps/intentar-captura`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_id: usuarioId,
                pokemon_id: Number(pokemonId),
                nivel: Number(nivel),
                es_shiny: !!esShiny,
                hp_actual: Number(hpActual),
                hp_maximo: Number(hpMaximo),
                item_id: Number(itemId),
                encuentro_token: encuentroToken || null
            })
        });
 
        if (data.capturado === true) {
            mostrarModalResultadoCaptura(
                `${data.mensaje || t("maps_capture_success_default")}<br>${t("maps_capture_probability")}: ${data.probabilidad ?? 0}%`,
                "exito"
            );
 
            await Promise.all([
                cargarPokemonUsuarioMaps(),
                cargarItemsUsuarioMaps(true)
            ]);
 
            itemSeleccionadoMaps = itemId;
            limpiarEncuentroActual();
            renderPanelDerechoVacio();
            return;
        }
 
        mostrarModalResultadoCaptura(
            `${data.mensaje || t("maps_capture_escape_default")}<br>${t("maps_capture_used_probability")}: ${data.probabilidad ?? 0}%`,
            "error"
        );
 
        await cargarItemsUsuarioMaps(true);
 
        if (encuentroActual) {
            const accionPanel = document.getElementById("encuentroAccionPanel");
            if (accionPanel) {
                accionPanel.innerHTML = renderPanelAccionEncuentro();
                actualizarProbabilidadVisual(encuentroActual.es_shiny === true);
            }
        }
    } catch (error) {
        console.error("Error al intentar capturar:", error);
 
        if (esErrorEncuentroExpiradoMaps(error)) {
            mostrarMensajeMaps(
                tMaps("maps_encounter_expired", "The encounter expired. Move again to search for a new Pokémon."),
                "warning"
            );
            limpiarEncuentroActual();
            renderPanelDerechoVacio();
        } else {
            mostrarMensajeMaps(error.message || t("maps_capture_error"), "error");
        }
 
        await cargarItemsUsuarioMaps(true);
    } finally {
        const nuevoBtnCapturar = document.getElementById("btnCapturarMapa");
        if (nuevoBtnCapturar) {
            nuevoBtnCapturar.disabled = false;
        }
    }
}
 
/* =========================
   UTILIDADES
========================= */
function obtenerPokeballsDisponibles(items = []) {
    const orden = ["Poke Ball", "Super Ball", "Ultra Ball", "Master Ball"];
 
    return orden
        .map(nombre => items.find(i => i.nombre === nombre))
        .filter(item => item && Number(item.cantidad) > 0);
}
 
function obtenerIndicePrimeraDisponible(items = []) {
    const idx = items.findIndex(i => Number(i.cantidad) > 0);
    return idx >= 0 ? idx : -1;
}
 
function obtenerImagenBall(nombreItem) {
    const imagenes = {
        "Poke Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
        "Super Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
        "Ultra Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png",
        "Master Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png"
    };
 
    return imagenes[nombreItem] || imagenes["Poke Ball"];
}
 
function mostrarMensajeMaps(mensaje, tipo = "ok") {
    const box = document.getElementById("mensajeMaps");
    if (!box) return;
 
    box.textContent = mensaje;
    box.classList.remove("oculto", "ok", "error", "warning");
    box.classList.add(tipo);
}
 
function limpiarMensajeMaps() {
    const box = document.getElementById("mensajeMaps");
    if (!box) return;
 
    box.textContent = "";
    box.classList.add("oculto");
    box.classList.remove("ok", "error", "warning");
}
 
function mostrarModalShiny() {
    const modal = document.getElementById("modalShiny");
    if (modal) modal.classList.remove("oculto");
}
 
function cerrarModalShiny() {
    const modal = document.getElementById("modalShiny");
    if (modal) modal.classList.add("oculto");
}
 
function actualizarProbabilidadVisual(esShiny = false) {
    const seleccionada = document.querySelector('input[name="pokeballSeleccionada"]:checked');
    const box = document.getElementById("probabilidadCaptura");
 
    if (!box) return;
 
    if (!seleccionada) {
        box.textContent = `${t("maps_capture_rate")}: —`;
        return;
    }
 
    const nombre = seleccionada.dataset.nombre;
 
    let prob = 35;
 
    if (nombre === "Poke Ball") prob = 50;
    else if (nombre === "Super Ball") prob = 65;
    else if (nombre === "Ultra Ball") prob = 80;
    else if (nombre === "Master Ball") prob = 100;
 
    if (esShiny && nombre !== "Master Ball") {
        prob -= 10;
    }
 
    prob = Math.max(1, Math.min(prob, 100));
    box.textContent = `${t("maps_capture_rate")}: ${prob}%`;
}
 
function setEstadoMovimiento(cargando, direccion = "") {
    const titulo = document.querySelector(".mapa-exploracion-header p");
 
    actualizarBotonesMovimientoDisponibles(cargando);
 
    if (!titulo) return;
 
    if (cargando) {
        titulo.textContent = direccion
            ? `${t("maps_exploring_direction")} ${traducirDireccion(direccion)}...`
            : tMaps("maps_searching_encounter", "Searching for an encounter...");
    } else if (zonaSeleccionadaActual) {
        titulo.textContent = t("maps_explore_hint");
    }
}
 
function traducirDireccion(direccion = "") {
    const mapa = {
        up: t("maps_dir_up"),
        down: t("maps_dir_down"),
        left: t("maps_dir_left"),
        right: t("maps_dir_right")
    };
 
    return mapa[direccion] || t("maps_dir_zone");
}
 
function mostrarModalResultadoCaptura(mensaje, tipo = "exito") {
    const modal = document.getElementById("modalResultadoCaptura");
    const box = document.getElementById("modalResultadoCapturaBox");
    const deco = document.getElementById("modalResultadoCapturaDeco");
    const titulo = document.getElementById("modalResultadoCapturaTitulo");
    const texto = document.getElementById("modalResultadoCapturaTexto");
 
    if (!modal || !box || !deco || !titulo || !texto) return;
 
    box.classList.remove("exito", "error");
    box.classList.add(tipo);
 
    if (tipo === "exito") {
        deco.textContent = "✨ ✨ ✨";
        titulo.innerHTML = t("maps_capture_success_title");
    } else {
        deco.textContent = "✦ ✦ ✦";
        titulo.innerHTML = t("maps_capture_fail_title");
    }
 
    texto.innerHTML = mensaje;
    modal.classList.remove("oculto");
}
 
function cerrarModalResultadoCaptura() {
    const modal = document.getElementById("modalResultadoCaptura");
    if (modal) {
        modal.classList.add("oculto");
    }
}
 
function cerrarModalesSecundarios() {
    cerrarModalResultadoCaptura();
    cerrarModalShiny();
}
 
async function generarEncuentroInicial() {
    if (!zonaSeleccionadaActual || encuentroActual) return;
    await moverEnMapa("up", { silencioso: true, soloEncuentro: true });
}
 
function scrollAlMapa() {
    const encuentro = document.getElementById("encuentroContainer");
    if (!encuentro) return;
 
    const intentarScroll = (intentosRestantes = 24) => {
        const rect = encuentro.getBoundingClientRect();
        const visible =
            !encuentro.classList.contains("oculto") &&
            encuentro.offsetHeight > 0 &&
            rect.height > 0;
 
        if (visible) {
            encuentro.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
            return;
        }
 
        if (intentosRestantes > 0) {
            requestAnimationFrame(() => intentarScroll(intentosRestantes - 1));
        }
    };
 
    requestAnimationFrame(() => intentarScroll());
}
 
/* =========================
   EXPOSE GLOBAL
========================= */
window.cerrarModalShiny = cerrarModalShiny;
