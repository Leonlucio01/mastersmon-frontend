let pokemonsCapturadosMaps = [];
let pokemonsShinyCapturadosMaps = [];
let listaPokemonUsuarioMaps = [];
 
let zonasCache = [];
let mapaInicio = 0;
let mapasPorVista = 4;
let mapsFiltrosEstado = {
    search: "",
    region: "all",
    generation: "all",
    biome: "all"
};
 
let zonaSeleccionadaActual = null;
let encuentroActual = null;
let itemsUsuarioMaps = [];
let movimientoEnCurso = false;
let resizeTimer = null;
let itemSeleccionadoMaps = null;
let encuentroRequestId = 0;
let encuentroSolicitudEnCursoMaps = false;
let movimientoPendienteMaps = null;
 
/* =========================================================
   TIEMPO REAL / PRESENCIA
========================================================= */
let mapsRealtimeConnection = null;
let jugadoresZonaMaps = new Map();
let jugadoresZonaDomCache = new Map();
let presenciaZonaActivaId = null;
let ultimoNodoReportadoMaps = null;
let ultimoEnvioPresenciaMapsAt = 0;
let nodoPendientePresenciaMaps = null;
let timerPendientePresenciaMaps = null;
const MAPS_PRESENCIA_MOVE_THROTTLE_MS = 120;
 
const MAPS_ZONAS_CACHE_KEY = "mastersmon_maps_zonas_cache_v7";
let mapsRegionShowcaseStart = 0;
const MAPS_AVATAR_POSICIONES_KEY = "mastersmon_maps_avatar_posiciones_v1";
const MAPS_AVATAR_DEFAULT_ID = "steven";
const MAPS_AVATAR_ID_REGEX = /^[a-z0-9_-]{1,60}$/;
 
/* =========================================================
   RUTA BASE DEL AVATAR
   - Primera versión del contorno caminable
   - Está en porcentajes para que sea responsive
========================================================= */
const RUTA_CONTORNO_BASE = {
    start: "n5",
    nodes: {
        /* =========================================================
           FILA INFERIOR
        ========================================================= */
        n1:  { x: 8,  y: 84, right: "n2" },
        n2:  { x: 18, y: 84, left: "n1", right: "n3", up: "n10" },
        n3:  { x: 28, y: 84, left: "n2", right: "n4", up: "n11" },
        n4:  { x: 38, y: 84, left: "n3", right: "n5", up: "n12" },
        n5:  { x: 50, y: 84, left: "n4", right: "n6", up: "n13" },
        n6:  { x: 62, y: 84, left: "n5", right: "n7", up: "n14" },
        n7:  { x: 72, y: 84, left: "n6", right: "n8", up: "n15" },
        n8:  { x: 82, y: 84, left: "n7", right: "n9", up: "n16" },
        n9:  { x: 92, y: 84, left: "n8" },

        /* =========================================================
           FILA 2
        ========================================================= */
        n10: { x: 12, y: 72, down: "n2", right: "n11", up: "n17" },
        n11: { x: 24, y: 72, left: "n10", down: "n3", right: "n12", up: "n18" },
        n12: { x: 36, y: 72, left: "n11", down: "n4", right: "n13", up: "n19" },
        n13: { x: 48, y: 72, left: "n12", down: "n5", right: "n14", up: "n20" },
        n14: { x: 60, y: 72, left: "n13", down: "n6", right: "n15", up: "n21" },
        n15: { x: 72, y: 72, left: "n14", down: "n7", right: "n16", up: "n22" },
        n16: { x: 84, y: 72, left: "n15", down: "n8", up: "n23" },

        /* =========================================================
           FILA 3
        ========================================================= */
        n17: { x: 10, y: 60, down: "n10", right: "n18" },
        n18: { x: 22, y: 60, left: "n17", down: "n11", right: "n19", up: "n24" },
        n19: { x: 34, y: 60, left: "n18", down: "n12", right: "n20", up: "n25" },
        n20: { x: 46, y: 60, left: "n19", down: "n13", right: "n21", up: "n26" },
        n21: { x: 58, y: 60, left: "n20", down: "n14", right: "n22", up: "n27" },
        n22: { x: 70, y: 60, left: "n21", down: "n15", right: "n23", up: "n28" },
        n23: { x: 82, y: 60, left: "n22", down: "n16", up: "n29" },

        /* =========================================================
           FILA 4
        ========================================================= */
        n24: { x: 16, y: 48, down: "n18", right: "n25" },
        n25: { x: 30, y: 48, left: "n24", down: "n19", right: "n26", up: "n30" },
        n26: { x: 44, y: 48, left: "n25", down: "n20", right: "n27", up: "n31" },
        n27: { x: 58, y: 48, left: "n26", down: "n21", right: "n28", up: "n32" },
        n28: { x: 72, y: 48, left: "n27", down: "n22", right: "n29", up: "n33" },
        n29: { x: 86, y: 48, left: "n28", down: "n23" },

        /* =========================================================
           FILA SUPERIOR
        ========================================================= */
        n30: { x: 26, y: 36, down: "n25", right: "n31" },
        n31: { x: 42, y: 36, left: "n30", down: "n26", right: "n32" },
        n32: { x: 58, y: 36, left: "n31", down: "n27", right: "n33" },
        n33: { x: 74, y: 36, left: "n32", down: "n28" }
    }
};


const MAPS_MAX_STEP_PERCENT = 6;

/* =========================================================
   GREEN FOREST POR GRID
   0 = bloqueado
   1 = caminable
========================================================= */

function crearRutaDesdeGrid(grid, options = {}) {
    const {
        prefix = "grid",
        xMin = 4,
        yMin = 8,
        cellWidth = 5.3,
        cellHeight = 5.8,
        startRow = 8,
        startCol = 8
    } = options;

    const nodes = {};

    function esCaminable(row, col) {
        if (row < 0 || row >= grid.length) return false;
        const fila = grid[row];
        if (typeof fila === "string") {
            return fila[col] === "1";
        }
        return fila?.[col] === 1;
    }

    // 1) Crear nodos
    for (let row = 0; row < grid.length; row++) {
        const fila = grid[row];
        const totalCols = typeof fila === "string" ? fila.length : fila.length;

        for (let col = 0; col < totalCols; col++) {
            if (!esCaminable(row, col)) continue;

            const id = `${prefix}_${row}_${col}`;
            nodes[id] = {
                x: Number((xMin + col * cellWidth).toFixed(2)),
                y: Number((yMin + row * cellHeight).toFixed(2))
            };
        }
    }

    // 2) Conectar vecinos
    for (let row = 0; row < grid.length; row++) {
        const fila = grid[row];
        const totalCols = typeof fila === "string" ? fila.length : fila.length;

        for (let col = 0; col < totalCols; col++) {
            if (!esCaminable(row, col)) continue;

            const id = `${prefix}_${row}_${col}`;
            if (!nodes[id]) continue;

            if (esCaminable(row - 1, col)) nodes[id].up = `${prefix}_${row - 1}_${col}`;
            if (esCaminable(row + 1, col)) nodes[id].down = `${prefix}_${row + 1}_${col}`;
            if (esCaminable(row, col - 1)) nodes[id].left = `${prefix}_${row}_${col - 1}`;
            if (esCaminable(row, col + 1)) nodes[id].right = `${prefix}_${row}_${col + 1}`;
        }
    }

    // 3) Start seguro
    let start = `${prefix}_${startRow}_${startCol}`;
    if (!nodes[start]) {
        const ids = Object.keys(nodes);
        start = ids.length ? ids[0] : start;
    }

    return { start, nodes };
}

/* =========================================================
   GRID GREEN FOREST
   - Todo habilitado para probar cobertura completa
========================================================= */
const GRID_GREEN_FOREST = [
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111",
    "1111111111111111111"
];

const RUTA_GREEN_FOREST = crearRutaDesdeGrid(GRID_GREEN_FOREST, {
    prefix: "gf",
    xMin: 4,
    yMin: 7.5,
    cellWidth: 5.3,
    cellHeight: 4.45,
    startRow: 8,
    startCol: 8
});

const MAPAS_RUTAS = {
    bosque: RUTA_GREEN_FOREST,
    cueva: RUTA_GREEN_FOREST,
    lago: RUTA_GREEN_FOREST,
    torre: RUTA_GREEN_FOREST,
    default: RUTA_GREEN_FOREST
};
 
const MAPAS_CONFIG = {
    bosque: {
        card: "/img/maps/cards/kanto/bosque_verde.png",
        escenario: "/img/maps/escenarios/kanto/bosque_verde.png",
        clase: "zona-bosque",
        accent: "#16a34a",
        accentSoft: "rgba(22, 163, 74, 0.14)",
        surface: "#f0fdf4",
        surfaceStrong: "#dcfce7",
        glow: "rgba(34, 197, 94, 0.24)",
        buttonBg: "linear-gradient(135deg, #16a34a, #22c55e)",
        headerBg: "linear-gradient(180deg, rgba(240,253,244,0.98) 0%, rgba(255,255,255,0.98) 100%)"
    },
    cueva: {
        card: "/img/maps/cards/kanto/cueva_roca.png",
        escenario: "/img/maps/escenarios/kanto/caverna_roca.png",
        clase: "zona-cueva",
        accent: "#7c3aed",
        accentSoft: "rgba(124, 58, 237, 0.14)",
        surface: "#f5f3ff",
        surfaceStrong: "#ede9fe",
        glow: "rgba(139, 92, 246, 0.24)",
        buttonBg: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
        headerBg: "linear-gradient(180deg, rgba(245,243,255,0.98) 0%, rgba(255,255,255,0.98) 100%)"
    },
    lago: {
        card: "/img/maps/cards/kanto/lago_azul.png",
        escenario: "/img/maps/escenarios/kanto/lago_azul.png",
        clase: "zona-lago",
        accent: "#2563eb",
        accentSoft: "rgba(37, 99, 235, 0.14)",
        surface: "#eff6ff",
        surfaceStrong: "#dbeafe",
        glow: "rgba(59, 130, 246, 0.24)",
        buttonBg: "linear-gradient(135deg, #2563eb, #3b82f6)",
        headerBg: "linear-gradient(180deg, rgba(239,246,255,0.98) 0%, rgba(255,255,255,0.98) 100%)"
    },
    torre: {
        card: "/img/maps/cards/kanto/torre_batalla.png",
        escenario: "/img/maps/escenarios/kanto/torre_batalla.png",
        clase: "zona-torre",
        accent: "#dc2626",
        accentSoft: "rgba(220, 38, 38, 0.14)",
        surface: "#fef2f2",
        surfaceStrong: "#fee2e2",
        glow: "rgba(248, 113, 113, 0.24)",
        buttonBg: "linear-gradient(135deg, #dc2626, #ef4444)",
        headerBg: "linear-gradient(180deg, rgba(254,242,242,0.98) 0%, rgba(255,255,255,0.98) 100%)"
    },
    volcan: {
        card: "/img/maps/cards/hoenn/caverna_fuego.png",
        escenario: "/img/maps/escenarios/hoenn/caverna_fuego.png",
        clase: "zona-volcan",
        accent: "#ea580c",
        accentSoft: "rgba(234, 88, 12, 0.14)",
        surface: "#fff7ed",
        surfaceStrong: "#ffedd5",
        glow: "rgba(249, 115, 22, 0.24)",
        buttonBg: "linear-gradient(135deg, #ea580c, #f97316)",
        headerBg: "linear-gradient(180deg, rgba(255,247,237,0.98) 0%, rgba(255,255,255,0.98) 100%)"
    },
    nieve: {
        card: "/img/maps/cards/zona_especial/cumbre_nevada.png",
        escenario: "/img/maps/escenarios/zona_especial/cumbre_nevada.png",
        clase: "zona-nieve",
        accent: "#0891b2",
        accentSoft: "rgba(8, 145, 178, 0.14)",
        surface: "#ecfeff",
        surfaceStrong: "#cffafe",
        glow: "rgba(34, 211, 238, 0.20)",
        buttonBg: "linear-gradient(135deg, #0891b2, #06b6d4)",
        headerBg: "linear-gradient(180deg, rgba(236,254,255,0.98) 0%, rgba(255,255,255,0.98) 100%)"
    },
    pantano: {
        card: "/img/maps/cards/zona_especial/pantano_toxico.png",
        escenario: "/img/maps/escenarios/zona_especial/pantano_toxico.png",
        clase: "zona-pantano",
        accent: "#4d7c0f",
        accentSoft: "rgba(77, 124, 15, 0.14)",
        surface: "#f7fee7",
        surfaceStrong: "#ecfccb",
        glow: "rgba(132, 204, 22, 0.22)",
        buttonBg: "linear-gradient(135deg, #4d7c0f, #65a30d)",
        headerBg: "linear-gradient(180deg, rgba(247,254,231,0.98) 0%, rgba(255,255,255,0.98) 100%)"
    },
    fantasma: {
        card: "/img/maps/cards/zona_especial/torre_fantasma.png",
        escenario: "/img/maps/escenarios/zona_especial/torre_fantasma.png",
        clase: "zona-fantasma",
        accent: "#6d28d9",
        accentSoft: "rgba(109, 40, 217, 0.14)",
        surface: "#faf5ff",
        surfaceStrong: "#f3e8ff",
        glow: "rgba(168, 85, 247, 0.24)",
        buttonBg: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
        headerBg: "linear-gradient(180deg, rgba(250,245,255,0.98) 0%, rgba(255,255,255,0.98) 100%)"
    },
    electrico: {
        card: "/img/maps/cards/zona_especial/pico_trueno.png",
        escenario: "/img/maps/escenarios/zona_especial/pico_trueno.png",
        clase: "zona-electrico",
        accent: "#ca8a04",
        accentSoft: "rgba(202, 138, 4, 0.16)",
        surface: "#fefce8",
        surfaceStrong: "#fef3c7",
        glow: "rgba(250, 204, 21, 0.24)",
        buttonBg: "linear-gradient(135deg, #ca8a04, #eab308)",
        headerBg: "linear-gradient(180deg, rgba(254,252,232,0.98) 0%, rgba(255,255,255,0.98) 100%)"
    },
    desierto: {
        card: "/img/maps/cards/zona_especial/desierto_dorado.png",
        escenario: "/img/maps/escenarios/zona_especial/desierto_dorado.png",
        clase: "zona-desierto",
        accent: "#b45309",
        accentSoft: "rgba(180, 83, 9, 0.14)",
        surface: "#fffbeb",
        surfaceStrong: "#fef3c7",
        glow: "rgba(245, 158, 11, 0.24)",
        buttonBg: "linear-gradient(135deg, #b45309, #d97706)",
        headerBg: "linear-gradient(180deg, rgba(255,251,235,0.98) 0%, rgba(255,255,255,0.98) 100%)"
    },
    cielo: {
        card: "/img/maps/cards/zona_especial/santuario_dragon.png",
        escenario: "/img/maps/escenarios/zona_especial/santuario_dragon.png",
        clase: "zona-cielo",
        accent: "#0284c7",
        accentSoft: "rgba(2, 132, 199, 0.14)",
        surface: "#f0f9ff",
        surfaceStrong: "#e0f2fe",
        glow: "rgba(14, 165, 233, 0.24)",
        buttonBg: "linear-gradient(135deg, #0284c7, #0ea5e9)",
        headerBg: "linear-gradient(180deg, rgba(240,249,255,0.98) 0%, rgba(255,255,255,0.98) 100%)"
    },
    default: {
        card: "/img/maps/cards/kanto/bosque_verde.png",
        escenario: "/img/maps/escenarios/kanto/bosque_verde.png",
        clase: "zona-default",
        accent: "#475569",
        accentSoft: "rgba(71, 85, 105, 0.14)",
        surface: "#f8fafc",
        surfaceStrong: "#e2e8f0",
        glow: "rgba(100, 116, 139, 0.18)",
        buttonBg: "linear-gradient(135deg, #2563eb, #3b82f6)",
        headerBg: "linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,0.98) 100%)"
    }
};

const MAPS_REGION_BY_GENERATION = {
    1: "kanto",
    2: "johto",
    3: "hoenn",
    4: "sinnoh",
    5: "unova",
    6: "kalos",
    7: "alola",
    8: "galar",
    9: "paldea"
};


const MAPS_REGION_ORDER = ["kanto", "johto", "hoenn", "sinnoh", "unova", "kalos", "alola", "galar", "paldea", "frontier"];


const MAPS_REGION_SHOWCASE_ORDER = ["kanto", "johto", "hoenn", "frontier", "sinnoh", "unova", "kalos", "alola", "galar", "paldea"];
const MAPS_REGION_ICONS = {
    kanto: "🌿",
    johto: "🕯️",
    hoenn: "🌊",
    sinnoh: "⛰️",
    unova: "⚙️",
    kalos: "✨",
    alola: "🌴",
    galar: "🏟️",
    paldea: "🧭",
    frontier: "🗺️"
};

const MAPS_ZONE_COPY_BY_CODE = {
    kanto_green_forest: {
        en: {
            name: "Kanto Green Forest",
            desc: "An opening forest route built for bug, grass and fast starter captures."
        },
        es: {
            name: "Bosque Verde de Kanto",
            desc: "Una ruta inicial de bosque pensada para capturas rápidas de tipo bicho y planta."
        }
    },
    kanto_rock_cave: {
        en: {
            name: "Kanto Rock Cave",
            desc: "A compact cave route with rocky encounters and a sharper level climb."
        },
        es: {
            name: "Cueva Roca de Kanto",
            desc: "Una cueva compacta con encuentros rocosos y una subida de nivel más marcada."
        }
    },
    kanto_blue_lake: {
        en: {
            name: "Kanto Blue Lake",
            desc: "A fresh water route with classic lake encounters and balanced progression."
        },
        es: {
            name: "Lago Azul de Kanto",
            desc: "Una ruta acuática clásica con encuentros de lago y progreso equilibrado."
        }
    },
    kanto_battle_tower: {
        en: {
            name: "Kanto Battle Tower",
            desc: "A tactical route that feels like the bridge between early maps and harder content."
        },
        es: {
            name: "Torre Batalla de Kanto",
            desc: "Una ruta táctica que conecta los primeros mapas con contenido más exigente."
        }
    },
    johto_whisper_forest: {
        en: {
            name: "Johto Ancient Forest",
            desc: "An ancient forest route with calmer encounters and smoother mid-game pacing."
        },
        es: {
            name: "Bosque Ancestral de Johto",
            desc: "Un bosque antiguo y sereno, con encuentros naturales y un ritmo mid game más suave."
        }
    },
    johto_ember_cavern: {
        en: {
            name: "Johto Deep Ruins",
            desc: "A deeper ruins route with rocky encounters, mystery and stronger progression."
        },
        es: {
            name: "Ruinas Profundas de Johto",
            desc: "Una zona de ruinas subterráneas con roca, misterio y progresión más exigente."
        }
    },
    johto_silver_lake: {
        en: {
            name: "Johto Whirlpool Lake",
            desc: "A whirlpool lake route with calmer captures, aquatic variety and steady rewards."
        },
        es: {
            name: "Lago Remolino de Johto",
            desc: "Una ruta acuática con corrientes, remolinos y capturas más calmadas."
        }
    },
    johto_guardian_tower: {
        en: {
            name: "Johto Bell Tower",
            desc: "A mystical tower route suited for spiritual, psychic and aerial encounters."
        },
        es: {
            name: "Torre Campana de Johto",
            desc: "Una torre mística ideal para encuentros espirituales, psíquicos y voladores vigilantes."
        }
    },
    hoenn_rain_forest: {
        en: {
            name: "Hoenn Tropical Forest",
            desc: "A denser tropical forest route with stronger wild teams and a more adventurous biome mix."
        },
        es: {
            name: "Bosque Tropical de Hoenn",
            desc: "Un bosque tropical más denso, con encuentros salvajes más fuertes y un bioma más aventurero."
        }
    },
    hoenn_magma_cavern: {
        en: {
            name: "Hoenn Fire Cavern",
            desc: "A hotter cavern route designed for fire encounters and stronger volcanic pacing."
        },
        es: {
            name: "Caverna Fuego de Hoenn",
            desc: "Una caverna ardiente diseñada para encuentros de fuego, roca y un progreso volcánico más fuerte."
        }
    },
    hoenn_tide_lake: {
        en: {
            name: "Hoenn Coral Lagoon",
            desc: "A stronger water route with coral lagoon variety and more adventurous aquatic pacing."
        },
        es: {
            name: "Laguna Coral de Hoenn",
            desc: "Una laguna coral con variedad marina y una progresión acuática más fuerte."
        }
    },
    hoenn_sky_tower: {
        en: {
            name: "Hoenn Sky Pillar",
            desc: "A high-route finale with flying pressure, early dragons and a world-map feel."
        },
        es: {
            name: "Pilar del Cielo de Hoenn",
            desc: "Un cierre de ruta más alto, con presión voladora, dragones tempranos y sensación de mapa mundial."
        }
    },
    frontier_snow_summit: {
        en: {
            name: "Frontier Snow Summit",
            desc: "A frozen summit route with icy encounters, thinner air and rare high-altitude threats."
        },
        es: {
            name: "Cumbre Nevada de la Frontera",
            desc: "Una ruta helada de alta montaña, con encuentros de hielo, aire más duro y amenazas raras de gran altitud."
        }
    },
    frontier_golden_desert: {
        en: {
            name: "Frontier Golden Desert",
            desc: "A scorching desert route with dunes, ground pressure and relic-themed rare encounters."
        },
        es: {
            name: "Desierto Dorado de la Frontera",
            desc: "Una ruta abrasadora de desierto, con dunas, presión de tipo tierra y encuentros raros con aire de reliquia."
        }
    },
    frontier_moon_garden: {
        en: {
            name: "Frontier Moon Garden",
            desc: "A moonlit garden route with fairy, psychic and mystery-focused encounters."
        },
        es: {
            name: "Jardín Lunar de la Frontera",
            desc: "Una ruta iluminada por la luna, con encuentros de hada, psíquico y un tono mucho más misterioso."
        }
    },
    frontier_toxic_swamp: {
        en: {
            name: "Frontier Toxic Swamp",
            desc: "A toxic swamp route with poison-heavy encounters and a harsher survival feel."
        },
        es: {
            name: "Pantano Tóxico de la Frontera",
            desc: "Una ruta de pantano venenoso, con encuentros cargados de veneno y una sensación de supervivencia más dura."
        }
    },
    frontier_thunder_peak: {
        en: {
            name: "Frontier Thunder Peak",
            desc: "An electric mountain route with storm pressure, metallic wildlife and fast battles."
        },
        es: {
            name: "Pico Trueno de la Frontera",
            desc: "Una ruta eléctrica de montaña, con presión de tormenta, fauna metálica y combates más rápidos."
        }
    },
    frontier_dragon_sanctuary: {
        en: {
            name: "Frontier Dragon Sanctuary",
            desc: "A sacred highland route where dragon-themed encounters and rare starters feel at home."
        },
        es: {
            name: "Santuario Dragón de la Frontera",
            desc: "Una ruta sagrada de altura, donde encajan encuentros de dragón y starters raros con un tono especial."
        }
    },
    frontier_ghost_tower: {
        en: {
            name: "Frontier Ghost Tower",
            desc: "A haunted tower route packed with ghost, psychic and ominous late-route pressure."
        },
        es: {
            name: "Torre Fantasma de la Frontera",
            desc: "Una ruta de torre embrujada, cargada de encuentros fantasma, psíquicos y presión inquietante de tramo final."
        }
    }
};



function mapsZoneMatchesFilters(zona = null, filtros = mapsFiltrosEstado) {
    if (!zona) return false;

    const visual = obtenerVisualZonaMaps(zona);
    const search = normalizarTextoMaps(filtros?.search || "");
    const region = String(filtros?.region || "all").trim().toLowerCase();
    const generation = String(filtros?.generation || "all").trim().toLowerCase();
    const biome = String(filtros?.biome || "all").trim().toLowerCase();

    if (region !== "all" && String(visual.region || "").toLowerCase() !== region) {
        return false;
    }

    if (generation !== "all" && String(visual.generacion || "") !== generation) {
        return false;
    }

    if (biome !== "all" && String(visual.clave || "default").toLowerCase() !== biome) {
        return false;
    }

    if (search) {
        const textoZona = normalizarTextoMaps([
            zona?.codigo,
            zona?.nombre,
            zona?.descripcion,
            zona?.tipo_ambiente,
            zona?.region_codigo,
            zona?.tema_visual,
            visual.region,
            visual.clave,
            obtenerNombreZonaTraducido(zona),
            obtenerDescripcionZonaTraducida(zona)
        ].filter(Boolean).join(" "));

        if (!textoZona.includes(search)) {
            return false;
        }
    }

    return true;
}

function obtenerZonasFiltradas(includeSelected = true) {
    const base = Array.isArray(zonasCache) ? zonasCache : [];
    const filtradas = base.filter(zona => mapsZoneMatchesFilters(zona));

    if (includeSelected && zonaSeleccionadaActual) {
        const selectedId = Number(zonaSeleccionadaActual.id);
        const yaIncluida = filtradas.some(zona => Number(zona.id) === selectedId);
        if (!yaIncluida) {
            const zonaReal = base.find(zona => Number(zona.id) === selectedId);
            if (zonaReal) {
                return [zonaReal, ...filtradas];
            }
        }
    }

    return filtradas;
}

function obtenerConteoZonasFiltradasReal() {
    return (Array.isArray(zonasCache) ? zonasCache : []).filter(zona => mapsZoneMatchesFilters(zona)).length;
}

function reiniciarCarruselSegunFiltrosMaps() {
    const lista = obtenerZonasFiltradas();
    if (!lista.length) {
        mapaInicio = 0;
        return;
    }

    mapaInicio = Math.min(mapaInicio, Math.max(0, lista.length - 1));
}

function popularSelectMaps(element, options, allLabel) {
    if (!element) return;

    const current = String(element.value || "all");
    element.innerHTML = `<option value="all">${allLabel}</option>`;

    options.forEach(option => {
        const opt = document.createElement("option");
        opt.value = String(option.value);
        opt.textContent = option.label;
        element.appendChild(opt);
    });

    const allowed = new Set(["all", ...options.map(option => String(option.value))]);
    element.value = allowed.has(current) ? current : "all";
}

function construirOpcionesRegionMaps() {
    const disponibles = new Set();
    (Array.isArray(zonasCache) ? zonasCache : []).forEach(zona => {
        const region = String(obtenerVisualZonaMaps(zona).region || "frontier").toLowerCase();
        if (region) disponibles.add(region);
    });

    const ordenadas = MAPS_REGION_ORDER.filter(region => disponibles.has(region));
    return ordenadas.map(region => ({ value: region, label: obtenerTextoRegionMaps(region) }));
}

function construirOpcionesGeneracionMaps() {
    const generaciones = Array.from(new Set(
        (Array.isArray(zonasCache) ? zonasCache : [])
            .map(zona => Number(obtenerVisualZonaMaps(zona).generacion || 0))
            .filter(valor => Number.isFinite(valor) && valor > 0)
    )).sort((a, b) => a - b);

    return generaciones.map(generacion => ({
        value: String(generacion),
        label: obtenerTextoGeneracionMaps(generacion)
    }));
}

function construirOpcionesBiomaMaps() {
    const biomas = Array.from(new Set(
        (Array.isArray(zonasCache) ? zonasCache : [])
            .map(zona => String(obtenerVisualZonaMaps(zona).clave || "default").toLowerCase())
            .filter(Boolean)
    ));

    biomas.sort((a, b) => obtenerTextoBiomaMaps(a).localeCompare(obtenerTextoBiomaMaps(b), undefined, { sensitivity: "base" }));

    return biomas.map(clave => ({ value: clave, label: obtenerTextoBiomaMaps(clave) }));
}

function renderizarOpcionesFiltrosMaps() {
    popularSelectMaps(
        document.getElementById("filtroMapsRegion"),
        construirOpcionesRegionMaps(),
        tMapsLocal("maps_filter_all_regions", "All regions", "Todas las regiones")
    );

    popularSelectMaps(
        document.getElementById("filtroMapsGeneration"),
        construirOpcionesGeneracionMaps(),
        tMapsLocal("maps_filter_all_generations", "All generations", "Todas las generaciones")
    );

    popularSelectMaps(
        document.getElementById("filtroMapsBiome"),
        construirOpcionesBiomaMaps(),
        tMapsLocal("maps_filter_all_biomes", "All biomes", "Todos los biomas")
    );

    const searchInput = document.getElementById("buscarMapaInput");
    if (searchInput) {
        searchInput.placeholder = tMapsLocal(
            "maps_filter_search_placeholder",
            "Search maps, regions or biomes...",
            "Buscar mapas, regiones o biomas..."
        );
        searchInput.value = String(mapsFiltrosEstado.search || "");
    }
}

function renderizarResumenFiltrosMaps() {
    const results = document.getElementById("mapsFilterResultsText");
    const chips = document.getElementById("mapsFilterActiveChips");
    if (!results || !chips) return;

    const totalReal = Array.isArray(zonasCache) ? zonasCache.length : 0;
    const filtradasReal = obtenerConteoZonasFiltradasReal();

    const regionCountEl = document.getElementById("mapsDiscoveryRegionCount");
    const generationCountEl = document.getElementById("mapsDiscoveryGenerationCount");
    if (regionCountEl) {
        regionCountEl.textContent = String(construirOpcionesRegionMaps().length || 0);
    }
    if (generationCountEl) {
        generationCountEl.textContent = String(construirOpcionesGeneracionMaps().length || 0);
    }

    results.textContent = tMapsLocal(
        "maps_filter_results_summary",
        "Showing {shown} of {total} maps",
        "Mostrando {shown} de {total} mapas",
        { shown: filtradasReal, total: totalReal }
    );

    const activos = [];
    if (mapsFiltrosEstado.region !== "all") {
        activos.push(obtenerTextoRegionMaps(mapsFiltrosEstado.region));
    }
    if (mapsFiltrosEstado.generation !== "all") {
        activos.push(obtenerTextoGeneracionMaps(Number(mapsFiltrosEstado.generation)));
    }
    if (mapsFiltrosEstado.biome !== "all") {
        activos.push(obtenerTextoBiomaMaps(mapsFiltrosEstado.biome));
    }
    if (String(mapsFiltrosEstado.search || "").trim()) {
        activos.push(`“${String(mapsFiltrosEstado.search).trim()}”`);
    }

    chips.innerHTML = activos.length
        ? activos.map(texto => `<span class="maps-active-filter-chip">${texto}</span>`).join("")
        : `<span class="maps-active-filter-chip is-neutral">${tMapsLocal("maps_filter_no_active", "No active filters", "Sin filtros activos")}</span>`;
}


function obtenerStoryRegionMaps(region = "frontier") {
    const key = {
        kanto: "maps_region_story_kanto",
        johto: "maps_region_story_johto",
        hoenn: "maps_region_story_hoenn",
        frontier: "maps_region_story_frontier"
    }[region] || "maps_region_story_frontier";

    return tMapsLocal(
        key,
        region === "kanto"
            ? "Classic opening routes focused on fast catches, simple caves and a clean early-game flow."
            : region === "johto"
                ? "A calmer mid-game region with mystical forests, ember caverns and taller tower runs."
                : region === "hoenn"
                    ? "A stronger route set with rainy forests, magma caverns and a more adventurous late map vibe."
                    : "Special routes outside the main regional journey.",
        region === "kanto"
            ? "Rutas clásicas de inicio, ideales para capturas rápidas, cuevas simples y un early game limpio."
            : region === "johto"
                ? "Una región intermedia más serena, con bosques místicos, cavernas de fuego y torres más exigentes."
                : region === "hoenn"
                    ? "Un set de rutas más fuerte, con bosques lluviosos, cavernas de magma y una aventura más épica."
                    : "Rutas especiales fuera del recorrido regional principal."
    );
}

function obtenerResumenRegionesMaps() {
    const regiones = new Map();

    (Array.isArray(zonasCache) ? zonasCache : []).forEach(zona => {
        const visual = obtenerVisualZonaMaps(zona);
        const region = String(visual.region || "frontier").toLowerCase();
        if (!regiones.has(region)) {
            regiones.set(region, {
                codigo: region,
                generacion: visual.generacion || null,
                zonas: [],
                featured: null,
                biomas: new Set(),
                nivel_min: Number(zona?.nivel_min || 0),
                nivel_max: Number(zona?.nivel_max || 0)
            });
        }

        const item = regiones.get(region);
        item.zonas.push(zona);
        item.biomas.add(String(visual.clave || "default").toLowerCase());
        item.nivel_min = Math.min(item.nivel_min || Number(zona?.nivel_min || 0), Number(zona?.nivel_min || 0));
        item.nivel_max = Math.max(item.nivel_max || Number(zona?.nivel_max || 0), Number(zona?.nivel_max || 0));

        if (!item.featured || Number(zona?.orden || zona?.id || 0) < Number(item.featured?.orden || item.featured?.id || 0)) {
            item.featured = zona;
        }

        if (!item.generacion && visual.generacion) {
            item.generacion = visual.generacion;
        }
    });

    return Array.from(regiones.values())
        .sort((a, b) => {
            const orderA = MAPS_REGION_SHOWCASE_ORDER.indexOf(a.codigo);
            const orderB = MAPS_REGION_SHOWCASE_ORDER.indexOf(b.codigo);
            return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
        });
}

function obtenerTarjetasRegionVisiblesMaps() {
    const width = typeof window !== "undefined" ? window.innerWidth : 1440;
    if (width <= 720) return 1;
    if (width <= 1100) return 2;
    return 3;
}

function moverCarruselRegionesMaps(direccion = 1) {
    const resumen = obtenerResumenRegionesMaps();
    if (!resumen.length) return;

    const total = Math.max(1, resumen.length);
    mapsRegionShowcaseStart = (mapsRegionShowcaseStart + direccion) % total;
    if (mapsRegionShowcaseStart < 0) {
        mapsRegionShowcaseStart = total - 1;
    }

    renderizarShowcaseRegionesMaps();
}

function obtenerRegionesShowcaseVisiblesMaps() {
    const resumen = obtenerResumenRegionesMaps();
    if (!resumen.length) return [];

    const cantidad = Math.min(obtenerTarjetasRegionVisiblesMaps(), resumen.length);
    const visibles = [];

    for (let i = 0; i < cantidad; i++) {
        const index = (mapsRegionShowcaseStart + i) % resumen.length;
        visibles.push(resumen[index]);
    }

    return visibles;
}

async function enfocarRegionMaps(regionCodigo, { scrollToMaps = true, seleccionarPrimera = true } = {}) {
    const region = String(regionCodigo || "all").toLowerCase();
    if (!region || region === "all") {
        mapsFiltrosEstado.region = "all";
        renderizarOpcionesFiltrosMaps();
        aplicarFiltrosMaps();
        return;
    }

    mapsFiltrosEstado.region = region;
    renderizarOpcionesFiltrosMaps();
    aplicarFiltrosMaps();

    const zonasRegion = obtenerZonasFiltradas(false);
    if (!zonasRegion.length) return;

    mapaInicio = 0;
    renderizarZonas();

    if (seleccionarPrimera) {
        await seleccionarZona(zonasRegion[0].id);
    }

    if (scrollToMaps) {
        requestAnimationFrame(() => {
            setTimeout(() => {
                const target = document.getElementById("zonasContainer") || document.getElementById("encuentroContainer");
                if (target && typeof target.scrollIntoView === "function") {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 60);
        });
    }
}

function renderizarShowcaseRegionesMaps() {
    const container = document.getElementById("mapsRegionShowcase");
    if (!container) return;

    const resumen = obtenerRegionesShowcaseVisiblesMaps();

    if (!resumen.length) {
        container.innerHTML = "";
        return;
    }

    container.style.gridTemplateColumns = `repeat(${Math.max(1, resumen.length)}, minmax(0, 1fr))`;

    container.innerHTML = resumen.map(region => {
        const featured = region.featured;
        const visual = obtenerVisualZonaMaps(featured);
        const regionLabel = obtenerTextoRegionMaps(region.codigo);
        const generationLabel = obtenerTextoGeneracionMaps(region.generacion);
        const imageSrc = obtenerImagenCardZonaMaps(featured);
        const icon = MAPS_REGION_ICONS[region.codigo] || MAPS_REGION_ICONS.frontier;
        const routesLabel = tMapsLocal("maps_region_maps_count", "{count} routes", "{count} rutas", {
            count: region.zonas.length
        });
        const biomesLabel = tMapsLocal("maps_region_biomes_count", "{count} biomes", "{count} biomas", {
            count: region.biomas.size
        });
        const rangeLabel = tMapsLocal("maps_region_level_span", "Lv. {min} - {max}", "Nv. {min} - {max}", {
            min: Number(region.nivel_min || 1),
            max: Number(region.nivel_max || region.nivel_min || 1)
        });
        const featuredLabel = tMapsLocal("maps_region_featured_badge", "Featured route", "Ruta destacada");
        const actionLabel = String(mapsFiltrosEstado.region || "all") === region.codigo
            ? tMapsLocal("maps_region_focus_active", "Region active", "Región activa")
            : tMapsLocal("maps_region_focus", "Focus region", "Enfocar región");

        const biomeChips = Array.from(region.biomas)
            .slice(0, 3)
            .map(biome => `<span class="maps-region-biome-chip">${obtenerTextoBiomaMaps(biome)}</span>`)
            .join("");

        const activeClass = String(mapsFiltrosEstado.region || "all") === region.codigo ? "is-active" : "";

        return `
            <article class="maps-region-card ${activeClass}" style="--region-accent:${obtenerConfigZona(featured).accent};--region-soft:${obtenerConfigZona(featured).accentSoft};">
                <div class="maps-region-card-visual">
                    <span class="maps-region-card-emoji">${icon}</span>
                    <span class="maps-region-card-chip">${generationLabel}</span>
                    <img src="${imageSrc}" alt="${regionLabel}" loading="lazy" decoding="async">
                </div>

                <div class="maps-region-card-body">
                    <div class="maps-region-card-head">
                        <div>
                            <h4>${regionLabel}</h4>
                            <span class="maps-region-card-subtitle">${routesLabel}</span>
                        </div>
                        <span class="maps-region-card-status">${biomesLabel}</span>
                    </div>

                    <p class="maps-region-card-text">${obtenerStoryRegionMaps(region.codigo)}</p>

                    <div class="maps-region-card-stats">
                        <span class="maps-region-card-pill">${rangeLabel}</span>
                        <span class="maps-region-card-pill">${tMapsLocal("maps_region_featured_badge", "Featured route", "Ruta destacada")}</span>
                    </div>

                    <div class="maps-region-card-biomes">
                        ${biomeChips}
                    </div>

                    <div class="maps-region-card-actions">
                        <div>
                            <span class="maps-region-featured-label">${featuredLabel}</span>
                            <strong class="maps-region-featured-name">${obtenerNombreZonaTraducido(featured)}</strong>
                        </div>

                        <button class="btn-maps-region ${activeClass ? "is-secondary" : ""}" type="button" data-region-focus="${region.codigo}">
                            ${actionLabel}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    const totalRegiones = obtenerResumenRegionesMaps().length;
    const prevButton = document.getElementById("btnRegionPrev");
    const nextButton = document.getElementById("btnRegionNext");
    const deshabilitar = totalRegiones <= obtenerTarjetasRegionVisiblesMaps();
    if (prevButton) prevButton.disabled = deshabilitar;
    if (nextButton) nextButton.disabled = deshabilitar;
}


function aplicarFiltrosMaps({ preserveStart = false } = {}) {
    if (!preserveStart) {
        mapaInicio = 0;
    }

    reiniciarCarruselSegunFiltrosMaps();
    renderizarResumenFiltrosMaps();
    renderizarShowcaseRegionesMaps();
    renderizarZonas();
}

function resetearFiltrosMaps() {
    mapsFiltrosEstado = {
        search: "",
        region: "all",
        generation: "all",
        biome: "all"
    };

    renderizarOpcionesFiltrosMaps();
    aplicarFiltrosMaps();
}

function configurarFiltrosMaps() {
    const searchInput = document.getElementById("buscarMapaInput");
    const selectRegion = document.getElementById("filtroMapsRegion");
    const selectGeneration = document.getElementById("filtroMapsGeneration");
    const selectBiome = document.getElementById("filtroMapsBiome");
    const resetButton = document.getElementById("btnMapsFiltersReset");
    const regionShowcase = document.getElementById("mapsRegionShowcase");

    if (searchInput && !searchInput.dataset.mapsBound) {
        searchInput.dataset.mapsBound = "1";
        searchInput.addEventListener("input", (event) => {
            mapsFiltrosEstado.search = String(event.target.value || "");
            aplicarFiltrosMaps();
        });
    }

    if (selectRegion && !selectRegion.dataset.mapsBound) {
        selectRegion.dataset.mapsBound = "1";
        selectRegion.addEventListener("change", (event) => {
            mapsFiltrosEstado.region = String(event.target.value || "all");
            aplicarFiltrosMaps();
        });
    }

    if (selectGeneration && !selectGeneration.dataset.mapsBound) {
        selectGeneration.dataset.mapsBound = "1";
        selectGeneration.addEventListener("change", (event) => {
            mapsFiltrosEstado.generation = String(event.target.value || "all");
            aplicarFiltrosMaps();
        });
    }

    if (selectBiome && !selectBiome.dataset.mapsBound) {
        selectBiome.dataset.mapsBound = "1";
        selectBiome.addEventListener("change", (event) => {
            mapsFiltrosEstado.biome = String(event.target.value || "all");
            aplicarFiltrosMaps();
        });
    }

    if (resetButton && !resetButton.dataset.mapsBound) {
        resetButton.dataset.mapsBound = "1";
        resetButton.addEventListener("click", () => resetearFiltrosMaps());
    }

    if (regionShowcase && !regionShowcase.dataset.mapsBound) {
        regionShowcase.dataset.mapsBound = "1";
        regionShowcase.addEventListener("click", async (event) => {
            const button = event.target.closest("[data-region-focus]");
            if (!button) return;
            const region = String(button.dataset.regionFocus || "all");
            await enfocarRegionMaps(region, { scrollToMaps: true, seleccionarPrimera: true });
        });
    }

    const regionPrev = document.getElementById("btnRegionPrev");
    if (regionPrev && !regionPrev.dataset.mapsBound) {
        regionPrev.dataset.mapsBound = "1";
        regionPrev.addEventListener("click", () => moverCarruselRegionesMaps(-1));
    }

    const regionNext = document.getElementById("btnRegionNext");
    if (regionNext && !regionNext.dataset.mapsBound) {
        regionNext.dataset.mapsBound = "1";
        regionNext.addEventListener("click", () => moverCarruselRegionesMaps(1));
    }

    renderizarOpcionesFiltrosMaps();
    renderizarResumenFiltrosMaps();
    renderizarShowcaseRegionesMaps();
}

document.addEventListener("DOMContentLoaded", () => {
    configurarCarruselMaps();
    configurarFiltrosMaps();
    configurarEventosDelegados();
    configurarMovimientoTeclado();
    configurarSelectorIdiomaMaps();
    configurarEventosSesionMaps();
    configurarEventosLifecycleMaps();
    inicializarMaps();
 
    const btnCerrarModalResultado = document.getElementById("btnCerrarModalResultadoCaptura");
    if (btnCerrarModalResultado) {
        btnCerrarModalResultado.addEventListener("click", cerrarModalResultadoCaptura);
    }
 
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const anterior = mapasPorVista;
            mapasPorVista = obtenerMapasPorVista();
 
            if (anterior !== mapasPorVista) {
                renderizarZonas();
            }

            renderizarShowcaseRegionesMaps();
            actualizarSpritesMovimientoMaps();
            actualizarBotonesMovimientoDisponibles();

            if (window.innerWidth > 900) {
                cerrarMenuMobile();
            }
        }, 40);
    });
 
    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
});
 
async function inicializarMaps() {
    mostrarCargaZonas();

    try {
        if (usuarioAutenticadoMaps()) {
            await sincronizarSesionMapsConBackend(true);
        }

        await cargarZonas();
        renderizarZonas();

        if (zonasCache.length > 0) {
            const primeraZonaId = Number(zonasCache[0].id);

            const cargaSecundaria = Promise.allSettled([
                cargarPokemonUsuarioMaps(),
                cargarItemsUsuarioMaps()
            ]);

            await seleccionarZona(primeraZonaId);

            cargaSecundaria.then(() => {
                if (encuentroActual) {
                    renderEncuentroActual();
                }
            });
        }
    } catch (error) {
        console.error("Error iniciando Maps:", error);
        mostrarErrorZonas();
    }
}
 
/* =========================
   MENU MOBILE
========================= */
function cerrarMenuMobile() {
    const menuMobile = document.getElementById("menuMobile");
    if (menuMobile) {
        menuMobile.classList.remove("menu-open");
    }
}
 
/* =========================
   IDIOMA
========================= */
function configurarSelectorIdiomaMaps() {
    const selectDesktop = document.getElementById("languageSelect");
    const selectMobile = document.getElementById("languageSelectMobile");
 
    const langActual = typeof getCurrentLang === "function" ? getCurrentLang() : "en";
 
    if (selectDesktop) selectDesktop.value = langActual;
    if (selectMobile) selectMobile.value = langActual;
 
    if (selectDesktop) {
        selectDesktop.addEventListener("change", (e) => {
            const nuevo = e.target.value;
            if (selectMobile) selectMobile.value = nuevo;
            setCurrentLang(nuevo);
        });
    }
 
    if (selectMobile) {
        selectMobile.addEventListener("change", (e) => {
            const nuevo = e.target.value;
            if (selectDesktop) selectDesktop.value = nuevo;
            setCurrentLang(nuevo);
        });
    }
 
    document.addEventListener("languageChanged", () => {
        if (typeof applyTranslations === "function") {
            applyTranslations();
        }
 
        if (zonasCache.length > 0) {
            renderizarOpcionesFiltrosMaps();
            renderizarResumenFiltrosMaps();
            renderizarShowcaseRegionesMaps();
            renderizarZonas();
        }
 
        if (!zonaSeleccionadaActual) return;
 
        if (!usuarioAutenticadoMaps()) {
            renderBloqueoMapsSinSesion();
            return;
        }
 
        renderizarZonaExploracion();
 
        const encuentro = document.getElementById("encuentroContainer");
        if (encuentro) {
            encuentro.classList.remove("oculto");
        }
 
        renderizarJugadoresMapa();
 
        if (encuentroActual) {
            renderEncuentroActual();
        } else {
            renderPanelDerechoVacio();
        }

        refrescarUiMusicaMaps();
    });
}
 
/* =========================
   SESION / AVATAR
========================= */
function configurarEventosSesionMaps() {
    document.addEventListener("usuarioSesionActualizada", async (event) => {
        const usuario = event.detail?.usuario || null;
 
        sincronizarUsuarioLocalMaps(usuario);
 
        if (zonasCache.length > 0) {
            renderizarResumenFiltrosMaps();
            renderizarShowcaseRegionesMaps();
            renderizarZonas();
        }
 
        if (!zonaSeleccionadaActual) return;
 
        if (!usuarioAutenticadoMaps()) {
            encuentroRequestId++;
            reiniciarEstadoMovimientoMaps();
            cerrarModalesSecundarios();
            limpiarMensajeMaps();
            limpiarEncuentroActual();
            limpiarJugadoresZonaMaps();
            await salirPresenciaMaps(true);
            renderBloqueoMapsSinSesion();
            return;
        }
 
        renderizarZonaExploracion();
 
        const encuentro = document.getElementById("encuentroContainer");
        if (encuentro) {
            encuentro.classList.remove("oculto");
        }
 
        try {
            await Promise.all([
                cargarPokemonUsuarioMaps(),
                cargarItemsUsuarioMaps(true),
                iniciarPresenciaZonaActual()
            ]);
        } catch (error) {
            console.warn("No se pudo refrescar la sesión en Maps:", error);
        }
 
        refrescarAvatarMapsEnPantalla();
 
        if (encuentroActual) {
            renderEncuentroActual();
        } else {
            renderPanelDerechoVacio();
        }
    });
 
    window.addEventListener("storage", async (event) => {
        if (
            event.key === "usuario" ||
            event.key === "usuario_id" ||
            event.key === "access_token" ||
            event.key === "usuario_avatar_id"
        ) {
            if (!usuarioAutenticadoMaps()) {
                encuentroRequestId++;
                reiniciarEstadoMovimientoMaps();
                cerrarModalesSecundarios();
                limpiarMensajeMaps();
                limpiarEncuentroActual();
                limpiarJugadoresZonaMaps();
                await salirPresenciaMaps(true);
 
                if (zonasCache.length > 0) {
                    renderizarShowcaseRegionesMaps();
                    renderizarZonas();
                }
 
                if (zonaSeleccionadaActual) {
                    renderBloqueoMapsSinSesion();
                }
                return;
            }
 
            await sincronizarSesionMapsConBackend(true);
            refrescarAvatarMapsEnPantalla();
            await refrescarPresenciaZonaActual();
            sincronizarPresenciaLocalMaps();
        }
    });
 
    document.addEventListener("visibilitychange", async () => {
        if (!document.hidden) {
            if (!usuarioAutenticadoMaps()) {
                if (zonaSeleccionadaActual) {
                    renderBloqueoMapsSinSesion();
                }
                return;
            }
 
            await sincronizarSesionMapsConBackend(true);
            refrescarAvatarMapsEnPantalla();
            await refrescarPresenciaZonaActual();
            sincronizarPresenciaLocalMaps();
        }
    });
}
 
function configurarEventosLifecycleMaps() {
    window.addEventListener("beforeunload", () => {
        salirPresenciaMaps(true);
    });
 
    window.addEventListener("pagehide", () => {
        salirPresenciaMaps(true);
    });
}
 
function sincronizarUsuarioLocalMaps(usuario) {
    if (!usuario || typeof usuario !== "object") return;
 
    try {
        localStorage.setItem("usuario", JSON.stringify(usuario));
        if (usuario.id != null) {
            localStorage.setItem("usuario_id", String(usuario.id));
        }
    } catch (error) {
        console.warn("No se pudo sincronizar usuario local en Maps:", error);
    }
}
 
function refrescarAvatarMapsEnPantalla() {
    if (!zonaSeleccionadaActual) return;
 
    const avatarWrap = document.getElementById("avatarMapa");
    if (!avatarWrap) return;
 
    renderizarAvatarMapa();
}
 
/* =========================
   EVENTOS DELEGADOS
========================= */
function configurarEventosDelegados() {
    const zonasContainer = document.getElementById("zonasContainer");
    const encuentroContainer = document.getElementById("encuentroContainer");
 
    if (zonasContainer) {
        zonasContainer.addEventListener("click", async (event) => {
            const btn = event.target.closest("[data-zona-id]");
            if (!btn) return;
 
            const zonaId = Number(btn.dataset.zonaId);
            await seleccionarZona(zonaId);
        });
    }
 
    if (encuentroContainer) {
        encuentroContainer.addEventListener("click", async (event) => {
            const moveBtn = event.target.closest("[data-move]");
            if (moveBtn) {
                const direccion = moveBtn.dataset.move;
                await moverEnMapa(direccion);
                return;
            }
 
            const capturarBtn = event.target.closest("#btnCapturarMapa");
            if (capturarBtn) {
                await intentarCapturaDesdeUI();
                return;
            }
 
            const huirBtn = event.target.closest("#btnHuirMapa");
            if (huirBtn) {
                cerrarModalesSecundarios();
                limpiarMensajeMaps();
                limpiarEncuentroActual();
                renderPanelDerechoVacio();
                return;
            }
        });
 
        encuentroContainer.addEventListener("change", (event) => {
            if (event.target.matches('input[name="pokeballSeleccionada"]')) {
                itemSeleccionadoMaps = Number(event.target.value);
                actualizarProbabilidadVisual(encuentroActual?.es_shiny === true);
            }
        });
    }
}
 
/* =========================
   CARRUSEL MAPAS
========================= */
function obtenerMapasPorVista() {
    const width = window.innerWidth;
 
    if (width <= 768) return 1;
    if (width <= 1100) return 2;
    if (width <= 1400) return 3;
    return 4;
}
 
function configurarCarruselMaps() {
    mapasPorVista = obtenerMapasPorVista();
 
    const btnPrev = document.getElementById("btnMapPrev");
    const btnNext = document.getElementById("btnMapNext");
 
    if (btnPrev) {
        btnPrev.addEventListener("click", () => moverCarrusel(-1));
    }
 
    if (btnNext) {
        btnNext.addEventListener("click", () => moverCarrusel(1));
    }
}
 

function moverCarrusel(direccion) {
    const lista = obtenerZonasFiltradas();
    if (!lista.length) return;

    mapaInicio += direccion;

    if (mapaInicio < 0) {
        mapaInicio = lista.length - 1;
    }

    if (mapaInicio >= lista.length) {
        mapaInicio = 0;
    }

    renderizarZonas();
}

function obtenerZonasVisibles() {
    const lista = obtenerZonasFiltradas();
    if (!lista.length) return [];

    const visibles = [];
    const total = Math.min(mapasPorVista, lista.length);

    for (let i = 0; i < total; i++) {
        const index = (mapaInicio + i) % lista.length;
        visibles.push(lista[index]);
    }

    return visibles;
}

 
/* =========================
   CACHE SIMPLE
========================= */
function guardarCacheZonas(zonas) {
    try {
        sessionStorage.setItem(MAPS_ZONAS_CACHE_KEY, JSON.stringify(zonas));
    } catch (error) {
        console.warn("No se pudo guardar cache de zonas:", error);
    }
}
 
function leerCacheZonas() {
    try {
        const raw = sessionStorage.getItem(MAPS_ZONAS_CACHE_KEY);
        if (!raw) return null;
 
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        console.warn("No se pudo leer cache de zonas:", error);
        return null;
    }
}
 
/* =========================
   AVATAR / MOVIMIENTO EN MAPA
========================= */
function tMaps(key, fallback) {
    if (typeof t !== "function") return fallback;
    const valor = t(key);
    return valor && valor !== key ? valor : fallback;
}

function getCurrentLangMapsSafe() {
    return typeof getCurrentLang === "function" ? getCurrentLang() : "en";
}

function reemplazarParametrosTextoMaps(texto, params = {}) {
    return String(texto || "").replace(/\{(\w+)\}/g, (_, key) => {
        return params[key] !== undefined ? String(params[key]) : `{${key}}`;
    });
}

function tMapsLocal(key, fallbackEn, fallbackEs = fallbackEn, params = {}) {
    let valor = "";
    if (typeof t === "function") {
        try {
            valor = t(key, params);
        } catch (error) {
            valor = "";
        }
    }

    if (!valor || valor === key) {
        valor = getCurrentLangMapsSafe() === "es" ? fallbackEs : fallbackEn;
    }

    return reemplazarParametrosTextoMaps(valor, params);
}

function normalizarTextoMaps(valor = "") {
    return String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizarRutaAssetMaps(ruta = "") {
    const valor = String(ruta || "").trim();
    if (!valor) return "";

    if (/^(https?:)?\/\//i.test(valor) || /^data:/i.test(valor) || /^blob:/i.test(valor)) {
        return valor;
    }

    const limpio = valor.replace(/^\.\//, "");
    return limpio.startsWith("/") ? limpio : `/${limpio}`;
}

function obtenerUrlCssAssetMaps(ruta = "") {
    const normalizada = normalizarRutaAssetMaps(ruta);
    if (!normalizada) return "";

    if (/^(https?:)?\/\//i.test(normalizada) || /^data:/i.test(normalizada) || /^blob:/i.test(normalizada)) {
        return normalizada;
    }

    try {
        return new URL(normalizada, window.location.origin).href;
    } catch (error) {
        return normalizada;
    }
}

function leerStorageJSON(clave, defecto = null) {
    try {
        const raw = localStorage.getItem(clave);
        return raw ? JSON.parse(raw) : defecto;
    } catch (error) {
        console.warn(`No se pudo leer ${clave}:`, error);
        return defecto;
    }
}
 
function guardarStorageJSON(clave, valor) {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
        console.warn(`No se pudo guardar ${clave}:`, error);
    }
}

async function sincronizarSesionMapsConBackend(forzar = false) {
    if (!usuarioAutenticadoMaps()) return null;

    const usuarioLocal = getUsuarioLocal();
    if (!forzar && usuarioLocal?.id != null) {
        return usuarioLocal;
    }

    if (typeof obtenerUsuarioActual !== "function") {
        return usuarioLocal || null;
    }

    try {
        const usuarioActual = await obtenerUsuarioActual();
        return usuarioActual || usuarioLocal || null;
    } catch (error) {
        console.warn("No se pudo sincronizar la sesión de Maps con el backend:", error);
        return usuarioLocal || null;
    }
}

function obtenerUsuarioIdMapsActual() {
    const usuario = obtenerUsuarioMapsActual();

    if (usuario?.id != null) {
        const id = Number(usuario.id);
        return Number.isFinite(id) && id > 0 ? id : null;
    }

    const idLocal = Number(getUsuarioIdLocal());
    return Number.isFinite(idLocal) && idLocal > 0 ? idLocal : null;
}
 
function obtenerUsuarioMapsActual() {
    return getUsuarioLocal() || null;
}
 
function obtenerNombreEntrenadorMaps() {
    const usuario = obtenerUsuarioMapsActual();
    return usuario?.nombre || tMaps("maps_trainer_default", "Trainer");
}
 
function normalizarAvatarIdMaps(avatarId) {
    const valor = String(avatarId || "").trim().toLowerCase();
    if (!valor || !MAPS_AVATAR_ID_REGEX.test(valor)) {
        return MAPS_AVATAR_DEFAULT_ID;
    }
    return valor;
}
 
function obtenerAvatarIdUsuarioMaps() {
    const usuario = obtenerUsuarioMapsActual();
 
    if (usuario?.avatar_id) {
        return normalizarAvatarIdMaps(usuario.avatar_id);
    }
 
    if (typeof getAvatarIdLocal === "function") {
        return normalizarAvatarIdMaps(getAvatarIdLocal());
    }
 
    return MAPS_AVATAR_DEFAULT_ID;
}
 
function obtenerRutaAvatarMaps(avatarId = null) {
    const avatarNormalizado = normalizarAvatarIdMaps(avatarId || obtenerAvatarIdUsuarioMaps());
    return `img/avatars/${avatarNormalizado}.png`;
}
 
function obtenerRutaAvatarFallbackMaps() {
    return `img/avatars/${MAPS_AVATAR_DEFAULT_ID}.png`;
}
 
function obtenerClaveZonaActualMaps() {
    return obtenerClaveZona(zonaSeleccionadaActual?.nombre || "");
}
 
function obtenerRutaZonaActual() {
    const clave = obtenerClaveZonaActualMaps();
    return MAPAS_RUTAS[clave] || MAPAS_RUTAS.default;
}
 
function asegurarPosicionAvatarZona(zona = null) {
    const clave = obtenerClaveZona(zona?.nombre || "");
    const ruta = MAPAS_RUTAS[clave] || MAPAS_RUTAS.default;
    const posiciones = leerStorageJSON(MAPS_AVATAR_POSICIONES_KEY, {}) || {};
 
    if (!posiciones[clave] || !ruta.nodes[posiciones[clave]]) {
        posiciones[clave] = ruta.start;
        guardarStorageJSON(MAPS_AVATAR_POSICIONES_KEY, posiciones);
    }
}
 
function obtenerNodoActualAvatar() {
    const ruta = obtenerRutaZonaActual();
    const clave = obtenerClaveZonaActualMaps();
    const posiciones = leerStorageJSON(MAPS_AVATAR_POSICIONES_KEY, {}) || {};
    const nodeId = posiciones[clave] && ruta.nodes[posiciones[clave]]
        ? posiciones[clave]
        : ruta.start;
 
    return {
        id: nodeId,
        ...ruta.nodes[nodeId]
    };
}
 
function guardarNodoActualAvatar(nodeId) {
    const clave = obtenerClaveZonaActualMaps();
    const ruta = obtenerRutaZonaActual();
    if (!ruta.nodes[nodeId]) return;
 
    const posiciones = leerStorageJSON(MAPS_AVATAR_POSICIONES_KEY, {}) || {};
    posiciones[clave] = nodeId;
    guardarStorageJSON(MAPS_AVATAR_POSICIONES_KEY, posiciones);
}
 

function sincronizarMusicaMapaZonaActual() {
    try {
        if (window.MapsAudio && typeof window.MapsAudio.handleZoneChange === "function") {
            window.MapsAudio.handleZoneChange(zonaSeleccionadaActual);
        }
    } catch (error) {
        console.warn("No se pudo sincronizar la música de Maps:", error);
    }
}

function refrescarUiMusicaMaps() {
    try {
        if (window.MapsAudio && typeof window.MapsAudio.refreshUI === "function") {
            window.MapsAudio.refreshUI();
        }
    } catch (error) {
        console.warn("No se pudo refrescar la UI de música de Maps:", error);
    }
}

async function reproducirShinySfxMaps() {
    try {
        if (window.MapsAudio && typeof window.MapsAudio.playShinySfx === "function") {
            await window.MapsAudio.playShinySfx();
        }
    } catch (error) {
        console.warn("No se pudo reproducir el SFX shiny de Maps:", error);
    }
}

function obtenerSiguienteNodoAvatar(direccion) {
    const actual = obtenerNodoActualAvatar();
    return actual?.[direccion] || null;
}
 
function puedeMoverAvatar(direccion) {
    return !!obtenerSiguienteNodoAvatar(direccion);
}
 
function renderizarAvatarMapa() {
    const avatarWrap = document.getElementById("avatarMapa");
    if (!avatarWrap || !zonaSeleccionadaActual) return;
 
    const nodo = obtenerNodoActualAvatar();
    const nombreEntrenador = obtenerNombreEntrenadorMaps();
    const avatarId = obtenerAvatarIdUsuarioMaps();
    const rutaAvatar = obtenerRutaAvatarMaps(avatarId);
    const rutaFallback = obtenerRutaAvatarFallbackMaps();
 
    avatarWrap.style.left = `${nodo.x}%`;
    avatarWrap.style.top = `${nodo.y}%`;
    avatarWrap.setAttribute("aria-label", nombreEntrenador);
    avatarWrap.dataset.avatarId = avatarId;
 
    avatarWrap.innerHTML = `
        <div class="avatar-mapa-sombra"></div>
        <img
            src="${rutaAvatar}"
            alt="${nombreEntrenador}"
            class="avatar-mapa-img"
            loading="eager"
            decoding="async"
            onerror="if(this.dataset.fallbackApplied==='1')return;this.dataset.fallbackApplied='1';this.src='${rutaFallback}';"
        >
    `;
 
    actualizarBotonesMovimientoDisponibles(false);
}
 
function obtenerSpriteMovimientoMaps(direccion = "", disponible = true) {
    const sprites = {
        up: "img/maps/move/north_able.png",
        down: "img/maps/move/south_able.png",
        left: "img/maps/move/west_able.png",
        right: "img/maps/move/east_able.png"
    };

    return sprites[direccion] || sprites.up;
}

function actualizarSpritesMovimientoMaps() {
    const botones = document.querySelectorAll("[data-move]");

    botones.forEach(btn => {
        const direccion = String(btn.dataset.move || "").trim().toLowerCase();
        const img = btn.querySelector("img");
        if (!img) return;

        const spriteSeguro = obtenerSpriteMovimientoMaps(direccion, !btn.disabled);
        if (img.getAttribute("src") !== spriteSeguro) {
            img.setAttribute("src", spriteSeguro);
        }

        img.onerror = function () {
            if (this.dataset.fallbackApplied === "1") return;
            this.dataset.fallbackApplied = "1";
            this.src = spriteSeguro;
        };
    });
}

function actualizarBotonesMovimientoDisponibles(cargando = false) {
    const botones = document.querySelectorAll("[data-move]");
 
    botones.forEach(btn => {
        const direccion = btn.dataset.move;
        const disponible = zonaSeleccionadaActual && puedeMoverAvatar(direccion);
 
        btn.disabled = cargando || !disponible;
        btn.classList.toggle("move-bloqueado", !cargando && !disponible);
    });

    actualizarSpritesMovimientoMaps();
}
 
function moverAvatarVisual(nodeId) {
    return new Promise((resolve) => {
        const avatarWrap = document.getElementById("avatarMapa");
        const ruta = obtenerRutaZonaActual();
        const nodo = ruta.nodes[nodeId];
 
        if (!avatarWrap || !nodo) {
            resolve();
            return;
        }
 
        requestAnimationFrame(() => {
            avatarWrap.style.left = `${nodo.x}%`;
            avatarWrap.style.top = `${nodo.y}%`;
            setTimeout(resolve, 25);
        });
    });
}
 
function configurarMovimientoTeclado() {
    if (window.__mapsKeyboardReady) return;
    window.__mapsKeyboardReady = true;
 
    window.addEventListener("keydown", async (event) => {
        const tag = document.activeElement?.tagName || "";
        const escribiendo = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);
 
        if (escribiendo) return;
        if (!zonaSeleccionadaActual) return;
        if (document.getElementById("modalShiny") && !document.getElementById("modalShiny").classList.contains("oculto")) return;
        if (document.getElementById("modalResultadoCaptura") && !document.getElementById("modalResultadoCaptura").classList.contains("oculto")) return;
 
        const mapa = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
            w: "up",
            W: "up",
            s: "down",
            S: "down",
            a: "left",
            A: "left",
            d: "right",
            D: "right"
        };
 
        const direccion = mapa[event.key];
        if (!direccion) return;
 
        event.preventDefault();
        await moverEnMapa(direccion);
    });
}
 
/* =========================
   TIEMPO REAL / PRESENCIA
========================= */
function obtenerLayerJugadoresMaps() {
    return document.getElementById("jugadoresMapaLayer");
}
 
function limpiarColaPresenciaMovimientoMaps() {
    if (timerPendientePresenciaMaps) {
        clearTimeout(timerPendientePresenciaMaps);
        timerPendientePresenciaMaps = null;
    }

    nodoPendientePresenciaMaps = null;
    ultimoEnvioPresenciaMapsAt = 0;
}

function limpiarJugadoresDomCacheMaps({ removeNodes = true } = {}) {
    jugadoresZonaDomCache.forEach((elemento) => {
        if (removeNodes && elemento?.remove) {
            elemento.remove();
        }
    });
    jugadoresZonaDomCache.clear();
}

function limpiarJugadoresZonaMaps() {
    jugadoresZonaMaps.clear();
    presenciaZonaActivaId = null;
    limpiarColaPresenciaMovimientoMaps();
    limpiarJugadoresDomCacheMaps();
    renderizarJugadoresMapa();
}
 
function obtenerNodoMapaPorId(nodeId) {
    const ruta = obtenerRutaZonaActual();
    if (!ruta || !ruta.nodes) return null;
    return ruta.nodes[nodeId] ? { id: nodeId, ...ruta.nodes[nodeId] } : null;
}
 
function obtenerInicialNombreJugador(nombre = "") {
    const limpio = String(nombre || "").trim();
    return limpio ? limpio.charAt(0).toUpperCase() : "T";
}
 
function esJugadorActualMaps(usuarioId) {
    const actual = obtenerUsuarioIdMapsActual();
    return Number(actual) > 0 && Number(actual) === Number(usuarioId);
}

 
function crearHtmlJugadorMapa(jugador, nodo) {
    const nombre = jugador?.nombre || tMaps("maps_trainer_default", "Trainer");
    const avatarId = normalizarAvatarIdMaps(jugador?.avatar_id || MAPS_AVATAR_DEFAULT_ID);
    const rutaAvatar = obtenerRutaAvatarMaps(avatarId);
    const rutaFallback = obtenerRutaAvatarFallbackMaps();
    const inicial = obtenerInicialNombreJugador(nombre);
 
    return `
        <div
            class="jugador-mapa"
            data-usuario-id="${Number(jugador.usuario_id)}"
            data-avatar-id="${avatarId}"
            style="left:${nodo.x}%; top:${nodo.y}%"
            aria-label="${nombre}"
            title="${nombre}"
        >
            <div class="jugador-mapa-etiqueta">${nombre}</div>
            <div class="jugador-mapa-sombra"></div>
            <img
                src="${rutaAvatar}"
                alt="${nombre}"
                class="jugador-mapa-img"
                loading="lazy"
                decoding="async"
                onerror="if(this.dataset.fallbackApplied==='1')return;this.dataset.fallbackApplied='1';this.src='${rutaFallback}';"
            >
            <div class="jugador-mapa-inicial">${inicial}</div>
        </div>
    `;
}

function crearElementoJugadorMapaMaps(jugador, nodo) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = crearHtmlJugadorMapa(jugador, nodo).trim();
    return wrapper.firstElementChild;
}

function actualizarElementoJugadorDomMapa(elemento, jugador, nodo) {
    if (!elemento || !jugador || !nodo) return;

    const nombre = jugador?.nombre || tMaps("maps_trainer_default", "Trainer");
    const avatarId = normalizarAvatarIdMaps(jugador?.avatar_id || MAPS_AVATAR_DEFAULT_ID);
    const rutaAvatar = obtenerRutaAvatarMaps(avatarId);
    const rutaFallback = obtenerRutaAvatarFallbackMaps();
    const inicial = obtenerInicialNombreJugador(nombre);

    elemento.dataset.usuarioId = String(Number(jugador.usuario_id));
    elemento.dataset.avatarId = avatarId;
    elemento.style.left = `${nodo.x}%`;
    elemento.style.top = `${nodo.y}%`;
    elemento.setAttribute("aria-label", nombre);
    elemento.setAttribute("title", nombre);

    const etiqueta = elemento.querySelector(".jugador-mapa-etiqueta");
    if (etiqueta && etiqueta.textContent !== nombre) {
        etiqueta.textContent = nombre;
    }

    const inicialBox = elemento.querySelector(".jugador-mapa-inicial");
    if (inicialBox && inicialBox.textContent !== inicial) {
        inicialBox.textContent = inicial;
    }

    const img = elemento.querySelector(".jugador-mapa-img");
    if (img) {
        if (img.getAttribute("src") !== rutaAvatar) {
            img.dataset.fallbackApplied = "0";
            img.setAttribute("src", rutaAvatar);
        }
        if (img.getAttribute("alt") !== nombre) {
            img.setAttribute("alt", nombre);
        }
        img.setAttribute(
            "onerror",
            `if(this.dataset.fallbackApplied==='1')return;this.dataset.fallbackApplied='1';this.src='${rutaFallback}';`
        );
    }
}

function quitarJugadorDomMapa(usuarioId) {
    const jugadorId = Number(usuarioId);
    const elemento = jugadoresZonaDomCache.get(jugadorId);
    if (elemento?.remove) {
        elemento.remove();
    }
    jugadoresZonaDomCache.delete(jugadorId);
}

function reemplazarJugadorDomMapa(jugador) {
    if (!jugador || jugador.usuario_id == null) return null;

    const layer = obtenerLayerJugadoresMaps();
    if (!layer) return null;

    const jugadorId = Number(jugador.usuario_id);
    const nodo = obtenerNodoMapaPorId(jugador.nodo_id);

    if (!nodo || esJugadorActualMaps(jugadorId)) {
        quitarJugadorDomMapa(jugadorId);
        return null;
    }

    let elemento = jugadoresZonaDomCache.get(jugadorId);

    if (!elemento || !elemento.isConnected) {
        elemento = crearElementoJugadorMapaMaps(jugador, nodo);
        layer.appendChild(elemento);
        jugadoresZonaDomCache.set(jugadorId, elemento);
        return elemento;
    }

    actualizarElementoJugadorDomMapa(elemento, jugador, nodo);
    jugadoresZonaDomCache.set(jugadorId, elemento);
    return elemento;
}
 
function renderizarJugadoresMapa() {
    const layer = obtenerLayerJugadoresMaps();
    if (!layer) return;
 
    if (!zonaSeleccionadaActual || !usuarioAutenticadoMaps()) {
        layer.innerHTML = "";
        limpiarJugadoresDomCacheMaps({ removeNodes: false });
        return;
    }
 
    const jugadores = Array.from(jugadoresZonaMaps.values())
        .filter(j => !esJugadorActualMaps(j.usuario_id))
        .filter(j => String(j.nodo_id || "").trim() !== "")
        .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), undefined, { sensitivity: "base" }));

    layer.innerHTML = "";
    limpiarJugadoresDomCacheMaps({ removeNodes: false });

    const fragment = document.createDocumentFragment();

    jugadores.forEach((jugador) => {
        const nodo = obtenerNodoMapaPorId(jugador.nodo_id);
        if (!nodo) return;

        const elemento = crearElementoJugadorMapaMaps(jugador, nodo);
        jugadoresZonaDomCache.set(Number(jugador.usuario_id), elemento);
        fragment.appendChild(elemento);
    });

    layer.appendChild(fragment);
}
 
function upsertJugadorZonaMaps(jugador) {
    if (!jugador || jugador.usuario_id == null) return;
    if (esJugadorActualMaps(jugador.usuario_id)) return;
 
    const normalizado = {
        ...jugador,
        usuario_id: Number(jugador.usuario_id)
    };

    const previo = jugadoresZonaMaps.get(normalizado.usuario_id);
    const sinCambios = previo
        && String(previo.nodo_id || "") === String(normalizado.nodo_id || "")
        && String(previo.nombre || "") === String(normalizado.nombre || "")
        && String(previo.avatar_id || "") === String(normalizado.avatar_id || "");

    if (sinCambios) {
        return;
    }

    jugadoresZonaMaps.set(normalizado.usuario_id, normalizado);
    reemplazarJugadorDomMapa(normalizado);
}
 
function quitarJugadorZonaMaps(usuarioId) {
    const jugadorId = Number(usuarioId);
    jugadoresZonaMaps.delete(jugadorId);
    quitarJugadorDomMapa(jugadorId);
}
 
function asegurarConexionTiempoRealMaps() {
    if (mapsRealtimeConnection) return mapsRealtimeConnection;
    if (typeof crearConexionTiempoRealMaps !== "function") return null;
 
    mapsRealtimeConnection = crearConexionTiempoRealMaps({
        onOpen: () => {
            // La función de api.js reenvía automáticamente el último join al reconectar.
        },
        onClose: () => {
            // Mantener silencioso para no ensuciar la UI del mapa.
        },
        onError: (error) => {
            console.warn("WebSocket Maps:", error);
        },
        onReconnect: ({ intentos, delay }) => {
            console.warn(`Maps WS reconectando. Intento ${intentos}, espera ${delay}ms`);
        },
        onMessage: (data) => {
            procesarMensajeTiempoRealMaps(data);
        }
    });
 
    mapsRealtimeConnection.connect();
    return mapsRealtimeConnection;
}
 
function procesarMensajeTiempoRealMaps(data) {
    const type = String(data?.type || "").toLowerCase();
 
    if (!type) return;
 
    if (type === "connected") {
        return;
    }
 
    if (type === "pong") {
        return;
    }
 
    if (type === "snapshot") {
        const zonaId = Number(data?.zona_id || 0);
        if (!zonaSeleccionadaActual || Number(zonaSeleccionadaActual.id) !== zonaId) return;
 
        jugadoresZonaMaps.clear();
 
        if (Array.isArray(data.jugadores)) {
            data.jugadores.forEach((jugador) => {
                if (!esJugadorActualMaps(jugador.usuario_id)) {
                    jugadoresZonaMaps.set(Number(jugador.usuario_id), {
                        ...jugador,
                        usuario_id: Number(jugador.usuario_id)
                    });
                }
            });
        }
 
        renderizarJugadoresMapa();
        return;
    }
 
    if (type === "upsert") {
        const jugador = data?.jugador || null;
        if (!jugador) return;
 
        if (!zonaSeleccionadaActual) return;
        if (Number(jugador.zona_id || 0) !== Number(zonaSeleccionadaActual.id)) return;
 
        upsertJugadorZonaMaps(jugador);
        return;
    }
 
    if (type === "remove") {
        const usuarioId = Number(data?.usuario_id || 0);
        if (!usuarioId) return;
 
        quitarJugadorZonaMaps(usuarioId);
        return;
    }
 
    if (type === "ack") {
        const self = data?.self || null;
        if (self && Number(self.usuario_id || 0) === Number(obtenerUsuarioIdMapsActual() || 0)) {
            ultimoNodoReportadoMaps = String(self.nodo_id || ultimoNodoReportadoMaps || "");
        }
        return;
    }
 
    if (type === "left") {
        return;
    }
 
    if (type === "error") {
        console.warn("Error WS Maps:", data?.message || data);
    }
}
 
async function refrescarPresenciaZonaActual() {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) return;
 
    try {
        const data = await obtenerPresenciaMapa(zonaSeleccionadaActual.id);
        if (!data || !Array.isArray(data.jugadores)) return;
        if (!zonaSeleccionadaActual || Number(data.zona_id || 0) !== Number(zonaSeleccionadaActual.id)) return;
 
        jugadoresZonaMaps.clear();
 
        data.jugadores.forEach((jugador) => {
            if (!esJugadorActualMaps(jugador.usuario_id)) {
                jugadoresZonaMaps.set(Number(jugador.usuario_id), {
                    ...jugador,
                    usuario_id: Number(jugador.usuario_id)
                });
            }
        });
 
        renderizarJugadoresMapa();
    } catch (error) {
        console.warn("No se pudo refrescar la presencia de la zona:", error);
    }
}
 
async function iniciarPresenciaZonaActual() {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) {
        limpiarJugadoresZonaMaps();
        return;
    }
 
    const nodoActual = obtenerNodoActualAvatar();
    const zonaId = Number(zonaSeleccionadaActual.id);
    const nodoId = String(nodoActual?.id || "").trim().toLowerCase();
 
    if (!zonaId || !nodoId) {
        limpiarJugadoresZonaMaps();
        return;
    }
 
    presenciaZonaActivaId = zonaId;
    ultimoNodoReportadoMaps = nodoId;
    limpiarColaPresenciaMovimientoMaps();
    jugadoresZonaMaps.clear();
    renderizarJugadoresMapa();
 
    try {
        const snapshot = await obtenerPresenciaMapa(zonaId);
        if (snapshot && Array.isArray(snapshot.jugadores) && zonaSeleccionadaActual && Number(zonaSeleccionadaActual.id) === zonaId) {
            snapshot.jugadores.forEach((jugador) => {
                if (!esJugadorActualMaps(jugador.usuario_id)) {
                    jugadoresZonaMaps.set(Number(jugador.usuario_id), {
                        ...jugador,
                        usuario_id: Number(jugador.usuario_id)
                    });
                }
            });
            renderizarJugadoresMapa();
        }
    } catch (error) {
        console.warn("No se pudo cargar snapshot de presencia:", error);
    }
 
    const conexion = asegurarConexionTiempoRealMaps();
 
    if (conexion) {
        conexion.join(zonaId, nodoId);
    } else {
        try {
            await actualizarPresenciaMapa(zonaId, nodoId);
        } catch (error) {
            console.warn("No se pudo actualizar la presencia inicial por HTTP:", error);
        }
    }
}
 
function enviarPresenciaMovimientoMaps(nodoNormalizado) {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) return;
    if (!nodoNormalizado) return;

    ultimoNodoReportadoMaps = nodoNormalizado;
    ultimoEnvioPresenciaMapsAt = Date.now();

    const conexion = asegurarConexionTiempoRealMaps();
 
    if (conexion) {
        const enviado = conexion.move(nodoNormalizado);
 
        if (!enviado) {
            actualizarPresenciaMapa(zonaSeleccionadaActual.id, nodoNormalizado)
                .catch((error) => {
                    console.warn("Fallback HTTP de movimiento falló:", error);
                });
        }
 
        return;
    }
 
    actualizarPresenciaMapa(zonaSeleccionadaActual.id, nodoNormalizado)
        .catch((error) => {
            console.warn("No se pudo actualizar presencia por HTTP:", error);
        });
}

function flushPresenciaMovimientoPendienteMaps() {
    if (timerPendientePresenciaMaps) {
        clearTimeout(timerPendientePresenciaMaps);
        timerPendientePresenciaMaps = null;
    }

    const nodoPendiente = nodoPendientePresenciaMaps;
    nodoPendientePresenciaMaps = null;

    if (!nodoPendiente) return;
    enviarPresenciaMovimientoMaps(nodoPendiente);
}

function sincronizarPresenciaMovimiento(nodoId) {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) return;
    if (!nodoId) return;
 
    const nodoNormalizado = String(nodoId).trim().toLowerCase();
    if (!nodoNormalizado) return;

    const ahora = Date.now();
    const tiempoDesdeUltimoEnvio = ahora - Number(ultimoEnvioPresenciaMapsAt || 0);

    if (!ultimoEnvioPresenciaMapsAt || tiempoDesdeUltimoEnvio >= MAPS_PRESENCIA_MOVE_THROTTLE_MS) {
        nodoPendientePresenciaMaps = null;
        flushPresenciaMovimientoPendienteMaps();
        enviarPresenciaMovimientoMaps(nodoNormalizado);
        return;
    }

    nodoPendientePresenciaMaps = nodoNormalizado;

    if (timerPendientePresenciaMaps) {
        return;
    }

    const espera = Math.max(16, MAPS_PRESENCIA_MOVE_THROTTLE_MS - tiempoDesdeUltimoEnvio);
    timerPendientePresenciaMaps = window.setTimeout(() => {
        flushPresenciaMovimientoPendienteMaps();
    }, espera);
}
 
function sincronizarPresenciaLocalMaps() {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) return;
 
    const nodoActual = obtenerNodoActualAvatar();
    const zonaId = Number(zonaSeleccionadaActual.id);
    const nodoId = String(nodoActual?.id || "").trim().toLowerCase();
 
    if (!zonaId || !nodoId) return;
 
    const conexion = asegurarConexionTiempoRealMaps();
    if (conexion) {
        conexion.join(zonaId, nodoId);
    }
}
 
async function salirPresenciaMaps(cerrarConexion = false) {
    try {
        if (mapsRealtimeConnection) {
            if (cerrarConexion) {
                mapsRealtimeConnection.disconnect();
            } else {
                mapsRealtimeConnection.leave();
            }
        }
    } catch (error) {
        console.warn("No se pudo hacer leave del WS Maps:", error);
    }
 
    try {
        if (usuarioAutenticadoMaps()) {
            await eliminarPresenciaMapa();
        }
    } catch (error) {
        console.warn("No se pudo eliminar presencia por HTTP:", error);
    }
 
    if (cerrarConexion && mapsRealtimeConnection) {
        mapsRealtimeConnection = null;
    }
 
    limpiarJugadoresZonaMaps();
}
 
/* =========================
   ENCUENTRO / SERVIDOR
========================= */

function obtenerRutaSpriteLocal(id, shiny = false) {
    const spriteId = normalizarSpriteId(id);
    return shiny
        ? `img/pokemon-png/sprites_shiny/${spriteId}_s.png`
        : `img/pokemon-png/sprites_normal/${spriteId}.png`;
}
 
async function solicitarEncuentroServidor(requestIdActual, zonaIdActual) {
    const pokemon = await fetchAuth(`${API_BASE}/maps/encuentro`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            zona_id: zonaIdActual
        })
    });

    if (requestIdActual !== encuentroRequestId) return;
    if (!zonaSeleccionadaActual || Number(zonaSeleccionadaActual.id) !== zonaIdActual) return;

    if (!pokemon || pokemon.error) {
        throw new Error(pokemon?.error || t("maps_encounter_generate_error"));
    }

    if (pokemon?.encuentro_generado === false) {
        limpiarEncuentroActual();
        renderPanelDerechoVacio("no_encounter");
        return;
    }

    if (!pokemon.pokemon_id) {
        throw new Error(t("maps_invalid_pokemon"));
    }

    const ttlSegundos = Number(
        pokemon.encuentro_ttl_segundos ??
        pokemon.ttl_segundos ??
        pokemon.ttl ??
        0
    );

    encuentroActual = {
        pokemon_id: Number(pokemon.pokemon_id),
        nombre: pokemon.nombre || t("maps_wild_pokemon_default"),
        tipo: pokemon.tipo || "—",
        imagen: pokemon.imagen || null,
        rareza: pokemon.rareza || null,
        generacion: pokemon.generacion || null,
        tiene_mega: !!pokemon.tiene_mega,
        ataque: Number(pokemon.ataque || 0),
        defensa: Number(pokemon.defensa || 0),
        ataque_especial: Number(pokemon.ataque_especial || pokemon.ataque || 0),
        defensa_especial: Number(pokemon.defensa_especial || pokemon.defensa || 0),
        hp: Number(pokemon.hp || pokemon.hp_max || 0),
        hp_max: Number(pokemon.hp_max || pokemon.hp || 0),
        velocidad: Number(pokemon.velocidad || 0),
        nivel: Number(pokemon.nivel || 1),
        es_shiny: pokemon.es_shiny === true || pokemon.es_shiny === 1,
        encuentro_token: pokemon.encuentro_token || null,
        encuentro_ttl_segundos: ttlSegundos,
        encuentro_expira_en_ms: ttlSegundos > 0 ? Date.now() + (ttlSegundos * 1000) : null
    };

    if (encuentroActual.es_shiny) {
        reproducirShinySfxMaps();
        mostrarModalShiny();
    }

    renderEncuentroActual();
}

 
/* =========================
   USUARIO / DATA
========================= */
async function cargarPokemonUsuarioMaps() {
    if (!usuarioAutenticadoMaps()) {
        pokemonsCapturadosMaps = [];
        pokemonsShinyCapturadosMaps = [];
        listaPokemonUsuarioMaps = [];
        return;
    }
 
    try {
        const data = await obtenerPokemonUsuarioActual();
 
        listaPokemonUsuarioMaps = Array.isArray(data) ? data : [];
 
        pokemonsCapturadosMaps = [
            ...new Set(listaPokemonUsuarioMaps.filter(p => !p.es_shiny).map(p => Number(p.pokemon_id)))
        ];
 
        pokemonsShinyCapturadosMaps = [
            ...new Set(listaPokemonUsuarioMaps.filter(p => p.es_shiny).map(p => Number(p.pokemon_id)))
        ];
    } catch (error) {
        console.error("Error cargando Pokémon del usuario en Maps:", error);
        pokemonsCapturadosMaps = [];
        pokemonsShinyCapturadosMaps = [];
        listaPokemonUsuarioMaps = [];
    }
}
 
async function cargarItemsUsuarioMaps(forzar = false) {
    if (!usuarioAutenticadoMaps()) {
        itemsUsuarioMaps = [];
        return [];
    }
 
    if (!forzar && itemsUsuarioMaps.length > 0) {
        return itemsUsuarioMaps;
    }
 
    try {
        const items = await obtenerItemsUsuarioActual();
 
        if (Array.isArray(items)) {
            itemsUsuarioMaps = items;
        }
 
        return itemsUsuarioMaps;
    } catch (error) {
        console.error("Error cargando items del usuario en Maps:", error);
        return itemsUsuarioMaps;
    }
}
 
function usuarioAutenticadoMaps() {
    return !!getAccessToken();
}
 
function esValorShinyMaps(valor) {
    return (
        valor === true ||
        valor === 1 ||
        valor === "1" ||
        String(valor).trim().toLowerCase() === "true"
    );
}

function obtenerEstadoCapturaMapa(pokemonId, esShiny, listaPokemonUsuario = []) {
    const shinyActual = esValorShinyMaps(esShiny);

    let cantidadNormal = 0;
    let cantidadShiny = 0;

    for (const p of listaPokemonUsuario) {
        if (Number(p.pokemon_id) !== Number(pokemonId)) continue;

        const shinyPokemon = esValorShinyMaps(p.es_shiny);

        if (shinyPokemon) {
            cantidadShiny += 1;
        } else {
            cantidadNormal += 1;
        }
    }

    const cantidadMostrada = shinyActual ? cantidadShiny : cantidadNormal;

    return {
        capturado: cantidadMostrada > 0,
        variante: shinyActual ? "shiny" : "normal",
        cantidad_normal: cantidadNormal,
        cantidad_shiny: cantidadShiny,
        cantidad_mostrada: cantidadMostrada,
        imagen: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
    };
}

/* =========================
   ZONAS
========================= */
function detectarClaveZonaPorTextoMaps(texto = "") {
    const valor = normalizarTextoMaps(texto);

    if (!valor) return "";
    if (/(bosque|forest|jungla|jungle|selva|grove|green)/.test(valor)) return "bosque";
    if (/(cueva|cave|cavern|caverna|gruta|mina|mine|roca|rock)/.test(valor)) return "cueva";
    if (/(lago|lake|water|rio|river|reef|coast|shore|ocean|mar|coral)/.test(valor)) return "lago";
    if (/(torre|tower|battle tower|fort|castle|citadel)/.test(valor)) return "torre";
    if (/(volcan|volcano|magma|lava|crater)/.test(valor)) return "volcan";
    if (/(pantano|swamp|marsh|bog|poison marsh)/.test(valor)) return "pantano";
    if (/(nieve|snow|ice|frozen|glacier|icy)/.test(valor)) return "nieve";
    if (/(fantasma|ghost|shadow|haunted|spirit|phantom)/.test(valor)) return "fantasma";
    if (/(electrico|electric|power|plant|generator|factory)/.test(valor)) return "electrico";
    if (/(desierto|desert|dune|sand|sandy)/.test(valor)) return "desierto";
    if (/(cielo|sky|cloud|wind|storm|air)/.test(valor)) return "cielo";

    return "";
}

function obtenerClaveZona(zona = null) {
    if (typeof zona === "string") {
        return detectarClaveZonaPorTextoMaps(zona) || "default";
    }

    const candidatos = [
        zona?.tema_visual,
        zona?.tipo_ambiente,
        zona?.nombre,
        zona?.descripcion
    ];

    for (const valor of candidatos) {
        const clave = detectarClaveZonaPorTextoMaps(valor);
        if (clave) return clave;
    }

    return "default";
}

function inferirGeneracionZonaMaps(zona = null, claveZona = "default") {
    const texto = normalizarTextoMaps([
        zona?.region_codigo,
        zona?.nombre,
        zona?.descripcion,
        zona?.tipo_ambiente
    ].filter(Boolean).join(" "));

    const mapa = [
        { match: /(gen\s*1|generation\s*1|kanto)/, generacion: 1 },
        { match: /(gen\s*2|generation\s*2|johto)/, generacion: 2 },
        { match: /(gen\s*3|generation\s*3|hoenn)/, generacion: 3 },
        { match: /(gen\s*4|generation\s*4|sinnoh)/, generacion: 4 },
        { match: /(gen\s*5|generation\s*5|unova)/, generacion: 5 },
        { match: /(gen\s*6|generation\s*6|kalos)/, generacion: 6 },
        { match: /(gen\s*7|generation\s*7|alola)/, generacion: 7 },
        { match: /(gen\s*8|generation\s*8|galar)/, generacion: 8 },
        { match: /(gen\s*9|generation\s*9|paldea)/, generacion: 9 }
    ];

    const encontrado = mapa.find(item => item.match.test(texto));
    if (encontrado) return encontrado.generacion;

    if (["bosque", "cueva", "lago", "torre"].includes(claveZona)) {
        return 1;
    }

    return null;
}

function inferirRegionZonaMaps(zona = null, generacion = null, claveZona = "default") {
    const texto = normalizarTextoMaps([
        zona?.region_codigo,
        zona?.nombre,
        zona?.descripcion,
        zona?.tipo_ambiente
    ].filter(Boolean).join(" "));

    const regiones = [
        { match: /kanto/, codigo: "kanto" },
        { match: /johto/, codigo: "johto" },
        { match: /hoenn/, codigo: "hoenn" },
        { match: /sinnoh/, codigo: "sinnoh" },
        { match: /unova/, codigo: "unova" },
        { match: /kalos/, codigo: "kalos" },
        { match: /alola/, codigo: "alola" },
        { match: /galar/, codigo: "galar" },
        { match: /paldea/, codigo: "paldea" }
    ];

    const encontrado = regiones.find(item => item.match.test(texto));
    if (encontrado) return encontrado.codigo;

    if (generacion && MAPS_REGION_BY_GENERATION[generacion]) {
        return MAPS_REGION_BY_GENERATION[generacion];
    }

    if (["bosque", "cueva", "lago", "torre"].includes(claveZona)) {
        return "kanto";
    }

    return "frontier";
}

function construirVisualZonaMaps(zona = null) {
    const clave = obtenerClaveZona(zona);
    const config = MAPAS_CONFIG[clave] || MAPAS_CONFIG.default;
    const generacion = inferirGeneracionZonaMaps(zona, clave);
    const region = inferirRegionZonaMaps(zona, generacion, clave);

    return {
        clave,
        config,
        generacion,
        region
    };
}

function enriquecerZonasVisualMaps(zonas = []) {
    return (Array.isArray(zonas) ? zonas : []).map(zona => ({
        ...zona,
        __maps_visual: construirVisualZonaMaps(zona)
    }));
}

function obtenerVisualZonaMaps(zona = null) {
    if (zona && typeof zona === "object" && zona.__maps_visual) {
        return zona.__maps_visual;
    }
    return construirVisualZonaMaps(zona);
}

function obtenerConfigZona(zona = null) {
    return obtenerVisualZonaMaps(zona).config || MAPAS_CONFIG.default;
}

function obtenerVarsCssZonaMaps(zona = null) {
    const config = obtenerConfigZona(zona);
    return [
        `--map-accent:${config.accent || MAPAS_CONFIG.default.accent}`,
        `--map-accent-soft:${config.accentSoft || MAPAS_CONFIG.default.accentSoft}`,
        `--map-surface:${config.surface || MAPAS_CONFIG.default.surface}`,
        `--map-surface-strong:${config.surfaceStrong || MAPAS_CONFIG.default.surfaceStrong}`,
        `--map-glow:${config.glow || MAPAS_CONFIG.default.glow}`,
        `--map-button-bg:${config.buttonBg || MAPAS_CONFIG.default.buttonBg}`,
        `--map-header-bg:${config.headerBg || MAPAS_CONFIG.default.headerBg}`
    ].join(";");
}

function obtenerTextoRegionMaps(codigo = "frontier") {
    const mapa = {
        kanto: ["Kanto", "Kanto"],
        johto: ["Johto", "Johto"],
        hoenn: ["Hoenn", "Hoenn"],
        sinnoh: ["Sinnoh", "Sinnoh"],
        unova: ["Unova", "Unova"],
        kalos: ["Kalos", "Kalos"],
        alola: ["Alola", "Alola"],
        galar: ["Galar", "Galar"],
        paldea: ["Paldea", "Paldea"],
        frontier: ["Frontier", "Frontera"]
    };

    const [en, es] = mapa[codigo] || mapa.frontier;
    return getCurrentLangMapsSafe() === "es" ? es : en;
}

function obtenerTextoGeneracionMaps(generacion = null) {
    if (!generacion) {
        return getCurrentLangMapsSafe() === "es" ? "Sin gen" : "No gen";
    }
    return `Gen ${Number(generacion)}`;
}

function obtenerTextoBiomaMaps(clave = "default") {
    const mapa = {
        bosque: ["Forest", "Bosque"],
        cueva: ["Cave", "Cueva"],
        lago: ["Lake", "Lago"],
        torre: ["Tower", "Torre"],
        volcan: ["Volcano", "Volcán"],
        nieve: ["Snow", "Nieve"],
        pantano: ["Swamp", "Pantano"],
        fantasma: ["Ghost", "Fantasma"],
        electrico: ["Electric", "Eléctrico"],
        desierto: ["Desert", "Desierto"],
        cielo: ["Sky", "Cielo"],
        default: ["Adventure", "Aventura"]
    };

    const [en, es] = mapa[clave] || mapa.default;
    return getCurrentLangMapsSafe() === "es" ? es : en;
}

function obtenerTextoDificultadZonaMaps(zona = null) {
    const nivelMax = Number(zona?.nivel_max || zona?.nivelMin || 0);

    if (nivelMax <= 12) {
        return getCurrentLangMapsSafe() === "es" ? "Inicio" : "Starter";
    }
    if (nivelMax <= 25) {
        return getCurrentLangMapsSafe() === "es" ? "Media" : "Standard";
    }
    if (nivelMax <= 45) {
        return getCurrentLangMapsSafe() === "es" ? "Avanzada" : "Advanced";
    }
    return getCurrentLangMapsSafe() === "es" ? "Élite" : "Elite";
}

function obtenerTextoEspeciesZonaMaps(zona = null) {
    const total = Array.isArray(zona?.pokemones) ? zona.pokemones.length : 0;
    return tMapsLocal("maps_zone_species_count", "{count} species", "{count} especies", {
        count: total
    });
}

function obtenerImagenCardZonaMaps(zona = null) {
    if (zona?.card_imagen) {
        return normalizarRutaAssetMaps(zona.card_imagen);
    }
    if (zona?.imagen) {
        return normalizarRutaAssetMaps(zona.imagen);
    }
    return normalizarRutaAssetMaps(obtenerConfigZona(zona).card);
}

function obtenerImagenEscenarioZonaMaps(zona = null) {
    if (zona?.escenario_imagen) {
        return normalizarRutaAssetMaps(zona.escenario_imagen);
    }
    return normalizarRutaAssetMaps(obtenerConfigZona(zona).escenario);
}

function obtenerNombreZonaTraducido(zona = null) {
    const nombreOriginal = typeof zona === "string"
        ? zona
        : (zona?.nombre || "");

    const zonaCodigo = typeof zona === "object" ? String(zona?.codigo || "").trim().toLowerCase() : "";
    const lang = getCurrentLangMapsSafe();

    if (zonaCodigo && MAPS_ZONE_COPY_BY_CODE[zonaCodigo]?.[lang]?.name) {
        return MAPS_ZONE_COPY_BY_CODE[zonaCodigo][lang].name;
    }

    const clave = obtenerClaveZona(zona);

    const mapa = {
        bosque: "maps_zone_bosque_name",
        cueva: "maps_zone_cueva_name",
        lago: "maps_zone_lago_name",
        torre: "maps_zone_torre_name"
    };

    const key = mapa[clave];
    const traducido = key ? t(key) : "";

    return traducido && traducido !== key
        ? traducido
        : nombreOriginal;
}

function obtenerDescripcionZonaTraducida(zona = null) {
    const descripcionOriginal = typeof zona === "object"
        ? (zona?.descripcion || "")
        : "";

    const zonaCodigo = typeof zona === "object" ? String(zona?.codigo || "").trim().toLowerCase() : "";
    const lang = getCurrentLangMapsSafe();

    if (zonaCodigo && MAPS_ZONE_COPY_BY_CODE[zonaCodigo]?.[lang]?.desc) {
        return MAPS_ZONE_COPY_BY_CODE[zonaCodigo][lang].desc;
    }

    const clave = obtenerClaveZona(zona);

    const mapa = {
        bosque: "maps_zone_bosque_desc",
        cueva: "maps_zone_cueva_desc",
        lago: "maps_zone_lago_desc",
        torre: "maps_zone_torre_desc"
    };

    const key = mapa[clave];
    const traducida = key ? t(key) : "";

    if (traducida && traducida !== key) {
        return traducida;
    }

    return descripcionOriginal || t("maps_default_zone_desc");
}

function traducirTipoPokemonMaps(tipo = "") {
    const mapa = {
        "Normal": "type_normal",
        "Fuego": "type_fire",
        "Agua": "type_water",
        "Planta": "type_grass",
        "Electrico": "type_electric",
        "Eléctrico": "type_electric",
        "Hielo": "type_ice",
        "Lucha": "type_fighting",
        "Veneno": "type_poison",
        "Tierra": "type_ground",
        "Volador": "type_flying",
        "Psiquico": "type_psychic",
        "Psíquico": "type_psychic",
        "Bicho": "type_bug",
        "Roca": "type_rock",
        "Fantasma": "type_ghost",
        "Dragon": "type_dragon",
        "Dragón": "type_dragon",
        "Acero": "type_steel",
        "Hada": "type_fairy"
    };
 
    return String(tipo || "")
        .split("/")
        .map(parte => {
            const limpio = parte.trim();
            const key = mapa[limpio];
            return key ? t(key) : limpio;
        })
        .join("/");
}
 
async function cargarZonas() {
    const cache = leerCacheZonas();
    if (cache && cache.length > 0) {
        zonasCache = enriquecerZonasVisualMaps(cache);
        mapasPorVista = obtenerMapasPorVista();
        mapaInicio = Math.min(mapaInicio, Math.max(0, zonasCache.length - 1));
        renderizarOpcionesFiltrosMaps();
        renderizarResumenFiltrosMaps();
    }

    const zonas = await fetchJson(`${API_BASE}/zonas`);
    zonasCache = enriquecerZonasVisualMaps(Array.isArray(zonas) ? zonas : []);
    guardarCacheZonas(zonasCache);

    mapasPorVista = obtenerMapasPorVista();
    mapaInicio = 0;
    renderizarOpcionesFiltrosMaps();
    renderizarResumenFiltrosMaps();
    renderizarShowcaseRegionesMaps();
    renderizarZonas();
}

function mostrarCargaZonas() {
    const container = document.getElementById("zonasContainer");
    if (!container) return;
 
    let html = "";
    const total = obtenerMapasPorVista();
 
    for (let i = 0; i < total; i++) {
        html += `
            <article class="map-card">
                <div class="map-img-wrap"></div>
                <div class="map-info">
                    <h3>${t("maps_loading")}</h3>
                    <p>${t("maps_preparing_zone")}</p>
                    <div class="map-actions">
                        <span class="map-level">${t("maps_level_short")} —</span>
                        <button class="btn-map" type="button" disabled>${t("maps_view")}</button>
                    </div>
                </div>
            </article>
        `;
    }
 
    container.innerHTML = html;
}
 
function mostrarErrorZonas() {
    const container = document.getElementById("zonasContainer");
    if (!container) return;
 
    container.innerHTML = `
        <article class="map-card">
            <div class="map-info">
                <h3>${t("maps_zones_load_error")}</h3>
                <p>${t("maps_check_backend")}</p>
                <div class="map-actions">
                    <button class="btn-map" type="button" onclick="window.location.reload()">${t("maps_retry")}</button>
                </div>
            </div>
        </article>
    `;
}
 
function renderizarZonas() {
    const container = document.getElementById("zonasContainer");
    if (!container) return;

    const visibles = obtenerZonasVisibles();

    if (!visibles.length) {
        const hayZonas = Array.isArray(zonasCache) && zonasCache.length > 0;
        container.innerHTML = `
            <article class="map-card">
                <div class="map-info">
                    <h3>${hayZonas ? tMapsLocal("maps_filter_empty_title", "No maps match your filters", "No hay mapas con esos filtros") : t("maps_no_zones")}</h3>
                    <p>${hayZonas ? tMapsLocal("maps_filter_empty_text", "Adjust your filters or reset them to see more zones.", "Ajusta tus filtros o reinícialos para ver más zonas.") : t("maps_add_zones_db")}</p>
                </div>
            </article>
        `;
        return;
    }

    container.innerHTML = visibles.map(zona => {
        const visual = obtenerVisualZonaMaps(zona);
        const config = visual.config;
        const activa = zonaSeleccionadaActual && Number(zonaSeleccionadaActual.id) === Number(zona.id);

        const nombreZonaUI = obtenerNombreZonaTraducido(zona);
        const descripcionZonaUI = obtenerDescripcionZonaTraducida(zona);
        const regionLabel = obtenerTextoRegionMaps(visual.region);
        const generationLabel = obtenerTextoGeneracionMaps(visual.generacion);
        const biomeLabel = obtenerTextoBiomaMaps(visual.clave);
        const speciesLabel = obtenerTextoEspeciesZonaMaps(zona);
        const difficultyLabel = obtenerTextoDificultadZonaMaps(zona);
        const imageSrc = obtenerImagenCardZonaMaps(zona);
        const cssVars = obtenerVarsCssZonaMaps(zona);

        return `
            <article class="map-card ${config.clase} ${activa ? "map-card-activa" : ""}" style="${cssVars}">
                <div class="map-img-wrap">
                    <span class="map-card-badge">${difficultyLabel}</span>
                    <img src="${imageSrc}" alt="${nombreZonaUI}" class="map-img" loading="lazy" decoding="async">
                </div>

                <div class="map-info">
                    <div class="map-chip-row">
                        <span class="map-chip map-chip-region">${regionLabel}</span>
                        <span class="map-chip map-chip-generation">${generationLabel}</span>
                        <span class="map-chip map-chip-biome">${biomeLabel}</span>
                    </div>

                    <h3>${nombreZonaUI}</h3>
                    <p>${descripcionZonaUI}</p>

                    <div class="map-stats-row">
                        <span class="map-stat-pill">${speciesLabel}</span>
                        <span class="map-threat-chip">${difficultyLabel}</span>
                    </div>

                    <div class="map-actions">
                        <span class="map-level">${t("maps_level")} ${zona.nivel_min} - ${zona.nivel_max}</span>
                        <button class="btn-map ${activa ? "btn-map-activa" : ""}" type="button" data-zona-id="${zona.id}">
                            ${activa ? tMapsLocal("maps_zone_active", "Exploring", "Explorando") : t("maps_view")}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

async function seleccionarZona(zonaId) {
    const zona = zonasCache.find(z => Number(z.id) === Number(zonaId));
    if (!zona) return;
 
    zonaSeleccionadaActual = zona;
    asegurarPosicionAvatarZona(zona);
    jugadoresZonaMaps.clear();
 
    if (!usuarioAutenticadoMaps()) {
        encuentroRequestId++;
        reiniciarEstadoMovimientoMaps();
 
        renderizarZonas();
        limpiarMensajeMaps();
        cerrarModalesSecundarios();
        limpiarEncuentroActual();
        limpiarJugadoresZonaMaps();
        await salirPresenciaMaps(true);
        renderBloqueoMapsSinSesion();
 
        const encuentro = document.getElementById("encuentroContainer");
        if (encuentro) {
            encuentro.classList.remove("oculto");
 
            requestAnimationFrame(() => {
                setTimeout(() => {
                    scrollAlMapa();
                }, 40);
            });
        }
 
        return;
    }
 
    encuentroRequestId++;
    reiniciarEstadoMovimientoMaps();
    cerrarModalesSecundarios();
    limpiarMensajeMaps();
    limpiarEncuentroActual();
 
    renderizarZonas();
    renderizarZonaExploracion();
 
    const encuentro = document.getElementById("encuentroContainer");
    if (encuentro) {
        encuentro.classList.remove("oculto");
    }
 
    renderPanelDerechoVacio();
    sincronizarMusicaMapaZonaActual();
 
    requestAnimationFrame(() => {
        setTimeout(() => {
            scrollAlMapa();
        }, 40);
    });
 
    try {
        await Promise.all([
            cargarItemsUsuarioMaps(),
            iniciarPresenciaZonaActual()
        ]);
    } catch (error) {
        console.warn("No se pudieron cargar datos al seleccionar zona:", error);
    }
 
    // El primer encuentro ahora aparece al moverte en el mapa.
}
 
function renderizarZonaExploracion() {
    if (!zonaSeleccionadaActual) return;

    const encuentro = document.getElementById("encuentroContainer");
    if (!encuentro) return;

    const visual = obtenerVisualZonaMaps(zonaSeleccionadaActual);
    const config = visual.config;
    const claseZona = config.clase;
    const nombreZonaUI = obtenerNombreZonaTraducido(zonaSeleccionadaActual);
    const descripcionZonaUI = obtenerDescripcionZonaTraducida(zonaSeleccionadaActual);
    const regionLabel = obtenerTextoRegionMaps(visual.region);
    const generationLabel = obtenerTextoGeneracionMaps(visual.generacion);
    const biomeLabel = obtenerTextoBiomaMaps(visual.clave);
    const speciesLabel = obtenerTextoEspeciesZonaMaps(zonaSeleccionadaActual);
    const difficultyLabel = obtenerTextoDificultadZonaMaps(zonaSeleccionadaActual);

    encuentro.className = "encuentro-box";
    if (claseZona) {
        encuentro.classList.add(claseZona);
    }
    encuentro.style.cssText = obtenerVarsCssZonaMaps(zonaSeleccionadaActual);

    limpiarJugadoresDomCacheMaps({ removeNodes: false });

    encuentro.innerHTML = `
        <div class="encuentro-layout-mapa">
            <div class="mapa-exploracion-panel">
                <div class="mapa-exploracion-header">
                    <div class="mapa-exploracion-kicker-row">
                        <span class="mapa-exploracion-kicker">${difficultyLabel}</span>
                        <div class="mapa-exploracion-chips">
                            <span class="mapa-meta-chip">${regionLabel}</span>
                            <span class="mapa-meta-chip">${generationLabel}</span>
                            <span class="mapa-meta-chip">${biomeLabel}</span>
                        </div>
                    </div>
                    <h3>${nombreZonaUI}</h3>
                    <p>${descripcionZonaUI || t("maps_explore_hint")}</p>
                    <div class="mapa-exploracion-stats">
                        <span>${t("maps_level")} ${zonaSeleccionadaActual.nivel_min} - ${zonaSeleccionadaActual.nivel_max}</span>
                        <span>${speciesLabel}</span>
                        <span>${t("maps_explore_hint")}</span>
                    </div>
                </div>

                <div class="mapa-exploracion-box">
                    <img
                        id="imgMapaExploracion"
                        src="${obtenerImagenEscenarioZonaMaps(zonaSeleccionadaActual)}"
                        alt="${nombreZonaUI}"
                        loading="eager"
                        decoding="async"
                    >

                    <div id="jugadoresMapaLayer" class="jugadores-mapa-layer"></div>

                    <div
                        id="avatarMapa"
                        class="avatar-mapa"
                        aria-label="${obtenerNombreEntrenadorMaps()}"
                    ></div>
                </div>

                <div class="mapa-ui-inferior">
                    <div class="mapa-evento-box">
                        <div class="mapa-evento-head">
                            <div class="mapa-evento-titulo">${t("maps_zone_pokemon")}</div>
                            <span class="mapa-evento-resumen">${speciesLabel}</span>
                        </div>
                        ${renderMiniaturasZona(zonaSeleccionadaActual)}
                    </div>

                    <div class="mapa-movimiento">
                        <button class="move-up" data-move="up" type="button" aria-label="${t("maps_move_up")}">
                            <img src="img/maps/move/north_able.png" alt="${t("maps_move_up")}">
                        </button>

                        <button class="move-left" data-move="left" type="button" aria-label="${t("maps_move_left")}">
                            <img src="img/maps/move/west_able.png" alt="${t("maps_move_left")}">
                        </button>

                        <div class="move-center">
                            <img src="img/maps/move/center.png" alt="${t("maps_center")}">
                        </div>

                        <button class="move-right" data-move="right" type="button" aria-label="${t("maps_move_right")}">
                            <img src="img/maps/move/east_able.png" alt="${t("maps_move_right")}">
                        </button>

                        <button class="move-down" data-move="down" type="button" aria-label="${t("maps_move_down")}">
                            <img src="img/maps/move/south_able.png" alt="${t("maps_move_down")}">
                        </button>
                    </div>
                </div>
            </div>

            <div class="encuentro-lateral">
                <div id="encuentroInfoPanel" class="encuentro-info-panel"></div>
                <div id="encuentroAccionPanel" class="encuentro-accion-panel"></div>
            </div>
        </div>
    `;

    renderizarAvatarMapa();
    renderizarJugadoresMapa();
    actualizarSpritesMovimientoMaps();
}

function renderMiniaturasZona(zona = null) {
    const pokemonesZona = Array.isArray(zona?.pokemones) ? zona.pokemones : [];
 
    if (!pokemonesZona.length) {
        return `
            <div class="mini-zona-vacia">
                <span>${t("maps_no_pokemon_zone")}</span>
            </div>
        `;
    }
 
    const htmlCards = pokemonesZona.map((p, index) => `
        <div class="mini-zona-card" title="${p.nombre}" style="--delay:${index * 0.08}s;">
            <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemon_id}.png"
                alt="${p.nombre}"
                loading="lazy"
                decoding="async"
            >
            <span>${p.nombre}</span>
        </div>
    `).join("");
 
    if (pokemonesZona.length <= 6) {
        return `
            <div class="mini-zona-grid-fijo">
                ${htmlCards}
            </div>
        `;
    }
 
    return `
        <div class="mini-zona-carrusel animando">
            <div class="mini-zona-track">
                ${htmlCards}
                ${htmlCards}
            </div>
        </div>
    `;
}
 
/* =========================
   ENCUENTROS
========================= */
function reiniciarEstadoMovimientoMaps({ limpiarCola = true } = {}) {
    movimientoEnCurso = false;
    encuentroSolicitudEnCursoMaps = false;

    if (limpiarCola) {
        movimientoPendienteMaps = null;
    }

    actualizarBotonesMovimientoDisponibles(false);
    setEstadoMovimiento(false, "", false);
}

function guardarMovimientoPendienteMaps(direccion, opciones = {}) {
    if (!direccion || opciones?.soloEncuentro) return;

    movimientoPendienteMaps = {
        direccion,
        opciones: {
            silencioso: Boolean(opciones?.silencioso),
            soloEncuentro: false
        }
    };
}

function consumirMovimientoPendienteMaps() {
    if (!movimientoPendienteMaps) return null;

    const pendiente = movimientoPendienteMaps;
    movimientoPendienteMaps = null;
    return pendiente;
}

function ejecutarMovimientoPendienteMaps() {
    const pendiente = consumirMovimientoPendienteMaps();
    if (!pendiente || !zonaSeleccionadaActual) return;

    const shinyAbierto = document.getElementById("modalShiny") && !document.getElementById("modalShiny").classList.contains("oculto");
    const capturaAbierta = document.getElementById("modalResultadoCaptura") && !document.getElementById("modalResultadoCaptura").classList.contains("oculto");

    if (encuentroActual || shinyAbierto || capturaAbierta) {
        return;
    }

    window.setTimeout(() => {
        moverEnMapa(pendiente.direccion, pendiente.opciones);
    }, 0);
}

async function moverEnMapa(direccion, opciones = {}) {
    if (!zonaSeleccionadaActual) return;

    const { silencioso = false, soloEncuentro = false } = opciones;

    if (!usuarioAutenticadoMaps()) {
        mostrarMensajeMaps(t("maps_login_required"), "error");
        return;
    }
    if (movimientoEnCurso || encuentroSolicitudEnCursoMaps) {
        guardarMovimientoPendienteMaps(direccion, opciones);

        if (encuentroSolicitudEnCursoMaps) {
            setEstadoMovimiento(true, "", false);
        }
        return;
    }


    const requestIdActual = ++encuentroRequestId;
    const zonaIdActual = Number(zonaSeleccionadaActual.id);

    let siguienteNodoId = null;

    if (!soloEncuentro) {
        siguienteNodoId = obtenerSiguienteNodoAvatar(direccion);

        if (!siguienteNodoId) {
            actualizarBotonesMovimientoDisponibles(false);
            return;
        }
    }

    movimientoEnCurso = true;
    cerrarModalesSecundarios();
    setEstadoMovimiento(true, direccion, true);
    limpiarMensajeMaps();

    if (!encuentroActual && !silencioso) {
        renderPanelDerechoVacio();
    }

    try {
        if (!soloEncuentro && siguienteNodoId) {
            guardarNodoActualAvatar(siguienteNodoId);
            await moverAvatarVisual(siguienteNodoId);
            sincronizarPresenciaMovimiento(siguienteNodoId);
        }

        if (requestIdActual !== encuentroRequestId) return;

        if (encuentroActualExpiradoMaps()) {
            limpiarEncuentroActual();
            renderPanelDerechoVacio();
        }

        movimientoEnCurso = false;
        encuentroSolicitudEnCursoMaps = true;
        setEstadoMovimiento(true, "", false);

        await solicitarEncuentroServidor(requestIdActual, zonaIdActual);
    } catch (error) {
        if (requestIdActual !== encuentroRequestId) return;
        if (error?.code === "ABORTED") return;

        console.error("Error explorando zona:", error);
        mostrarMensajeMaps(error.message || t("maps_encounter_generate_error"), "error");

        if (!encuentroActual) {
            renderPanelDerechoVacio();
        }
    } finally {
        if (requestIdActual === encuentroRequestId) {
            reiniciarEstadoMovimientoMaps({ limpiarCola: false });
            ejecutarMovimientoPendienteMaps();
        } else {
            movimientoEnCurso = false;
            encuentroSolicitudEnCursoMaps = false;
        }
    }
}
 
function renderEncuentroActual() {
    if (!encuentroActual || !zonaSeleccionadaActual) {
        renderPanelDerechoVacio();
        return;
    }
 
    const infoPanel = document.getElementById("encuentroInfoPanel");
    const accionPanel = document.getElementById("encuentroAccionPanel");
    if (!infoPanel || !accionPanel) return;
 
    const imagen = obtenerImagenPokemonEncuentro(encuentroActual);
 
    const estadoCaptura = obtenerEstadoCapturaMapa(
        encuentroActual.pokemon_id,
        encuentroActual.es_shiny,
        listaPokemonUsuarioMaps
    );
 
    infoPanel.innerHTML = `
        <h2>${t("maps_wild_found")}</h2>
 
        <div class="encuentro-top-status">
            <div class="captura-indicador-superior ${estadoCaptura.capturado ? "exacto" : "ninguno"}">
                <img
                    src="${estadoCaptura.imagen}"
                    class="captura-ball-img ${estadoCaptura.capturado ? "" : "gris"}"
                    alt="${t("maps_capture_status")}"
                >
            </div>

            <div class="captura-cantidad-box">
                x${estadoCaptura.cantidad_mostrada}
            </div>
        </div>
 
        <div class="encuentro-pokemon-showcase fondo-zona ${obtenerConfigZona(zonaSeleccionadaActual).clase}" style="--encounter-zone-bg-image:url('${obtenerUrlCssAssetMaps(obtenerImagenCardZonaMaps(zonaSeleccionadaActual))}')">
            <div class="encuentro-pokemon-aura ${encuentroActual.es_shiny ? "aura-shiny" : ""}"></div>
            <div class="encuentro-pokemon-plataforma"></div>
            <img src="${imagen}" alt="${encuentroActual.nombre}" class="encuentro-img" loading="eager" decoding="async">
        </div>
 
        <div class="encuentro-nombre-box">
            <h3>${encuentroActual.nombre}</h3>
            ${encuentroActual.es_shiny ? `<span class="encuentro-shiny-badge">✨ Shiny</span>` : ""}
        </div>
 
        <div class="encuentro-datos-grid">
            <div class="dato-mini">
                <span>${t("maps_type")}</span>
                <strong>${traducirTipoPokemonMaps(encuentroActual.tipo) || "—"}</strong>
            </div>
            <div class="dato-mini">
                <span>${t("maps_level")}</span>
                <strong>${encuentroActual.nivel ?? "—"}</strong>
            </div>
            <div class="dato-mini">
                <span>${t("maps_hp")}</span>
                <strong>${encuentroActual.hp ?? "—"}</strong>
            </div>
        </div>
    `;
 
    accionPanel.innerHTML = renderPanelAccionEncuentro();
    actualizarProbabilidadVisual(encuentroActual.es_shiny === true);
}
 
function renderBloqueoMapsSinSesion() {
    const encuentro = document.getElementById("encuentroContainer");
    if (!encuentro) return;
 
    encuentro.className = "encuentro-box";
    encuentro.classList.remove("oculto");
 
    encuentro.innerHTML = `
        <div class="maps-login-lock">
            <h3>${t("maps_login_to_explore")}</h3>
            <p>${t("maps_login_explore_text")}</p>
        </div>
    `;
}
 
function animarSwapSuavePanelMaps(elemento) {
    if (!elemento || typeof elemento.animate !== "function") return;

    try {
        elemento.animate(
            [
                { opacity: 0, transform: "translateY(10px) scale(0.985)", filter: "blur(2px)" },
                { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0)" }
            ],
            {
                duration: 220,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)"
            }
        );
    } catch (error) {
        // Animación opcional; si falla, el panel igual debe renderizarse.
    }
}

function renderPanelDerechoVacio(estado = "default") {
    const infoPanel = document.getElementById("encuentroInfoPanel");
    const accionPanel = document.getElementById("encuentroAccionPanel");

    if (!infoPanel || !accionPanel) return;

    const nombreZonaUI = zonaSeleccionadaActual
        ? obtenerNombreZonaTraducido(zonaSeleccionadaActual)
        : t("maps_map_fallback");

    const sinEncuentro = estado === "no_encounter";

    const tituloPanel = sinEncuentro
        ? t("maps_no_encounter_title")
        : t("maps_area_ready");

    const subtituloPanel = sinEncuentro
        ? tMapsLocal(
            "maps_no_encounter_soft_hint",
            "This step found nothing. Keep moving to trigger the next wild encounter.",
            "Este paso no encontró nada. Sigue moviéndote para activar el siguiente encuentro salvaje."
        )
        : t("maps_generate_encounter_hint");

    const badgeTexto = sinEncuentro
        ? tMapsLocal("maps_keep_exploring", "Keep exploring", "Sigue explorando")
        : t("maps_free");

    const badgeStyle = sinEncuentro
        ? "background:rgba(59,130,246,0.10);color:#2563eb;"
        : "background:rgba(34,197,94,0.10);color:#15803d;";

    infoPanel.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <h2>${tituloPanel}</h2>
            <span style="display:inline-flex;align-items:center;justify-content:center;padding:7px 12px;border-radius:999px;${badgeStyle}font-size:12px;font-weight:800;letter-spacing:0.02em;">
                ${badgeTexto}
            </span>
        </div>

        <div class="encuentro-nombre-box">
            <h3>${nombreZonaUI}</h3>
            <p style="margin:10px 0 0;color:#64748b;font-size:13px;line-height:1.45;">
                ${subtituloPanel}
            </p>
        </div>

        <div class="encuentro-datos-grid">
            <div class="dato-mini">
                <span>${t("maps_area")}</span>
                <strong>${nombreZonaUI || "—"}</strong>
            </div>
            <div class="dato-mini">
                <span>${t("maps_status")}</span>
                <strong>${sinEncuentro ? badgeTexto : t("maps_free")}</strong>
            </div>
            <div class="dato-mini">
                <span>${t("maps_encounter")}</span>
                <strong>—</strong>
            </div>
        </div>
    `;

    accionPanel.innerHTML = sinEncuentro
        ? `
            <div style="
                padding:18px 16px;
                border-radius:18px;
                background:linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
                border:1px solid rgba(59,130,246,0.16);
                text-align:center;
            ">
                <div style="font-size:28px; line-height:1; margin-bottom:10px;">🧭</div>
                <h4 style="margin:0 0 8px; color:#1d4ed8;">
                    ${tMapsLocal("maps_keep_moving", "Keep moving", "Sigue avanzando")}
                </h4>
                <p style="margin:0; color:#475569; font-size:13px; line-height:1.5;">
                    ${tMapsLocal(
                        "maps_no_encounter_panel_hint",
                        "Use the arrows to try the next step.",
                        "Usa las flechas para intentar el siguiente paso."
                    )}
                </p>
            </div>
        `
        : `
            <h4>${t("maps_select_ball")}</h4>
            <div class="probabilidad-captura">
                ${t("maps_generate_encounter_hint")}
            </div>
        `;

    animarSwapSuavePanelMaps(infoPanel);
    animarSwapSuavePanelMaps(accionPanel);
}

function renderPanelAccionEncuentro() {
    const pokeballs = obtenerPokeballsDisponibles(itemsUsuarioMaps);
    const primeraDisponible = obtenerIndicePrimeraDisponible(pokeballs);
    const usuarioLogueado = usuarioAutenticadoMaps();
 
    let itemMarcadoId = null;
 
    if (itemSeleccionadoMaps !== null) {
        const itemGuardado = pokeballs.find(i =>
            Number(i.item_id) === Number(itemSeleccionadoMaps) && Number(i.cantidad) > 0
        );
 
        if (itemGuardado) {
            itemMarcadoId = Number(itemGuardado.item_id);
        }
    }
 
    if (itemMarcadoId === null && primeraDisponible !== -1 && pokeballs[primeraDisponible]) {
        itemMarcadoId = Number(pokeballs[primeraDisponible].item_id);
    }
 
    const htmlBalls = !usuarioLogueado
        ? `<p class="sin-balls">${t("maps_login_balls_text")}</p>`
        : pokeballs.length
            ? pokeballs.map((item) => `
                <label class="ball-option ${item.cantidad <= 0 ? "sin-stock" : ""}">
                    <input
                        type="radio"
                        name="pokeballSeleccionada"
                        value="${item.item_id}"
                        data-nombre="${item.nombre}"
                        ${Number(item.item_id) === Number(itemMarcadoId) ? "checked" : ""}
                        ${item.cantidad <= 0 ? "disabled" : ""}
                    >
                    <div class="ball-option-card">
                        <img src="${obtenerImagenBall(item.nombre)}" alt="${item.nombre}" loading="lazy" decoding="async">
                        <span class="ball-nombre">${item.nombre}</span>
                        <span class="ball-cantidad">x${item.cantidad}</span>
                    </div>
                </label>
            `).join("")
            : `<p class="sin-balls">${t("maps_no_balls")}</p>`;
 
    return `
        <h4>${t("maps_select_ball")}</h4>
 
        <div class="ball-selector-grid">
            ${htmlBalls}
        </div>
 
        <div id="probabilidadCaptura" class="probabilidad-captura">
            ${usuarioLogueado ? `${t("maps_capture_rate")}: —` : t("maps_capture_rate_hidden")}
        </div>
 
        <div class="encuentro-botones">
            <button class="btn-capturar" id="btnCapturarMapa" type="button" ${
                !usuarioLogueado ||
                itemMarcadoId === null ||
                !pokeballs.some(i => Number(i.item_id) === Number(itemMarcadoId) && Number(i.cantidad) > 0)
                    ? "disabled"
                    : ""
            }>
                ${t("maps_catch")}
            </button>
 
            <button class="btn-huir" id="btnHuirMapa" type="button">
                ${t("maps_run")}
            </button>
        </div>
    `;
}
 
function limpiarEncuentroActual() {
    encuentroActual = null;
}
 
function encuentroActualExpiradoMaps() {
    if (!encuentroActual) return false;
 
    if (!encuentroActual.encuentro_token) return true;
 
    const expiraMs = Number(encuentroActual.encuentro_expira_en_ms || 0);
    if (expiraMs > 0 && Date.now() >= expiraMs) {
        return true;
    }
 
    return false;
}
 
function esErrorEncuentroExpiradoMaps(error) {
    const mensaje = String(error?.message || "").toLowerCase();
    return (
        mensaje.includes("encuentro") && (
            mensaje.includes("expir") ||
            mensaje.includes("inválido") ||
            mensaje.includes("invalido") ||
            mensaje.includes("ya no es válido") ||
            mensaje.includes("ya no es valido") ||
            mensaje.includes("token")
        )
    );
}
 
async function intentarCapturaDesdeUI() {
    if (!encuentroActual) {
        mostrarMensajeMaps(t("maps_no_active_encounter"), "warning");
        return;
    }
 
    if (encuentroActualExpiradoMaps()) {
        mostrarMensajeMaps(
            tMaps("maps_encounter_expired", "The encounter expired. Move again to search for a new Pokémon."),
            "warning"
        );
        limpiarEncuentroActual();
        renderPanelDerechoVacio();
        return;
    }
 
    const seleccionada = document.querySelector('input[name="pokeballSeleccionada"]:checked');
 
    if (!seleccionada) {
        mostrarMensajeMaps(t("maps_choose_ball"), "error");
        return;
    }
 
    const itemId = Number(seleccionada.value);
    itemSeleccionadoMaps = itemId;
 
    await ejecutarAnimacionIntentoCapturaMaps();
 
    await intentarCaptura(
        encuentroActual.pokemon_id,
        encuentroActual.nivel,
        encuentroActual.es_shiny,
        encuentroActual.hp,
        encuentroActual.hp_max || encuentroActual.hp,
        itemId,
        encuentroActual.encuentro_token
    );
}
 
async function intentarCaptura(pokemonId, nivel, esShiny, hpActual, hpMaximo, itemId, encuentroToken = null) {
    if (!usuarioAutenticadoMaps()) {
        mostrarMensajeMaps(t("maps_login_required"), "error");
        return;
    }

    const btnCapturar = document.getElementById("btnCapturarMapa");
    if (btnCapturar) btnCapturar.disabled = true;

    try {
        limpiarMensajeMaps();

        const data = await fetchAuth(`${API_BASE}/maps/intentar-captura`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pokemon_id: Number(pokemonId),
                nivel: Number(nivel),
                es_shiny: !!esShiny,
                hp_actual: Number(hpActual),
                hp_maximo: Number(hpMaximo),
                item_id: Number(itemId),
                encuentro_token: encuentroToken || null
            })
        });

        if (data.capturado === true) {
            mostrarModalResultadoCaptura(
                `${data.mensaje || t("maps_capture_success_default")}<br>${t("maps_capture_probability")}: ${data.probabilidad ?? 0}%`,
                "exito"
            );

            await sincronizarSesionMapsConBackend(false);
            await Promise.all([
                cargarPokemonUsuarioMaps(),
                cargarItemsUsuarioMaps(true)
            ]);

            if (typeof mostrarToastRecompensasOnboarding === "function" && data?.onboarding) {
                mostrarToastRecompensasOnboarding(data.onboarding);
            }

            itemSeleccionadoMaps = itemId;
            limpiarEncuentroActual();
            renderPanelDerechoVacio();
            return;
        }

        mostrarModalResultadoCaptura(
            `${data.mensaje || t("maps_capture_escape_default")}<br>${t("maps_capture_used_probability")}: ${data.probabilidad ?? 0}%`,
            "error"
        );

        await cargarItemsUsuarioMaps(true);

        if (encuentroActual) {
            renderEncuentroActual();
        } else {
            renderPanelDerechoVacio();
        }
    } catch (error) {
        console.error("Error al intentar capturar:", error);

        if (esErrorEncuentroExpiradoMaps(error)) {
            mostrarMensajeMaps(
                tMaps("maps_encounter_expired", "The encounter expired. Move again to search for a new Pokémon."),
                "warning"
            );
            limpiarEncuentroActual();
            renderPanelDerechoVacio();
        } else {
            mostrarMensajeMaps(error.message || t("maps_capture_error"), "error");
            await cargarItemsUsuarioMaps(true);

            if (encuentroActual) {
                renderEncuentroActual();
            }
        }
    } finally {
        const nuevoBtnCapturar = document.getElementById("btnCapturarMapa");
        if (nuevoBtnCapturar) {
            nuevoBtnCapturar.disabled = false;
        }
    }
}
 
/* =========================
   UTILIDADES
========================= */
function obtenerPokeballsDisponibles(items = []) {
    const orden = ["Poke Ball", "Super Ball", "Ultra Ball", "Master Ball"];
 
    return orden
        .map(nombre => items.find(i => i.nombre === nombre))
        .filter(item => item && Number(item.cantidad) > 0);
}
 
function obtenerIndicePrimeraDisponible(items = []) {
    const idx = items.findIndex(i => Number(i.cantidad) > 0);
    return idx >= 0 ? idx : -1;
}
 
function obtenerImagenBall(nombreItem) {
    const imagenes = {
        "Poke Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
        "Super Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
        "Ultra Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png",
        "Master Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png"
    };

    return imagenes[nombreItem] || imagenes["Poke Ball"];
}

function esperarMaps(ms = 0) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
}

function obtenerCentroViewportElementoMaps(elemento) {
    if (!elemento || typeof elemento.getBoundingClientRect !== "function") return null;

    const rect = elemento.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;

    return {
        x: rect.left + (rect.width / 2),
        y: rect.top + (rect.height / 2)
    };
}

function limpiarAnimacionCapturaTemporalMaps() {
    document.querySelectorAll(".capture-flight-layer").forEach(node => node.remove());
    document.body.classList.remove("maps-capture-animating");

    const showcase = document.querySelector(".encuentro-pokemon-showcase");
    const pokemonImg = showcase?.querySelector(".encuentro-img");

    showcase?.classList.remove("capture-target-active", "capture-impact-active");
    pokemonImg?.classList.remove("capture-hit");
}

function animarSacudidasPokeballCapturaMaps(ball, showcase, pokemonImg) {
    if (!ball || typeof ball.animate !== "function") {
        return esperarMaps(760);
    }

    const secuencia = [
        { transform: "translate(-50%, -50%) scale(1) rotate(0deg)" },
        { transform: "translate(-58%, -50%) scale(1) rotate(-16deg)", offset: 0.14 },
        { transform: "translate(-42%, -50%) scale(1) rotate(16deg)", offset: 0.28 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", offset: 0.38 },

        { transform: "translate(-56%, -50%) scale(1) rotate(-13deg)", offset: 0.52 },
        { transform: "translate(-44%, -50%) scale(1) rotate(13deg)", offset: 0.64 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", offset: 0.72 },

        { transform: "translate(-54%, -50%) scale(1) rotate(-9deg)", offset: 0.84 },
        { transform: "translate(-46%, -50%) scale(1) rotate(9deg)", offset: 0.93 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", offset: 1 }
    ];

    const animacionBall = ball.animate(secuencia, {
        duration: 980,
        easing: "ease-in-out",
        fill: "forwards"
    });

    showcase?.animate([
        { transform: "scale(1)", filter: "brightness(1)" },
        { transform: "scale(1.012)", filter: "brightness(1.04)", offset: 0.22 },
        { transform: "scale(1)", filter: "brightness(1)", offset: 0.38 },
        { transform: "scale(1.01)", filter: "brightness(1.03)", offset: 0.62 },
        { transform: "scale(1)", filter: "brightness(1)", offset: 0.78 },
        { transform: "scale(1.006)", filter: "brightness(1.02)", offset: 0.92 },
        { transform: "scale(1)", filter: "brightness(1)" }
    ], {
        duration: 980,
        easing: "ease-in-out"
    });

    pokemonImg?.animate([
        { opacity: 0.28, transform: "scale(0.9)" },
        { opacity: 0.18, transform: "scale(0.86)", offset: 0.16 },
        { opacity: 0.12, transform: "scale(0.82)", offset: 0.32 },
        { opacity: 0.08, transform: "scale(0.79)", offset: 0.48 },
        { opacity: 0.06, transform: "scale(0.77)", offset: 0.68 },
        { opacity: 0.03, transform: "scale(0.74)", offset: 0.86 },
        { opacity: 0, transform: "scale(0.72)" }
    ], {
        duration: 720,
        easing: "ease-out",
        fill: "forwards"
    });

    return new Promise((resolve) => {
        animacionBall.onfinish = () => resolve();
        animacionBall.oncancel = () => resolve();
        window.setTimeout(resolve, 1100);
    });
}

async function ejecutarAnimacionIntentoCapturaMaps() {
    const seleccionada = document.querySelector('input[name="pokeballSeleccionada"]:checked');
    const ballLabel = seleccionada?.closest(".ball-option");
    const ballImg = ballLabel?.querySelector(".ball-option-card img");
    const showcase = document.querySelector(".encuentro-pokemon-showcase");
    const pokemonImg = showcase?.querySelector(".encuentro-img");
    const targetElemento = pokemonImg || showcase;

    if (!seleccionada || !ballImg || !showcase || !targetElemento) return;

    const start = obtenerCentroViewportElementoMaps(ballImg);
    const end = obtenerCentroViewportElementoMaps(targetElemento);

    if (!start || !end) return;

    limpiarAnimacionCapturaTemporalMaps();

    const layer = document.createElement("div");
    layer.className = "capture-flight-layer";
    layer.style.setProperty("--capture-start-x", `${start.x}px`);
    layer.style.setProperty("--capture-start-y", `${start.y}px`);
    layer.style.setProperty("--capture-end-x", `${end.x}px`);
    layer.style.setProperty("--capture-end-y", `${end.y}px`);
    layer.style.setProperty("--capture-dx", `${(end.x - start.x).toFixed(2)}px`);
    layer.style.setProperty("--capture-dy", `${(end.y - start.y).toFixed(2)}px`);

    const trail = document.createElement("div");
    trail.className = "capture-flight-trail";

    const impact = document.createElement("div");
    impact.className = "capture-flight-impact";

    const ball = document.createElement("img");
    ball.className = "capture-flight-ball";
    ball.src = ballImg.currentSrc || ballImg.src || obtenerImagenBall(seleccionada.dataset.nombre || "Poke Ball");
    ball.alt = seleccionada.dataset.nombre || "Poké Ball";
    ball.decoding = "async";

    layer.appendChild(trail);
    layer.appendChild(impact);
    layer.appendChild(ball);
    document.body.appendChild(layer);

    document.body.classList.add("maps-capture-animating");

    requestAnimationFrame(() => {
        layer.classList.add("is-animating");
        showcase.classList.add("capture-target-active");
    });

    window.setTimeout(() => {
        showcase.classList.add("capture-impact-active");
        pokemonImg?.classList.add("capture-hit");
    }, 360);

    await esperarMaps(560);

    trail.style.opacity = "0";
    impact.style.opacity = "0";
    ball.style.left = `${end.x}px`;
    ball.style.top = `${end.y}px`;
    ball.style.transform = "translate(-50%, -50%) scale(1) rotate(0deg)";
    ball.style.transition = "none";
    ball.style.filter = "drop-shadow(0 14px 22px rgba(15,23,42,0.32))";
    ball.style.zIndex = "4";

    if (showcase) {
        showcase.style.overflow = "visible";
    }

    await animarSacudidasPokeballCapturaMaps(ball, showcase, pokemonImg);

    layer.classList.add("is-leaving");
    await esperarMaps(180);

    if (showcase) {
        showcase.style.overflow = "";
    }

    limpiarAnimacionCapturaTemporalMaps();
}
 
function mostrarMensajeMaps(mensaje, tipo = "ok") {
    const box = document.getElementById("mensajeMaps");
    if (!box) return;
 
    box.textContent = mensaje;
    box.classList.remove("oculto", "ok", "error", "warning");
    box.classList.add(tipo);
}
 
function limpiarMensajeMaps() {
    const box = document.getElementById("mensajeMaps");
    if (!box) return;
 
    box.textContent = "";
    box.classList.add("oculto");
    box.classList.remove("ok", "error", "warning");
}
 
function mostrarModalShiny() {
    const modal = document.getElementById("modalShiny");
    if (modal) modal.classList.remove("oculto");
}
 
function cerrarModalShiny() {
    const modal = document.getElementById("modalShiny");
    if (modal) modal.classList.add("oculto");
}
 
function actualizarProbabilidadVisual(esShiny = false) {
    const seleccionada = document.querySelector('input[name="pokeballSeleccionada"]:checked');
    const box = document.getElementById("probabilidadCaptura");
 
    if (!box) return;
 
    if (!seleccionada) {
        box.textContent = `${t("maps_capture_rate")}: —`;
        return;
    }
 
    const nombre = seleccionada.dataset.nombre;
 
    let prob = 35;
 
    if (nombre === "Poke Ball") prob = 50;
    else if (nombre === "Super Ball") prob = 65;
    else if (nombre === "Ultra Ball") prob = 80;
    else if (nombre === "Master Ball") prob = 100;
 
    if (esShiny && nombre !== "Master Ball") {
        prob -= 10;
    }
 
    prob = Math.max(1, Math.min(prob, 100));
    box.textContent = `${t("maps_capture_rate")}: ${prob}%`;
}
 
function setEstadoMovimiento(cargando, direccion = "", bloquearBotones = true) {
    const titulo = document.querySelector(".mapa-exploracion-header p");
 
    if (bloquearBotones) {
        actualizarBotonesMovimientoDisponibles(cargando);
    } else if (!cargando) {
        actualizarBotonesMovimientoDisponibles(false);
    }
 
    if (!titulo) return;
 
    if (cargando) {
        titulo.textContent = direccion
            ? `${t("maps_exploring_direction")} ${traducirDireccion(direccion)}...`
            : tMaps("maps_searching_encounter", "Searching for an encounter...");
    } else if (zonaSeleccionadaActual) {
        titulo.textContent = t("maps_explore_hint");
    }
}
 
function traducirDireccion(direccion = "") {
    const mapa = {
        up: t("maps_dir_up"),
        down: t("maps_dir_down"),
        left: t("maps_dir_left"),
        right: t("maps_dir_right")
    };
 
    return mapa[direccion] || t("maps_dir_zone");
}
 
function mostrarModalResultadoCaptura(mensaje, tipo = "exito") {
    const modal = document.getElementById("modalResultadoCaptura");
    const box = document.getElementById("modalResultadoCapturaBox");
    const deco = document.getElementById("modalResultadoCapturaDeco");
    const titulo = document.getElementById("modalResultadoCapturaTitulo");
    const texto = document.getElementById("modalResultadoCapturaTexto");
    const btn = document.getElementById("btnCerrarModalResultadoCaptura");

    if (!modal || !box || !deco || !titulo || !texto || !btn) return;

    modal.classList.remove("oculto");

    box.classList.remove(
        "exito",
        "error",
        "capture-enter",
        "capture-success-fx",
        "capture-fail-fx"
    );

    if (tipo === "exito") {
        box.classList.add("exito", "capture-enter", "capture-success-fx");
        deco.innerHTML = `<span>✨</span><span>✨</span><span>✨</span>`;
        titulo.innerHTML = t("maps_capture_success_title");
    } else {
        box.classList.add("error", "capture-enter", "capture-fail-fx");
        deco.innerHTML = `<span>✦</span><span>✦</span><span>✦</span>`;
        titulo.innerHTML = t("maps_capture_fail_title");
    }

    texto.innerHTML = mensaje;

    btn.disabled = true;
    btn.classList.remove("capture-btn-visible");

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            btn.classList.add("capture-btn-visible");
        });
    });

    window.setTimeout(() => {
        btn.disabled = false;
        if (typeof btn.focus === "function") {
            btn.focus({ preventScroll: true });
        }
    }, 420);
}
 
function cerrarModalResultadoCaptura() {
    const modal = document.getElementById("modalResultadoCaptura");
    if (modal) {
        modal.classList.add("oculto");
    }
}
 
function cerrarModalesSecundarios() {
    cerrarModalResultadoCaptura();
    cerrarModalShiny();
}
 
async function generarEncuentroInicial() {
    if (!zonaSeleccionadaActual || encuentroActual) return;
    await moverEnMapa("up", { silencioso: true, soloEncuentro: true });
}
 
function scrollAlMapa() {
    const encuentro = document.getElementById("encuentroContainer");
    if (!encuentro) return;
 
    const intentarScroll = (intentosRestantes = 24) => {
        const rect = encuentro.getBoundingClientRect();
        const visible =
            !encuentro.classList.contains("oculto") &&
            encuentro.offsetHeight > 0 &&
            rect.height > 0;
 
        if (visible) {
            encuentro.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
            return;
        }
 
        if (intentosRestantes > 0) {
            requestAnimationFrame(() => intentarScroll(intentosRestantes - 1));
        }
    };
 
    requestAnimationFrame(() => intentarScroll());
}
 
/* =========================
   EXPOSE GLOBAL
========================= */
window.cerrarModalShiny = cerrarModalShiny;
