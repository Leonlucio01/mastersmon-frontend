const spriteManifestCache = {
  loaded: false,
  data: []
};

const itemManifestCache = {
  loaded: false,
  data: []
};

const customItemManifestCache = {
  loaded: false,
  data: []
};

function normalizeId(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }
  return null;
}

function pad4(value) {
  return String(value).padStart(4, "0");
}

async function loadJsonOnce(cache, url) {
  if (cache.loaded) return cache.data;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    cache.data = await res.json();
  } catch (err) {
    console.warn("[assets] Could not load manifest:", url, err);
    cache.data = [];
  }

  cache.loaded = true;
  return cache.data;
}

export async function loadSpriteManifest() {
  return loadJsonOnce(
    spriteManifestCache,
    "data/manifests/sprites_manifest.json"
  );
}

export async function loadItemManifest() {
  return loadJsonOnce(
    itemManifestCache,
    "data/manifests/items_manifest.json"
  );
}

export async function loadCustomItemManifest() {
  return loadJsonOnce(
    customItemManifestCache,
    "data/manifests/items_custom_manifest.json"
  );
}

export function getPokemonSpriteById(pokemonId, shiny = false) {
  const normalizedId = normalizeId(pokemonId);
  if (!normalizedId) {
    return "img/pokemon-png/placeholder.png";
  }

  const padded = pad4(normalizedId);
  const folder = shiny ? "sprites_shiny" : "sprites_normal";
  const suffix = shiny ? "_s" : "";

  return `img/pokemon-png/${folder}/${padded}${suffix}.png`;
}

export async function getPokemonSprite(input, shiny = false) {
  const manifest = await loadSpriteManifest();

  const pokemonId =
    normalizeId(input?.pokemon_id) ??
    normalizeId(input?.pokemonId) ??
    normalizeId(input?.species_id) ??
    normalizeId(input?.speciesId) ??
    normalizeId(input?.id) ??
    normalizeId(input);

  if (!pokemonId) {
    return getPokemonSpriteById(null, shiny);
  }

  const entry = manifest.find((row) => {
    const rowPokemonId = normalizeId(row?.pokemon_id);
    const rowSpeciesId = normalizeId(row?.species_id);
    return rowPokemonId === pokemonId || rowSpeciesId === pokemonId;
  });

  if (entry) {
    const file = shiny ? entry.shiny_file : entry.normal_file;
    const folder = shiny ? "sprites_shiny" : "sprites_normal";
    if (file) {
      return `img/pokemon-png/${folder}/${file}`;
    }
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

export async function getItemImage(itemCodeOrItem) {
  const code =
    typeof itemCodeOrItem === "string"
      ? itemCodeOrItem
      : itemCodeOrItem?.item_code || itemCodeOrItem?.code || itemCodeOrItem?.slug;

  if (!code) return "img/items/placeholder.png";

  const [official, custom] = await Promise.all([
    loadItemManifest(),
    loadCustomItemManifest()
  ]);

  const merged = [...official, ...custom];
  const entry = merged.find((row) => row?.item_code === code);

  if (!entry?.file) {
    return "img/items/placeholder.png";
  }

  return `img/items/${entry.file}`;
}

export default {
  loadSpriteManifest,
  loadItemManifest,
  loadCustomItemManifest,
  getPokemonSpriteById,
  getPokemonSprite,
  getItemImage,
  bindSpriteFallback
};
