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
    .replace(/\s+/g, '-')
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/é/g, 'e');
}

function buildSpriteMap(modules: Record<string, SpriteEntry | string>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [path, mod] of Object.entries(modules)) {
    const file = path.split('/').pop() || '';
    const base = file.replace(/\.(png|jpg|jpeg|webp)$/i, '');
    result[base.toLowerCase()] = extractUrl(mod);
  }

  return result;
}

const normalMap = buildSpriteMap(normalModules);
const shinyMap = buildSpriteMap(shinyModules);

function resolveKeyFromPokemon(input: string | number): string[] {
  if (typeof input === 'number') {
    const num = String(input).padStart(4, '0');
    return [num];
  }

  const raw = normalizeName(input);
  return [raw];
}

export function getPokemonSprite(input: string | number, shiny = false): string | null {
  const keys = resolveKeyFromPokemon(input);
  const target = shiny ? shinyMap : normalMap;

  for (const key of keys) {
    if (target[key]) return target[key];
    if (shiny && target[`${key}_s`]) return target[`${key}_s`];
  }

  return null;
}
