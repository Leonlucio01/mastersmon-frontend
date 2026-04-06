const ITEMS_CONFIG = {
    basePath: "img/items",
    officialBasePath: "img/items/official",
    customBasePath: "img/items/custom",
    manifestPath: "img/items/items_manifest.json",
    customManifestPath: "img/items/items_custom_manifest.json"
};

const ITEMS_STATE = {
    officialManifest: [],
    customManifest: [],
    loaded: false,
    loading: false,
    error: null,
    readyPromise: null,
    officialById: new Map(),
    officialByCode: new Map(),
    officialByName: new Map(),
    customByCode: new Map(),
    customByName: new Map()
};

const ITEMS_ALIAS_MAP = {
    "poke-ball": "poke-ball",
    "poke-ball.png": "poke-ball",
    "pokeball": "poke-ball",
    "poke-ball-item": "poke-ball",
    "poke-ball-icon": "poke-ball",
    "poke-ball-official": "poke-ball",
    "poke-ball-default": "poke-ball",
    "poke_ball": "poke-ball",
    "poke ball": "poke-ball",

    "great-ball": "great-ball",
    "great_ball": "great-ball",
    "great ball": "great-ball",
    "super-ball": "great-ball",
    "super_ball": "great-ball",
    "super ball": "great-ball",

    "ultra-ball": "ultra-ball",
    "ultra_ball": "ultra-ball",
    "ultra ball": "ultra-ball",

    "master-ball": "master-ball",
    "master_ball": "master-ball",
    "master ball": "master-ball",

    "potion": "potion",
    "pocion": "potion",
    "pocion-normal": "potion",

    "super-potion": "super-potion",
    "super_potion": "super-potion",
    "super potion": "super-potion",
    "super-pocion": "super-potion",
    "super_pocion": "super-potion",
    "super pocion": "super-potion",

    "hyper-potion": "hyper-potion",
    "hyper_potion": "hyper-potion",
    "hyper potion": "hyper-potion",
    "hiper-pocion": "hyper-potion",
    "hiper_pocion": "hyper-potion",
    "hiper pocion": "hyper-potion",

    "max-potion": "max-potion",
    "max_potion": "max-potion",
    "max potion": "max-potion",
    "max-pocion": "max-potion",
    "max_pocion": "max-potion",
    "max pocion": "max-potion",

    "revive": "revive",
    "revivir": "revive",
    "max-revive": "max-revive",
    "max_revive": "max-revive",
    "max revive": "max-revive",
    "max-revivir": "max-revive",
    "max_revivir": "max-revive",
    "max revivir": "max-revive",

    "fire-stone": "fire-stone",
    "fire_stone": "fire-stone",
    "fire stone": "fire-stone",
    "piedra-fuego": "fire-stone",
    "piedra_fuego": "fire-stone",
    "piedra fuego": "fire-stone",

    "water-stone": "water-stone",
    "water_stone": "water-stone",
    "water stone": "water-stone",
    "piedra-agua": "water-stone",
    "piedra_agua": "water-stone",
    "piedra agua": "water-stone",

    "thunder-stone": "thunder-stone",
    "thunder_stone": "thunder-stone",
    "thunder stone": "thunder-stone",
    "piedra-trueno": "thunder-stone",
    "piedra_trueno": "thunder-stone",
    "piedra trueno": "thunder-stone",

    "leaf-stone": "leaf-stone",
    "leaf_stone": "leaf-stone",
    "leaf stone": "leaf-stone",
    "piedra-hoja": "leaf-stone",
    "piedra_hoja": "leaf-stone",
    "piedra hoja": "leaf-stone",

    "moon-stone": "moon-stone",
    "moon_stone": "moon-stone",
    "moon stone": "moon-stone",
    "piedra-lunar": "moon-stone",
    "piedra_lunar": "moon-stone",
    "piedra lunar": "moon-stone",

    "sun-stone": "sun-stone",
    "sun_stone": "sun-stone",
    "sun stone": "sun-stone",
    "piedra-sol": "sun-stone",
    "piedra_sol": "sun-stone",
    "piedra sol": "sun-stone",

    "shiny-stone": "shiny-stone",
    "shiny_stone": "shiny-stone",
    "shiny stone": "shiny-stone",

    "dusk-stone": "dusk-stone",
    "dusk_stone": "dusk-stone",
    "dusk stone": "dusk-stone",

    "dawn-stone": "dawn-stone",
    "dawn_stone": "dawn-stone",
    "dawn stone": "dawn-stone",

    "ice-stone": "ice-stone",
    "ice_stone": "ice-stone",
    "ice stone": "ice-stone",

    "kings-rock": "kings-rock",
    "kings_rock": "kings-rock",
    "kings rock": "kings-rock",
    "kingsrock": "kings-rock",
    "king's-rock": "kings-rock",
    "king's rock": "kings-rock",

    "metal-coat": "metal-coat",
    "metal_coat": "metal-coat",
    "metal coat": "metal-coat",

    "dragon-scale": "dragon-scale",
    "dragon_scale": "dragon-scale",
    "dragon scale": "dragon-scale",

    "up-grade": "up-grade",
    "up_grade": "up-grade",
    "up grade": "up-grade",
    "upgrade": "up-grade",

    "linking-cord": "linking-cord",
    "linking_cord": "linking-cord",
    "linking cord": "linking-cord",
    "link-cable": "linking-cord",
    "link_cable": "linking-cord",
    "link cable": "linking-cord",
    "linkcable": "linking-cord",

    "protector": "protector",
    "electirizer": "electirizer",
    "magmarizer": "magmarizer",
    "dubious-disc": "dubious-disc",
    "dubious_disc": "dubious-disc",
    "dubious disc": "dubious-disc",
    "reaper-cloth": "reaper-cloth",
    "reaper_cloth": "reaper-cloth",
    "reaper cloth": "reaper-cloth",
    "razor-claw": "razor-claw",
    "razor_claw": "razor-claw",
    "razor claw": "razor-claw",
    "razor-fang": "razor-fang",
    "razor_fang": "razor-fang",
    "razor fang": "razor-fang",
    "deep-sea-tooth": "deep-sea-tooth",
    "deep_sea_tooth": "deep-sea-tooth",
    "deep sea tooth": "deep-sea-tooth",
    "deepseatooth": "deep-sea-tooth",
    "deep-sea-scale": "deep-sea-scale",
    "deep_sea_scale": "deep-sea-scale",
    "deep sea scale": "deep-sea-scale",
    "deepseascale": "deep-sea-scale",
    "oval-stone": "oval-stone",
    "oval_stone": "oval-stone",
    "oval stone": "oval-stone",
    "prism-scale": "prism-scale",
    "prism_scale": "prism-scale",
    "prism scale": "prism-scale",
    "sachet": "sachet",
    "whipped-dream": "whipped-dream",
    "whipped_dream": "whipped-dream",
    "whipped dream": "whipped-dream",
    "shiny-charm": "shiny-charm",
    "shiny_charm": "shiny-charm",
    "shiny charm": "shiny-charm",
    "beast-ball": "beast-ball",
    "beast_ball": "beast-ball",
    "beast ball": "beast-ball",

    "booster-battle-exp-x2-24h": "booster_battle_exp_x2_24h",
    "booster_battle_exp_x2_24h": "booster_battle_exp_x2_24h",
    "booster battle exp x2 24h": "booster_battle_exp_x2_24h",
    "battle-exp-x2-booster": "booster_battle_exp_x2_24h",
    "battle exp x2 booster": "booster_battle_exp_x2_24h",

    "booster-battle-gold-x2-24h": "booster_battle_gold_x2_24h",
    "booster_battle_gold_x2_24h": "booster_battle_gold_x2_24h",
    "booster battle gold x2 24h": "booster_battle_gold_x2_24h",
    "battle-gold-x2-booster": "booster_battle_gold_x2_24h",
    "battle gold x2 booster": "booster_battle_gold_x2_24h"
};

const ITEMS_FALLBACK_FILES = {
    "poke-ball": "0004_poke-ball.png",
    "great-ball": "0003_great-ball.png",
    "ultra-ball": "0002_ultra-ball.png",
    "master-ball": "0001_master-ball.png",
    "potion": "0017_potion.png",
    "super-potion": "0026_super-potion.png",
    "hyper-potion": "0025_hyper-potion.png",
    "max-potion": "0024_max-potion.png",
    "revive": "0028_revive.png",
    "max-revive": "0029_max-revive.png",
    "fire-stone": "0082_fire-stone.png",
    "water-stone": "0084_water-stone.png",
    "thunder-stone": "0083_thunder-stone.png",
    "leaf-stone": "0085_leaf-stone.png",
    "moon-stone": "0081_moon-stone.png",
    "sun-stone": "0080_sun-stone.png",
    "shiny-stone": "0107_shiny-stone.png",
    "dusk-stone": "0108_dusk-stone.png",
    "dawn-stone": "0109_dawn-stone.png",
    "oval-stone": "0110_oval-stone.png",
    "kings-rock": "0198_kings-rock.png",
    "deep-sea-tooth": "0203_deep-sea-tooth.png",
    "deep-sea-scale": "0204_deep-sea-scale.png",
    "metal-coat": "0210_metal-coat.png",
    "dragon-scale": "0212_dragon-scale.png",
    "up-grade": "0229_up-grade.png",
    "protector": "0298_protector.png",
    "electirizer": "0299_electirizer.png",
    "magmarizer": "0300_magmarizer.png",
    "dubious-disc": "0301_dubious-disc.png",
    "reaper-cloth": "0302_reaper-cloth.png",
    "razor-claw": "0303_razor-claw.png",
    "razor-fang": "0304_razor-fang.png",
    "prism-scale": "0580_prism-scale.png",
    "shiny-charm": "0675_shiny-charm.png",
    "whipped-dream": "0686_whipped-dream.png",
    "sachet": "0687_sachet.png"
};

const ITEMS_CUSTOM_FALLBACK_FILES = {
    "booster_battle_exp_x2_24h": "booster_battle_exp_x2_24h.png",
    "booster_battle_gold_x2_24h": "booster_battle_gold_x2_24h.png"
};

function normalizarClaveItem(valor = "") {
    return String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[’']/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function normalizarRutaItem(file = "", source = "official") {
    const raw = String(file || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/")) return raw;
    if (raw.startsWith("custom/")) return `${ITEMS_CONFIG.basePath}/${raw}`;
    if (raw.startsWith("official/")) return `${ITEMS_CONFIG.basePath}/${raw}`;
    return source === "custom"
        ? `${ITEMS_CONFIG.customBasePath}/${raw}`
        : `${ITEMS_CONFIG.officialBasePath}/${raw}`;
}

function resolverAliasItem(valor = "") {
    const normalizado = normalizarClaveItem(valor);
    return ITEMS_ALIAS_MAP[normalizado] || normalizado;
}

function registrarItemEnIndice(entry, source = "official") {
    if (!entry || typeof entry !== "object") return;

    const maps = source === "custom"
        ? { byId: null, byCode: ITEMS_STATE.customByCode, byName: ITEMS_STATE.customByName }
        : { byId: ITEMS_STATE.officialById, byCode: ITEMS_STATE.officialByCode, byName: ITEMS_STATE.officialByName };

    const itemId = Number(entry.item_id || entry.id || 0);
    const sourceName = String(entry.source || source || "official").toLowerCase() === "custom" ? "custom" : "official";
    const normalizedEntry = {
        ...entry,
        source: sourceName,
        file: String(entry.file || "").trim(),
        _resolvedPath: normalizarRutaItem(entry.file || "", sourceName)
    };

    if (maps.byId && itemId > 0) {
        maps.byId.set(itemId, normalizedEntry);
    }

    const candidateCodes = [
        entry.item_code,
        entry.codigo,
        entry.code,
        entry.item_name,
        entry.nombre,
        entry.display_name,
        entry.slug
    ];

    candidateCodes
        .filter(Boolean)
        .map(resolverAliasItem)
        .filter(Boolean)
        .forEach(code => maps.byCode.set(code, normalizedEntry));

    const candidateNames = [
        entry.item_name,
        entry.nombre,
        entry.display_name,
        entry.item_code,
        entry.codigo,
        ...(Array.isArray(entry.aliases) ? entry.aliases : [])
    ];

    candidateNames
        .filter(Boolean)
        .map(resolverAliasItem)
        .filter(Boolean)
        .forEach(name => maps.byName.set(name, normalizedEntry));
}

async function cargarJSONItemSeguro(url) {
    try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.warn(`No se pudo cargar ${url}:`, error);
        return [];
    }
}

async function cargarItemsManifest() {
    if (ITEMS_STATE.loaded) return {
        official: ITEMS_STATE.officialManifest,
        custom: ITEMS_STATE.customManifest
    };
    if (ITEMS_STATE.loading && ITEMS_STATE.readyPromise) return ITEMS_STATE.readyPromise;

    ITEMS_STATE.loading = true;
    ITEMS_STATE.error = null;

    ITEMS_STATE.readyPromise = Promise.all([
        cargarJSONItemSeguro(ITEMS_CONFIG.manifestPath),
        cargarJSONItemSeguro(ITEMS_CONFIG.customManifestPath)
    ]).then(([official, custom]) => {
        ITEMS_STATE.officialManifest = official;
        ITEMS_STATE.customManifest = custom;
        ITEMS_STATE.officialById.clear();
        ITEMS_STATE.officialByCode.clear();
        ITEMS_STATE.officialByName.clear();
        ITEMS_STATE.customByCode.clear();
        ITEMS_STATE.customByName.clear();

        official.forEach(entry => registrarItemEnIndice(entry, "official"));
        custom.forEach(entry => registrarItemEnIndice(entry, "custom"));

        ITEMS_STATE.loaded = true;
        ITEMS_STATE.loading = false;

        return { official, custom };
    }).catch(error => {
        ITEMS_STATE.error = error;
        ITEMS_STATE.loading = false;
        console.warn("No se pudo preparar el catálogo de items locales:", error);
        return {
            official: ITEMS_STATE.officialManifest,
            custom: ITEMS_STATE.customManifest
        };
    });

    return ITEMS_STATE.readyPromise;
}

function buscarEntradaItem({ itemCode = "", itemName = "", itemId = null } = {}) {
    const normalizedCode = resolverAliasItem(itemCode);
    const normalizedName = resolverAliasItem(itemName);
    const normalizedId = Number(itemId || 0);

    if (normalizedCode) {
        return ITEMS_STATE.customByCode.get(normalizedCode)
            || ITEMS_STATE.officialByCode.get(normalizedCode)
            || ITEMS_STATE.customByName.get(normalizedCode)
            || ITEMS_STATE.officialByName.get(normalizedCode)
            || null;
    }

    if (normalizedName) {
        return ITEMS_STATE.customByName.get(normalizedName)
            || ITEMS_STATE.officialByName.get(normalizedName)
            || ITEMS_STATE.customByCode.get(normalizedName)
            || ITEMS_STATE.officialByCode.get(normalizedName)
            || null;
    }

    if (normalizedId > 0) {
        return ITEMS_STATE.officialById.get(normalizedId) || null;
    }

    return null;
}

function construirRutaFallbackItem({ itemCode = "", itemName = "", itemId = null } = {}) {
    const normalizedCode = resolverAliasItem(itemCode);
    const normalizedName = resolverAliasItem(itemName);
    const normalizedId = Number(itemId || 0);

    const key = normalizedCode || normalizedName;

    if (key && ITEMS_CUSTOM_FALLBACK_FILES[key]) {
        return `${ITEMS_CONFIG.customBasePath}/${ITEMS_CUSTOM_FALLBACK_FILES[key]}`;
    }

    if (key && ITEMS_FALLBACK_FILES[key]) {
        return `${ITEMS_CONFIG.officialBasePath}/${ITEMS_FALLBACK_FILES[key]}`;
    }

    if (normalizedId > 0 && ITEMS_STATE.officialById.has(normalizedId)) {
        return ITEMS_STATE.officialById.get(normalizedId)._resolvedPath || "";
    }

    return `${ITEMS_CONFIG.officialBasePath}/0004_poke-ball.png`;
}

function obtenerRutaItemLocalSeguro({ itemCode = "", itemName = "", itemId = null, fallback = "" } = {}) {
    const entry = buscarEntradaItem({ itemCode, itemName, itemId });
    if (entry?._resolvedPath) return entry._resolvedPath;

    const fallbackPath = construirRutaFallbackItem({ itemCode, itemName, itemId });
    if (fallbackPath) return fallbackPath;

    return String(fallback || `${ITEMS_CONFIG.officialBasePath}/0004_poke-ball.png`);
}

function obtenerItemLocalMetadata({ itemCode = "", itemName = "", itemId = null } = {}) {
    return buscarEntradaItem({ itemCode, itemName, itemId });
}

window.ITEMS_CONFIG = ITEMS_CONFIG;
window.cargarItemsManifest = cargarItemsManifest;
window.obtenerRutaItemLocalSeguro = obtenerRutaItemLocalSeguro;
window.obtenerItemLocalMetadata = obtenerItemLocalMetadata;

cargarItemsManifest();
