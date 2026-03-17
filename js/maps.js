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
        }, 120);
    });
});

async function inicializarMaps() {
    mostrarCargaZonas();

    try {
        const usuario = getUsuarioLocal();
        if (usuario && usuario.id != null && !localStorage.getItem("usuario_id")) {
            localStorage.setItem("usuario_id", String(usuario.id));
        }

        await Promise.all([
            cargarZonas(),
            cargarPokemonUsuarioMaps(),
            cargarItemsUsuarioMaps(true)
        ]);

        renderizarZonas();

        if (!zonaSeleccionadaActual && zonasCache.length > 0) {
            zonaSeleccionadaActual = zonasCache[0];
            renderizarZonas();
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
    const nombre = nombreZona.toLowerCase().trim();

    if (nombre.includes("bosque")) return "bosque";
    if (nombre.includes("cueva")) return "cueva";
    if (nombre.includes("lago")) return "lago";
    if (nombre.includes("torre")) return "torre";

    return "default";
}

function obtenerConfigZona(nombreZona = "") {
    const clave = obtenerClaveZona(nombreZona);
    return MAPAS_CONFIG[clave] || MAPAS_CONFIG.default;
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
                    <h3>Cargando...</h3>
                    <p>Preparando zona de exploración...</p>
                    <div class="map-actions">
                        <span class="map-level">Nivel —</span>
                        <button class="btn-map" type="button" disabled>View</button>
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
                <h3>No se pudieron cargar las zonas</h3>
                <p>Verifica que tu backend esté corriendo.</p>
                <div class="map-actions">
                    <button class="btn-map" type="button" onclick="window.location.reload()">Reintentar</button>
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
                    <h3>No hay zonas disponibles</h3>
                    <p>Agrega zonas en la base de datos.</p>
                </div>
            </article>
        `;
        return;
    }

    container.innerHTML = visibles.map(zona => {
        const config = obtenerConfigZona(zona.nombre);
        const activa = zonaSeleccionadaActual && Number(zonaSeleccionadaActual.id) === Number(zona.id);

        return `
            <article class="map-card ${config.clase} ${activa ? "map-card-activa" : ""}">
                <div class="map-img-wrap">
                    <img src="${config.card}" alt="${zona.nombre}" class="map-img" loading="lazy" decoding="async">
                </div>

                <div class="map-info">
                    <h3>${zona.nombre}</h3>
                    <p>${zona.descripcion || "Zona de exploración Pokémon."}</p>

                    <div class="map-actions">
                        <span class="map-level">Nivel ${zona.nivel_min} - ${zona.nivel_max}</span>
                        <button class="btn-map ${activa ? "btn-map-activa" : ""}" type="button" data-zona-id="${zona.id}">
                            View
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
        renderizarZonas();
        limpiarMensajeMaps();
        cerrarModalesSecundarios();
        limpiarEncuentroActual();
        renderBloqueoMapsSinSesion();

        const encuentro = document.getElementById("encuentroContainer");
        if (encuentro) {
            encuentro.classList.remove("oculto");
            scrollAlMapa();
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

    try {
        await cargarItemsUsuarioMaps(true);
    } catch (error) {
        console.warn("No se pudieron refrescar items al seleccionar zona:", error);
    }

    await generarEncuentroInicial();
    scrollAlMapa();
}

function renderizarZonaExploracion() {
    if (!zonaSeleccionadaActual) return;

    const encuentro = document.getElementById("encuentroContainer");
    if (!encuentro) return;

    const config = obtenerConfigZona(zonaSeleccionadaActual.nombre);
    const claseZona = config.clase;

    encuentro.className = "encuentro-box";
    if (claseZona) {
        encuentro.classList.add(claseZona);
    }

    encuentro.innerHTML = `
        <div class="encuentro-layout-mapa">
            <div class="mapa-exploracion-panel">
                <div class="mapa-exploracion-header">
                    <h3>${zonaSeleccionadaActual.nombre}</h3>
                    <p>Usa las flechas para explorar y generar encuentros</p>
                </div>

                <div class="mapa-exploracion-box">
                    <img
                        id="imgMapaExploracion"
                        src="${config.escenario}"
                        alt="${zonaSeleccionadaActual.nombre}"
                        loading="eager"
                        decoding="async"
                    >
                </div>

                <div class="mapa-ui-inferior">
                    <div class="mapa-evento-box">
                        <div class="mapa-evento-titulo">Pokémon que habitan aquí</div>
                        ${renderMiniaturasZona(zonaSeleccionadaActual)}
                    </div>

                    <div class="mapa-movimiento">
                        <button class="move-up" data-move="up" type="button" aria-label="Mover arriba">
                            <img src="img/maps/move/north_able.png" alt="Arriba">
                        </button>

                        <button class="move-left" data-move="left" type="button" aria-label="Mover izquierda">
                            <img src="img/maps/move/west_able.png" alt="Izquierda">
                        </button>

                        <div class="move-center">
                            <img src="img/maps/move/center.png" alt="Centro">
                        </div>

                        <button class="move-right" data-move="right" type="button" aria-label="Mover derecha">
                            <img src="img/maps/move/east_able.png" alt="Derecha">
                        </button>

                        <button class="move-down" data-move="down" type="button" aria-label="Mover abajo">
                            <img src="img/maps/move/south_able.png" alt="Abajo">
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
                <span>Sin Pokémon</span>
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
        mostrarMensajeMaps("Debes iniciar sesión.", "error");
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
            throw new Error(pokemon?.error || "No se pudo generar el encuentro");
        }

        if (!pokemon.pokemon_id) {
            throw new Error("El backend no devolvió un Pokémon válido");
        }

        encuentroActual = {
            pokemon_id: Number(pokemon.pokemon_id),
            nombre: pokemon.nombre || "Pokémon salvaje",
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
        mostrarMensajeMaps(error.message || "No se pudo generar el encuentro.", "error");

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
        <h2>¡Pokémon salvaje encontrado!</h2>

        <div class="encuentro-top-status">
            <div class="captura-indicador-superior ${estadoCaptura.variante}">
                <img 
                    src="${estadoCaptura.imagen}" 
                    class="captura-ball-img ${estadoCaptura.variante === "ninguno" ? "gris" : ""} ${estadoCaptura.variante === "otra-version" ? "dorada" : ""}"
                    alt="Estado captura"
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
                <span>Tipo</span>
                <strong>${encuentroActual.tipo || "—"}</strong>
            </div>
            <div class="dato-mini">
                <span>Nivel</span>
                <strong>${encuentroActual.nivel ?? "—"}</strong>
            </div>
            <div class="dato-mini">
                <span>HP</span>
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
            <h3>Inicia sesión para explorar</h3>
            <p>Debes iniciar sesión con Google para entrar al mapa, moverte y capturar Pokémon.</p>
        </div>
    `;
}

function renderPanelDerechoVacio() {
    const infoPanel = document.getElementById("encuentroInfoPanel");
    const accionPanel = document.getElementById("encuentroAccionPanel");

    if (!infoPanel || !accionPanel) return;

    infoPanel.innerHTML = `
        <h2>Zona lista para explorar</h2>
        <div class="encuentro-nombre-box">
            <h3>${zonaSeleccionadaActual?.nombre || "Mapa"}</h3>
        </div>
        <div class="encuentro-datos-grid">
            <div class="dato-mini">
                <span>Zona</span>
                <strong>${zonaSeleccionadaActual?.nombre || "—"}</strong>
            </div>
            <div class="dato-mini">
                <span>Estado</span>
                <strong>Libre</strong>
            </div>
            <div class="dato-mini">
                <span>Encuentro</span>
                <strong>—</strong>
            </div>
        </div>
    `;

    accionPanel.innerHTML = `
        <h4>Selecciona la Poké Ball</h4>
        <div class="probabilidad-captura">
            Usa las flechas para generar un encuentro salvaje.
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
        ? `<p class="sin-balls">Inicia sesión para usar Poké Balls y capturar Pokémon.</p>`
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
            : `<p class="sin-balls">No tienes Poké Balls disponibles.</p>`;

    return `
        <h4>Selecciona la Poké Ball</h4>

        <div class="ball-selector-grid">
            ${htmlBalls}
        </div>

        <div id="probabilidadCaptura" class="probabilidad-captura">
            ${usuarioLogueado ? "Probabilidad estimada: —" : "Inicia sesión para ver la probabilidad de captura"}
        </div>

        <div class="encuentro-botones">
            <button class="btn-capturar" id="btnCapturarMapa" type="button" ${
                !usuarioLogueado ||
                itemMarcadoId === null ||
                !pokeballs.some(i => Number(i.item_id) === Number(itemMarcadoId) && Number(i.cantidad) > 0)
                    ? "disabled"
                    : ""
            }>
                Capturar
            </button>

            <button class="btn-huir" id="btnHuirMapa" type="button">
                Huir
            </button>
        </div>
    `;
}

function limpiarEncuentroActual() {
    encuentroActual = null;
}

async function intentarCapturaDesdeUI() {
    if (!encuentroActual) {
        mostrarMensajeMaps("No hay ningún encuentro activo.", "warning");
        return;
    }

    const seleccionada = document.querySelector('input[name="pokeballSeleccionada"]:checked');

    if (!seleccionada) {
        mostrarMensajeMaps("Selecciona una Poké Ball.", "error");
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
        mostrarMensajeMaps("Debes iniciar sesión.", "error");
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
                `${data.mensaje || "Pokémon capturado con éxito."}<br>Probabilidad: ${data.probabilidad ?? 0}%`,
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
            `${data.mensaje || "El Pokémon escapó."}<br>Probabilidad usada: ${data.probabilidad ?? 0}%`,
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
        mostrarMensajeMaps(error.message || "Error al intentar capturar el Pokémon.", "error");
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
        box.textContent = "Probabilidad estimada: —";
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
    box.textContent = `Probabilidad estimada: ${prob}%`;
}

function setEstadoMovimiento(cargando, direccion = "") {
    const botones = document.querySelectorAll("[data-move]");
    botones.forEach(btn => {
        btn.disabled = cargando;
    });

    const titulo = document.querySelector(".mapa-exploracion-header p");
    if (!titulo) return;

    if (cargando) {
        titulo.textContent = `Explorando ${traducirDireccion(direccion)}...`;
    } else if (zonaSeleccionadaActual) {
        titulo.textContent = "Usa las flechas para explorar y generar encuentros";
    }
}

function traducirDireccion(direccion = "") {
    const mapa = {
        up: "arriba",
        down: "abajo",
        left: "a la izquierda",
        right: "a la derecha"
    };

    return mapa[direccion] || "la zona";
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
        titulo.innerHTML = "¡Captura<br>exitosa!";
    } else {
        deco.textContent = "✦ ✦ ✦";
        titulo.innerHTML = "No se pudo<br>capturar";
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

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            encuentro.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}

/* =========================
   EXPOSE GLOBAL
========================= */
window.cerrarModalShiny = cerrarModalShiny;