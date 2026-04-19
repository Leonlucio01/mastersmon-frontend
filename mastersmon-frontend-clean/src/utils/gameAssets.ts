const avatarModules = import.meta.glob('../../img/avatars/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>;
const trainerModules = import.meta.glob('../../img/trainers/*/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>;
const badgeModules = import.meta.glob('../../img/bagde/*/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>;
const itemOfficialModules = import.meta.glob('../../img/items/official/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>;
const itemCustomModules = import.meta.glob('../../img/items/custom/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>;
const mapRegionModules = import.meta.glob('../../img/maps/escenarios/*/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>;
const mapSpecialModules = import.meta.glob('../../img/maps/escenarios/zona_especial/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>;

function normalizeToken(value: string | null | undefined): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.[^.]+$/, '')
    .replace(/badge/g, '')
    .replace(/medalla/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function pathTail(path: string, levels = 1): string {
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
  const slice = parts.slice(-levels);
  return slice.join('/');
}

function buildIndex(modules: Record<string, string>, levels: number): Map<string, string> {
  const index = new Map<string, string>();
  for (const [path, url] of Object.entries(modules)) {
    const tail = pathTail(path, levels);
    const key = tail
      .split('/')
      .map((segment) => normalizeToken(segment))
      .filter(Boolean)
      .join('/');
    if (key) index.set(key, url);
    const fileKey = normalizeToken(pathTail(path, 1));
    if (fileKey && !index.has(fileKey)) index.set(fileKey, url);
  }
  return index;
}

const avatarIndex = buildIndex(avatarModules, 1);
const trainerIndex = buildIndex(trainerModules, 2);
const badgeIndex = buildIndex(badgeModules, 2);
const itemIndex = new Map<string, string>([
  ...buildIndex(itemOfficialModules, 2),
  ...buildIndex(itemCustomModules, 2),
]);
const mapIndex = new Map<string, string>([
  ...buildIndex(mapRegionModules, 2),
  ...buildIndex(mapSpecialModules, 1),
]);

function resolveFromAssetPath(index: Map<string, string>, assetPath?: string | null): string | null {
  const clean = String(assetPath || '').trim();
  if (!clean) return null;
  const normalized = clean
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => normalizeToken(segment))
    .filter(Boolean);
  if (!normalized.length) return null;

  const last = normalized.slice(-2).join('/');
  return index.get(last) || index.get(normalized[normalized.length - 1]) || null;
}

export function getAvatarAsset(avatarId?: string | null): string | null {
  const key = normalizeToken(avatarId);
  return avatarIndex.get(key) || null;
}

export function getTrainerAsset(regionCode?: string | null, trainerName?: string | null, assetPath?: string | null): string | null {
  return resolveFromAssetPath(trainerIndex, assetPath)
    || trainerIndex.get(`${normalizeToken(regionCode)}/${normalizeToken(trainerName)}`)
    || trainerIndex.get(normalizeToken(trainerName))
    || null;
}

export function getBadgeAsset(regionCode?: string | null, badgeName?: string | null, assetPath?: string | null): string | null {
  return resolveFromAssetPath(badgeIndex, assetPath)
    || badgeIndex.get(`${normalizeToken(regionCode)}/${normalizeToken(badgeName)}`)
    || badgeIndex.get(normalizeToken(badgeName))
    || null;
}

export function getItemAsset(itemCodeOrPath?: string | null): string | null {
  const direct = resolveFromAssetPath(itemIndex, itemCodeOrPath);
  if (direct) return direct;
  const key = normalizeToken(itemCodeOrPath);
  return itemIndex.get(`official/${key}`) || itemIndex.get(`custom/${key}`) || itemIndex.get(key) || null;
}

export function getScenarioBackdrop(regionCode?: string | null, preferredKey?: string | null): string | null {
  const region = normalizeToken(regionCode);
  const preferred = normalizeToken(preferredKey);
  if (region && preferred) {
    const exact = mapIndex.get(`${region}/${preferred}`);
    if (exact) return exact;
  }

  const defaults: Record<string, string> = {
    kanto: 'bosque_verde',
    johto: 'torre_campana',
    hoenn: 'bosque_tropical',
    zona_especial: 'jardin_lunar',
  };

  if (region) {
    const fallback = mapIndex.get(`${region}/${defaults[region] || ''}`);
    if (fallback) return fallback;
  }

  return mapIndex.get('kanto/bosque_verde')
    || mapIndex.get('johto/torre_campana')
    || mapIndex.get('hoenn/bosque_tropical')
    || mapIndex.get('jardin_lunar')
    || null;
}
