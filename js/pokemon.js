function obtenerImagenPokemon(id, shiny = false) {
    return shiny
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

function obtenerImagenPokeball() {
    return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
}

function crearCardPokemon(pokemon) {
    const pokemonId = Number(pokemon.id);
    const imagen = obtenerImagenPokemon(pokemonId, modoShiny);

    const capturadoNormal = pokemonsCapturados.includes(pokemonId);
    const capturadoShiny = pokemonsShinyCapturados.includes(pokemonId);
    const mostrarCaptura = modoShiny ? capturadoShiny : capturadoNormal;

    return `
    <div 
        class="card"
        data-id="${pokemonId}"
        data-nombre="${pokemon.nombre}"
        data-tipo="${pokemon.tipo}"
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

        <div class="tipo">${pokemon.tipo}</div>

        <p>${t("pokemon_attack")}: ${pokemon.ataque}</p>
        <p>${t("pokemon_defense")}: ${pokemon.defensa}</p>
        <p>${t("pokemon_hp")}: ${pokemon.hp}</p>
    </div>
    `;
}