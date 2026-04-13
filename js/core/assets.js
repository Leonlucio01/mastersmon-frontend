const ASSET_MANIFESTS = {
  sprites: null,
  items: null,
  customItems: null,
  loaded: false,
  loading: null,
};

const SPRITE_BASE_NORMAL = '/img/pokemon-png/sprites_normal';
const SPRITE_BASE_SHINY = '/img/pokemon-png/sprites_shiny';
const ITEM_BASE = '/img/items';
const AVATAR_BASE = '/img/avatars';
const MAPS_BASE = '/img/maps';
const MAP_MOVE_BASE = '/img/maps/move';
const FALLBACKS = {
  pokemon: '/img/pokemon-png/sprites_normal/0001.png',
  item: '/img/items/official/0004_poke-ball.png',
  avatar: '/img/avatars/steven.png',
  map: '/img/Banner.png',
  logo: '/img/Logo MastersMon.png',
};
const ITEM_CODE_ALIASES = {
  poke_ball: 'poke-ball',
  super_ball: 'great-ball',
  ultra_ball: 'ultra-ball',
  master_ball: 'master-ball',
  super_potion: 'super-potion',
  max_potion: 'max-potion',
  king_s_rock: 'kings-rock',
  piedra_fuego: 'fire-stone',
  piedra_agua: 'water-stone',
  piedra_trueno: 'thunder-stone',
  piedra_hoja: 'leaf-stone',
  piedra_lunar: 'moon-stone',
  sun_stone: 'sun-stone',
  shiny_stone: 'shiny-stone',
  dusk_stone: 'dusk-stone',
  dawn_stone: 'dawn-stone',
  oval_stone: 'oval-stone',
  metal_coat: 'metal-coat',
  dragon_scale: 'dragon-scale',
  up_grade: 'up-grade',
  link_cable: 'linking-cord',
  deepseatooth: 'deep-sea-tooth',
  deepseascale: 'deep-sea-scale',
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

function normalizeItemLookup(value = '') {
  const normalized = normalizeText(value).replace(/_/g, '-').replace(/\s+/g, '-');
  return ITEM_CODE_ALIASES[normalized.replace(/-/g, '_')] || ITEM_CODE_ALIASES[normalized] || normalized;
}

function normalizeSpriteId(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) return '0000';
  return String(num).padStart(4, '0');
}

function ensureLeadingSlash(path = '') {
  const raw = String(path || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function normalizePokemonAssetPath(path = '') {
  const raw = ensureLeadingSlash(path);
  if (!raw || /^https?:\/\//i.test(raw)) return raw;
  if (!raw.startsWith('/img/pokemon-png/')) return raw;
  if (raw.startsWith('/img/pokemon-png/sprites_normal/') || raw.startsWith('/img/pokemon-png/sprites_shiny/')) {
    return raw;
  }

  const fileName = raw.split('/').pop() || '';
  if (!fileName) return raw;
  const isShiny = /_s(?=\.png$)/i.test(fileName);
  return `${isShiny ? SPRITE_BASE_SHINY : SPRITE_BASE_NORMAL}/${fileName}`;
}

function normalizeItemAssetPath(path = '') {
  const raw = ensureLeadingSlash(path);
  if (!raw || /^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/img/items/')) return raw;
  if (raw.startsWith('/official/') || raw.startsWith('/custom/')) return `${ITEM_BASE}${raw}`;
  return raw;
}

function normalizeMapAssetPath(path = '') {
  const raw = ensureLeadingSlash(path);
  if (!raw || /^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/img/maps/')) return raw;
  return `${MAPS_BASE}/${raw.replace(/^\/+/, '').replace(/^img\/maps\/?/, '')}`;
}

function normalizeAvatarAssetPath(path = '') {
  const raw = ensureLeadingSlash(path);
  if (!raw || /^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/img/avatars/')) return raw;
  return `${AVATAR_BASE}/${raw.replace(/^\/+/, '')}`;
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
    loadJson('/data/manifests/sprites_manifest.json').catch(() => []),
    loadJson('/data/manifests/items_manifest.json').catch(() => []),
    loadJson('/data/manifests/items_custom_manifest.json').catch(() => []),
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
    return normalizePokemonAssetPath(directText);
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
  const normalizedCode = normalizeItemLookup(itemCode);
  const normalizedName = normalizeItemLookup(itemName);

  return items.find((entry) => {
    const entryId = Number(entry?.item_id || 0);
    const entryCode = normalizeItemLookup(entry?.item_code || '');
    const entryName = normalizeItemLookup(entry?.display_name || entry?.item_name || '');
    if (itemId && entryId === Number(itemId)) return true;
    if (normalizedCode && entryCode === normalizedCode) return true;
    if (normalizedName && entryName === normalizedName) return true;
    return false;
  }) || null;
}

export function getItemImage(item = {}) {
  const direct = item?.image_url || item?.icon_url || item?.asset_url || item?.image || '';
  const directText = String(direct || '');
  if (directText && !/placehold\.co/i.test(directText)) {
    const legacyFile = directText.split('/').pop()?.replace(/\.png$/i, '') || '';
    const entryFromLegacy = findItemEntry({
      itemId: item?.item_id || item?.id || null,
      itemCode: legacyFile,
      itemName: item?.display_name || item?.item_name || item?.nombre || item?.name || '',
    });
    if (entryFromLegacy?.file) return `${ITEM_BASE}/${entryFromLegacy.file}`;
    return normalizeItemAssetPath(directText);
  }

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
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/img/') || raw.startsWith('img/')) return normalizeAvatarAssetPath(raw);
  return `${AVATAR_BASE}/${normalizeText(raw).replace(/[^a-z0-9-]+/g, '')}.png`;
}

export function getMapImage(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return FALLBACKS.map;
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/img/') || raw.startsWith('img/')) return normalizeMapAssetPath(raw);
  return normalizeMapAssetPath(raw);
}

export function getMapMoveAsset(direction = '') {
  const key = normalizeText(direction);
  const map = {
    center: `${MAP_MOVE_BASE}/center.png`,
    up: `${MAP_MOVE_BASE}/north_able.png`,
    north: `${MAP_MOVE_BASE}/north_able.png`,
    down: `${MAP_MOVE_BASE}/south_able.png`,
    south: `${MAP_MOVE_BASE}/south_able.png`,
    left: `${MAP_MOVE_BASE}/west_able.png`,
    west: `${MAP_MOVE_BASE}/west_able.png`,
    right: `${MAP_MOVE_BASE}/east_able.png`,
    east: `${MAP_MOVE_BASE}/east_able.png`,
  };
  return map[key] || `${MAP_MOVE_BASE}/center.png`;
}

export function getBrandAsset(name = '') {
  const key = normalizeText(name);
  if (key === 'logo' || key === 'mastersmon') return FALLBACKS.logo;
  if (key === 'banner' || key === 'home-banner') return FALLBACKS.map;
  return FALLBACKS.logo;
}

export function getAssetAuditSummary() {
  return {
    sprites: safeArray(ASSET_MANIFESTS.sprites).length,
    items: safeArray(ASSET_MANIFESTS.items).length,
    customItems: safeArray(ASSET_MANIFESTS.customItems).length,
  };
}
