const ASSET_MANIFESTS = {
  sprites: null,
  items: null,
  customItems: null,
  loaded: false,
  loading: null,
};

const SPRITE_BASE_NORMAL = 'img/pokemon-png/sprites_normal/sprites_normal';
const SPRITE_BASE_SHINY = 'img/pokemon-png/sprites_shiny/sprites_shiny';
const ITEM_BASE = 'img/items';
const AVATAR_BASE = 'img/avatars';
const MAPS_BASE = 'img/maps';
const FALLBACKS = {
  pokemon: 'https://placehold.co/96x96/png?text=Pokemon',
  item: 'https://placehold.co/72x72/png?text=Item',
  avatar: 'https://placehold.co/64x64/png?text=Avatar',
  map: 'https://placehold.co/600x320/png?text=Region',
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeVariantSuffix(value = '') {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '');
}

function normalizeSpriteId(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) return '0000';
  return String(num).padStart(4, '0');
}

async function loadJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
  return response.json();
}

export async function ensureAssetManifests() {
  if (ASSET_MANIFESTS.loaded) return ASSET_MANIFESTS;
  if (ASSET_MANIFESTS.loading) return ASSET_MANIFESTS.loading;

  ASSET_MANIFESTS.loading = Promise.all([
    loadJson('data/manifests/sprites_manifest.json').catch(() => []),
    loadJson('data/manifests/items_manifest.json').catch(() => []),
    loadJson('data/manifests/items_custom_manifest.json').catch(() => []),
  ]).then(([sprites, items, customItems]) => {
    ASSET_MANIFESTS.sprites = safeArray(sprites);
    ASSET_MANIFESTS.items = safeArray(items);
    ASSET_MANIFESTS.customItems = safeArray(customItems);
    ASSET_MANIFESTS.loaded = true;
    return ASSET_MANIFESTS;
  }).finally(() => {
    ASSET_MANIFESTS.loading = null;
  });

  return ASSET_MANIFESTS.loading;
}

function findSpriteEntry({ speciesId = null, pokemonId = null, pokemonName = '', variantSuffix = '' } = {}) {
  const sprites = safeArray(ASSET_MANIFESTS.sprites);
  if (!sprites.length) return null;
  const normalizedName = normalizeText(pokemonName);
  const normalizedSuffix = normalizeVariantSuffix(variantSuffix);

  return sprites.find((entry) => {
    const entrySpeciesId = Number(entry?.species_id || 0);
    const entryPokemonId = Number(entry?.pokemon_id || 0);
    const entryName = normalizeText(entry?.pokemon_name || entry?.species_name || '');
    const entrySuffix = normalizeVariantSuffix(entry?.variant_suffix || '');

    if (speciesId && entrySpeciesId === Number(speciesId) && entrySuffix === normalizedSuffix) return true;
    if (pokemonId && entryPokemonId === Number(pokemonId) && entrySuffix === normalizedSuffix) return true;
    if (normalizedName && entryName === normalizedName && entrySuffix === normalizedSuffix) return true;
    return false;
  }) || null;
}

export function getPokemonSprite(pokemon = {}, shinyOverride = null) {
  const direct = pokemon?.asset_url || pokemon?.imagen || pokemon?.imagen_url || pokemon?.image || pokemon?.sprite || '';
  const directText = String(direct || '');
  if (directText && !/placehold\.co/i.test(directText) && !/pokeapi\.co\/api\/v2\//i.test(directText)) {
    return directText;
  }

  const shiny = shinyOverride !== null
    ? Boolean(shinyOverride)
    : Boolean(pokemon?.is_shiny || pokemon?.es_shiny);

  const speciesId = pokemon?.species_id || pokemon?.pokemon_species_id || pokemon?.speciesId || pokemon?.species?.id || pokemon?.id || null;
  const pokemonId = pokemon?.pokemon_id || pokemon?.user_pokemon_id || pokemon?.pokemonId || pokemon?.id || null;
  const pokemonName = pokemon?.pokemon_name_api || pokemon?.api_name || pokemon?.pokeapi_name || pokemon?.pokemon_name || pokemon?.species_name || pokemon?.display_name || '';
  const variantSuffix = pokemon?.variant_suffix || pokemon?.forma_suffix || '';

  const entry = findSpriteEntry({ speciesId, pokemonId, pokemonName, variantSuffix });
  if (entry) {
    const fileName = shiny ? entry?.shiny_file : entry?.normal_file;
    if (fileName) return `${shiny ? SPRITE_BASE_SHINY : SPRITE_BASE_NORMAL}/${fileName}`;
  }

  const fallbackId = normalizeSpriteId(speciesId || pokemonId);
  return `${shiny ? SPRITE_BASE_SHINY : SPRITE_BASE_NORMAL}/${fallbackId}${shiny ? '_s' : ''}.png`;
}

function findItemEntry({ itemId = null, itemCode = '', itemName = '' } = {}) {
  const items = [...safeArray(ASSET_MANIFESTS.customItems), ...safeArray(ASSET_MANIFESTS.items)];
  if (!items.length) return null;
  const normalizedCode = normalizeText(itemCode).replace(/_/g, '-');
  const normalizedName = normalizeText(itemName).replace(/\s+/g, '-');

  return items.find((entry) => {
    const entryId = Number(entry?.item_id || 0);
    const entryCode = normalizeText(entry?.item_code || '').replace(/_/g, '-');
    const entryName = normalizeText(entry?.display_name || entry?.item_name || '').replace(/\s+/g, '-');
    if (itemId && entryId === Number(itemId)) return true;
    if (normalizedCode && entryCode === normalizedCode) return true;
    if (normalizedName && entryName === normalizedName) return true;
    return false;
  }) || null;
}

export function getItemImage(item = {}) {
  const direct = item?.image_url || item?.icon_url || item?.asset_url || item?.image || '';
  if (direct && !/placehold\.co/i.test(String(direct))) return String(direct);

  const entry = findItemEntry({
    itemId: item?.item_id || item?.id || null,
    itemCode: item?.item_code || item?.codigo || item?.code || '',
    itemName: item?.display_name || item?.item_name || item?.nombre || item?.name || '',
  });
  if (entry?.file) return `${ITEM_BASE}/${entry.file}`;

  return FALLBACKS.item;
}

export function getAvatarImage(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return FALLBACKS.avatar;
  if (/^https?:\/\//i.test(raw) || raw.startsWith('img/')) return raw;
  return `${AVATAR_BASE}/${normalizeText(raw).replace(/[^a-z0-9-]+/g, '')}.png`;
}

export function getMapImage(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return FALLBACKS.map;
  if (/^https?:\/\//i.test(raw) || raw.startsWith('img/')) return raw;
  return `${MAPS_BASE}/${raw.replace(/^\/+/, '')}`;
}

export function getAssetAuditSummary() {
  return {
    sprites: safeArray(ASSET_MANIFESTS.sprites).length,
    items: safeArray(ASSET_MANIFESTS.items).length,
    customItems: safeArray(ASSET_MANIFESTS.customItems).length,
  };
}
