const SPRITES_CONFIG = {
    normalBasePath: "img/pokemon-png/sprites_normal",
    shinyBasePath: "img/pokemon-png/sprites_shiny",
    manifestPath: "img/pokemon-png/sprites_manifest.json"
};

const SPRITES_STATE = {
    manifest: [],
    loaded: false,
    loading: false,
    error: null,
    bySpeciesAndSuffix: new Map(),
    byPokemonId: new Map(),
    byPokemonName: new Map(),
    readyPromise: null
};

function normalizarSpriteId(id) {
    const num = Number(id || 0);
    if (!Number.isFinite(num) || num <= 0) return "0000";
    return String(num).padStart(4, "0");
}

function normalizarVariantSuffix(suffix = "") {
    return String(suffix || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

function construirClaveSpeciesSuffix(speciesId, variantSuffix = "") {
    return `${Number(speciesId) || 0}::${normalizarVariantSuffix(variantSuffix)}`;
}

function construirRutaSprite(folderPath, fileName) {
    if (!fileName) return "";
    return `${folderPath}/${fileName}`;
}

function construirNombreSpriteFallback(id, shiny = false, variantSuffix = "") {
    const spriteId = normalizarSpriteId(id);
    const suffix = normalizarVariantSuffix(variantSuffix);

    if (suffix) {
        return shiny
            ? `${spriteId}_${suffix}_s.png`
            : `${spriteId}_${suffix}.png`;
    }

    return shiny
        ? `${spriteId}_s.png`
        : `${spriteId}.png`;
}

function obtenerRutaSpriteLocal(id, shiny = false, variantSuffix = "") {
    const folder = shiny ? SPRITES_CONFIG.shinyBasePath : SPRITES_CONFIG.normalBasePath;
    const fileName = construirNombreSpriteFallback(id, shiny, variantSuffix);
    return construirRutaSprite(folder, fileName);
}

function registrarEntradaSprite(entry) {
    if (!entry || typeof entry !== "object") return;

    const speciesId = Number(entry.species_id || 0);
    const pokemonId = Number(entry.pokemon_id || 0);
    const pokemonName = String(entry.pokemon_name || "").trim().toLowerCase();
    const suffix = normalizarVariantSuffix(entry.variant_suffix || "");

    if (speciesId > 0) {
        SPRITES_STATE.bySpeciesAndSuffix.set(
            construirClaveSpeciesSuffix(speciesId, suffix),
            entry
        );
    }

    if (pokemonId > 0) {
        SPRITES_STATE.byPokemonId.set(pokemonId, entry);
    }

    if (pokemonName) {
        SPRITES_STATE.byPokemonName.set(pokemonName, entry);
    }
}

async function cargarSpritesManifest() {
    if (SPRITES_STATE.loaded) return SPRITES_STATE.manifest;
    if (SPRITES_STATE.loading && SPRITES_STATE.readyPromise) return SPRITES_STATE.readyPromise;

    SPRITES_STATE.loading = true;
    SPRITES_STATE.error = null;

    SPRITES_STATE.readyPromise = fetch(SPRITES_CONFIG.manifestPath, { cache: "no-store" })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`No se pudo cargar sprites_manifest.json (${response.status})`);
            }

            const data = await response.json();
            const lista = Array.isArray(data) ? data : [];

            SPRITES_STATE.manifest = lista;
            SPRITES_STATE.bySpeciesAndSuffix.clear();
            SPRITES_STATE.byPokemonId.clear();
            SPRITES_STATE.byPokemonName.clear();

            lista.forEach(registrarEntradaSprite);

            SPRITES_STATE.loaded = true;
            SPRITES_STATE.loading = false;
            return lista;
        })
        .catch((error) => {
            SPRITES_STATE.error = error;
            SPRITES_STATE.loading = false;
            console.warn("No se pudo cargar sprites_manifest.json:", error);
            return [];
        });

    return SPRITES_STATE.readyPromise;
}

function obtenerEntradaSpritePorSpecies(speciesId, variantSuffix = "") {
    const key = construirClaveSpeciesSuffix(speciesId, variantSuffix);
    return SPRITES_STATE.bySpeciesAndSuffix.get(key) || null;
}

function obtenerEntradaSpritePorPokemonId(pokemonId) {
    const id = Number(pokemonId || 0);
    if (!id) return null;
    return SPRITES_STATE.byPokemonId.get(id) || null;
}

function obtenerEntradaSpritePorPokemonName(pokemonName = "") {
    const name = String(pokemonName || "").trim().toLowerCase();
    if (!name) return null;
    return SPRITES_STATE.byPokemonName.get(name) || null;
}

function obtenerRutaDesdeEntradaManifest(entry, shiny = false) {
    if (!entry) return "";

    const fileName = shiny ? entry.shiny_file : entry.normal_file;
    const folder = shiny ? SPRITES_CONFIG.shinyBasePath : SPRITES_CONFIG.normalBasePath;

    if (!fileName) return "";
    return construirRutaSprite(folder, fileName);
}

function obtenerRutaSpriteDesdeManifest({
    speciesId = null,
    pokemonId = null,
    pokemonName = "",
    shiny = false,
    variantSuffix = ""
} = {}) {
    const suffix = normalizarVariantSuffix(variantSuffix);

    let entry = null;

    if (speciesId != null) {
        entry = obtenerEntradaSpritePorSpecies(speciesId, suffix);
    }

    if (!entry && pokemonId != null) {
        entry = obtenerEntradaSpritePorPokemonId(pokemonId);
    }

    if (!entry && pokemonName) {
        entry = obtenerEntradaSpritePorPokemonName(pokemonName);
    }

    if (entry) {
        const ruta = obtenerRutaDesdeEntradaManifest(entry, shiny);
        if (ruta) return ruta;
    }

    return obtenerRutaSpriteLocal(speciesId || pokemonId, shiny, suffix);
}

function obtenerRutaSpriteDesdePokemon(pokemon = {}, shinyOverride = null) {
    const shiny = shinyOverride !== null
        ? Boolean(shinyOverride)
        : (pokemon?.es_shiny === true || pokemon?.es_shiny === 1);

    const variantSuffix = pokemon?.variant_suffix || pokemon?.forma_suffix || "";
    const speciesId =
        pokemon?.species_id ||
        pokemon?.pokemon_species_id ||
        pokemon?.id_base ||
        pokemon?.id ||
        pokemon?.pokemon_id ||
        null;

    const pokemonId = pokemon?.pokemon_id || pokemon?.id || null;

    const pokemonNameApi =
        pokemon?.pokemon_name_api ||
        pokemon?.api_name ||
        pokemon?.pokeapi_name ||
        "";

    return obtenerRutaSpriteDesdeManifest({
        speciesId,
        pokemonId,
        pokemonName: pokemonNameApi,
        shiny,
        variantSuffix
    });
}

function spritesManifestListo() {
    return SPRITES_STATE.loaded;
}

function obtenerSpritesManifestState() {
    return {
        loaded: SPRITES_STATE.loaded,
        loading: SPRITES_STATE.loading,
        error: SPRITES_STATE.error ? String(SPRITES_STATE.error.message || SPRITES_STATE.error) : null,
        total: SPRITES_STATE.manifest.length
    };
}

cargarSpritesManifest();

window.normalizarSpriteId = normalizarSpriteId;
window.normalizarVariantSuffix = normalizarVariantSuffix;
window.obtenerRutaSpriteLocal = obtenerRutaSpriteLocal;
window.obtenerRutaSpriteDesdeManifest = obtenerRutaSpriteDesdeManifest;
window.obtenerRutaSpriteDesdePokemon = obtenerRutaSpriteDesdePokemon;
window.cargarSpritesManifest = cargarSpritesManifest;
window.spritesManifestListo = spritesManifestListo;
window.obtenerSpritesManifestState = obtenerSpritesManifestState;
