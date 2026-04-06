let modoShiny = false;
let pokemonsCapturados = [];
let pokemonsShinyCapturados = [];
let listaPokemonGlobal = [];
let pokedexRenderizada = false;

const POKEDEX_CACHE_KEY = "mastersmon_pokedex_cache";
const POKEDEX_META_KEY = "mastersmon_pokedex_meta";
const EVOLUCION_CACHE_KEY = "mastersmon_evolucion_cache";

let evolucionCacheMemoria = {};
let precargaEvolucionesPromise = null;
let evolucionesPrecargadas = false;

const onboardingIndexState = {
    data: null,
    cargando: false,
};

function tOnboarding(key, fallback, params = {}) {
    try {
        if (typeof t === "function") {
            const valor = t(key, params);
            if (valor && valor !== key) return valor;
        }
    } catch (error) {
        // no-op
    }
    return fallback;
}

function escapeHtmlOnboarding(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function obtenerTextoRecompensaOnboarding(codigo) {
    if (codigo === "capturas") return tOnboarding("onboarding_reward_catch_text", "+5000 Pokédollars and 5 Poké Balls");
    if (codigo === "equipo") return tOnboarding("onboarding_reward_team_text", "+7000 Pokédollars and 2 Great Balls");
    if (codigo === "batalla") return tOnboarding("onboarding_reward_battle_text", "+10000 Pokédollars and 2 Ultra Balls");
    return tOnboarding("onboarding_reward_final_text", "+15000 Pokédollars, 3 Ultra Balls and 2 Super Potions");
}

function obtenerMisionMetaOnboarding(codigo) {
    const mapa = {
        capturas: {
            titulo: tOnboarding("onboarding_mission_catch_title", "Capture 6 Pokémon"),
            texto: tOnboarding("onboarding_mission_catch_text", "Explore Maps and catch your first six Pokémon to start your roster."),
            cta: tOnboarding("onboarding_cta_maps", "Go to Maps"),
            href: "maps.html",
            icono: "🧭"
        },
        equipo: {
            titulo: tOnboarding("onboarding_mission_team_title", "Build your 6-Pokémon team"),
            texto: tOnboarding("onboarding_mission_team_text", "Go to Battle IA and save a full team of 6 Pokémon."),
            cta: tOnboarding("onboarding_cta_battle", "Go to Battle"),
            href: "battle.html",
            icono: "⚔️"
        },
        batalla: {
            titulo: tOnboarding("onboarding_mission_battle_title", "Win your first Battle IA"),
            texto: tOnboarding("onboarding_mission_battle_text", "Defeat your first AI rival battle to complete the starter path."),
            cta: tOnboarding("onboarding_cta_battle", "Go to Battle"),
            href: "battle.html",
            icono: "🏆"
        }
    };

    return mapa[codigo] || {
        titulo: codigo,
        texto: codigo,
        cta: tOnboarding("onboarding_cta_collection", "Open Collection"),
        href: "mypokemon.html",
        icono: "⭐"
    };
}

function renderizarOnboardingIndex() {
    const section = document.getElementById("starterJourneySection");
    const grid = document.getElementById("starterJourneyGrid");
    const title = document.getElementById("starterJourneyTitle");
    const text = document.getElementById("starterJourneyText");
    const progressValue = document.getElementById("starterJourneyProgressValue");
    const progressPercent = document.getElementById("starterJourneyProgressPercent");
    const finalStatus = document.getElementById("starterFinalRewardStatus");
    const finalTitle = document.getElementById("starterFinalRewardTitle");
    const liveRewards = document.getElementById("starterJourneyLiveRewards");

    if (!section || !grid || !title || !text || !progressValue || !progressPercent || !finalStatus || !finalTitle || !liveRewards) return;

    const data = onboardingIndexState.data;

    const onboardingCompletado = Boolean(data?.tutorial_completado && data?.recompensa_final?.reclamada);

    if (!usuarioAutenticado() || !data?.habilitado || onboardingCompletado) {
        section.classList.add("oculto");
        grid.innerHTML = "";
        liveRewards.classList.add("oculto");
        liveRewards.innerHTML = "";
        return;
    }

    section.classList.remove("oculto");

    title.textContent = data.tutorial_completado
        ? tOnboarding("onboarding_complete_title", "Starter Journey completed")
        : tOnboarding("onboarding_panel_title", "Complete your first steps");
    text.textContent = data.tutorial_completado
        ? tOnboarding("onboarding_complete_text", "You already cleared the onboarding path and claimed the welcome rewards.")
        : tOnboarding("onboarding_panel_text", "Capture Pokémon, build your team, and win your first Battle IA to unlock onboarding rewards.");

    const completadas = Number(data?.progreso?.completadas || 0);
    const total = Number(data?.progreso?.total || 3);
    progressValue.textContent = `${completadas} / ${total}`;
    progressPercent.textContent = `${Number(data?.progreso?.porcentaje || 0)}%`;

    const recompensasRecientes = Array.isArray(data?.recompensas_aplicadas) ? data.recompensas_aplicadas : [];
    if (recompensasRecientes.length > 0) {
        liveRewards.classList.remove("oculto");
        liveRewards.innerHTML = `
            <strong>${escapeHtmlOnboarding(tOnboarding("onboarding_recent_rewards_title", "Rewards added to your account"))}</strong><br>
            ${recompensasRecientes.map(recompensa => {
                const textoItems = Array.isArray(recompensa.items)
                    ? recompensa.items.map(item => `${Number(item.cantidad || 0)}x ${escapeHtmlOnboarding(item.nombre || item.item_codigo || "Item")}`).join(", ")
                    : "";
                const textoPokedolares = Number(recompensa.pokedolares || 0) > 0
                    ? `+${Number(recompensa.pokedolares || 0)} Pokédollars`
                    : "";
                return [textoPokedolares, textoItems].filter(Boolean).join(" · ");
            }).join("<br>")}
        `;
    } else {
        liveRewards.classList.add("oculto");
        liveRewards.innerHTML = "";
    }

    const misiones = Array.isArray(data?.misiones) ? data.misiones : [];
    grid.innerHTML = misiones.map(mision => {
        const meta = obtenerMisionMetaOnboarding(mision.codigo);
        const completada = Boolean(mision.completada);
        const estadoTexto = completada
            ? tOnboarding("onboarding_completed_label", "Completed")
            : tOnboarding("onboarding_pending_label", "Pending");
        const rewardText = obtenerTextoRecompensaOnboarding(mision.codigo);
        const progresoTexto = `${Number(mision.actual || 0)} / ${Number(mision.objetivo || 0)}`;

        return `
            <article class="starter-mission-card ${completada ? "is-complete" : ""}">
                <div class="starter-mission-top">
                    <span class="starter-mission-chip ${completada ? "is-complete" : "is-pending"}">${escapeHtmlOnboarding(estadoTexto)}</span>
                    <div class="starter-mission-icon">${meta.icono}</div>
                </div>
                <h3>${escapeHtmlOnboarding(meta.titulo)}</h3>
                <p>${escapeHtmlOnboarding(meta.texto)}</p>
                <div class="starter-mission-progress">
                    <span>${escapeHtmlOnboarding(tOnboarding("onboarding_progress_label", "Progress"))}</span>
                    <strong>${escapeHtmlOnboarding(progresoTexto)}</strong>
                </div>
                <div class="starter-mission-reward">
                    <strong>${escapeHtmlOnboarding(tOnboarding("onboarding_reward_label", "Reward"))}</strong>
                    <span>${escapeHtmlOnboarding(rewardText)}</span>
                </div>
                <div class="starter-mission-actions">
                    ${completada
                        ? `<span class="starter-mission-link">${escapeHtmlOnboarding(tOnboarding("onboarding_done_cta", "Completed"))}</span>`
                        : `<a class="starter-mission-link" href="${escapeHtmlOnboarding(meta.href)}">${escapeHtmlOnboarding(meta.cta)}</a>`}
                </div>
            </article>
        `;
    }).join("");

    const finalReclamada = Boolean(data?.recompensa_final?.reclamada);
    finalTitle.textContent = tOnboarding("onboarding_final_reward_text", "Complete the 3 missions to unlock an extra welcome reward.");
    finalStatus.textContent = finalReclamada
        ? tOnboarding("onboarding_final_reward_claimed", "Claimed")
        : tOnboarding("onboarding_final_reward_pending", "In progress");
}

function abrirModalOnboardingIndex() {
    const modal = document.getElementById("starterJourneyModal");
    if (!modal) return;
    modal.classList.remove("oculto");
    modal.setAttribute("aria-hidden", "false");
}

function cerrarModalOnboardingIndex() {
    const modal = document.getElementById("starterJourneyModal");
    if (!modal) return;
    modal.classList.add("oculto");
    modal.setAttribute("aria-hidden", "true");
}

async function cargarOnboardingIndex({ forzar = false } = {}) {
    if (!usuarioAutenticado()) {
        onboardingIndexState.data = null;
        onboardingIndexState.cargando = false;
        renderizarOnboardingIndex();
        cerrarModalOnboardingIndex();
        return null;
    }

    if (onboardingIndexState.cargando && !forzar) {
        return onboardingIndexState.data;
    }

    onboardingIndexState.cargando = true;
    try {
        const data = await obtenerOnboardingActual();
        onboardingIndexState.data = data && typeof data === "object" ? data : null;
        renderizarOnboardingIndex();

        if (onboardingIndexState.data?.habilitado && !onboardingIndexState.data?.bienvenida_mostrada && !onboardingIndexState.data?.tutorial_completado) {
            abrirModalOnboardingIndex();
        } else {
            cerrarModalOnboardingIndex();
        }

        return onboardingIndexState.data;
    } catch (error) {
        console.error("Error cargando onboarding:", error);
        onboardingIndexState.data = { ok: false, habilitado: false, mensaje: tOnboarding("onboarding_reset_error", "Could not load the onboarding journey.") };
        renderizarOnboardingIndex();
        cerrarModalOnboardingIndex();
        return onboardingIndexState.data;
    } finally {
        onboardingIndexState.cargando = false;
    }
}

async function marcarBienvenidaOnboardingIndexYcerrar(scrollPanel = false) {
    try {
        if (usuarioAutenticado()) {
            const data = await marcarBienvenidaOnboardingVista(true);
            if (data && typeof data === "object") {
                onboardingIndexState.data = data;
            }
        }
    } catch (error) {
        console.warn("No se pudo marcar la bienvenida del onboarding:", error);
    } finally {
        renderizarOnboardingIndex();
        cerrarModalOnboardingIndex();

        if (scrollPanel) {
            const section = document.getElementById("starterJourneySection");
            if (section) {
                section.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    }
}

function configurarEventosOnboardingIndex() {
    const btnStart = document.getElementById("starterJourneyModalStart");
    const modal = document.getElementById("starterJourneyModal");

    if (btnStart) {
        btnStart.addEventListener("click", () => {
            marcarBienvenidaOnboardingIndexYcerrar(true);
        });
    }

    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                event.preventDefault();
            }
        });
    }
}

function usuarioAutenticado() {
    return !!getAccessToken();
}

function obtenerImagenItemEvolucion(nombreItem) {
    const alias = {
        "Piedra Fuego": { itemCode: "fire-stone", itemName: "Fire Stone" },
        "Piedra Agua": { itemCode: "water-stone", itemName: "Water Stone" },
        "Piedra Trueno": { itemCode: "thunder-stone", itemName: "Thunder Stone" },
        "Piedra Hoja": { itemCode: "leaf-stone", itemName: "Leaf Stone" },
        "Piedra Lunar": { itemCode: "moon-stone", itemName: "Moon Stone" },
        "Piedra Sol": { itemCode: "sun-stone", itemName: "Sun Stone" },
        "Piedra Día": { itemCode: "dawn-stone", itemName: "Dawn Stone" },
        "Piedra Noche": { itemCode: "dusk-stone", itemName: "Dusk Stone" },
        "Piedra Brillo": { itemCode: "shiny-stone", itemName: "Shiny Stone" },
        "Piedra Hielo": { itemCode: "ice-stone", itemName: "Ice Stone" }
    };

    const data = alias[String(nombreItem || "").trim()] || {
        itemName: nombreItem,
        itemCode: nombreItem
    };

    if (typeof obtenerRutaItemLocalSeguro === "function") {
        return obtenerRutaItemLocalSeguro({
            itemCode: data.itemCode,
            itemName: data.itemName,
            fallback: "img/items/official/0004_poke-ball.png"
        });
    }

    const fallbackMap = {
        "fire-stone": "img/items/official/0082_fire-stone.png",
        "water-stone": "img/items/official/0084_water-stone.png",
        "thunder-stone": "img/items/official/0083_thunder-stone.png",
        "leaf-stone": "img/items/official/0085_leaf-stone.png",
        "moon-stone": "img/items/official/0081_moon-stone.png",
        "sun-stone": "img/items/official/0080_sun-stone.png",
        "dawn-stone": "img/items/official/0109_dawn-stone.png",
        "dusk-stone": "img/items/official/0108_dusk-stone.png",
        "shiny-stone": "img/items/official/0107_shiny-stone.png",
        "ice-stone": "img/items/official/0004_poke-ball.png"
    };

    return fallbackMap[data.itemCode] || "img/items/official/0004_poke-ball.png";
}

function mostrarCargaPokedex() {
    const pokedex = document.getElementById("pokedex");
    if (!pokedex) return;

    let skeletons = "";
    for (let i = 0; i < 12; i++) {
        skeletons += `
            <div class="card skeleton-card">
                <div class="skeleton-title"></div>
                <div class="skeleton-image"></div>
                <div class="skeleton-pill"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
            </div>
        `;
    }

    pokedex.innerHTML = skeletons;
}

function mostrarErrorPokedex() {
    const pokedex = document.getElementById("pokedex");
    if (!pokedex) return;

    pokedex.innerHTML = `
        <div class="pokedex-error">
            <p>${t("pokedex_error_load")}</p>
            <button id="btnReintentarPokedex" type="button">${t("pokedex_retry")}</button>
        </div>
    `;

    const btn = document.getElementById("btnReintentarPokedex");
    if (btn) {
        btn.addEventListener("click", () => cargarPokedex({ forzarPokemon: true }));
    }
}

function guardarCachePokedex(lista, meta) {
    try {
        sessionStorage.setItem(POKEDEX_CACHE_KEY, JSON.stringify(lista));
        sessionStorage.setItem(POKEDEX_META_KEY, JSON.stringify(meta));
    } catch (error) {
        console.warn("No se pudo guardar cache de Pokédex:", error);
    }
}

function leerCachePokedex() {
    try {
        const raw = sessionStorage.getItem(POKEDEX_CACHE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;

        return parsed;
    } catch (error) {
        console.warn("No se pudo leer cache de Pokédex:", error);
        return null;
    }
}

function leerMetaPokedex() {
    try {
        const raw = sessionStorage.getItem(POKEDEX_META_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;

        return parsed;
    } catch (error) {
        console.warn("No se pudo leer meta de Pokédex:", error);
        return null;
    }
}

function limpiarCachePokedex() {
    try {
        sessionStorage.removeItem(POKEDEX_CACHE_KEY);
        sessionStorage.removeItem(POKEDEX_META_KEY);
    } catch (error) {
        console.warn("No se pudo limpiar cache de Pokédex:", error);
    }
}

function leerCacheEvoluciones() {
    try {
        const raw = sessionStorage.getItem(EVOLUCION_CACHE_KEY);
        if (!raw) return {};

        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
        console.warn("No se pudo leer cache de evoluciones:", error);
        return {};
    }
}

function guardarCacheEvoluciones() {
    try {
        sessionStorage.setItem(EVOLUCION_CACHE_KEY, JSON.stringify(evolucionCacheMemoria));
    } catch (error) {
        console.warn("No se pudo guardar cache de evoluciones:", error);
    }
}

async function obtenerDetalleEvolucionConCache(id) {
    const clave = String(id);

    if (Object.prototype.hasOwnProperty.call(evolucionCacheMemoria, clave)) {
        return evolucionCacheMemoria[clave];
    }

    const data = await obtenerDetalleEvolucion(id);
    evolucionCacheMemoria[clave] = Array.isArray(data) ? data : [];
    guardarCacheEvoluciones();

    return evolucionCacheMemoria[clave];
}

async function precargarEvolucionesGlobal() {
    if (evolucionesPrecargadas) return;
    if (precargaEvolucionesPromise) return precargaEvolucionesPromise;

    precargaEvolucionesPromise = (async () => {
        try {
            const data = await obtenerEvolucionesCacheGlobal();

            if (data && typeof data === "object") {
                evolucionCacheMemoria = {
                    ...evolucionCacheMemoria,
                    ...data
                };
                guardarCacheEvoluciones();
            }

            evolucionesPrecargadas = true;
        } catch (error) {
            console.warn("No se pudo precargar evoluciones:", error);
        } finally {
            precargaEvolucionesPromise = null;
        }
    })();

    return precargaEvolucionesPromise;
}

function metaCambio(metaNueva, metaGuardada) {
    if (!metaNueva || !metaGuardada) return true;

    return (
        Number(metaNueva.total_pokemon) !== Number(metaGuardada.total_pokemon) ||
        Number(metaNueva.max_id) !== Number(metaGuardada.max_id)
    );
}

async function cargarPokemonUsuario() {
    if (!usuarioAutenticado()) {
        pokemonsCapturados = [];
        pokemonsShinyCapturados = [];
        return;
    }

    try {
        const data = await obtenerPokemonUsuarioActual();

        pokemonsCapturados = [
            ...new Set(data.filter(p => !p.es_shiny).map(p => Number(p.pokemon_id)))
        ];

        pokemonsShinyCapturados = [
            ...new Set(data.filter(p => p.es_shiny).map(p => Number(p.pokemon_id)))
        ];
    } catch (error) {
        console.error("Error cargando Pokémon del usuario:", error);
        pokemonsCapturados = [];
        pokemonsShinyCapturados = [];
    }
}

async function cargarEstadoCapturas() {
    await cargarPokemonUsuario();
    actualizarVisualPokeballs();
    actualizarImagenesPokemon();
    aplicarFiltrosVisuales();
}

window.cargarEstadoCapturas = cargarEstadoCapturas;

function actualizarTextoBotonShiny() {
    const btnShiny = document.getElementById("modoShiny");
    if (!btnShiny) return;

    btnShiny.textContent = modoShiny
        ? t("pokedex_shiny_on")
        : t("pokedex_shiny_off");
}

function normalizarTipoFiltroPokedex(valor = "") {
    const limpio = String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");

    const mapa = {
        normal: "normal",
        fuego: "fire",
        fire: "fire",
        agua: "water",
        water: "water",
        planta: "grass",
        grass: "grass",
        electrico: "electric",
        electric: "electric",
        hielo: "ice",
        ice: "ice",
        lucha: "fighting",
        fighting: "fighting",
        veneno: "poison",
        poison: "poison",
        tierra: "ground",
        ground: "ground",
        volador: "flying",
        flying: "flying",
        psiquico: "psychic",
        psychic: "psychic",
        bicho: "bug",
        bug: "bug",
        roca: "rock",
        rock: "rock",
        fantasma: "ghost",
        ghost: "ghost",
        dragon: "dragon",
        acero: "steel",
        steel: "steel",
        hada: "fairy",
        fairy: "fairy",
        siniestro: "dark",
        oscuro: "dark",
        dark: "dark"
    };

    return mapa[limpio] || limpio;
}

function aplicarFiltrosVisuales() {
    const buscador = document.getElementById("buscarPokemon");
    const filtroTipo = document.getElementById("filtroTipo");
    const filtroGeneracion = document.getElementById("filtroGeneracion");
    const cards = document.querySelectorAll(".card");

    const texto = buscador ? buscador.value.toLowerCase().trim() : "";
    const tipo = filtroTipo ? filtroTipo.value.toLowerCase().trim() : "";
    const generacion = filtroGeneracion ? filtroGeneracion.value.trim() : "";

    cards.forEach(card => {
        const nombre = (card.dataset.nombre || "").toLowerCase();
        const tipoPokemonRaw = String(card.dataset.tipo || "");
        const generacionPokemon = String(card.dataset.generacion || "").trim();

        const tiposNormalizados = tipoPokemonRaw
            .split("/")
            .map(parte => normalizarTipoFiltroPokedex(parte))
            .filter(Boolean);

        const tipoFiltroNormalizado = normalizarTipoFiltroPokedex(tipo);

        const coincideNombre = nombre.includes(texto);
        const coincideTipo = tipo === "" || tiposNormalizados.includes(tipoFiltroNormalizado);
        const coincideGeneracion = generacion === "" || generacionPokemon === generacion;

        card.style.display = (coincideNombre && coincideTipo && coincideGeneracion) ? "flex" : "none";
    });
}

function actualizarVisualPokeballs() {
    document.querySelectorAll(".card").forEach(card => {
        const id = Number(card.dataset.id);
        const pokeball = card.querySelector(".pokeball-captura");

        if (!pokeball) return;

        const capturadoNormal = pokemonsCapturados.includes(id);
        const capturadoShiny = pokemonsShinyCapturados.includes(id);
        const mostrarCaptura = modoShiny ? capturadoShiny : capturadoNormal;

        pokeball.classList.toggle("capturado", mostrarCaptura);
        pokeball.classList.toggle("no-capturado", !mostrarCaptura);
    });
}

function actualizarImagenesPokemon() {
    document.querySelectorAll(".card").forEach(card => {
        const id = Number(card.dataset.id);
        const img = card.querySelector(".pokemon-img");
        if (!img) return;

        img.src = obtenerImagenPokemon(id, modoShiny);
    });
}

function renderizarPokedex() {
    const pokedex = document.getElementById("pokedex");
    if (!pokedex) return;

    let html = "";
    for (const pokemon of listaPokemonGlobal) {
        html += crearCardPokemon(pokemon);
    }

    pokedex.innerHTML = html;
    pokedexRenderizada = true;
    aplicarFiltrosVisuales();
    actualizarVisualPokeballs();
}

async function cargarPokedex({ forzarPokemon = false } = {}) {
    const pokedex = document.getElementById("pokedex");
    if (!pokedex) return;

    const cacheGuardado = leerCachePokedex();
    const metaGuardada = leerMetaPokedex();

    if (!forzarPokemon && cacheGuardado && cacheGuardado.length > 0) {
        listaPokemonGlobal = cacheGuardado;

        if (!pokedexRenderizada) {
            renderizarPokedex();
        } else {
            actualizarImagenesPokemon();
            aplicarFiltrosVisuales();
        }
    } else if (!pokedexRenderizada || forzarPokemon) {
        mostrarCargaPokedex();
    }

    try {
        const promesaUsuario = cargarPokemonUsuario();
        const promesaMeta = obtenerPokemonMeta();

        const [, metaActual] = await Promise.all([promesaUsuario, promesaMeta]);

        if (!cacheGuardado || cacheGuardado.length === 0 || forzarPokemon) {
            listaPokemonGlobal = await obtenerPokemon();

            if (metaActual) {
                guardarCachePokedex(listaPokemonGlobal, metaActual);
            }

            renderizarPokedex();
            return;
        }

        if (!metaActual || !metaGuardada || metaCambio(metaActual, metaGuardada)) {
            listaPokemonGlobal = await obtenerPokemon();

            if (metaActual) {
                guardarCachePokedex(listaPokemonGlobal, metaActual);
            }

            renderizarPokedex();
            return;
        }

        actualizarVisualPokeballs();
        actualizarImagenesPokemon();
        aplicarFiltrosVisuales();
    } catch (error) {
        console.error("Error cargando pokedex:", error);

        if (!cacheGuardado || cacheGuardado.length === 0) {
            mostrarErrorPokedex();
        }
    }
}

function construirHtmlEvolucion(id, nombre, evoluciones) {
    let htmlEvolucion = "";

    if (evoluciones && evoluciones.length > 0) {
        const actualImg = obtenerImagenPokemon(id, modoShiny);

        if (evoluciones.length === 1 && evoluciones[0].tipo_metodo === "nivel") {
            const e = evoluciones[0];
            const evoImg = obtenerImagenPokemon(e.evolucion_id, modoShiny);

            let metodo = "";
            if (e.tipo_metodo === "nivel") {
                metodo = `Nivel ${e.nivel}`;
            } else if (e.tipo_metodo === "item") {
                metodo = e.item_nombre;
            }

            const imagenItem = e.item_nombre ? obtenerImagenItemEvolucion(e.item_nombre) : "";

            htmlEvolucion = `
                <div class="cadena-evolucion">
                    <div class="evo-item evo-actual">
                        <img src="${actualImg}" alt="${nombre}" loading="lazy" decoding="async">
                        <span>${nombre}</span>
                        <small>Actual</small>
                    </div>

                    <div class="evo-flecha">→</div>

                    <div class="evo-item">
                        <img src="${evoImg}" alt="${e.evolucion_nombre}" loading="lazy" decoding="async">
                        <span>${e.evolucion_nombre}</span>
                        ${
                            e.tipo_metodo === "item"
                                ? `
                                    <div class="metodo-evolucion-item">
                                        <img src="${imagenItem}" alt="${e.item_nombre}" loading="lazy" decoding="async">
                                        <span>${e.item_nombre}</span>
                                    </div>
                                `
                                : `<small>${metodo}</small>`
                        }
                    </div>
                </div>
            `;
        } else {
            htmlEvolucion = `
                <div class="evolucion-grid">
                    ${evoluciones.map(e => {
                        const evoImg = obtenerImagenPokemon(e.evolucion_id, modoShiny);

                        const imagenItem = e.item_nombre
                            ? obtenerImagenItemEvolucion(e.item_nombre)
                            : "";

                        let metodoHtml = "";

                        if (e.tipo_metodo === "item") {
                            metodoHtml = `
                                <div class="evo-metodo">
                                    <img src="${imagenItem}" alt="${e.item_nombre}" loading="lazy" decoding="async">
                                    <span>${e.item_nombre}</span>
                                </div>
                            `;
                        } else if (e.tipo_metodo === "nivel") {
                            metodoHtml = `<small class="evo-nivel">Nivel ${e.nivel}</small>`;
                        }

                        return `
                            <div class="evo-card">
                                <img src="${evoImg}" alt="${e.evolucion_nombre}" loading="lazy" decoding="async">
                                <span class="evo-nombre">${e.evolucion_nombre}</span>
                                ${metodoHtml}
                            </div>
                        `;
                    }).join("")}
                </div>
            `;
        }
    } else {
        htmlEvolucion = `
            <div class="sin-evolucion-box">
                <p>Este Pokémon no tiene evolución registrada.</p>
            </div>
        `;
    }

    return htmlEvolucion;
}

window.mostrarDetalle = async function(id, nombre, tipo, ataque, defensa, hp) {
    try {
        const imagen = obtenerImagenPokemon(id, modoShiny);
        const detalle = document.getElementById("contenidoDetalle");
        const modal = document.getElementById("detallePokemon");

        if (!detalle || !modal) return;

        const cacheExiste = Object.prototype.hasOwnProperty.call(evolucionCacheMemoria, String(id));
        const htmlInicialEvolucion = cacheExiste
            ? construirHtmlEvolucion(id, nombre, evolucionCacheMemoria[String(id)])
            : `
                <div class="sin-evolucion-box">
                    <p>Cargando evolución...</p>
                </div>
            `;

        detalle.innerHTML = `
            <div class="detalle-pokemon-moderno">
                <div class="detalle-header">
                    <h2>#${id} ${nombre}</h2>
                </div>

                <div class="detalle-imagen-box">
                    <img class="imgPrincipal" src="${imagen}" alt="${nombre}" loading="lazy" decoding="async">
                </div>

                <div class="detalle-info-box">
                    <div class="tipo tipo-detalle" data-tipo="${tipo}">${typeof traducirTipoPokemon === "function" ? traducirTipoPokemon(tipo) : tipo}</div>

                    <div class="stats-detalle-grid">
                        <div class="stat-detalle-card">
                            <span>Ataque</span>
                            <strong>${ataque}</strong>
                        </div>
                        <div class="stat-detalle-card">
                            <span>Defensa</span>
                            <strong>${defensa}</strong>
                        </div>
                        <div class="stat-detalle-card">
                            <span>HP</span>
                            <strong>${hp}</strong>
                        </div>
                    </div>
                </div>

                <div class="detalle-evolucion-section">
                    <h3>Métodos de evolución</h3>
                    <div id="evolucionContenidoDetalle">
                        ${htmlInicialEvolucion}
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove("oculto");
        document.body.classList.add("modal-abierto");

        if (!cacheExiste) {
            const evoluciones = await obtenerDetalleEvolucionConCache(id);
            const contenedorEvolucion = document.getElementById("evolucionContenidoDetalle");
            if (!contenedorEvolucion) return;

            contenedorEvolucion.innerHTML = construirHtmlEvolucion(id, nombre, evoluciones);
        }
    } catch (error) {
        console.error("Error mostrando detalle:", error);
        alert("No se pudo mostrar el detalle del Pokémon");
    }
};

window.cerrarDetalle = function() {
    const modal = document.getElementById("detallePokemon");
    if (modal) modal.classList.add("oculto");
    document.body.classList.remove("modal-abierto");
};

window.limpiarCachePokedex = limpiarCachePokedex;
window.cargarPokedex = cargarPokedex;
window.limpiarCacheEvoluciones = function() {
    evolucionCacheMemoria = {};
    evolucionesPrecargadas = false;
    try {
        sessionStorage.removeItem(EVOLUCION_CACHE_KEY);
    } catch (error) {
        console.warn("No se pudo limpiar cache de evoluciones:", error);
    }
};

window.onclick = function(event) {
    const modal = document.getElementById("detallePokemon");
    if (modal && event.target === modal) {
        cerrarDetalle();
    }
};

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        cerrarDetalle();
    }
});

document.addEventListener("usuarioSesionActualizada", async () => {
    await cargarEstadoCapturas();
    await cargarOnboardingIndex({ forzar: true });
});

document.addEventListener("DOMContentLoaded", async () => {
    evolucionCacheMemoria = leerCacheEvoluciones();
    evolucionesPrecargadas = Object.keys(evolucionCacheMemoria).length > 0;

    const buscador = document.getElementById("buscarPokemon");
    const filtroTipo = document.getElementById("filtroTipo");
    const filtroGeneracion = document.getElementById("filtroGeneracion");
    const btnShiny = document.getElementById("modoShiny");
    const pokedex = document.getElementById("pokedex");

    configurarEventosOnboardingIndex();

    if (buscador) {
        buscador.addEventListener("input", aplicarFiltrosVisuales);
    }

    if (filtroTipo) {
        filtroTipo.addEventListener("change", aplicarFiltrosVisuales);
    }

    if (filtroGeneracion) {
        filtroGeneracion.addEventListener("change", aplicarFiltrosVisuales);
    }

    if (btnShiny) {
        btnShiny.addEventListener("click", function() {
            modoShiny = !modoShiny;

            actualizarTextoBotonShiny();
            actualizarImagenesPokemon();
            actualizarVisualPokeballs();
            aplicarFiltrosVisuales();
        });
    }

    document.addEventListener("languageChanged", () => {
        if (typeof applyTranslations === "function") {
            applyTranslations();
        }

        actualizarTextoBotonShiny();
        renderizarOnboardingIndex();

        if (listaPokemonGlobal.length > 0) {
            renderizarPokedex();
        } else {
            aplicarFiltrosVisuales();
            actualizarVisualPokeballs();
            actualizarImagenesPokemon();
        }
    });

    if (pokedex) {
        pokedex.addEventListener("click", async function(event) {
            const card = event.target.closest(".card");
            if (!card) return;

            const id = Number(card.dataset.id);
            const pokemon = listaPokemonGlobal.find(p => Number(p.id) === id);
            if (!pokemon) return;

            if (!evolucionesPrecargadas && !precargaEvolucionesPromise) {
                await precargarEvolucionesGlobal();
            } else if (precargaEvolucionesPromise) {
                await precargaEvolucionesPromise;
            }

            mostrarDetalle(
                pokemon.id,
                pokemon.nombre,
                pokemon.tipo,
                pokemon.ataque,
                pokemon.defensa,
                pokemon.hp
            );
        });
    }

    if (typeof applyTranslations === "function") {
        applyTranslations();
    }

    actualizarTextoBotonShiny();

    await cargarPokedex();
    await cargarOnboardingIndex({ forzar: true });
    await precargarEvolucionesGlobal();
});
