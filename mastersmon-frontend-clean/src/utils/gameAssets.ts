type AssetEntry = {
  default?: string;
};

const avatarModules = import.meta.glob('../../img/avatars/*.{png,jpg,jpeg,webp}', {
  eager: true
}) as Record<string, AssetEntry | string>;

const trainerModules = import.meta.glob('../../img/trainers/**/*.{png,jpg,jpeg,webp}', {
  eager: true
}) as Record<string, AssetEntry | string>;

const badgeModules = import.meta.glob('../../img/bagde/**/*.{png,jpg,jpeg,webp}', {
  eager: true
}) as Record<string, AssetEntry | string>;

const mapModules = import.meta.glob('../../img/maps/escenarios/**/*.{png,jpg,jpeg,webp}', {
  eager: true
}) as Record<string, AssetEntry | string>;

const itemModules = import.meta.glob('../../img/items/**/*.{png,jpg,jpeg,webp}', {
  eager: true
}) as Record<string, AssetEntry | string>;

function extractUrl(mod: AssetEntry | string): string {
  return typeof mod === 'string' ? mod : mod.default || '';
}

function fileNameWithoutExt(path: string): string {
  const file = path.split('/').pop() || '';
  return file.replace(/\.(png|jpg|jpeg|webp)$/i, '').toLowerCase();
}

function normalizeValue(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '_').replace(/-/g, '_');
}

function buildMap(modules: Record<string, AssetEntry | string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, mod] of Object.entries(modules)) {
    out[fileNameWithoutExt(path)] = extractUrl(mod);
  }
  return out;
}

const avatarMap = buildMap(avatarModules);
const trainerMap = buildMap(trainerModules);
const badgeMap = buildMap(badgeModules);
const mapAssetMap = buildMap(mapModules);
const itemMap = buildMap(itemModules);

export function getAvatarAsset(avatarId?: string | null): string | null {
  if (!avatarId) return null;
  return avatarMap[normalizeValue(avatarId)] || null;
}

export function getTrainerAsset(name?: string | null): string | null {
  if (!name) return null;
  return trainerMap[normalizeValue(name)] || null;
}

export function getBadgeAsset(name?: string | null): string | null {
  if (!name) return null;
  return badgeMap[normalizeValue(name)] || null;
}

export function getMapAsset(name?: string | null): string | null {
  if (!name) return null;
  return mapAssetMap[normalizeValue(name)] || null;
}

export function getItemAsset(code?: string | null): string | null {
  if (!code) return null;
  return itemMap[normalizeValue(code)] || null;
}
