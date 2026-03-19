let misPokemonData = [];
let usuarioActualMyPokemon = null;
let pokemonPendienteSoltar = null;
let estadosEvolucionCache = new Map();
let modalEvolucionActual = null;
let cargandoMyPokemonEnCurso = false;
let avatarActualizandoMyPokemon = false;

const MY_POKEMON_CACHE_KEY = "mastersmon_mypokemon_cache";
const MY_POKEMON_ITEMS_CACHE_KEY = "mastersmon_mypokemon_items_cache";
const MY_POKEMON_RESUMEN_CACHE_KEY = "mastersmon_mypokemon_resumen_cache";
const MY_POKEMON_AVATAR_DEFAULT = "steven";
const MY_POKEMON_AVATAR_REGEX = /^[a-z0-9_-]{1,60}$/;

const AVATARES_DISPONIBLES = [
    { id: "steven", nombre: "Steven" },
    { id: "steven_1", nombre: "Steven 2" },
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
    } catch (error) {
        console.warn("No se pudo limpiar cache My Pokemon:", error);
    }
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

function obtenerImagenPokemonColeccion(pokemonId, esShiny = false) {
    return esShiny
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
}

function obtenerImagenItemInventario(nombreItem) {
    const imagenes = {
        "Poke Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
        "Super Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
        "Ultra Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png",
        "Master Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png",
        "Pocion": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png",
        "Super Pocion": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-potion.png",
        "Piedra Fuego": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png",
        "Piedra Agua": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png",
        "Piedra Trueno": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png",
        "Piedra Hoja": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leaf-stone.png",
        "Piedra Lunar": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moon-stone.png"
    };

    return imagenes[nombreItem] || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
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

function traducirNombreItemMyPokemon(nombreItem = "") {
    const mapa = {
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

    const key = mapa[nombreItem];
    return key ? t(key) : nombreItem;
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

    section.innerHTML = `
        <div class="avatar-studio-shell ${avatarActualizandoMyPokemon ? "updating" : ""}">
            <div class="avatar-studio-top">
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

            <div class="avatar-studio-grid">
                ${AVATARES_DISPONIBLES.map(avatar => {
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
                            <div class="avatar-option-preview">
                                <img
                                    src="${obtenerRutaAvatarMyPokemon(avatar.id)}"
                                    alt="${escapeHtmlMyPokemon(avatar.nombre)}"
                                    onerror="this.onerror=null;this.src='img/avatars/${MY_POKEMON_AVATAR_DEFAULT}.png';"
                                >
                            </div>
                            <span class="avatar-option-name">${escapeHtmlMyPokemon(avatar.nombre)}</span>
                            ${activo ? `<span class="avatar-option-badge">${tMyPokemon("mypokemon_avatar_selected", "Selected")}</span>` : ""}
                        </button>
                    `;
                }).join("")}
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

    if (!items.length) {
        inventario.innerHTML = `
            <h3>${t("mypokemon_inventory_title")}</h3>
            <p>${t("mypokemon_inventory_empty")}</p>
        `;
        return;
    }

    inventario.innerHTML = `
        <h3>${t("mypokemon_inventory_title")}</h3>
        <div class="inventario-lista">
            ${items.map(i => `
                <span class="item-chip item-chip-con-icono">
                    <img src="${obtenerImagenItemInventario(i.nombre)}" alt="${traducirNombreItemMyPokemon(i.nombre)}">
                    <span>${traducirNombreItemMyPokemon(i.nombre)} x${i.cantidad}</span>
                </span>
            `).join("")}
        </div>
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

    avatarActualizandoMyPokemon = true;
    renderAvatarSelector();

    try {
        const data = await actualizarAvatarUsuarioActual(avatarNormalizado);
        if (data?.usuario) {
            usuarioActualMyPokemon = normalizarUsuarioMyPokemon(data.usuario);
        } else {
            usuarioActualMyPokemon = normalizarUsuarioMyPokemon(getUsuarioLocal());
        }

        renderAvatarSelector();
        mostrarMensajeEvolucion(
            tMyPokemon("mypokemon_avatar_updated", "Avatar updated successfully"),
            "ok"
        );
    } catch (error) {
        console.error("Error actualizando avatar:", error);
        renderAvatarSelector();
        mostrarMensajeEvolucion(
            tMyPokemon("mypokemon_avatar_update_error", "Could not update the avatar"),
            "error"
        );
    } finally {
        avatarActualizandoMyPokemon = false;
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
            renderEstadoSinSesion();
            return false;
        }

        if (!forzar) {
            const cachePokemon = leerCacheJSON(MY_POKEMON_CACHE_KEY, null);
            const cacheItems = leerCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, null);
            const cacheResumen = leerCacheJSON(MY_POKEMON_RESUMEN_CACHE_KEY, null);

            if (Array.isArray(cachePokemon)) {
                misPokemonData = cachePokemon;
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
            renderEstadoSinSesion();
            return false;
        }

        usuarioActualMyPokemon = normalizarUsuarioMyPokemon(usuario);
        renderAvatarSelector();

        if (forzar) {
            estadosEvolucionCache.clear();
        }

        const [pokemons, items, resumenData] = await Promise.all([
            obtenerPokemonUsuarioActual(),
            obtenerItemsUsuarioActual(),
            obtenerResumenPokedexUsuario(usuario.id)
        ]);

        misPokemonData = Array.isArray(pokemons) ? pokemons : [];

        guardarCacheJSON(MY_POKEMON_CACHE_KEY, misPokemonData);
        guardarCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, Array.isArray(items) ? items : []);
        guardarCacheJSON(MY_POKEMON_RESUMEN_CACHE_KEY, resumenData || null);

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

    try {
        const data = await fetchJson(`${API_BASE}/usuario/pokemon/${usuarioPokemonId}/evolucion`);
        estadosEvolucionCache.set(usuarioPokemonId, data);
        return data;
    } catch (error) {
        console.error("Error revisando evolución:", error);
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

async function hidratarEstadosEvolucion(pokemons) {
    if (!Array.isArray(pokemons) || !pokemons.length) return;

    const tareas = pokemons.map(async (p) => {
        if (estadosEvolucionCache.has(p.id)) {
            actualizarBotonEvolucionCard(p.id, estadosEvolucionCache.get(p.id));
            return;
        }

        const evoData = await obtenerEstadoEvolucion(p.id);
        actualizarBotonEvolucionCard(p.id, evoData);
    });

    await Promise.allSettled(tareas);
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

    void hidratarEstadosEvolucion(pokemons);
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
        const data = await fetchJson(`${API_BASE}/usuario/soltar-pokemon`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_pokemon_id: pokemonPendienteSoltar.usuarioPokemonId,
                usuario_id: Number(usuario.id)
            })
        });

        cerrarModalSoltar();
        mostrarMensajeEvolucion(data.mensaje || t("mypokemon_release_success"), "ok");

        const [pokemons, items, resumenData] = await Promise.all([
            obtenerPokemonUsuarioActual(),
            obtenerItemsUsuarioActual(),
            obtenerResumenPokedexUsuario(usuario.id)
        ]);

        misPokemonData = Array.isArray(pokemons) ? pokemons : [];
        guardarCacheJSON(MY_POKEMON_CACHE_KEY, misPokemonData);

        guardarCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, Array.isArray(items) ? items : []);
        guardarCacheJSON(MY_POKEMON_RESUMEN_CACHE_KEY, resumenData || null);

        renderInventarioUsuario(Array.isArray(items) ? items : []);
        renderResumenColeccion(resumenData);

        estadosEvolucionCache.clear();
        aplicarFiltrosMisPokemon();
    } catch (error) {
        console.error("Error al soltar Pokémon:", error);
        cerrarModalSoltar();
        mostrarMensajeEvolucion(t("mypokemon_release_error"), "error");
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

        const evoData = await fetchJson(`${API_BASE}/pokemon/evolucionar-nivel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_pokemon_id: usuarioPokemonId,
                usuario_id: Number(usuario.id)
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
        aplicarFiltrosMisPokemon();
    } catch (error) {
        console.error("Error evolucionando por nivel:", error);
        cerrarModalEvolucion();
        mostrarMensajeEvolucion(t("mypokemon_evolve_error"), "error");
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

        const evoData = await fetchJson(`${API_BASE}/pokemon/evolucionar-item`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_pokemon_id: usuarioPokemonId,
                item_id: itemId,
                usuario_id: Number(usuario.id)
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

        const [pokemons, items] = await Promise.all([
            obtenerPokemonUsuarioActual(),
            obtenerItemsUsuarioActual()
        ]);

        misPokemonData = Array.isArray(pokemons) ? pokemons : [];
        guardarCacheJSON(MY_POKEMON_CACHE_KEY, misPokemonData);

        guardarCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, Array.isArray(items) ? items : []);
        renderInventarioUsuario(Array.isArray(items) ? items : []);

        estadosEvolucionCache.clear();
        aplicarFiltrosMisPokemon();
    } catch (error) {
        console.error("Error evolucionando por item:", error);
        cerrarModalEvolucion();
        mostrarMensajeEvolucion(t("mypokemon_evolve_error"), "error");
    }
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
        if (Array.isArray(itemsCache)) {
            renderInventarioUsuario(itemsCache);
        }
    }

    try {
        const items = await obtenerItemsUsuarioActual();
        guardarCacheJSON(MY_POKEMON_ITEMS_CACHE_KEY, Array.isArray(items) ? items : []);
        renderInventarioUsuario(Array.isArray(items) ? items : []);
    } catch (error) {
        console.error("Error cargando items del usuario:", error);
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
}

function configurarEventosAvatarSelector() {
    const section = document.getElementById("avatarSelectorSection");
    if (!section) return;

    section.addEventListener("click", async (event) => {
        const btn = event.target.closest("[data-avatar-option]");
        if (!btn) return;

        const avatarId = btn.dataset.avatarOption;
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