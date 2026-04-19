type AssetEntry = { default?: string };

type AssetModuleMap = Record<string, AssetEntry | string>;

type AssetIndex = Record<string, string>;

const avatarModules = import.meta.glob('../../img/avatars/*.{png,jpg,jpeg,webp}', {
  eager: true
}) as AssetModuleMap;

const trainerModules = import.meta.glob('../../img/trainers/**/*.{png,jpg,jpeg,webp}', {
  eager: true
}) as AssetModuleMap;

const badgeModules = import.meta.glob('../../img/bagde/**/*.{png,jpg,jpeg,webp}', {
  eager: true
}) as AssetModuleMap;

const mapModules = import.meta.glob('../../img/maps/escenarios/**/*.{png,jpg,jpeg,webp}', {
  eager: true
}) as AssetModuleMap;

const itemModules = import.meta.glob('../../img/items/**/*.{png,jpg,jpeg,webp}', {
  eager: true
}) as AssetModuleMap;

function extractUrl(mod: AssetEntry | string): string {
  return typeof mod === 'string' ? mod : mod.default || '';
}

function stripExt(value: string): string {
  return value.replace(/\.(png|jpg|jpeg|webp)$/i, '');
}

function normalizeValue(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\\/g, '/')
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

function buildIndex(modules: AssetModuleMap, marker: string): AssetIndex {
  const out: AssetIndex = {};

  for (const [path, mod] of Object.entries(modules)) {
    const url = extractUrl(mod);
    if (!url) continue;

    const normalizedPath = path.replace(/\\/g, '/');
    const markerIdx = normalizedPath.indexOf(marker);
    const relative = markerIdx >= 0 ? normalizedPath.slice(markerIdx + marker.length) : normalizedPath.split('/').pop() || normalizedPath;
    const noExt = stripExt(relative);
    const parts = noExt.split('/').filter(Boolean).map((part) => normalizeValue(part));
    const joined = parts.join('/');
    const basename = parts[parts.length - 1] || '';

    if (joined) out[joined] = url;
    if (basename) out[basename] = url;
  }

  return out;
}

const avatarIndex = buildIndex(avatarModules, '/avatars/');
const trainerIndex = buildIndex(trainerModules, '/trainers/');
const badgeIndex = buildIndex(badgeModules, '/bagde/');
const mapIndex = buildIndex(mapModules, '/maps/escenarios/');
const itemIndex = buildIndex(itemModules, '/items/');

function cleanupBackendPath(value?: string | null): string | null {
  if (!value) return null;

  const cleaned = stripExt(
    value
      .trim()
      .replace(/^\/+/, '')
      .replace(/^img\//i, '')
      .replace(/^\.?\//, '')
      .replace(/\\/g, '/')
  );

  return normalizeValue(cleaned);
}

function pickFromIndex(index: AssetIndex, ...candidates: Array<string | null | undefined>): string | null {
  for (const raw of candidates) {
    if (!raw) continue;
    const key = normalizeValue(raw);
    if (index[key]) return index[key];
  }
  return null;
}

export function getAvatarAsset(avatarId?: string | null, backendPath?: string | null): string | null {
  const pathCandidate = cleanupBackendPath(backendPath);
  return pickFromIndex(
    avatarIndex,
    pathCandidate,
    pathCandidate?.replace(/^avatars\//, '') || null,
    avatarId || null
  );
}

export function getTrainerAsset(regionOrName?: string | null, trainerName?: string | null, backendPath?: string | null): string | null {
  const pathCandidate = cleanupBackendPath(backendPath);
  const region = regionOrName ? normalizeValue(regionOrName) : null;
  const trainer = trainerName ? normalizeValue(trainerName) : null;

  return pickFromIndex(
    trainerIndex,
    pathCandidate,
    pathCandidate?.replace(/^trainers\//, '') || null,
    region && trainer ? `${region}/${trainer}` : null,
    trainer,
    regionOrName || null
  );
}

export function getBadgeAsset(regionOrName?: string | null, badgeName?: string | null, backendPath?: string | null): string | null {
  const pathCandidate = cleanupBackendPath(backendPath);
  const region = regionOrName ? normalizeValue(regionOrName) : null;
  const badge = badgeName ? normalizeValue(badgeName) : null;

  return pickFromIndex(
    badgeIndex,
    pathCandidate,
    pathCandidate?.replace(/^bagde\//, '') || null,
    region && badge ? `${region}/${badge}` : null,
    badge,
    regionOrName || null
  );
}

export function getMapAsset(regionOrName?: string | null, mapName?: string | null, backendPath?: string | null): string | null {
  const pathCandidate = cleanupBackendPath(backendPath);
  const region = regionOrName ? normalizeValue(regionOrName) : null;
  const map = mapName ? normalizeValue(mapName) : null;

  return pickFromIndex(
    mapIndex,
    pathCandidate,
    pathCandidate?.replace(/^maps\/escenarios\//, '') || null,
    region && map ? `${region}/${map}` : null,
    map,
    regionOrName || null
  );
}

export function getItemAsset(code?: string | null, backendPath?: string | null): string | null {
  const pathCandidate = cleanupBackendPath(backendPath);
  const normalizedCode = code ? normalizeValue(code) : null;

  return pickFromIndex(
    itemIndex,
    pathCandidate,
    pathCandidate?.replace(/^items\//, '') || null,
    normalizedCode,
    normalizedCode?.replace(/_/g, '-') || null,
    normalizedCode?.replace(/-/g, '_') || null
  );
}
