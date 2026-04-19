type SpriteEntry = {
  default?: string;
};

const normalModules = import.meta.glob('../../img/pokemon-png/sprites_normal/*.{png,jpg,jpeg,webp}', {
  eager: true
}) as Record<string, SpriteEntry | string>;

const shinyModules = import.meta.glob('../../img/pokemon-png/sprites_shiny/*.{png,jpg,jpeg,webp}', {
  eager: true
}) as Record<string, SpriteEntry | string>;

function extractUrl(mod: SpriteEntry | string): string {
  return typeof mod === 'string' ? mod : mod.default || '';
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/é/g, 'e');
}

function buildSpriteMap(modules: Record<string, SpriteEntry | string>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [path, mod] of Object.entries(modules)) {
    const file = path.split('/').pop() || '';
    const base = file.replace(/\.(png|jpg|jpeg|webp)$/i, '').toLowerCase();
    result[base] = extractUrl(mod);
  }

  return result;
}

const normalMap = buildSpriteMap(normalModules);
const shinyMap = buildSpriteMap(shinyModules);

function normalizeDexKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\.(png|jpg|jpeg|webp)$/i, '')
    .replace(/_s$/, '')
    .replace(/[^a-z0-9_\-]/g, '');
}

function resolveKeyCandidates(input: string | number): string[] {
  if (typeof input === 'number') {
    const num = String(input).padStart(4, '0');
    return [num];
  }

  const raw = String(input || '').trim();
  if (!raw) return [];

  const normalized = normalizeName(raw);
  const directDex = normalizeDexKey(raw);

  return Array.from(
    new Set(
      [
        directDex,
        normalized,
        normalized.replace(/-/g, '_'),
        normalized.replace(/_/g, '-'),
        /^\d+$/.test(raw) ? raw.padStart(4, '0') : raw
      ].filter(Boolean)
    )
  );
}

export function getLocalPokemonSpriteByDexKey(dexKey: string | number, shiny = false): string | null {
  const keys = resolveKeyCandidates(dexKey);
  const target = shiny ? shinyMap : normalMap;

  for (const key of keys) {
    if (target[key]) return target[key];
    if (shiny && target[`${key}_s`]) return target[`${key}_s`];
  }

  return null;
}

export function getPokemonSprite(input: string | number, shiny = false): string | null {
  return getLocalPokemonSpriteByDexKey(input, shiny);
}

export function getPokemonCardImage(
  pokemonIdOrKey: string | number,
  shiny = false,
  fallbackImage?: string | null
): string {
  return (
    getLocalPokemonSpriteByDexKey(pokemonIdOrKey, shiny) ||
    (fallbackImage ? String(fallbackImage) : '') ||
    ''
  );
}
