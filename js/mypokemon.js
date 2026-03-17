let misPokemonData = [];
let usuarioActualMyPokemon = null;
let pokemonPendienteSoltar = null;
let estadosEvolucionCache = new Map();

const MY_POKEMON_CACHE_KEY = "mastersmon_mypokemon_cache";
const MY_POKEMON_ITEMS_CACHE_KEY = "mastersmon_mypokemon_items_cache";
const MY_POKEMON_RESUMEN_CACHE_KEY = "mastersmon_mypokemon_resumen_cache";

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

function renderEstadoSinSesion() {
    const inventario = document.getElementById("inventarioUsuario");
    const resumen = document.getElementById("resumenColeccion");
    const container = document.getElementById("misPokemonContainer");

    if (inventario) {
        inventario.innerHTML = `
            <h3>🔒 Sesión requerida</h3>
            <p>Inicia sesión para ver tu inventario y tu colección.</p>
        `;
    }

    if (resumen) {
        resumen.innerHTML = "";
    }

    if (container) {
        container.innerHTML = `
            <div class="empty-box">
                <h3>Debes iniciar sesión</h3>
                <p>Accede con Google para ver tus Pokémon capturados.</p>
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
            <span>📘 Total Pokémon</span>
            <strong>${resumenData.total_capturados} / ${resumenData.total_pokedex}</strong>
        </div>
        <div class="resumen-card">
            <span>✨ Shinys</span>
            <strong>${resumenData.total_shiny} / ${resumenData.total_pokemon_tabla}</strong>
        </div>
        <div class="resumen-card">
            <span>📈 Avance Pokédex</span>
            <strong>${resumenData.avance}%</strong>
        </div>
    `;
}

function renderInventarioUsuario(items = []) {
    const inventario = document.getElementById("inventarioUsuario");
    if (!inventario) return;

    if (!items.length) {
        inventario.innerHTML = `
            <h3>🎒 Inventario</h3>
            <p>No tienes items registrados todavía.</p>
        `;
        return;
    }

    inventario.innerHTML = `
        <h3>🎒 Inventario</h3>
        <div class="inventario-lista">
            ${items.map(i => `
                <span class="item-chip item-chip-con-icono">
                    <img src="${obtenerImagenItemInventario(i.nombre)}" alt="${i.nombre}">
                    <span>${i.nombre} x${i.cantidad}</span>
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

async function cargarDatosBaseMyPokemon({ forzar = false } = {}) {
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

    usuarioActualMyPokemon = usuario;

    try {
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

        renderInventarioUsuario(Array.isArray(items) ? items : []);
        renderResumenColeccion(resumenData);
        aplicarFiltrosMisPokemon();

        return true;
    } catch (error) {
        console.error("Error cargando datos base de My Pokemon:", error);
        return false;
    }
}

function aplicarFiltrosMisPokemon() {
    const buscar = document.getElementById("buscarMiPokemon");
    const filtroTipo = document.getElementById("filtroMiTipo");
    const filtroRareza = document.getElementById("filtroMiRareza");
    const orden = document.getElementById("ordenMisPokemon");

    const texto = buscar ? buscar.value.toLowerCase().trim() : "";
    const tipo = filtroTipo ? filtroTipo.value.toLowerCase().trim() : "";
    const rareza = filtroRareza ? filtroRareza.value.toLowerCase().trim() : "";
    const ordenValor = orden ? orden.value : "pokemon_id_asc";

    let filtrados = [...misPokemonData];

    filtrados = filtrados.filter(p => {
        const nombre = (p.nombre || "").toLowerCase();
        const tipoPokemon = (p.tipo || "").toLowerCase();
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
            texto: evoData.tipo === "nivel" ? "Listo por nivel" : "Listo por item"
        };
    }

    if (evoData?.puede_evolucionar && !evoData.listo_ahora) {
        return {
            clase: "btn-evolucionar",
            texto: evoData.tipo === "item" ? "Requiere item" : "Evolucionar"
        };
    }

    if (evoData && evoData.puede_evolucionar === false) {
        return {
            clase: "btn-evolucionar",
            texto: "Sin evolución"
        };
    }

    return {
        clase: "btn-evolucionar",
        texto: "Evolucionar"
    };
}

function construirCardPokemon(p, evoData = null) {
    const imagen = obtenerImagenPokemonColeccion(p.pokemon_id, p.es_shiny === true);
    const porcentajeExp = Math.min(100, Math.floor((p.experiencia / (p.nivel * 50)) * 100));
    const estado = estadoEvolucionVisual(evoData);
    const nombreSeguro = String(p.nombre).replace(/'/g, "\\'");

    return `
        <div class="pokemon-card" data-tipo="${p.tipo}" data-nombre="${p.nombre}" data-shiny="${p.es_shiny ? "true" : "false"}" data-usuario-pokemon-id="${p.id}">
            <div class="pokemon-card-header">
                <h3>#${p.pokemon_id} ${p.nombre}</h3>
                ${p.es_shiny ? `<span class="badge-shiny">✨ Shiny</span>` : `<span class="badge-normal">Normal</span>`}
            </div>

            <div class="pokemon-card-image">
                <img src="${imagen}" alt="${p.nombre}" loading="lazy" decoding="async">
            </div>

            <div class="tipo">${p.tipo}</div>

            <div class="pokemon-stats">
                <p><strong>Nivel:</strong> ${p.nivel}</p>
                <p><strong>HP:</strong> ${p.hp_actual}/${p.hp_max}</p>
                <p><strong>Ataque:</strong> ${p.ataque}</p>
                <p><strong>Defensa:</strong> ${p.defensa}</p>
                <p><strong>Velocidad:</strong> ${p.velocidad}</p>
            </div>

            <div class="exp-box">
                <div class="exp-label">EXP: ${p.experiencia} / ${p.nivel * 50}</div>
                <div class="exp-bar">
                    <div class="exp-fill" style="width:${porcentajeExp}%"></div>
                </div>
            </div>

            <div class="pokemon-actions">
                <button class="${estado.clase}" data-evo-btn="${p.id}" onclick="manejarEvolucion(${p.id}, '${nombreSeguro}')">
                    ${estado.texto}
                </button>

                <button class="btn-soltar" onclick="abrirModalSoltar(${p.id}, '${nombreSeguro}')">
                    Soltar
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
                    <h3>No tienes Pokémon todavía</h3>
                    <p>Explora mapas para capturar tu primer Pokémon.</p>
                </div>
            `
            : `
                <div class="empty-box">
                    <h3>No se encontraron Pokémon</h3>
                    <p>Prueba cambiando los filtros.</p>
                </div>
            `;
        return;
    }

    container.innerHTML = pokemons.map(p => {
        const evoCache = estadosEvolucionCache.get(p.id) || null;
        return construirCardPokemon(p, evoCache);
    }).join("");

    hidratarEstadosEvolucion(pokemons);
}

function abrirModalSoltar(usuarioPokemonId, nombrePokemon) {
    pokemonPendienteSoltar = { usuarioPokemonId, nombrePokemon };

    const modal = document.getElementById("modalConfirmarSoltar");
    const texto = document.getElementById("textoConfirmarSoltar");
    const btn = document.getElementById("btnConfirmarSoltar");

    if (texto) {
        texto.textContent = `¿Seguro que deseas soltar a ${nombrePokemon}?`;
    }

    if (btn) {
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
        mostrarMensajeEvolucion("Debes iniciar sesión.", "error");
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
        mostrarMensajeEvolucion(data.mensaje || "Pokémon liberado correctamente", "ok");

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
        mostrarMensajeEvolucion("No se pudo soltar el Pokémon", "error");
    }
}

async function manejarEvolucion(usuarioPokemonId, nombrePokemon) {
    try {
        const data = await obtenerEstadoEvolucion(usuarioPokemonId);

        if (!data?.puede_evolucionar) {
            mostrarMensajeEvolucion(data?.motivo || "Este Pokémon aún no puede evolucionar", "error");
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
        mostrarMensajeEvolucion("No se pudo revisar la evolución.", "error");
    }
}

function mostrarModalEvolucionNivel(usuarioPokemonId, nombrePokemon, data) {
    const modal = document.getElementById("modalEvolucion");
    const contenido = document.getElementById("contenidoModalEvolucion");

    const opciones = Array.isArray(data?.opciones) ? data.opciones : [];
    const opcionNivel = opciones.find(op => op.tipo === "nivel") || opciones[0];
    if (!opcionNivel || !contenido || !modal) return;

    const imagenActual = obtenerImagenPokemonModal(data.pokemon_id);
    const imagenEvolucion = obtenerImagenPokemonModal(opcionNivel.evolucion_id || opcionNivel.evoluciona_a);

    const nivelActual = data.nivel_actual || 0;
    const nivelRequerido = opcionNivel.nivel_requerido || 0;
    const listo = opcionNivel.listo === true;

    contenido.innerHTML = `
        <h2 class="titulo-modal-evolucion">Evolución por nivel</h2>
        <p class="subtitulo-modal-evolucion">Tu Pokémon evoluciona al alcanzar el nivel requerido</p>

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
                    <h3>Nivel requerido</h3>
                    <p>Nivel actual: ${nivelActual}</p>
                    <p>Nivel necesario: ${nivelRequerido}</p>
                </div>
            </div>
        </div>

        <p class="evolucion-detalle ${listo ? "ok" : "error"}">
            ${listo
                ? "Este Pokémon ya cumple el nivel para evolucionar."
                : "Aún no cumple el nivel necesario para evolucionar."}
        </p>

        <div class="evolucion-botones">
            <button class="btn-cancelar-modal" onclick="cerrarModalEvolucion()">Cancelar</button>
            <button class="btn-confirmar-evolucion" onclick="confirmarEvolucionNivel(${usuarioPokemonId})" ${!listo ? "disabled" : ""}>
                Evolucionar
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

    const imagenActual = obtenerImagenPokemonModal(data.pokemon_id);
    const imagenEvolucion = obtenerImagenPokemonModal(opcionMostrar.evoluciona_a);
    const imagenItem = obtenerImagenItemModal(opcionMostrar.item_nombre);
    const tieneItem = opcionMostrar.tiene_item;

    contenido.innerHTML = `
        <h2 class="titulo-modal-evolucion">Evolución por item</h2>
        <p class="subtitulo-modal-evolucion">Tu Pokémon puede evolucionar usando un objeto especial</p>

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
                <img src="${imagenItem}" alt="${opcionMostrar.item_nombre}">
                <div>
                    <h3>${opcionMostrar.item_nombre}</h3>
                    <p>Tienes: x${opcionMostrar.cantidad}</p>
                </div>
            </div>
        </div>

        <p class="evolucion-detalle ${tieneItem ? "ok" : "error"}">
            ${tieneItem
                ? "Ya tienes el item necesario para evolucionar."
                : "Todavía no tienes el item necesario para esta evolución."}
        </p>

        <div class="evolucion-botones">
            <button class="btn-cancelar-modal" onclick="cerrarModalEvolucion()">Cancelar</button>
            <button class="btn-usar-item" onclick="confirmarEvolucionItem(${usuarioPokemonId}, ${opcionMostrar.item_id})" ${!tieneItem ? "disabled" : ""}>
                <img src="${imagenItem}" class="icon-item-btn" alt="${opcionMostrar.item_nombre}">
                Usar ${opcionMostrar.item_nombre}
            </button>
        </div>
    `;

    modal.classList.remove("oculto");
}

async function confirmarEvolucionNivel(usuarioPokemonId) {
    const usuario = usuarioActualMyPokemon || await obtenerUsuarioActual();
    if (!usuario?.id) {
        cerrarModalEvolucion();
        mostrarMensajeEvolucion("Debes iniciar sesión.", "error");
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

        mostrarMensajeEvolucion(evoData.mensaje || "Evolución realizada con éxito", "ok");

        const pokemons = await obtenerPokemonUsuarioActual();
        misPokemonData = Array.isArray(pokemons) ? pokemons : [];
        guardarCacheJSON(MY_POKEMON_CACHE_KEY, misPokemonData);

        estadosEvolucionCache.clear();
        aplicarFiltrosMisPokemon();
    } catch (error) {
        console.error("Error evolucionando por nivel:", error);
        cerrarModalEvolucion();
        mostrarMensajeEvolucion("No se pudo evolucionar.", "error");
    }
}

async function confirmarEvolucionItem(usuarioPokemonId, itemId) {
    const usuario = usuarioActualMyPokemon || await obtenerUsuarioActual();
    if (!usuario?.id) {
        cerrarModalEvolucion();
        mostrarMensajeEvolucion("Debes iniciar sesión.", "error");
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

        mostrarMensajeEvolucion(evoData.mensaje || "Evolución realizada con éxito", "ok");

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
        mostrarMensajeEvolucion("No se pudo evolucionar.", "error");
    }
}

function cerrarModalEvolucion() {
    const modal = document.getElementById("modalEvolucion");
    const contenido = document.getElementById("contenidoModalEvolucion");

    if (modal) modal.classList.add("oculto");
    if (contenido) contenido.innerHTML = "";
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

document.addEventListener("DOMContentLoaded", () => {
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

