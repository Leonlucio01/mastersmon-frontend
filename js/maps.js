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

const MAPS_ZONAS_CACHE_KEY = "mastersmon_maps_zonas_cache_v2";

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
    inicializarMaps();

    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect && typeof getCurrentLang === "function") {
        languageSelect.value = getCurrentLang();
        languageSelect.addEventListener("change", (e) => {
            setCurrentLang(e.target.value);
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

        if (encuentroActual) {
            renderEncuentroActual();
        } else {
            renderPanelDerechoVacio();
        }
    });

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

    if (!usuarioAutenticadoMaps()) {
        encuentroRequestId++;
        movimientoEnCurso = false;

        renderizarZonas();
        limpiarMensajeMaps();
        cerrarModalesSecundarios();
        limpiarEncuentroActual();
        renderBloqueoMapsSinSesion();

        const encuentro = document.getElementById("encuentroContainer");
        if (encuentro) {
            encuentro.classList.remove("oculto");

            requestAnimationFrame(() => {
                setTimeout(() => {
                    scrollAlMapa();
                }, 120);
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
        }, 120);
    });

    try {
        await cargarItemsUsuarioMaps();
    } catch (error) {
        console.warn("No se pudieron cargar items al seleccionar zona:", error);
    }

    try {
        await generarEncuentroInicial();
    } catch (error) {
        console.error("Error generando encuentro inicial:", error);
    }
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

    const { silencioso = false } = opciones;
    const usuarioId = getUsuarioIdLocal();

    if (!usuarioId) {
        mostrarMensajeMaps(t("maps_login_required"), "error");
        return;
    }

    const requestIdActual = ++encuentroRequestId;
    const zonaIdActual = Number(zonaSeleccionadaActual.id);

    movimientoEnCurso = true;
    cerrarModalesSecundarios();
    setEstadoMovimiento(true, direccion);
    limpiarMensajeMaps();

    if (!encuentroActual && !silencioso) {
        renderPanelDerechoVacio();
    }

    try {
        const pokemon = await fetchJson(`${API_BASE}/maps/encuentro`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(getAccessToken() ? { "Authorization": `Bearer ${getAccessToken()}` } : {})
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
            es_shiny: pokemon.es_shiny === true || pokemon.es_shiny === 1
        };

        if (encuentroActual.es_shiny) {
            mostrarModalShiny();
        }

        renderEncuentroActual();
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

    const imagen = encuentroActual.es_shiny
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${encuentroActual.pokemon_id}.png`
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${encuentroActual.pokemon_id}.png`;

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

async function intentarCapturaDesdeUI() {
    if (!encuentroActual) {
        mostrarMensajeMaps(t("maps_no_active_encounter"), "warning");
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
        encuentroActual.hp,
        itemId
    );
}

async function intentarCaptura(pokemonId, nivel, esShiny, hpActual, hpMaximo, itemId) {
    const usuarioId = getUsuarioIdLocal();

    if (!usuarioId) {
        mostrarMensajeMaps(t("maps_login_required"), "error");
        return;
    }

    const btnCapturar = document.getElementById("btnCapturarMapa");
    if (btnCapturar) btnCapturar.disabled = true;

    try {
        limpiarMensajeMaps();

        const data = await fetchJson(`${API_BASE}/maps/intentar-captura`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(getAccessToken() ? { "Authorization": `Bearer ${getAccessToken()}` } : {})
            },
            body: JSON.stringify({
                usuario_id: usuarioId,
                pokemon_id: Number(pokemonId),
                nivel: Number(nivel),
                es_shiny: !!esShiny,
                hp_actual: Number(hpActual),
                hp_maximo: Number(hpMaximo),
                item_id: Number(itemId)
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

            await generarEncuentroInicial();
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
        mostrarMensajeMaps(error.message || t("maps_capture_error"), "error");
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
    const botones = document.querySelectorAll("[data-move]");
    botones.forEach(btn => {
        btn.disabled = cargando;
    });

    const titulo = document.querySelector(".mapa-exploracion-header p");
    if (!titulo) return;

    if (cargando) {
        titulo.textContent = `${t("maps_exploring_direction")} ${traducirDireccion(direccion)}...`;
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
    const direcciones = ["up", "down", "left", "right"];
    const direccion = direcciones[Math.floor(Math.random() * direcciones.length)];
    await moverEnMapa(direccion, { silencioso: true });
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