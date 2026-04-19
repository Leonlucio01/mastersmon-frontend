export function getPokeApiSpriteUrl(pokemonId: number, shiny = false): string {
  const safeId = Math.max(1, Number(pokemonId || 1));
  if (shiny) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${safeId}.png`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${safeId}.png`;
}

export function getPokemonCardImage(pokemonId: number, shiny: boolean, localImage?: string | null): string {
  if (localImage && localImage.trim()) {
    return localImage;
  }
  return getPokeApiSpriteUrl(pokemonId, shiny);
}
