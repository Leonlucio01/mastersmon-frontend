const spriteManifestCache = {
  loaded: false,
  loading: null,
  data: []
};

const itemManifestCache = {
  loaded: false,
  loading: null,
  data: []
};

const customItemManifestCache = {
  loaded: false,
  loading: null,
  data: []
};

function normalizeId(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return null;
}

function pad4(value) {
  return String(value).padStart(4, "0");
}

function normalizeCode(value) {
  return String(value || "").trim().toLowerCase();
}

function loadJsonOnce(cache, url) {
  if (cache.loaded) return Promise.resolve(cache.data);
  if (cache.loading) return cache.loading;

  cache.loading = fetch(url, { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
      return res.json();
    })
    .then((json) => {
      cache.data = Array.isArray(json) ? json : [];
      cache.loaded = true;
      return cache.data;
    })
    .catch((err) => {
      console.warn("[assets] Could not load manifest:", url, err);
      cache.data = [];
      cache.loaded = true;
      return cache.data;
    });

  return cache.loading;
}

export function preloadAssetManifests() {
  return Promise.all([
    loadJsonOnce(spriteManifestCache, "data/manifests/sprites_manifest.json"),
    loadJsonOnce(itemManifestCache, "data/manifests/items_manifest.json"),
    loadJsonOnce(customItemManifestCache, "data/manifests/items_custom_manifest.json")
  ]);
}

export function getPokemonSpriteById(pokemonId, shiny = false) {
  const normalizedId = normalizeId(pokemonId);
  if (!normalizedId) return "img/pokemon-png/placeholder.png";

  const padded = pad4(normalizedId);
  const folder = shiny ? "sprites_shiny" : "sprites_normal";
  const suffix = shiny ? "_s" : "";
  return `img/pokemon-png/${folder}/${padded}${suffix}.png`;
}

function extractPokemonId(input) {
  return (
    normalizeId(input?.pokemon_id) ??
    normalizeId(input?.pokemonId) ??
    normalizeId(input?.species_id) ??
    normalizeId(input?.speciesId) ??
    normalizeId(input?.id) ??
    normalizeId(input)
  );
}

/**
 * IMPORTANT:
 * Keep this synchronous for compatibility with existing modules.
 */
export function getPokemonSprite(input, shiny = false) {
  const pokemonId = extractPokemonId(input);
  return getPokemonSpriteById(pokemonId, shiny);
}

export async function resolvePokemonSprite(input, shiny = false) {
  const manifest = await loadJsonOnce(
    spriteManifestCache,
    "data/manifests/sprites_manifest.json"
  );

  const pokemonId = extractPokemonId(input);
  if (!pokemonId) return "img/pokemon-png/placeholder.png";

  const entry = manifest.find((row) => {
    const rowPokemonId = normalizeId(row?.pokemon_id);
    const rowSpeciesId = normalizeId(row?.species_id);
    return rowPokemonId === pokemonId || rowSpeciesId === pokemonId;
  });

  if (entry) {
    const file = shiny ? entry.shiny_file : entry.normal_file;
    const folder = shiny ? "sprites_shiny" : "sprites_normal";
    if (file) return `img/pokemon-png/${folder}/${file}`;
  }

  return getPokemonSpriteById(pokemonId, shiny);
}

export function bindSpriteFallback(imgEl, fallback = "img/pokemon-png/placeholder.png") {
  if (!imgEl) return;
  imgEl.addEventListener(
    "error",
    () => {
      if (imgEl.dataset.fallbackApplied === "1") return;
      imgEl.dataset.fallbackApplied = "1";
      imgEl.src = fallback;
    },
    { once: true }
  );
}

/**
 * Keep item lookup synchronous too, so existing renders do not break.
 * It falls back to common deterministic paths first.
 */
export function getItemImage(itemCodeOrItem) {
  const code = normalizeCode(
    typeof itemCodeOrItem === "string"
      ? itemCodeOrItem
      : itemCodeOrItem?.item_code || itemCodeOrItem?.code || itemCodeOrItem?.slug
  );

  if (!code) return "img/items/placeholder.png";

  const official = itemManifestCache.data || [];
  const custom = customItemManifestCache.data || [];
  const merged = [...official, ...custom];

  const entry = merged.find((row) => normalizeCode(row?.item_code) == code);
  if (entry?.file) return `img/items/${entry.file}`;

  return `img/items/official/${code}.png`;
}

export async function resolveItemImage(itemCodeOrItem) {
  await Promise.all([
    loadJsonOnce(itemManifestCache, "data/manifests/items_manifest.json"),
    loadJsonOnce(customItemManifestCache, "data/manifests/items_custom_manifest.json")
  ]);
  return getItemImage(itemCodeOrItem);
}

export default {
  preloadAssetManifests,
  getPokemonSpriteById,
  getPokemonSprite,
  resolvePokemonSprite,
  getItemImage,
  resolveItemImage,
  bindSpriteFallback
};
