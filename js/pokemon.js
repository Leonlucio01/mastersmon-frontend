function obtenerImagenPokemon(pokemonOrId, shiny = false) {
    if (pokemonOrId && typeof pokemonOrId === "object") {
        if (typeof obtenerRutaSpriteDesdePokemon === "function") {
            return obtenerRutaSpriteDesdePokemon({
                ...pokemonOrId,
                es_shiny: shiny
            });
        }

        const fallbackId = pokemonOrId.species_id || pokemonOrId.id || pokemonOrId.pokemon_id;
        return shiny
            ? `img/pokemon-png/sprites_shiny/${String(Number(fallbackId || 0)).padStart(4, "0")}_s.png`
            : `img/pokemon-png/sprites_normal/${String(Number(fallbackId || 0)).padStart(4, "0")}.png`;
    }

    if (typeof obtenerRutaSpriteDesdeManifest === "function") {
        return obtenerRutaSpriteDesdeManifest({
            speciesId: pokemonOrId,
            pokemonId: pokemonOrId,
            shiny
        });
    }

    return shiny
        ? `img/pokemon-png/sprites_shiny/${String(Number(pokemonOrId || 0)).padStart(4, "0")}_s.png`
        : `img/pokemon-png/sprites_normal/${String(Number(pokemonOrId || 0)).padStart(4, "0")}.png`;
}

function obtenerImagenPokeball() {
    return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
}

function crearCardPokemon(pokemon) {
    const pokemonId = Number(pokemon.id);
    const imagen = obtenerImagenPokemon(pokemon, modoShiny);

    const capturadoNormal = pokemonsCapturados.includes(pokemonId);
    const capturadoShiny = pokemonsShinyCapturados.includes(pokemonId);
    const mostrarCaptura = modoShiny ? capturadoShiny : capturadoNormal;

    return `
    <div
        class="card"
        data-id="${pokemonId}"
        data-nombre="${pokemon.nombre}"
        data-tipo="${pokemon.tipo}"
        data-generacion="${pokemon.generacion || ""}"
        data-species-id="${pokemon.species_id || pokemon.id || ""}"
        data-variant-suffix="${pokemon.variant_suffix || ""}"
    >
        <img
            class="pokeball-captura ${mostrarCaptura ? "capturado" : "no-capturado"}"
            src="${obtenerImagenPokeball()}"
            alt="${t("pokemon_capture_status")}"
            loading="lazy"
            decoding="async"
        >

        <h3>#${pokemonId} ${pokemon.nombre}</h3>

        <div class="imagen-pokemon">
            <img
                class="pokemon-img"
                src="${imagen}"
                alt="${pokemon.nombre}"
                loading="lazy"
                decoding="async"
            >
        </div>

        <div class="tipo">${traducirTipoPokemon(pokemon.tipo)}</div>

        <p>${t("pokemon_attack")}: ${pokemon.ataque}</p>
        <p>${t("pokemon_defense")}: ${pokemon.defensa}</p>
        <p>${t("pokemon_hp")}: ${pokemon.hp}</p>
    </div>
    `;
}

function traducirTipoPokemon(tipo = "") {
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
        "Hada": "type_fairy",
        "Siniestro": "type_dark",
        "Oscuro": "type_dark",
        "Dark": "type_dark"
    };

    return String(tipo || "")
        .split("/")
        .map(ti => {
            const limpio = ti.trim();
            const key = mapa[limpio];
            return key ? t(key) : limpio;
        })
        .join(" / ");
}
