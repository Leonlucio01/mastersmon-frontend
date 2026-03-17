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

function usuarioAutenticado() {
    return !!getAccessToken();
}

function obtenerImagenItemEvolucion(nombreItem) {
    const imagenes = {
        "Piedra Fuego": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png",
        "Piedra Agua": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png",
        "Piedra Trueno": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png",
        "Piedra Hoja": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leaf-stone.png",
        "Piedra Lunar": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moon-stone.png"
    };

    return imagenes[nombreItem] || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
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
            <p>No se pudo cargar la Pokédex.</p>
            <button id="btnReintentarPokedex" type="button">Reintentar</button>
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

function aplicarFiltrosVisuales() {
    const buscador = document.getElementById("buscarPokemon");
    const filtroTipo = document.getElementById("filtroTipo");
    const cards = document.querySelectorAll(".card");

    const texto = buscador ? buscador.value.toLowerCase().trim() : "";
    const tipo = filtroTipo ? filtroTipo.value.toLowerCase().trim() : "";

    cards.forEach(card => {
        const nombre = (card.dataset.nombre || "").toLowerCase();
        const tipoPokemon = (card.dataset.tipo || "").toLowerCase();

        const coincideNombre = nombre.includes(texto);
        const coincideTipo = tipo === "" || tipoPokemon.includes(tipo);

        card.style.display = (coincideNombre && coincideTipo) ? "block" : "none";
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
                    <div class="tipo tipo-detalle" data-tipo="${tipo}">${tipo}</div>

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

document.addEventListener("DOMContentLoaded", async () => {
    evolucionCacheMemoria = leerCacheEvoluciones();
    evolucionesPrecargadas = Object.keys(evolucionCacheMemoria).length > 0;

    const buscador = document.getElementById("buscarPokemon");
    const filtroTipo = document.getElementById("filtroTipo");
    const btnShiny = document.getElementById("modoShiny");
    const pokedex = document.getElementById("pokedex");

    if (buscador) {
        buscador.addEventListener("input", aplicarFiltrosVisuales);
    }

    if (filtroTipo) {
        filtroTipo.addEventListener("change", aplicarFiltrosVisuales);
    }

    if (btnShiny) {
        btnShiny.addEventListener("click", function() {
            modoShiny = !modoShiny;
            this.textContent = modoShiny ? "🌟 Shiny Activo" : "✨ Shiny";

            actualizarImagenesPokemon();
            actualizarVisualPokeballs();
            aplicarFiltrosVisuales();
        });
    }

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

    await cargarPokedex();
    await precargarEvolucionesGlobal();
});