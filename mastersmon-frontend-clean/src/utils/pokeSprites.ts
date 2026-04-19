const normalModules = import.meta.glob('../../img/pokemon-png/sprites_normal/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>;
const shinyModules = import.meta.glob('../../img/pokemon-png/sprites_shiny/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>;

function normalizeSpriteKey(value: string | number | null | undefined): string {
  if (typeof value === 'number') {
    return String(Math.max(1, Math.trunc(value))).padStart(4, '0');
  }

  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  return raw
    .replace(/^.*[\\/]/, '')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9_]+/g, '_');
}

function buildSpriteIndex(modules: Record<string, string>): Map<string, string> {
  const index = new Map<string, string>();
  for (const [path, url] of Object.entries(modules)) {
    const file = path.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '').toLowerCase();
    index.set(file, url);
  }
  return index;
}

const normalIndex = buildSpriteIndex(normalModules);
const shinyIndex = buildSpriteIndex(shinyModules);

export function getPokeApiSpriteUrl(pokemonId: number, shiny = false): string {
  const safeId = Math.max(1, Number(pokemonId || 1));
  if (shiny) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${safeId}.png`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${safeId}.png`;
}

export function getLocalPokemonSpriteByDexKey(key: string | number, shiny = false): string | null {
  const normalized = normalizeSpriteKey(key);
  if (!normalized) return null;
  return (shiny ? shinyIndex : normalIndex).get(normalized) || null;
}

function resolveFromLocalImage(localImage?: string | null, shiny = false): string | null {
  const normalized = normalizeSpriteKey(localImage);
  if (!normalized) return null;

  if (shiny && !normalized.endsWith('_s')) {
    const shinyVersion = `${normalized}_s`;
    return shinyIndex.get(shinyVersion) || shinyIndex.get(normalized) || normalIndex.get(normalized) || null;
  }

  return (shiny ? shinyIndex : normalIndex).get(normalized) || null;
}

export function getPokemonCardImage(pokemonId: number, shiny: boolean, localImage?: string | null): string {
  const fromLocalImage = resolveFromLocalImage(localImage, shiny);
  if (fromLocalImage) return fromLocalImage;

  if (localImage && /^https?:\/\//i.test(localImage.trim())) {
    return localImage;
  }

  const local = getLocalPokemonSpriteByDexKey(pokemonId, shiny);
  if (local) return local;

  return getPokeApiSpriteUrl(pokemonId, shiny);
}
