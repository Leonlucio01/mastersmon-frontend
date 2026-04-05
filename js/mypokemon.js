let misPokemonData = [];
let usuarioActualMyPokemon = null;
let pokemonPendienteSoltar = null;
let estadosEvolucionCache = new Map();
let modalEvolucionActual = null;
let modalMovimientosActual = null;
let cargandoMyPokemonEnCurso = false;
let avatarActualizandoMyPokemon = false;
let equipandoMovimientoEnCurso = false;
let movimientosPokemonCache = new Map();
let avatarCarruselInicio = 0;
let beneficiosActivosMyPokemon = [];
let boosterActivandoCodigo = "";

const MY_POKEMON_CACHE_KEY = "mastersmon_mypokemon_cache";
const MY_POKEMON_ITEMS_CACHE_KEY = "mastersmon_mypokemon_items_cache";
const MY_POKEMON_RESUMEN_CACHE_KEY = "mastersmon_mypokemon_resumen_cache";
const MY_POKEMON_BENEFITS_CACHE_KEY = "mastersmon_mypokemon_benefits_cache";
const MY_POKEMON_AVATAR_DEFAULT = "goku";
const MY_POKEMON_AVATAR_REGEX = /^[a-z0-9_-]{1,60}$/;
const AVATARES_VISIBLES_POR_VISTA = 7;

const AVATARES_DISPONIBLES = [
    { id: "batman", nombre: "Batman" },
    { id: "bryan", nombre: "Bryan" },
    { id: "goku", nombre: "Goku" },
    { id: "hades", nombre: "Hades" },
    { id: "jean", nombre: "Jean" },
    { id: "jhonny", nombre: "Jhonny" },
    { id: "leon", nombre: "Leon" },
    { id: "nathaly", nombre: "Nathaly" },
    { id: "rafael", nombre: "Rafael" }
];

function usuarioAutenticadoMyPokemon() {
    return !!getAccessToken();
}

function leerCacheJSON(clave, defecto = null) {
    try {
        const raw = sessionStorage.getItem(clave);
        return raw ? JSON.parse(raw) : defecto;
    } catch (error) {
        console.warn(`No se pudo leer cache ${clave}:`, error);
        return defecto;
    }
}

function guardarCacheJSON(clave, valor) {
    try {
        sessionStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
        console.warn(`No se pudo guardar cache ${clave}:`, error);
    }
}

function limpiarCacheMyPokemon() {
    try {
        sessionStorage.removeItem(MY_POKEMON_CACHE_KEY);
        sessionStorage.removeItem(MY_POKEMON_ITEMS_CACHE_KEY);
        sessionStorage.removeItem(MY_POKEMON_RESUMEN_CACHE_KEY);
        sessionStorage.removeItem(MY_POKEMON_BENEFITS_CACHE_KEY);
    } catch (error) {
        console.warn("No se pudo limpiar cache My Pokemon:", error);
    }

    movimientosPokemonCache.clear();
}

function reemplazarParametrosTexto(texto, params = {}) {
    return String(texto || "").replace(/\{(\w+)\}/g, (_, key) => {
        return params[key] !== undefined ? String(params[key]) : `{${key}}`;
    });
}

function tMyPokemon(key, fallback, params = {}) {
    if (typeof t === "function") {
        const valor = t(key, params);
        if (valor && valor !== key) {
            return valor;
        }
    }
    return reemplazarParametrosTexto(fallback, params);
}

function normalizarAvatarIdMyPokemon(avatarId) {
    const valor = String(avatarId || "").trim().toLowerCase();
    if (!valor || !MY_POKEMON_AVATAR_REGEX.test(valor)) {
        return MY_POKEMON_AVATAR_DEFAULT;
    }
    return valor;
}

function obtenerNombreAvatarVisual(avatarId) {
    const normalizado = normalizarAvatarIdMyPokemon(avatarId);
    const encontrado = AVATARES_DISPONIBLES.find(a => a.id === normalizado);
    if (encontrado) return encontrado.nombre;

    return normalizado
        .replaceAll("_", " ")
        .replace(/\b\w/g, letra => letra.toUpperCase());
}

function obtenerRutaAvatarMyPokemon(avatarId) {
    return `img/avatars/${normalizarAvatarIdMyPokemon(avatarId)}.png`;
}

function normalizarUsuarioMyPokemon(usuario) {
    if (!usuario || typeof usuario !== "object") return null;
    return {
        ...usuario,
        avatar_id: normalizarAvatarIdMyPokemon(usuario.avatar_id || getAvatarIdLocal())
    };
}

function obtenerAvatarActualUsuarioMyPokemon() {
    const usuario = normalizarUsuarioMyPokemon(usuarioActualMyPokemon || getUsuarioLocal());
    return normalizarAvatarIdMyPokemon(usuario?.avatar_id || getAvatarIdLocal());
}

function totalAvataresDisponibles() {
    return AVATARES_DISPONIBLES.length;
}

function normalizarIndiceCarruselAvatar(indice, total = totalAvataresDisponibles()) {
    if (!total) return 0;
    return ((indice % total) + total) % total;
}

function obtenerAvataresVisiblesCarrusel() {
    const total = totalAvataresDisponibles();
    if (!total) return [];

    if (total <= AVATARES_VISIBLES_POR_VISTA) {
        return AVATARES_DISPONIBLES.map((avatar, index) => ({
            ...avatar,
            _indice_real: index
        }));
    }

    const visibles = [];
    for (let i = 0; i < AVATARES_VISIBLES_POR_VISTA; i++) {
        const indiceReal = normalizarIndiceCarruselAvatar(avatarCarruselInicio + i, total);
        visibles.push({
            ...AVATARES_DISPONIBLES[indiceReal],
            _indice_real: indiceReal
        });
    }
    return visibles;
}

function carruselIncluyeIndiceAvatar(indiceObjetivo) {
    const total = totalAvataresDisponibles();
    if (!total || indiceObjetivo < 0) return false;

    const cantidad = Math.min(AVATARES_VISIBLES_POR_VISTA, total);
    for (let i = 0; i < cantidad; i++) {
        const indice = normalizarIndiceCarruselAvatar(avatarCarruselInicio + i, total);
        if (indice === indiceObjetivo) {
            return true;
        }
    }
    return false;
}

function asegurarAvatarVisibleEnCarrusel(avatarId) {
    const total = totalAvataresDisponibles();
    if (!total || total <= AVATARES_VISIBLES_POR_VISTA) {
        avatarCarruselInicio = 0;
        return;
    }

    const indice = AVATARES_DISPONIBLES.findIndex(a => a.id === avatarId);
    if (indice < 0) return;

    if (carruselIncluyeIndiceAvatar(indice)) {
        return;
    }

    const offsetCentro = Math.floor(AVATARES_VISIBLES_POR_VISTA / 2);
    avatarCarruselInicio = normalizarIndiceCarruselAvatar(indice - offsetCentro, total);
}

function moverCarruselAvatar(direccion = 1) {
    if (avatarActualizandoMyPokemon) return;

    const total = totalAvataresDisponibles();
    if (!total || total <= AVATARES_VISIBLES_POR_VISTA) return;

    avatarCarruselInicio = normalizarIndiceCarruselAvatar(avatarCarruselInicio + direccion, total);
    renderAvatarSelector();
}

function obtenerImagenPokemonColeccion(pokemonId, esShiny = false) {
    return obtenerRutaSpriteLocal(pokemonId, esShiny);
}

function obtenerImagenItemInventario(nombreItem, itemCode = "") {
    const imagenesPorCodigo = {
        "poke_ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
        "super_ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
        "ultra_ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png",
        "master_ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png",
        "potion": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png",
        "super_potion": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-potion.png",
        "booster_battle_exp_x2_24h": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/exp-share.png",
        "booster_battle_gold_x2_24h": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/nugget.png"
    };

    const imagenesPorNombre = {
        "Poke Ball": imagenesPorCodigo.poke_ball,
        "Super Ball": imagenesPorCodigo.super_ball,
        "Ultra Ball": imagenesPorCodigo.ultra_ball,
        "Master Ball": imagenesPorCodigo.master_ball,
        "Pocion": imagenesPorCodigo.potion,
        "Super Pocion": imagenesPorCodigo.super_potion,
        "Piedra Fuego": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png",
        "Piedra Agua": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png",
        "Piedra Trueno": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png",
        "Piedra Hoja": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leaf-stone.png",
        "Piedra Lunar": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moon-stone.png",
        "Booster Battle EXP x2 24h": imagenesPorCodigo.booster_battle_exp_x2_24h,
        "Booster Battle GOLD x2 24h": imagenesPorCodigo.booster_battle_gold_x2_24h
    };

    return imagenesPorCodigo[itemCode] || imagenesPorNombre[nombreItem] || imagenesPorCodigo.poke_ball;
}

function obtenerImagenPokemonModal(pokemonId, esShiny = false) {
    return obtenerImagenPokemonColeccion(pokemonId, esShiny);
}

function obtenerImagenItemModal(nombreItem) {
    return obtenerImagenItemInventario(nombreItem);
}

function traducirTipoPokemonMyPokemon(tipo = "") {
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

function traducirNombreItemMyPokemon(nombreItem = "", itemCode = "") {
    const mapaPorNombre = {
        "Poke Ball": "item_poke_ball",
        "Super Ball": "item_super_ball",
        "Ultra Ball": "item_ultra_ball",
        "Master Ball": "item_master_ball",
        "Pocion": "item_potion",
        "Super Pocion": "item_super_potion",
        "Piedra Fuego": "item_fire_stone",
        "Piedra Agua": "item_water_stone",
        "Piedra Trueno": "item_thunder_stone",
        "Piedra Hoja": "item_leaf_stone",
        "Piedra Lunar": "item_moon_stone"
    };
    const mapaPorCodigo = {
        "booster_battle_exp_x2_24h": "mypokemon_booster_exp_name",
        "booster_battle_gold_x2_24h": "mypokemon_booster_gold_name"
    };

    const key = mapaPorCodigo[itemCode] || mapaPorNombre[nombreItem];
    if (key) {
        return tMyPokemon(
            key,
            itemCode === "booster_battle_exp_x2_24h"
                ? "Battle EXP x2 Booster"
                : itemCode === "booster_battle_gold_x2_24h"
                    ? "Battle GOLD x2 Booster"
                    : nombreItem
        );
    }
    return nombreItem;
}

const BATTLE_BOOSTER_CONFIG_MyPokemon = {
    booster_battle_exp_x2_24h: {
        itemCode: "booster_battle_exp_x2_24h",
        benefitCode: "battle_exp_x2",
        accent: "exp",
        titleFallback: "Battle EXP x2 Booster",
        descriptionFallback: "Manual activation · 24h per use",
        activeTitleFallback: "EXP x2 active in Battle",
        buttonFallback: "Use +24h"
    },
    booster_battle_gold_x2_24h: {
        itemCode: "booster_battle_gold_x2_24h",
        benefitCode: "battle_gold_x2",
        accent: "gold",
        titleFallback: "Battle GOLD x2 Booster",
        descriptionFallback: "Manual activation · 24h per use",
        activeTitleFallback: "GOLD x2 active in Battle",
        buttonFallback: "Use +24h"
    }
};

function detectarCodigoBoosterMyPokemon(item = {}) {
    const codigo = String(item?.item_codigo || item?.codigo || "").trim().toLowerCase();
    if (codigo && BATTLE_BOOSTER_CONFIG_MyPokemon[codigo]) return codigo;

    const nombre = normalizarTextoMyPokemon(item?.nombre || "");
    if (nombre.includes("booster battle exp x2")) return "booster_battle_exp_x2_24h";
    if (nombre.includes("booster battle gold x2")) return "booster_battle_gold_x2_24h";
    return "";
}

function esBoosterBatallaMyPokemon(item = {}) {
    return !!detectarCodigoBoosterMyPokemon(item);
}

function obtenerConfigBoosterBatallaMyPokemon(itemOrCode) {
    const codigo = typeof itemOrCode === "string"
        ? String(itemOrCode || "").trim().toLowerCase()
        : detectarCodigoBoosterMyPokemon(itemOrCode || {});
    return BATTLE_BOOSTER_CONFIG_MyPokemon[codigo] || null;
}

function obtenerBeneficioActivoMyPokemon(benefitCode = "") {
    const codigo = String(benefitCode || "").trim().toLowerCase();
    return (beneficiosActivosMyPokemon || []).find(
        beneficio => String(beneficio?.beneficio_codigo || "").trim().toLowerCase() === codigo
    ) || null;
}

function formatearTiempoRestanteBeneficioMyPokemon(expiraEn) {
    if (!expiraEn) {
        return tMyPokemon("mypokemon_booster_status_active", "Active now");
    }

    const expira = new Date(expiraEn);
    if (Number.isNaN(expira.getTime())) {
        return tMyPokemon("mypokemon_booster_status_active", "Active now");
    }

    const restanteMs = expira.getTime() - Date.now();
    if (restanteMs <= 0) {
        return tMyPokemon("mypokemon_booster_status_expired", "Expired");
    }

    const totalMin = Math.max(1, Math.floor(restanteMs / 60000));
    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;
    if (horas > 0) return `${horas}h ${minutos}m`;
    return `${minutos}m`;
}

async function obtenerBeneficiosActivosSeguroMyPokemon() {
    try {
        const data = await obtenerBeneficiosActivos();
        return Array.isArray(data?.beneficios) ? data.beneficios : [];
    } catch (error) {
        if (esErrorAuthMyPokemon(error)) {
            return [];
        }
        console.error("Error obteniendo beneficios activos:", error);
        return [];
    }
}

function construirTarjetaBoosterActivaMyPokemon(config, beneficio) {
    const restante = formatearTiempoRestanteBeneficioMyPokemon(beneficio?.expira_en);
    return `
        <article class="inventory-booster-active inventory-booster-active-${config.accent}">
            <div class="inventory-booster-active-icon">
                <img src="${obtenerImagenItemInventario(config.titleFallback, config.itemCode)}" alt="${escapeHtmlMyPokemon(config.titleFallback)}">
            </div>
            <div class="inventory-booster-active-copy">
                <strong>${escapeHtmlMyPokemon(tMyPokemon(config.benefitCode === "battle_exp_x2" ? "mypokemon_booster_exp_active_title" : "mypokemon_booster_gold_active_title", config.activeTitleFallback))}</strong>
                <span>${escapeHtmlMyPokemon(tMyPokemon("mypokemon_booster_active_remaining", "Remaining: {time}", { time: restante }))}</span>
            </div>
        </article>
    `;
}

function construirCardBoosterInventarioMyPokemon(item) {
    const codigo = detectarCodigoBoosterMyPokemon(item);
    const config = obtenerConfigBoosterBatallaMyPokemon(codigo);
    if (!config) return "";

    const beneficioActivo = obtenerBeneficioActivoMyPokemon(config.benefitCode);
    const restante = beneficioActivo ? formatearTiempoRestanteBeneficioMyPokemon(beneficioActivo.expira_en) : "";
    const nombreVisual = traducirNombreItemMyPokemon(item.nombre, codigo);
    const descripcion = tMyPokemon(
        codigo === "booster_battle_exp_x2_24h" ? "mypokemon_booster_exp_desc" : "mypokemon_booster_gold_desc",
        config.descriptionFallback
    );

    return `
        <article class="inventory-booster-card inventory-booster-card-${config.accent}">
            <div class="inventory-booster-head">
                <div class="inventory-booster-icon">
                    <img src="${obtenerImagenItemInventario(item.nombre, codigo)}" alt="${escapeHtmlMyPokemon(nombreVisual)}">
                </div>
                <div class="inventory-booster-copy">
                    <h4>${escapeHtmlMyPokemon(nombreVisual)}</h4>
                    <p>${escapeHtmlMyPokemon(descripcion)}</p>
                </div>
                <div class="inventory-booster-qty">x${Number(item.cantidad) || 0}</div>
            </div>
            <div class="inventory-booster-footer">
                <div class="inventory-booster-status-wrap">
                    ${beneficioActivo
                        ? `<span class="inventory-booster-status is-active">${escapeHtmlMyPokemon(tMyPokemon("mypokemon_booster_status_active_short", `Active · ${restante}`))}</span>`
                        : `<span class="inventory-booster-status">${escapeHtmlMyPokemon(tMyPokemon("mypokemon_booster_status_ready", "Ready to use"))}</span>`}
                </div>
                <button class="inventory-booster-action" type="button" data-use-booster="${codigo}" ${boosterActivandoCodigo === codigo ? "disabled" : ""}>
                    ${escapeHtmlMyPokemon(tMyPokemon("mypokemon_booster_use_button", config.buttonFallback))}
                </button>
            </div>
        </article>
    `;
}

function mostrarMensajeEvolucion(mensaje, tipo = "ok") {
    const box = document.getElementById("mensajeEvolucion");
    if (!box) return;

    box.classList.remove("oculto", "ok", "error");
    box.classList.add(tipo);
    box.textContent = mensaje;
}

function limpiarMensajeEvolucion() {
    const box = document.getElementById("mensajeEvolucion");
    if (!box) return;

    box.textContent = "";
    box.classList.add("oculto");
    box.classList.remove("ok", "error");
}

function obtenerDatosMovimientosCache(usuarioPokemonId) {
    return movimientosPokemonCache.get(Number(usuarioPokemonId)) || null;
}

function guardarDatosMovimientosCache(usuarioPokemonId, data) {
    movimientosPokemonCache.set(Number(usuarioPokemonId), data || null);
}

function obtenerCategoriaMovimientoTexto(categoria) {
    const valor = String(categoria || "").trim().toLowerCase();
    if (valor === "fisico") return tMyPokemon("mypokemon_move_category_physical", "Physical");
    if (valor === "especial") return tMyPokemon("mypokemon_move_category_special", "Special");
    if (valor === "estado") return tMyPokemon("mypokemon_move_category_status", "Status");
    return categoria || "-";
}

function normalizarTipoCssMyPokemon(tipo = "") {
    const valor = normalizarTextoMyPokemon(tipo).split("/")[0].trim();
    const mapa = {
        normal: "normal",
        fire: "fire",
        fuego: "fire",
        water: "water",
        agua: "water",
        grass: "grass",
        planta: "grass",
        electric: "electric",
        electrico: "electric",
        ice: "ice",
        hielo: "ice",
        fighting: "fighting",
        lucha: "fighting",
        poison: "poison",
        veneno: "poison",
        ground: "ground",
        tierra: "ground",
        flying: "flying",
        volador: "flying",
        psychic: "psychic",
        psiquico: "psychic",
        bug: "bug",
        bicho: "bug",
        rock: "rock",
        roca: "rock",
        ghost: "ghost",
        fantasma: "ghost",
        dragon: "dragon",
        steel: "steel",
        acero: "steel",
        fairy: "fairy",
        hada: "fairy"
    };
    return mapa[valor] || "neutral";
}

function obtenerTextoTipoMovimientoUi(tipo = "") {
    const limpio = String(tipo || "").trim();
    if (!limpio) return tMyPokemon("mypokemon_moves_type_unknown", "Unknown");
    return traducirTipoPokemonMyPokemon(limpio);
}

function obtenerMovimientoEquipadoPorSlot(movimientos = [], slot = 1) {
    return (Array.isArray(movimientos) ? movimientos : []).find(mov => Number(mov?.slot) === Number(slot)) || null;
}

function renderModalMovimientosLoading(nombrePokemon = "") {
    const contenido = document.getElementById("contenidoModalMovimientosPokemon");
    if (!contenido) return;

    contenido.innerHTML = `
        <div class="mypokemon-moves-shell is-loading">
            <div class="mypokemon-moves-hero">
                <h2 class="titulo-modal-evolucion">${tMyPokemon("mypokemon_moves_title", "Pokémon moves")}</h2>
                <p class="subtitulo-modal-evolucion">${escapeHtmlMyPokemon(nombrePokemon || tMyPokemon("mypokemon_moves_loading_subtitle", "Loading moves..."))}</p>
            </div>

            <div class="mypokemon-moves-empty-state">
                <h3>${tMyPokemon("mypokemon_moves_loading_title", "Loading moves...")}</h3>
                <p>${tMyPokemon("mypokemon_moves_loading_text", "Please wait a moment.")}</p>
            </div>
        </div>
    `;
}

function renderModalMovimientosError(nombrePokemon = "", mensaje = "") {
    const contenido = document.getElementById("contenidoModalMovimientosPokemon");
    if (!contenido) return;

    contenido.innerHTML = `
        <div class="mypokemon-moves-shell is-error">
            <div class="mypokemon-moves-hero">
                <h2 class="titulo-modal-evolucion">${tMyPokemon("mypokemon_moves_title", "Pokémon moves")}</h2>
                <p class="subtitulo-modal-evolucion">${escapeHtmlMyPokemon(nombrePokemon || "")}</p>
            </div>

            <div class="mypokemon-moves-empty-state is-error">
                <h3>${tMyPokemon("mypokemon_moves_error_title", "Could not load moves")}</h3>
                <p>${escapeHtmlMyPokemon(mensaje || tMyPokemon("mypokemon_moves_error_text", "Try again in a moment."))}</p>
                <button type="button" class="btn-evolucionar" data-skill-refresh="1">
                    ${tMyPokemon("mypokemon_moves_retry", "Retry")}
                </button>
            </div>
        </div>
    `;
}

function renderModalMovimientosContenido() {
    const contenido = document.getElementById("contenidoModalMovimientosPokemon");
    if (!contenido || !modalMovimientosActual) return;

    if (modalMovimientosActual.cargando) {
        renderModalMovimientosLoading(modalMovimientosActual.nombrePokemon);
        return;
    }

    const data = modalMovimientosActual.data || {};
    const usuarioPokemon = data.usuario_pokemon || {};
    const movimientos = Array.isArray(data.movimientos) ? data.movimientos : [];
    const nombrePokemon = usuarioPokemon.nombre || modalMovimientosActual.nombrePokemon || "Pokémon";
    const nivelPokemon = Number(usuarioPokemon.nivel || 1);
    const tipoPokemon = traducirTipoPokemonMyPokemon(usuarioPokemon.tipo || "");
    const slotSeleccionado = Number(modalMovimientosActual.slotSeleccionado || 1);
    const movimientoSlotActual = obtenerMovimientoEquipadoPorSlot(movimientos, slotSeleccionado);
    const movimientoPendienteId = Number(
        modalMovimientosActual.movimientoPendienteId || movimientoSlotActual?.movimiento_id || 0
    );
    const tipoCssSeleccionado = normalizarTipoCssMyPokemon(movimientoSlotActual?.tipo || "");
    const textoTipoSeleccionado = movimientoSlotActual
        ? obtenerTextoTipoMovimientoUi(movimientoSlotActual.tipo || "")
        : "";
    const textoCategoriaSeleccionada = movimientoSlotActual
        ? obtenerCategoriaMovimientoTexto(movimientoSlotActual.categoria)
        : "";

    const slotsHtml = [1, 2, 3, 4].map(slot => {
        const movimiento = obtenerMovimientoEquipadoPorSlot(movimientos, slot);
        const activo = slotSeleccionado === slot;
        const tipoCss = normalizarTipoCssMyPokemon(movimiento?.tipo || "");
        const estadoSlot = movimiento
            ? tMyPokemon("mypokemon_moves_slot_filled_badge", "Equipped")
            : tMyPokemon("mypokemon_moves_slot_empty_badge", "Empty");

        return `
            <button
                type="button"
                class="mypokemon-moves-slot-card ${activo ? "is-selected" : ""} ${movimiento ? "is-filled" : "is-empty"}"
                data-skill-slot="${slot}"
                ${equipandoMovimientoEnCurso ? "disabled" : ""}
            >
                <span class="mypokemon-moves-slot-index">${tMyPokemon("mypokemon_moves_slot_short", "Slot")} ${slot}</span>
                <span class="mypokemon-moves-slot-state ${movimiento ? "is-filled" : "is-empty"}">${estadoSlot}</span>

                <div class="mypokemon-moves-slot-body">
                    <div class="mypokemon-moves-slot-title-row">
                        <h3>${tMyPokemon("mypokemon_moves_slot_label", "Slot")} ${slot}</h3>
                    </div>

                    <p class="mypokemon-moves-slot-name">
                        ${movimiento ? escapeHtmlMyPokemon(movimiento.nombre) : tMyPokemon("mypokemon_moves_empty_slot", "Empty slot")}
                    </p>

                    <div class="mypokemon-moves-slot-meta">
                        ${movimiento ? `
                            <span class="mypokemon-move-pill type-${tipoCss}">${escapeHtmlMyPokemon(obtenerTextoTipoMovimientoUi(movimiento.tipo || ""))}</span>
                            <span class="mypokemon-move-pill is-category">${escapeHtmlMyPokemon(obtenerCategoriaMovimientoTexto(movimiento.categoria))}</span>
                        ` : `
                            <span class="mypokemon-moves-slot-hint">${tMyPokemon("mypokemon_moves_select_slot", "Select this slot")}</span>
                        `}
                    </div>
                </div>
            </button>
        `;
    }).join("");

    const movimientosHtml = movimientos.length
        ? movimientos.map(mov => {
            const estaEquipado = Number(mov.slot || 0) > 0;
            const estaEnSlotSeleccionado = Number(mov.slot || 0) === slotSeleccionado;
            const estaResaltado = movimientoPendienteId > 0 && Number(mov.movimiento_id) === movimientoPendienteId;
            const potencia = mov.potencia != null ? String(mov.potencia) : tMyPokemon("mypokemon_moves_no_power", "-");
            const tipoCss = normalizarTipoCssMyPokemon(mov.tipo || "");
            const textoEstado = estaEquipado
                ? `${tMyPokemon("mypokemon_moves_equipped_in", "Equipped in slot")} ${mov.slot}`
                : `${tMyPokemon("mypokemon_moves_unlock_level", "Unlock level")} ${mov.nivel_requerido}`;
            const accionTexto = estaEnSlotSeleccionado
                ? tMyPokemon("mypokemon_moves_selected_move", "Selected move")
                : tMyPokemon("mypokemon_moves_equip_here", "Equip in this slot");

            return `
                <button
                    type="button"
                    class="mypokemon-move-card ${estaEquipado ? "is-equipped" : ""} ${estaResaltado ? "is-selected" : ""} ${estaEnSlotSeleccionado ? "is-current-slot" : ""}"
                    data-skill-equip="${mov.movimiento_id}"
                    ${equipandoMovimientoEnCurso ? "disabled" : ""}
                >
                    <div class="mypokemon-move-card-top">
                        <div>
                            <h3 class="mypokemon-move-name">${escapeHtmlMyPokemon(mov.nombre)}</h3>
                            <div class="mypokemon-move-pill-row">
                                <span class="mypokemon-move-pill type-${tipoCss}">${escapeHtmlMyPokemon(obtenerTextoTipoMovimientoUi(mov.tipo || ""))}</span>
                                <span class="mypokemon-move-pill is-category">${escapeHtmlMyPokemon(obtenerCategoriaMovimientoTexto(mov.categoria))}</span>
                                <span class="mypokemon-move-pill ${estaEquipado ? "is-equipped" : "is-available"}">${escapeHtmlMyPokemon(textoEstado)}</span>
                            </div>
                        </div>
                        <span class="mypokemon-move-action">${accionTexto}</span>
                    </div>

                    <div class="mypokemon-move-stats-grid">
                        <div class="mypokemon-move-stat-box">
                            <span>${tMyPokemon("mypokemon_moves_power_label", "Power")}</span>
                            <strong>${escapeHtmlMyPokemon(potencia)}</strong>
                        </div>
                        <div class="mypokemon-move-stat-box">
                            <span>${tMyPokemon("mypokemon_moves_accuracy_label", "Accuracy")}</span>
                            <strong>${escapeHtmlMyPokemon(String(mov.precision_pct || 0))}%</strong>
                        </div>
                        <div class="mypokemon-move-stat-box">
                            <span>${tMyPokemon("mypokemon_moves_cooldown_label", "Cooldown")}</span>
                            <strong>${escapeHtmlMyPokemon(String(mov.cooldown_turnos || 0))}</strong>
                        </div>
                    </div>
                </button>
            `;
        }).join("")
        : `
            <div class="mypokemon-moves-empty-state">
                <h3>${tMyPokemon("mypokemon_moves_empty_title", "No moves available")}</h3>
                <p>${tMyPokemon("mypokemon_moves_empty_text", "This Pokémon has no unlocked moves yet.")}</p>
            </div>
        `;

    contenido.innerHTML = `
        <div class="mypokemon-moves-shell" data-selected-type="${tipoCssSeleccionado}">
            <div class="mypokemon-moves-hero">
                <h2 class="titulo-modal-evolucion">${tMyPokemon("mypokemon_moves_title", "Pokémon moves")}</h2>
                <p class="subtitulo-modal-evolucion">${escapeHtmlMyPokemon(nombrePokemon)} · ${t("battle_level_short")} ${nivelPokemon}${tipoPokemon ? ` · ${escapeHtmlMyPokemon(tipoPokemon)}` : ""}</p>
            </div>

            <div class="mypokemon-moves-helper-banner">
                <span class="mypokemon-moves-helper-icon">✦</span>
                <span>${tMyPokemon("mypokemon_moves_help", "Select a slot first, then choose the move you want to equip.")}</span>
            </div>

            <section class="mypokemon-moves-slots-section" data-selected-type="${tipoCssSeleccionado}">
                <div class="mypokemon-moves-section-head">
                    <div>
                        <span class="mypokemon-moves-section-kicker">${tMyPokemon("mypokemon_moves_equipped_title", "Equipped loadout")}</span>
                        <h3>${tMyPokemon("mypokemon_moves_slots_title", "Choose the slot to edit")}</h3>
                    </div>
                </div>

                <div class="mypokemon-moves-slots-grid">
                    ${slotsHtml}
                </div>
            </section>

            <section class="mypokemon-moves-selected-panel ${movimientoSlotActual ? "has-move" : "is-empty"}" data-selected-type="${tipoCssSeleccionado}">
                <div class="mypokemon-moves-selected-copy">
                    <span class="mypokemon-moves-section-kicker">${tMyPokemon("mypokemon_moves_selected_slot", "Selected slot")}</span>
                    <h3>${tMyPokemon("mypokemon_moves_slot_label", "Slot")} ${slotSeleccionado}</h3>
                    <p>
                        ${movimientoSlotActual
                            ? tMyPokemon("mypokemon_moves_selected_slot_filled", "This is the move currently equipped in the selected slot.")
                            : tMyPokemon("mypokemon_moves_selected_slot_empty", "This slot is empty. Choose any unlocked move below.")}
                    </p>
                </div>

                <div class="mypokemon-moves-selected-preview" data-selected-type="${tipoCssSeleccionado}">
                    ${movimientoSlotActual ? `
                        <div class="mypokemon-moves-selected-preview-top">
                            <span class="mypokemon-move-pill type-${tipoCssSeleccionado}">${escapeHtmlMyPokemon(textoTipoSeleccionado)}</span>
                            <span class="mypokemon-move-pill is-category">${escapeHtmlMyPokemon(textoCategoriaSeleccionada)}</span>
                        </div>
                    ` : ""}
                    <strong>${movimientoSlotActual ? escapeHtmlMyPokemon(movimientoSlotActual.nombre) : tMyPokemon("mypokemon_moves_empty_slot", "Empty slot")}</strong>
                    <span>${movimientoSlotActual ? `${escapeHtmlMyPokemon(textoTipoSeleccionado)} · ${escapeHtmlMyPokemon(textoCategoriaSeleccionada)}` : tMyPokemon("mypokemon_moves_choose_move_cta", "Choose a move to equip")}</span>
                </div>
            </section>

            <section class="mypokemon-moves-list-section" data-selected-type="${tipoCssSeleccionado}">
                <div class="mypokemon-moves-section-head">
                    <div>
                        <span class="mypokemon-moves-section-kicker">${tMyPokemon("mypokemon_moves_available_list", "Unlocked moves")}</span>
                        <h3>${tMyPokemon("mypokemon_moves_available_title", "Pick the move for the selected slot")}</h3>
                    </div>
                </div>

                <div class="mypokemon-moves-grid">
                    ${movimientosHtml}
                </div>
            </section>

            <div class="evolucion-botones mypokemon-moves-actions">
                <button type="button" class="btn-cancelar-modal" onclick="cerrarModalMovimientosPokemon()">${t("battle_cancel")}</button>
                <button type="button" class="btn-evolucionar" data-skill-refresh="1" ${equipandoMovimientoEnCurso ? "disabled" : ""}>
                    ${equipandoMovimientoEnCurso ? tMyPokemon("mypokemon_moves_saving", "Saving...") : tMyPokemon("mypokemon_moves_refresh", "Refresh")}
                </button>
            </div>
        </div>
    `;
}

async function abrirModalMovimientosPokemon(usuarioPokemonId, nombrePokemon, { forzar = false } = {}) {
    const modal = document.getElementById("modalMovimientosPokemon");
    if (!modal) return;

    modal.classList.remove("oculto");

    const cache = !forzar ? obtenerDatosMovimientosCache(usuarioPokemonId) : null;
    modalMovimientosActual = {
        usuarioPokemonId: Number(usuarioPokemonId),
        nombrePokemon: String(nombrePokemon || "Pokémon"),
        slotSeleccionado: Number(modalMovimientosActual?.usuarioPokemonId) === Number(usuarioPokemonId)
            ? Number(modalMovimientosActual?.slotSeleccionado || 1)
            : 1,
        movimientoPendienteId: Number(modalMovimientosActual?.usuarioPokemonId) === Number(usuarioPokemonId)
            ? Number(modalMovimientosActual?.movimientoPendienteId || 0)
            : 0,
        data: cache,
        cargando: true
    };

    if (cache && !forzar) {
        modalMovimientosActual.cargando = false;
        renderModalMovimientosContenido();
    } else {
        renderModalMovimientosLoading(nombrePokemon);
    }

    try {
        const data = await obtenerMovimientosPokemonUsuario(usuarioPokemonId);
        if (!modalMovimientosActual || Number(modalMovimientosActual.usuarioPokemonId) !== Number(usuarioPokemonId)) {
            return;
        }

        guardarDatosMovimientosCache(usuarioPokemonId, data);
        modalMovimientosActual.data = data;
        modalMovimientosActual.cargando = false;
        modalMovimientosActual.nombrePokemon = data?.usuario_pokemon?.nombre || modalMovimientosActual.nombrePokemon;
        const movimientoActivo = obtenerMovimientoEquipadoPorSlot(Array.isArray(data?.movimientos) ? data.movimientos : [], modalMovimientosActual.slotSeleccionado);
        modalMovimientosActual.movimientoPendienteId = Number(movimientoActivo?.movimiento_id || modalMovimientosActual.movimientoPendienteId || 0);
        renderModalMovimientosContenido();
    } catch (error) {
        console.error("Error cargando movimientos del Pokémon:", error);

        if (esErrorAuthMyPokemon(error)) {
            cerrarModalMovimientosPokemon();
            manejarErrorAuthMyPokemon();
            mostrarMensajeEvolucion(t("mypokemon_login_required_action"), "error");
            return;
        }

        if (!modalMovimientosActual || Number(modalMovimientosActual.usuarioPokemonId) !== Number(usuarioPokemonId)) {
            return;
        }

        modalMovimientosActual.cargando = false;
        renderModalMovimientosError(nombrePokemon, error.message || tMyPokemon("mypokemon_moves_error_text", "Try again in a moment."));
    }
}

function cerrarModalMovimientosPokemon() {
    const modal = document.getElementById("modalMovimientosPokemon");
    const contenido = document.getElementById("contenidoModalMovimientosPokemon");

    if (modal) modal.classList.add("oculto");
    if (contenido) contenido.innerHTML = "";

    equipandoMovimientoEnCurso = false;
    modalMovimientosActual = null;
}

async function equiparMovimientoSeleccionado(movimientoId) {
    if (!modalMovimientosActual || equipandoMovimientoEnCurso) return;

    const usuarioPokemonId = Number(modalMovimientosActual.usuarioPokemonId || 0);
    const slot = Number(modalMovimientosActual.slotSeleccionado || 1);

    if (!usuarioPokemonId || !movimientoId || slot < 1 || slot > 4) return;

    modalMovimientosActual.movimientoPendienteId = Number(movimientoId || 0);
    equipandoMovimientoEnCurso = true;
    renderModalMovimientosContenido();

    try {
        const data = await equiparMovimientoPokemonUsuario(usuarioPokemonId, movimientoId, slot);

        const payloadActual = modalMovimientosActual?.data || {};
        const actualizado = {
            ...payloadActual,
            movimientos: Array.isArray(data?.movimientos) ? data.movimientos : [],
            equipados: Array.isArray(data?.equipados) ? data.equipados : []
        };

        guardarDatosMovimientosCache(usuarioPokemonId, actualizado);

        if (modalMovimientosActual && Number(modalMovimientosActual.usuarioPokemonId) === usuarioPokemonId) {
            modalMovimientosActual.data = actualizado;
            modalMovimientosActual.movimientoPendienteId = Number(movimientoId || 0);
        }

        renderModalMovimientosContenido();
        mostrarMensajeEvolucion(data?.mensaje || tMyPokemon("mypokemon_moves_saved", "Move equipped successfully"), "ok");
    } catch (error) {
        console.error("Error equipando movimiento:", error);

        if (esErrorAuthMyPokemon(error)) {
            cerrarModalMovimientosPokemon();
            manejarErrorAuthMyPokemon();
            mostrarMensajeEvolucion(t("mypokemon_login_required_action"), "error");
            return;
        }

        renderModalMovimientosContenido();
        mostrarMensajeEvolucion(error.message || tMyPokemon("mypokemon_moves_save_error", "Could not equip the move"), "error");
    } finally {
        equipandoMovimientoEnCurso = false;
        if (modalMovimientosActual) {
            renderModalMovimientosContenido();
        }
    }
}

function configurarEventosMovimientosPokemon() {
    const modal = document.getElementById("modalMovimientosPokemon");
    if (!modal) return;

    modal.addEventListener("click", async (event) => {
        const btnRefresh = event.target.closest("[data-skill-refresh]");
        if (btnRefresh && modalMovimientosActual) {
            await abrirModalMovimientosPokemon(
                modalMovimientosActual.usuarioPokemonId,
                modalMovimientosActual.nombrePokemon,
                { forzar: true }
            );
            return;
        }

        const btnSlot = event.target.closest("[data-skill-slot]");
        if (btnSlot && modalMovimientosActual && !equipandoMovimientoEnCurso) {
            modalMovimientosActual.slotSeleccionado = Number(btnSlot.dataset.skillSlot || 1);
            const movimientos = Array.isArray(modalMovimientosActual?.data?.movimientos) ? modalMovimientosActual.data.movimientos : [];
            const movimientoSlot = obtenerMovimientoEquipadoPorSlot(movimientos, modalMovimientosActual.slotSeleccionado);
            modalMovimientosActual.movimientoPendienteId = Number(movimientoSlot?.movimiento_id || 0);
            renderModalMovimientosContenido();
            return;
        }

        const btnEquipar = event.target.closest("[data-skill-equip]");
        if (btnEquipar) {
            const movimientoId = Number(btnEquipar.dataset.skillEquip || 0);
            if (movimientoId > 0) {
                await equiparMovimientoSeleccionado(movimientoId);
            }
        }
    });
}

function esErrorAuthMyPokemon(error) {
    return error?.code === "NO_TOKEN" || error?.code === "UNAUTHORIZED";
}

function manejarErrorAuthMyPokemon() {
    usuarioActualMyPokemon = null;
    misPokemonData = [];
    estadosEvolucionCache.clear();
    limpiarCacheMyPokemon();
    renderEstadoSinSesion();
}

function renderAvatarSelector() {
    const section = document.getElementById("avatarSelectorSection");
    if (!section) return;

    if (!usuarioAutenticadoMyPokemon()) {
        section.innerHTML = `
            <div class="avatar-studio-lock">
                <h3>${tMyPokemon("mypokemon_avatar_login_title", "Login required")}</h3>
                <p>${tMyPokemon("mypokemon_avatar_login_text", "Log in to choose your trainer avatar.")}</p>
            </div>
        `;
        return;
    }

    const avatarActual = obtenerAvatarActualUsuarioMyPokemon();
    const nombreActual = obtenerNombreAvatarVisual(avatarActual);
    asegurarAvatarVisibleEnCarrusel(avatarActual);

    const avataresVisibles = obtenerAvataresVisiblesCarrusel();
    const mostrarControles = totalAvataresDisponibles() > AVATARES_VISIBLES_POR_VISTA;

    section.innerHTML = `
        <div class="avatar-studio-shell ${avatarActualizandoMyPokemon ? "updating" : ""}">
            <div class="avatar-studio-header">
                <div class="avatar-studio-copy">
                    <span class="avatar-studio-kicker">
                        ${tMyPokemon("mypokemon_avatar_kicker", "Trainer style")}
                    </span>
                    <h3>${tMyPokemon("mypokemon_avatar_title", "Choose your avatar")}</h3>
                    <p>${tMyPokemon("mypokemon_avatar_subtitle", "Your avatar appears in maps, rankings, and profile sections.")}</p>
                </div>

                <div class="avatar-studio-current">
                    <div class="avatar-studio-current-preview">
                        <img
                            src="${obtenerRutaAvatarMyPokemon(avatarActual)}"
                            alt="${escapeHtmlMyPokemon(nombreActual)}"
                            onerror="this.onerror=null;this.src='img/avatars/${MY_POKEMON_AVATAR_DEFAULT}.png';"
                        >
                    </div>

                    <div class="avatar-studio-current-text">
                        <span>${tMyPokemon("mypokemon_avatar_current", "Current avatar")}</span>
                        <strong>${escapeHtmlMyPokemon(nombreActual)}</strong>
                    </div>
                </div>
            </div>

            <div class="avatar-carousel-shell ${mostrarControles ? "" : "sin-controles"}">
                ${mostrarControles ? `
                    <button
                        type="button"
                        class="avatar-carousel-nav"
                        data-avatar-nav="-1"
                        ${avatarActualizandoMyPokemon ? "disabled" : ""}
                        aria-label="${escapeHtmlMyPokemon(tMyPokemon("mypokemon_avatar_prev", "Previous avatars"))}"
                        title="${escapeHtmlMyPokemon(tMyPokemon("mypokemon_avatar_prev", "Previous avatars"))}"
                    >
                        ‹
                    </button>
                ` : ""}

                <div class="avatar-carousel-track">
                    ${avataresVisibles.map(avatar => {
                        const activo = avatar.id === avatarActual;
                        return `
                            <button
                                type="button"
                                class="avatar-option ${activo ? "activa" : ""}"
                                data-avatar-option="${avatar.id}"
                                ${avatarActualizandoMyPokemon ? "disabled" : ""}
                                aria-label="${escapeHtmlMyPokemon(avatar.nombre)}"
                                title="${escapeHtmlMyPokemon(avatar.nombre)}"
                            >
                                <span class="avatar-option-check">${activo ? "✓" : ""}</span>

                                <div class="avatar-option-preview">
                                    <img
                                        src="${obtenerRutaAvatarMyPokemon(avatar.id)}"
                                        alt="${escapeHtmlMyPokemon(avatar.nombre)}"
                                        onerror="this.onerror=null;this.src='img/avatars/${MY_POKEMON_AVATAR_DEFAULT}.png';"
                                    >
                                </div>

                                <span class="avatar-option-name">${escapeHtmlMyPokemon(avatar.nombre)}</span>
                                ${activo ? `<span class="avatar-option-selected-text">${tMyPokemon("mypokemon_avatar_selected", "Selected")}</span>` : ""}
                            </button>
                        `;
                    }).join("")}
                </div>

                ${mostrarControles ? `
                    <button
                        type="button"
                        class="avatar-carousel-nav"
                        data-avatar-nav="1"
                        ${avatarActualizandoMyPokemon ? "disabled" : ""}
                        aria-label="${escapeHtmlMyPokemon(tMyPokemon("mypokemon_avatar_next", "Next avatars"))}"
                        title="${escapeHtmlMyPokemon(tMyPokemon("mypokemon_avatar_next", "Next avatars"))}"
                    >
                        ›
                    </button>
                ` : ""}
            </div>

            ${avatarActualizandoMyPokemon ? `
                <div class="avatar-studio-loading">
                    ${tMyPokemon("mypokemon_avatar_updating", "Updating avatar...")}
                </div>
            ` : ""}
        </div>
    `;
}

function renderEstadoSinSesion() {
    const inventario = document.getElementById("inventarioUsuario");
    const resumen = document.getElementById("resumenColeccion");
    const container = document.getElementById("misPokemonContainer");

    renderAvatarSelector();

    if (inventario) {
        inventario.innerHTML = `
            <h3>${t("mypokemon_login_required_title")}</h3>
            <p>${t("mypokemon_login_required_inventory_text")}</p>
        `;
    }

    if (resumen) {
        resumen.innerHTML = "";
    }

    if (container) {
        container.innerHTML = `
            <div class="empty-box">
                <h3>${t("mypokemon_login_required_box_title")}</h3>
                <p>${t("mypokemon_login_required_box_text")}</p>
            </div>
        `;
    }
}

function renderResumenColeccion(resumenData) {
    const resumen = document.getElementById("resumenColeccion");
    if (!resumen) return;

    if (!resumenData) {
        resumen.innerHTML = "";
        return;
    }

    resumen.innerHTML = `
        <div class="resumen-card">
            <span>${t("mypokemon_summary_total")}</span>
            <strong>${resumenData.total_capturados} / ${resumenData.total_pokedex}</strong>
        </div>
        <div class="resumen-card">
            <span>${t("mypokemon_summary_shiny")}</span>
            <strong>${resumenData.total_shiny} / ${resumenData.total_pokemon_tabla}</strong>
        </div>
        <div class="resumen-card">
            <span>${t("mypokemon_summary_progress")}</span>
            <strong>${resumenData.avance}%</strong>
        </div>
    `;
}

function renderInventarioUsuario(items = []) {
    const inventario = document.getElementById("inventarioUsuario");
    if (!inventario) return;

    const lista = Array.isArray(items) ? items : [];
    const boosters = lista.filter(esBoosterBatallaMyPokemon);
    const itemsGenerales = lista.filter(item => !esBoosterBatallaMyPokemon(item));
    const boostersActivos = Object.values(BATTLE_BOOSTER_CONFIG_MyPokemon)
        .map(config => ({ config, beneficio: obtenerBeneficioActivoMyPokemon(config.benefitCode) }))
        .filter(entry => !!entry.beneficio);

    if (!lista.length && !boostersActivos.length) {
        inventario.innerHTML = `
            <h3>${t("mypokemon_inventory_title")}</h3>
            <p>${t("mypokemon_inventory_empty")}</p>
        `;
        return;
    }

    inventario.innerHTML = `
        <div class="inventory-topbar">
            <div>
                <h3>${t("mypokemon_inventory_title")}</h3>
                <p>${escapeHtmlMyPokemon(tMyPokemon("mypokemon_inventory_helper", "Use your items here and activate battle boosters manually."))}</p>
            </div>
        </div>

        ${boostersActivos.length ? `
            <div class="inventory-boosters-active-grid">
                ${boostersActivos.map(entry => construirTarjetaBoosterActivaMyPokemon(entry.config, entry.beneficio)).join("")}
            </div>
        ` : ""}

        ${boosters.length ? `
            <div class="inventory-booster-grid">
                ${boosters.map(item => construirCardBoosterInventarioMyPokemon(item)).join("")}
            </div>
        ` : ""}

        ${itemsGenerales.length ? `
            <div class="inventario-lista">
                ${itemsGenerales.map(i => `
                    <span class="item-chip item-chip-con-icono">
                        <img src="${obtenerImagenItemInventario(i.nombre, i.item_codigo || i.codigo || "")}" alt="${traducirNombreItemMyPokemon(i.nombre, i.item_codigo || i.codigo || "")}">
                        <span>${traducirNombreItemMyPokemon(i.nombre, i.item_codigo || i.codigo || "")} x${i.cantidad}</span>
                    </span>
                `).join("")}
            </div>
        ` : (!boosters.length ? `<p>${escapeHtmlMyPokemon(tMyPokemon("mypokemon_inventory_only_boosters", "Only battle boosters are available right now."))}</p>` : "")}
    `;
}

async function obtenerResumenPokedexUsuario(usuarioId) {
    try {
        return await fetchJson(`${API_BASE}/pokedex/resumen/${usuarioId}`);
    } catch (error) {
        console.error("Error en obtenerResumenPokedexUsuario:", error);
        return null;
    }
}

async function cambiarAvatarSeleccionado(avatarId) {
    if (avatarActualizandoMyPokemon) return;

    if (!usuarioAutenticadoMyPokemon()) {
        mostrarMensajeEvolucion(t("mypokemon_login_required_action"), "error");
        return;
    }

    const avatarNormalizado = normalizarAvatarIdMyPokemon(avatarId);
    const actual = obtenerAvatarActualUsuarioMyPokemon();

    if (avatarNormalizado === actual) return;

    const usuarioAnterior = normalizarUsuarioMyPokemon(
        usuarioActualMyPokemon || getUsuarioLocal() || { avatar_id: actual }
    );

    avatarActualizandoMyPokemon = true;

    usuarioActualMyPokemon = normalizarUsuarioMyPokemon({
        ...(usuarioAnterior || {}),
        avatar_id: avatarNormalizado
    });

    asegurarAvatarVisibleEnCarrusel(avatarNormalizado);
    renderAvatarSelector();

    try {
        const data = await actualizarAvatarUsuarioActual(avatarNormalizado);

        if (data?.usuario) {
            usuarioActualMyPokemon = normalizarUsuarioMyPokemon(data.usuario);
        } else {
            usuarioActualMyPokemon = normalizarUsuarioMyPokemon({
                ...(usuarioAnterior || {}),
                avatar_id: avatarNormalizado
            });
        }

        mostrarMensajeEvolucion(
            tMyPokemon("mypokemon_avatar_updated", "Avatar updated successfully"),
            "ok"
        );
    } catch (error) {
        console.error("Error actualizando avatar:", error);

        usuarioActualMyPokemon = usuarioAnterior;

        mostrarMensajeEvolucion(
            tMyPokemon("mypokemon_avatar_update_error", "Could not update the avatar"),
            "error"
        );
    } finally {
        avatarActualizandoMyPokemon = false;
        asegurarAvatarVisibleEnCarrusel(obtenerAvatarActualUsuarioMyPokemon());
        renderAvatarSelector();
    }
}

async function cargarDatosBaseMyPokemon({ forzar = false } = {}) {
    cargandoMyPokemonEnCurso = true;

    try {
        if (!usuarioAutenticadoMyPokemon()) {
            usuarioActualMyPokemon = null;
            misPokemonData = [];
            estadosEvolucionCache.clear();
            limpiarCacheMyPokemon();
            cerrarModalMovimientosPokemon();
            renderEstadoSinSesion();
            return false;
        }

        if (!forzar) {
            const cachePokemon = leerCacheJSON(MY_POKEMON_CACHE_KEY, null);
            const cacheItems = leerCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, null);
            const cacheResumen = leerCacheJSON(MY_POKEMON_RESUMEN_CACHE_KEY, null);
            const cacheBeneficios = leerCacheJSON(MY_POKEMON_BENEFITS_CACHE_KEY, null);

            if (Array.isArray(cachePokemon)) {
                misPokemonData = cachePokemon;
                beneficiosActivosMyPokemon = Array.isArray(cacheBeneficios) ? cacheBeneficios : [];
                renderAvatarSelector();
                renderInventarioUsuario(Array.isArray(cacheItems) ? cacheItems : []);
                renderResumenColeccion(cacheResumen);
                aplicarFiltrosMisPokemon();
            }
        }

        const usuario = await obtenerUsuarioActual();

        if (!usuario || !usuario.id) {
            usuarioActualMyPokemon = null;
            misPokemonData = [];
            estadosEvolucionCache.clear();
            limpiarCacheMyPokemon();
            cerrarModalMovimientosPokemon();
            renderEstadoSinSesion();
            return false;
        }

        usuarioActualMyPokemon = normalizarUsuarioMyPokemon(usuario);
        renderAvatarSelector();

        if (forzar) {
            estadosEvolucionCache.clear();
        }

        const [pokemons, items, resumenData, beneficios] = await Promise.all([
            obtenerPokemonUsuarioActual(),
            obtenerItemsUsuarioActual(),
            obtenerResumenPokedexUsuario(usuario.id),
            obtenerBeneficiosActivosSeguroMyPokemon()
        ]);

        misPokemonData = Array.isArray(pokemons) ? pokemons : [];
        beneficiosActivosMyPokemon = Array.isArray(beneficios) ? beneficios : [];

        guardarCacheJSON(MY_POKEMON_CACHE_KEY, misPokemonData);
        guardarCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, Array.isArray(items) ? items : []);
        guardarCacheJSON(MY_POKEMON_RESUMEN_CACHE_KEY, resumenData || null);
        guardarCacheJSON(MY_POKEMON_BENEFITS_CACHE_KEY, beneficiosActivosMyPokemon);

        renderAvatarSelector();
        renderInventarioUsuario(Array.isArray(items) ? items : []);
        renderResumenColeccion(resumenData);
        aplicarFiltrosMisPokemon();

        return true;
    } catch (error) {
        console.error("Error cargando datos base de My Pokemon:", error);
        return false;
    } finally {
        cargandoMyPokemonEnCurso = false;
    }
}

function aplicarFiltrosMisPokemon() {
    const buscar = document.getElementById("buscarMiPokemon");
    const filtroTipo = document.getElementById("filtroMiTipo");
    const filtroRareza = document.getElementById("filtroMiRareza");
    const orden = document.getElementById("ordenMisPokemon");

    const texto = buscar ? normalizarTextoMyPokemon(buscar.value) : "";
    const tipo = filtroTipo ? normalizarTextoMyPokemon(filtroTipo.value) : "";
    const rareza = filtroRareza ? filtroRareza.value.toLowerCase().trim() : "";
    const ordenValor = orden ? orden.value : "pokemon_id_asc";

    let filtrados = [...misPokemonData];

    filtrados = filtrados.filter(p => {
        const nombre = normalizarTextoMyPokemon(p.nombre || "");
        const tipoPokemon = normalizarTextoMyPokemon(p.tipo || "");
        const esShiny = p.es_shiny === true;

        const coincideNombre = nombre.includes(texto);
        const coincideTipo = tipo === "" || tipoPokemon.includes(tipo);

        let coincideRareza = true;
        if (rareza === "normal") coincideRareza = !esShiny;
        if (rareza === "shiny") coincideRareza = esShiny;

        return coincideNombre && coincideTipo && coincideRareza;
    });

    switch (ordenValor) {
        case "reciente":
            filtrados.sort((a, b) => b.id - a.id);
            break;
        case "nivel_desc":
            filtrados.sort((a, b) => b.nivel - a.nivel);
            break;
        case "ataque_desc":
            filtrados.sort((a, b) => b.ataque - a.ataque);
            break;
        case "defensa_desc":
            filtrados.sort((a, b) => b.defensa - a.defensa);
            break;
        case "hp_desc":
            filtrados.sort((a, b) => b.hp_max - a.hp_max);
            break;
        case "pokemon_id_asc":
        default:
            filtrados.sort((a, b) => a.pokemon_id - b.pokemon_id);
            break;
    }

    renderizarMisPokemon(filtrados);
}

async function obtenerEstadoEvolucion(usuarioPokemonId, { forzar = false } = {}) {
    if (!forzar && estadosEvolucionCache.has(usuarioPokemonId)) {
        return estadosEvolucionCache.get(usuarioPokemonId);
    }

    if (!usuarioAutenticadoMyPokemon()) {
        return null;
    }

    try {
        const data = await fetchAuth(`${API_BASE}/usuario/pokemon/${usuarioPokemonId}/evolucion`);
        estadosEvolucionCache.set(usuarioPokemonId, data);
        return data;
    } catch (error) {
        if (esErrorAuthMyPokemon(error)) {
            manejarErrorAuthMyPokemon();
            return null;
        }

        console.error("Error obteniendo estado de evolución:", error);
        return null;
    }
}

function estadoEvolucionVisual(evoData) {
    if (evoData?.puede_evolucionar && evoData.listo_ahora) {
        return {
            clase: evoData.tipo === "nivel" ? "btn-evolucionar-listo" : "btn-evolucionar-item",
            texto: evoData.tipo === "nivel"
                ? t("mypokemon_evolve_ready_level")
                : t("mypokemon_evolve_ready_item")
        };
    }

    if (evoData?.puede_evolucionar && !evoData.listo_ahora) {
        return {
            clase: "btn-evolucionar",
            texto: evoData.tipo === "item"
                ? t("mypokemon_evolve_requires_item")
                : t("mypokemon_evolve_default")
        };
    }

    if (evoData && evoData.puede_evolucionar === false) {
        return {
            clase: "btn-evolucionar",
            texto: t("mypokemon_evolve_no_evolution")
        };
    }

    return {
        clase: "btn-evolucionar",
        texto: t("mypokemon_evolve_default")
    };
}

function construirCardPokemon(p, evoData = null) {
    const imagen = obtenerImagenPokemonColeccion(p.pokemon_id, p.es_shiny === true);
    const porcentajeExp = Math.min(100, Math.floor((p.experiencia / Math.max(1, (p.nivel * 50))) * 100));
    const estado = estadoEvolucionVisual(evoData);
    const nombreSeguro = String(p.nombre).replace(/'/g, "\\'");
    const tipoTraducido = traducirTipoPokemonMyPokemon(p.tipo || "");

    return `
        <div
            class="pokemon-card"
            data-tipo="${escapeHtmlMyPokemon(p.tipo)}"
            data-nombre="${escapeHtmlMyPokemon(p.nombre)}"
            data-shiny="${p.es_shiny ? "true" : "false"}"
            data-usuario-pokemon-id="${p.id}"
        >
            <div class="pokemon-card-header">
                <h3>#${p.pokemon_id} ${escapeHtmlMyPokemon(p.nombre)}</h3>
                ${p.es_shiny
                    ? `<span class="badge-shiny">${t("mypokemon_badge_shiny")}</span>`
                    : `<span class="badge-normal">${t("mypokemon_badge_normal")}</span>`}
            </div>

            <div class="pokemon-card-image">
                <img src="${imagen}" alt="${escapeHtmlMyPokemon(p.nombre)}" loading="lazy" decoding="async">
            </div>

            <div class="tipo">${escapeHtmlMyPokemon(tipoTraducido)}</div>

            <div class="pokemon-stats">
                <p><strong>${t("mypokemon_stat_level")}:</strong> ${p.nivel}</p>
                <p><strong>${t("mypokemon_stat_hp")}:</strong> ${p.hp_actual}/${p.hp_max}</p>
                <p><strong>${t("mypokemon_stat_attack")}:</strong> ${p.ataque}</p>
                <p><strong>${t("mypokemon_stat_defense")}:</strong> ${p.defensa}</p>
                <p><strong>${t("mypokemon_stat_speed")}:</strong> ${p.velocidad}</p>
            </div>

            <div class="exp-box">
                <div class="exp-label">${t("mypokemon_exp_label")}: ${p.experiencia} / ${p.nivel * 50}</div>
                <div class="exp-bar">
                    <div class="exp-fill" style="width:${porcentajeExp}%"></div>
                </div>
            </div>

            <div class="pokemon-actions">
                <button class="${estado.clase}" data-evo-btn="${p.id}" onclick="manejarEvolucion(${p.id}, '${nombreSeguro}')">
                    ${estado.texto}
                </button>

                <button class="btn-evolucionar" onclick="abrirModalMovimientosPokemon(${p.id}, '${nombreSeguro}')">
                    ${tMyPokemon("mypokemon_moves_button", "Moves")}
                </button>

                <button class="btn-soltar" onclick="abrirModalSoltar(${p.id}, '${nombreSeguro}')">
                    ${t("mypokemon_release_button")}
                </button>
            </div>
        </div>
    `;
}

function actualizarBotonEvolucionCard(usuarioPokemonId, evoData) {
    const btn = document.querySelector(`[data-evo-btn="${usuarioPokemonId}"]`);
    if (!btn) return;

    const estado = estadoEvolucionVisual(evoData);
    btn.className = estado.clase;
    btn.textContent = estado.texto;
}

async function hidratarEstadosEvolucion() {
    return;
}

function renderizarMisPokemon(pokemons) {
    const container = document.getElementById("misPokemonContainer");
    if (!container) return;

    if (!usuarioAutenticadoMyPokemon()) {
        renderEstadoSinSesion();
        return;
    }

    if (!pokemons.length) {
        const sinColeccion = misPokemonData.length === 0;

        container.innerHTML = sinColeccion
            ? `
                <div class="empty-box">
                    <h3>${t("mypokemon_empty_title")}</h3>
                    <p>${t("mypokemon_empty_text")}</p>
                </div>
            `
            : `
                <div class="empty-box">
                    <h3>${t("mypokemon_no_results_title")}</h3>
                    <p>${t("mypokemon_no_results_text")}</p>
                </div>
            `;
        return;
    }

    container.innerHTML = pokemons.map(p => {
        const evoCache = estadosEvolucionCache.get(p.id) || null;
        return construirCardPokemon(p, evoCache);
    }).join("");
}

function abrirModalSoltar(usuarioPokemonId, nombrePokemon) {
    pokemonPendienteSoltar = { usuarioPokemonId, nombrePokemon };

    const modal = document.getElementById("modalConfirmarSoltar");
    const texto = document.getElementById("textoConfirmarSoltar");
    const btn = document.getElementById("btnConfirmarSoltar");

    if (texto) {
        texto.textContent = `${t("mypokemon_release_modal_text")} ${nombrePokemon}?`;
    }

    if (btn) {
        btn.textContent = t("mypokemon_release_confirm");
        btn.onclick = confirmarSoltarPokemon;
    }

    if (modal) {
        modal.classList.remove("oculto");
    }
}

function cerrarModalSoltar() {
    const modal = document.getElementById("modalConfirmarSoltar");
    if (modal) modal.classList.add("oculto");
    pokemonPendienteSoltar = null;
}

async function confirmarSoltarPokemon() {
    if (!pokemonPendienteSoltar) return;

    const usuario = usuarioActualMyPokemon || await obtenerUsuarioActual();
    if (!usuario?.id) {
        cerrarModalSoltar();
        mostrarMensajeEvolucion(t("mypokemon_login_required_action"), "error");
        return;
    }

    try {
        const data = await fetchAuth(`${API_BASE}/usuario/soltar-pokemon`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_pokemon_id: pokemonPendienteSoltar.usuarioPokemonId
            })
        });

        cerrarModalSoltar();
        mostrarMensajeEvolucion(data.mensaje || t("mypokemon_release_success"), "ok");

        const [pokemons, items, resumenData, beneficios] = await Promise.all([
            obtenerPokemonUsuarioActual(),
            obtenerItemsUsuarioActual(),
            obtenerResumenPokedexUsuario(usuario.id),
            obtenerBeneficiosActivosSeguroMyPokemon()
        ]);

        misPokemonData = Array.isArray(pokemons) ? pokemons : [];
        guardarCacheJSON(MY_POKEMON_CACHE_KEY, misPokemonData);

        guardarCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, Array.isArray(items) ? items : []);
        guardarCacheJSON(MY_POKEMON_RESUMEN_CACHE_KEY, resumenData || null);

        renderInventarioUsuario(Array.isArray(items) ? items : []);
        renderResumenColeccion(resumenData);

        estadosEvolucionCache.clear();
        movimientosPokemonCache.delete(Number(pokemonPendienteSoltar?.usuarioPokemonId || 0));

        if (modalMovimientosActual && Number(modalMovimientosActual.usuarioPokemonId) === Number(pokemonPendienteSoltar?.usuarioPokemonId || 0)) {
            cerrarModalMovimientosPokemon();
        }

        aplicarFiltrosMisPokemon();
    } catch (error) {
        console.error("Error al soltar Pokémon:", error);
        cerrarModalSoltar();

        if (esErrorAuthMyPokemon(error)) {
            manejarErrorAuthMyPokemon();
            mostrarMensajeEvolucion(t("mypokemon_login_required_action"), "error");
            return;
        }

        mostrarMensajeEvolucion(error.message || t("mypokemon_release_error"), "error");
    }
}

async function manejarEvolucion(usuarioPokemonId, nombrePokemon) {
    try {
        const data = await obtenerEstadoEvolucion(usuarioPokemonId);

        if (!data?.puede_evolucionar) {
            mostrarMensajeEvolucion(data?.motivo || t("mypokemon_evolve_not_available"), "error");
            return;
        }

        if (data.tipo === "nivel") {
            mostrarModalEvolucionNivel(usuarioPokemonId, nombrePokemon, data);
            return;
        }

        if (data.tipo === "item") {
            mostrarModalEvolucionItem(usuarioPokemonId, nombrePokemon, data);
            return;
        }
    } catch (error) {
        console.error("Error manejando evolución:", error);
        mostrarMensajeEvolucion(t("mypokemon_evolve_check_error"), "error");
    }
}

function mostrarModalEvolucionNivel(usuarioPokemonId, nombrePokemon, data) {
    const modal = document.getElementById("modalEvolucion");
    const contenido = document.getElementById("contenidoModalEvolucion");

    const opciones = Array.isArray(data?.opciones) ? data.opciones : [];
    const opcionNivel = opciones.find(op => op.tipo === "nivel") || opciones[0];
    if (!opcionNivel || !contenido || !modal) return;

    modalEvolucionActual = {
        tipo: "nivel",
        usuarioPokemonId,
        nombrePokemon,
        data
    };

    const imagenActual = obtenerImagenPokemonModal(data.pokemon_id);
    const imagenEvolucion = obtenerImagenPokemonModal(opcionNivel.evolucion_id || opcionNivel.evoluciona_a);

    const nivelActual = data.nivel_actual || 0;
    const nivelRequerido = opcionNivel.nivel_requerido || 0;
    const listo = opcionNivel.listo === true;

    contenido.innerHTML = `
        <h2 class="titulo-modal-evolucion">${t("mypokemon_evolve_level_title")}</h2>
        <p class="subtitulo-modal-evolucion">${t("mypokemon_evolve_level_subtitle")}</p>

        <div class="evolucion-preview-horizontal">
            <div class="evolucion-card-pokemon">
                <img src="${imagenActual}" alt="${nombrePokemon}">
                <p>${nombrePokemon}</p>
            </div>

            <div class="evolucion-flecha-grande">➜</div>

            <div class="evolucion-card-pokemon evolucion-destino ${listo ? "evolucion-lista" : ""}">
                <img src="${imagenEvolucion}" alt="${opcionNivel.evolucion_nombre}">
                <p>${opcionNivel.evolucion_nombre}</p>
            </div>
        </div>

        <div class="item-evolucion-card">
            <div class="item-evolucion-top">
                <div>
                    <h3>${t("mypokemon_evolve_required_level")}</h3>
                    <p>${t("mypokemon_evolve_current_level")}: ${nivelActual}</p>
                    <p>${t("mypokemon_evolve_needed_level")}: ${nivelRequerido}</p>
                </div>
            </div>
        </div>

        <p class="evolucion-detalle ${listo ? "ok" : "error"}">
            ${listo
                ? t("mypokemon_evolve_level_ready_text")
                : t("mypokemon_evolve_level_not_ready_text")}
        </p>

        <div class="evolucion-botones">
            <button class="btn-cancelar-modal" onclick="cerrarModalEvolucion()">${t("battle_cancel")}</button>
            <button class="btn-confirmar-evolucion" onclick="confirmarEvolucionNivel(${usuarioPokemonId})" ${!listo ? "disabled" : ""}>
                ${t("mypokemon_evolve_confirm")}
            </button>
        </div>
    `;

    modal.classList.remove("oculto");
}

function mostrarModalEvolucionItem(usuarioPokemonId, nombrePokemon, data) {
    const modal = document.getElementById("modalEvolucion");
    const contenido = document.getElementById("contenidoModalEvolucion");

    const opciones = Array.isArray(data?.opciones) ? data.opciones : [];
    const opcionDisponible = opciones.find(op => op.tiene_item);
    const opcionMostrar = opcionDisponible || opciones[0];

    if (!opcionMostrar || !contenido || !modal) return;

    modalEvolucionActual = {
        tipo: "item",
        usuarioPokemonId,
        nombrePokemon,
        data
    };

    const imagenActual = obtenerImagenPokemonModal(data.pokemon_id);
    const imagenEvolucion = obtenerImagenPokemonModal(opcionMostrar.evoluciona_a);
    const imagenItem = obtenerImagenItemModal(opcionMostrar.item_nombre);
    const tieneItem = opcionMostrar.tiene_item;
    const itemTraducido = traducirNombreItemMyPokemon(opcionMostrar.item_nombre);

    contenido.innerHTML = `
        <h2 class="titulo-modal-evolucion">${t("mypokemon_evolve_item_title")}</h2>
        <p class="subtitulo-modal-evolucion">${t("mypokemon_evolve_item_subtitle")}</p>

        <div class="evolucion-preview-horizontal">
            <div class="evolucion-card-pokemon">
                <img src="${imagenActual}" alt="${nombrePokemon}">
                <p>${nombrePokemon}</p>
            </div>

            <div class="evolucion-flecha-grande">➜</div>

            <div class="evolucion-card-pokemon evolucion-destino ${tieneItem ? "evolucion-lista" : ""}">
                <img src="${imagenEvolucion}" alt="${opcionMostrar.evolucion_nombre}">
                <p>${opcionMostrar.evolucion_nombre}</p>
            </div>
        </div>

        <div class="item-evolucion-card">
            <div class="item-evolucion-top">
                <img src="${imagenItem}" alt="${itemTraducido}">
                <div>
                    <h3>${itemTraducido}</h3>
                    <p>${t("mypokemon_item_you_have")}: x${opcionMostrar.cantidad}</p>
                </div>
            </div>
        </div>

        <p class="evolucion-detalle ${tieneItem ? "ok" : "error"}">
            ${tieneItem
                ? t("mypokemon_evolve_item_ready_text")
                : t("mypokemon_evolve_item_missing_text")}
        </p>

        <div class="evolucion-botones">
            <button class="btn-cancelar-modal" onclick="cerrarModalEvolucion()">${t("battle_cancel")}</button>
            <button class="btn-usar-item" onclick="confirmarEvolucionItem(${usuarioPokemonId}, ${opcionMostrar.item_id})" ${!tieneItem ? "disabled" : ""}>
                <img src="${imagenItem}" class="icon-item-btn" alt="${itemTraducido}">
                ${t("mypokemon_use_item")} ${itemTraducido}
            </button>
        </div>
    `;

    modal.classList.remove("oculto");
}

async function confirmarEvolucionNivel(usuarioPokemonId) {
    const usuario = usuarioActualMyPokemon || await obtenerUsuarioActual();
    if (!usuario?.id) {
        cerrarModalEvolucion();
        mostrarMensajeEvolucion(t("mypokemon_login_required_action"), "error");
        return;
    }

    try {
        limpiarMensajeEvolucion();

        const evoData = await fetchAuth(`${API_BASE}/pokemon/evolucionar-nivel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_pokemon_id: usuarioPokemonId
            })
        });

        cerrarModalEvolucion();

        if (evoData.mensaje && (
            evoData.mensaje.toLowerCase().includes("aún no puede") ||
            evoData.mensaje.toLowerCase().includes("no encontrado") ||
            evoData.mensaje.toLowerCase().includes("no puede")
        )) {
            mostrarMensajeEvolucion(evoData.mensaje, "error");
            return;
        }

        mostrarMensajeEvolucion(evoData.mensaje || t("mypokemon_evolve_success"), "ok");

        const pokemons = await obtenerPokemonUsuarioActual();
        misPokemonData = Array.isArray(pokemons) ? pokemons : [];
        guardarCacheJSON(MY_POKEMON_CACHE_KEY, misPokemonData);

        estadosEvolucionCache.clear();
        movimientosPokemonCache.delete(Number(usuarioPokemonId));

        if (modalMovimientosActual && Number(modalMovimientosActual.usuarioPokemonId) === Number(usuarioPokemonId)) {
            await abrirModalMovimientosPokemon(usuarioPokemonId, modalMovimientosActual?.nombrePokemon || "Pokémon", { forzar: true });
        }

        aplicarFiltrosMisPokemon();
    } catch (error) {
        console.error("Error evolucionando por nivel:", error);
        cerrarModalEvolucion();

        if (esErrorAuthMyPokemon(error)) {
            manejarErrorAuthMyPokemon();
            mostrarMensajeEvolucion(t("mypokemon_login_required_action"), "error");
            return;
        }

        mostrarMensajeEvolucion(error.message || t("mypokemon_evolve_error"), "error");
    }
}

async function confirmarEvolucionItem(usuarioPokemonId, itemId) {
    const usuario = usuarioActualMyPokemon || await obtenerUsuarioActual();
    if (!usuario?.id) {
        cerrarModalEvolucion();
        mostrarMensajeEvolucion(t("mypokemon_login_required_action"), "error");
        return;
    }

    try {
        limpiarMensajeEvolucion();

        const evoData = await fetchAuth(`${API_BASE}/pokemon/evolucionar-item`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_pokemon_id: usuarioPokemonId,
                item_id: itemId
            })
        });

        cerrarModalEvolucion();

        if (evoData.mensaje && (
            evoData.mensaje.toLowerCase().includes("no tienes") ||
            evoData.mensaje.toLowerCase().includes("no encontrado") ||
            evoData.mensaje.toLowerCase().includes("no evoluciona")
        )) {
            mostrarMensajeEvolucion(evoData.mensaje, "error");
            return;
        }

        mostrarMensajeEvolucion(evoData.mensaje || t("mypokemon_evolve_success"), "ok");

        const [pokemons, items, beneficios] = await Promise.all([
            obtenerPokemonUsuarioActual(),
            obtenerItemsUsuarioActual(),
            obtenerBeneficiosActivosSeguroMyPokemon()
        ]);

        misPokemonData = Array.isArray(pokemons) ? pokemons : [];
        beneficiosActivosMyPokemon = Array.isArray(beneficios) ? beneficios : beneficiosActivosMyPokemon;
        guardarCacheJSON(MY_POKEMON_CACHE_KEY, misPokemonData);

        guardarCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, Array.isArray(items) ? items : []);
        guardarCacheJSON(MY_POKEMON_BENEFITS_CACHE_KEY, beneficiosActivosMyPokemon);
        renderInventarioUsuario(Array.isArray(items) ? items : []);

        estadosEvolucionCache.clear();
        movimientosPokemonCache.delete(Number(usuarioPokemonId));

        if (modalMovimientosActual && Number(modalMovimientosActual.usuarioPokemonId) === Number(usuarioPokemonId)) {
            await abrirModalMovimientosPokemon(usuarioPokemonId, modalMovimientosActual?.nombrePokemon || "Pokémon", { forzar: true });
        }

        aplicarFiltrosMisPokemon();
    } catch (error) {
        console.error("Error evolucionando por item:", error);
        cerrarModalEvolucion();

        if (esErrorAuthMyPokemon(error)) {
            manejarErrorAuthMyPokemon();
            mostrarMensajeEvolucion(t("mypokemon_login_required_action"), "error");
            return;
        }

        mostrarMensajeEvolucion(error.message || t("mypokemon_evolve_error"), "error");
    }
}

async function activarBoosterInventarioMyPokemon(itemCode) {
    const codigo = String(itemCode || "").trim().toLowerCase();
    const config = obtenerConfigBoosterBatallaMyPokemon(codigo);
    if (!config) return;

    if (!usuarioAutenticadoMyPokemon()) {
        mostrarMensajeEvolucion(t("mypokemon_login_required_action"), "error");
        return;
    }

    if (boosterActivandoCodigo) {
        return;
    }

    boosterActivandoCodigo = codigo;
    renderInventarioUsuario(leerCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, []));

    try {
        const data = await usarBoosterPago(codigo);
        const [items, beneficios] = await Promise.all([
            obtenerItemsUsuarioActual(),
            obtenerBeneficiosActivosSeguroMyPokemon()
        ]);

        beneficiosActivosMyPokemon = Array.isArray(beneficios) ? beneficios : [];
        guardarCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, Array.isArray(items) ? items : []);
        guardarCacheJSON(MY_POKEMON_BENEFITS_CACHE_KEY, beneficiosActivosMyPokemon);
        renderInventarioUsuario(Array.isArray(items) ? items : []);

        const restante = data?.consumo?.cantidad_restante;
        const beneficio = data?.beneficio || {};
        const nombreBooster = tMyPokemon(
            codigo === "booster_battle_exp_x2_24h" ? "mypokemon_booster_exp_name" : "mypokemon_booster_gold_name",
            config.titleFallback
        );
        const tiempo = formatearTiempoRestanteBeneficioMyPokemon(beneficio?.expira_en);
        mostrarMensajeEvolucion(
            tMyPokemon(
                "mypokemon_booster_activation_success",
                "{name} activated. Remaining charges: {charges}. Active for {time}.",
                {
                    name: nombreBooster,
                    charges: restante ?? 0,
                    time: tiempo,
                }
            ),
            "ok"
        );
    } catch (error) {
        console.error("Error activando booster:", error);

        if (esErrorAuthMyPokemon(error)) {
            manejarErrorAuthMyPokemon();
            mostrarMensajeEvolucion(t("mypokemon_login_required_action"), "error");
        } else {
            mostrarMensajeEvolucion(
                error.message || tMyPokemon("mypokemon_booster_activation_error", "Could not activate the booster"),
                "error"
            );
        }
    } finally {
        boosterActivandoCodigo = "";
        renderInventarioUsuario(leerCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, []));
    }
}

function configurarEventosInventarioMyPokemon() {
    const inventario = document.getElementById("inventarioUsuario");
    if (!inventario) return;

    inventario.addEventListener("click", async (event) => {
        const boton = event.target.closest("[data-use-booster]");
        if (!boton) return;

        const itemCode = boton.dataset.useBooster;
        if (!itemCode) return;

        await activarBoosterInventarioMyPokemon(itemCode);
    });
}

function cerrarModalEvolucion() {
    const modal = document.getElementById("modalEvolucion");
    const contenido = document.getElementById("contenidoModalEvolucion");

    if (modal) modal.classList.add("oculto");
    if (contenido) contenido.innerHTML = "";
    modalEvolucionActual = null;
}

async function cargarMisPokemon({ forzar = false } = {}) {
    await cargarDatosBaseMyPokemon({ forzar });
}

async function cargarItemsUsuario({ forzar = false } = {}) {
    if (!usuarioAutenticadoMyPokemon()) {
        renderEstadoSinSesion();
        return;
    }

    if (!forzar) {
        const itemsCache = leerCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, null);
        const benefitsCache = leerCacheJSON(MY_POKEMON_BENEFITS_CACHE_KEY, null);
        if (Array.isArray(itemsCache)) {
            beneficiosActivosMyPokemon = Array.isArray(benefitsCache) ? benefitsCache : beneficiosActivosMyPokemon;
            renderInventarioUsuario(itemsCache);
        }
    }

    try {
        const [items, beneficios] = await Promise.all([
            obtenerItemsUsuarioActual(),
            obtenerBeneficiosActivosSeguroMyPokemon()
        ]);
        beneficiosActivosMyPokemon = Array.isArray(beneficios) ? beneficios : beneficiosActivosMyPokemon;
        guardarCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, Array.isArray(items) ? items : []);
        guardarCacheJSON(MY_POKEMON_BENEFITS_CACHE_KEY, beneficiosActivosMyPokemon);
        renderInventarioUsuario(Array.isArray(items) ? items : []);
    } catch (error) {
        console.error("Error cargando items del usuario:", error);
    }
}

function cerrarMenuMobileMyPokemon() {
    const menuMobile = document.getElementById("menuMobile");
    if (menuMobile) {
        menuMobile.classList.remove("menu-open");
    }
}

function configurarSelectorIdiomaMyPokemon() {
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
}

function refrescarUIIdiomaMyPokemon() {
    if (typeof applyTranslations === "function") {
        applyTranslations();
    }

    renderAvatarSelector();

    const resumenCache = leerCacheJSON(MY_POKEMON_RESUMEN_CACHE_KEY, null);
    const itemsCache = leerCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, []);
    renderResumenColeccion(resumenCache);
    renderInventarioUsuario(Array.isArray(itemsCache) ? itemsCache : []);

    if (!usuarioAutenticadoMyPokemon()) {
        renderEstadoSinSesion();
    } else {
        aplicarFiltrosMisPokemon();
    }

    if (pokemonPendienteSoltar) {
        abrirModalSoltar(pokemonPendienteSoltar.usuarioPokemonId, pokemonPendienteSoltar.nombrePokemon);
    }

    if (modalEvolucionActual?.tipo === "nivel") {
        mostrarModalEvolucionNivel(
            modalEvolucionActual.usuarioPokemonId,
            modalEvolucionActual.nombrePokemon,
            modalEvolucionActual.data
        );
    }

    if (modalEvolucionActual?.tipo === "item") {
        mostrarModalEvolucionItem(
            modalEvolucionActual.usuarioPokemonId,
            modalEvolucionActual.nombrePokemon,
            modalEvolucionActual.data
        );
    }

    if (modalMovimientosActual) {
        renderModalMovimientosContenido();
    }
}

function configurarEventosAvatarSelector() {
    const section = document.getElementById("avatarSelectorSection");
    if (!section) return;

    section.addEventListener("click", async (event) => {
        const btnNav = event.target.closest("[data-avatar-nav]");
        if (btnNav) {
            const direccion = Number(btnNav.dataset.avatarNav || 0);
            moverCarruselAvatar(direccion);
            return;
        }

        const btnAvatar = event.target.closest("[data-avatar-option]");
        if (!btnAvatar) return;

        const avatarId = btnAvatar.dataset.avatarOption;
        if (!avatarId) return;

        await cambiarAvatarSeleccionado(avatarId);
    });
}

function configurarEventosSesionMyPokemon() {
    document.addEventListener("usuarioSesionActualizada", async (event) => {
        const usuario = event.detail?.usuario || null;
        usuarioActualMyPokemon = normalizarUsuarioMyPokemon(usuario);

        if (cargandoMyPokemonEnCurso) {
            renderAvatarSelector();
            return;
        }

        if (!usuario) {
            misPokemonData = [];
            estadosEvolucionCache.clear();
            limpiarCacheMyPokemon();
            cerrarModalMovimientosPokemon();
            renderEstadoSinSesion();
            return;
        }

        renderAvatarSelector();
        await cargarMisPokemon({ forzar: true });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    configurarSelectorIdiomaMyPokemon();
    configurarEventosAvatarSelector();
    configurarEventosInventarioMyPokemon();
    configurarEventosMovimientosPokemon();
    configurarEventosSesionMyPokemon();
    renderAvatarSelector();
    cargarMisPokemon();

    const buscar = document.getElementById("buscarMiPokemon");
    const filtroTipo = document.getElementById("filtroMiTipo");
    const filtroRareza = document.getElementById("filtroMiRareza");
    const orden = document.getElementById("ordenMisPokemon");

    if (buscar) buscar.addEventListener("input", aplicarFiltrosMisPokemon);
    if (filtroTipo) filtroTipo.addEventListener("change", aplicarFiltrosMisPokemon);
    if (filtroRareza) filtroRareza.addEventListener("change", aplicarFiltrosMisPokemon);
    if (orden) orden.addEventListener("change", aplicarFiltrosMisPokemon);

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            cerrarMenuMobileMyPokemon();
        }
    });
});

document.addEventListener("languageChanged", () => {
    refrescarUIIdiomaMyPokemon();
});

function normalizarTextoMyPokemon(valor = "") {
    return String(valor || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function escapeHtmlMyPokemon(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

window.cerrarModalEvolucion = cerrarModalEvolucion;
window.cerrarModalSoltar = cerrarModalSoltar;
window.abrirModalSoltar = abrirModalSoltar;
window.confirmarSoltarPokemon = confirmarSoltarPokemon;
window.manejarEvolucion = manejarEvolucion;
window.confirmarEvolucionNivel = confirmarEvolucionNivel;
window.confirmarEvolucionItem = confirmarEvolucionItem;