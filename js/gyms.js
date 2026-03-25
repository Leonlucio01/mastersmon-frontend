const GYMS_TEAM_STORAGE_KEY = "mastersmon_battle_team_v1";
const GYMS_PROGRESS_STORAGE_KEY = "mastersmon_gyms_progress_v2";
const GYMS_SELECTED_STORAGE_KEY = "mastersmon_gyms_selected_v2";
const GYMS_ARENA_MODE_KEY = "mastersmon_battle_arena_mode_v1";
const GYMS_BATTLE_SESSION_KEY = "mastersmon_battle_gym_session_v1";
const TRAINER_ASSET_ROOT = "img/trainers";
const BADGE_ASSET_ROOT = "img/bagde";

const REGION_ORDER = ["kanto", "johto", "hoenn"];

const REGION_CONFIG = {
    kanto: {
        id: "kanto",
        name: "Kanto",
        shortName: "Gen 1",
        accent: "rock",
        description: "Classic badge route with defensive openers, clean difficulty spikes, and iconic leaders.",
        bannerTitle: "Kanto badge campaign",
        unlockText: "The most direct path to validate your Gym UX before backend unlock logic.",
        championNote: "Finishing Kanto gives you a perfect base for Elite content later."
    },
    johto: {
        id: "johto",
        name: "Johto",
        shortName: "Gen 2",
        accent: "flying",
        description: "More tactical pacing, unusual specialties and a smoother power curve into advanced PvE.",
        bannerTitle: "Johto badge campaign",
        unlockText: "Great for the second progression pass once Kanto already feels stable.",
        championNote: "Johto expands your route without changing the core Gym shell."
    },
    hoenn: {
        id: "hoenn",
        name: "Hoenn",
        shortName: "Gen 3",
        accent: "water",
        description: "High visual variety, stronger type identity and a more explosive late-route difficulty climb.",
        bannerTitle: "Hoenn badge campaign",
        unlockText: "Ideal for a broader second wave with more dramatic leader presentation.",
        championNote: "Hoenn is perfect for premium visuals and richer route identity."
    }
};

const GYMS_CONFIG = [
    {
        id: "brock",
        region: "kanto",
        order: 1,
        city: "Pewter City",
        gymName: "Pewter Gym",
        leader: "Brock",
        leaderSlug: "brock",
        type: "rock",
        difficulty: "Beginner",
        recommendedLevel: 10,
        badge: "Boulder Badge",
        badgeSlug: "boulder",
        rewardMoney: 1200,
        rewardExp: 550,
        description: "Defensive opener with Rock and Ground pressure. Great first step for badge progression.",
        hint: "Water and Grass answers create the cleanest route into your first clear.",
        enemyStyle: "Defense wall",
        roster: [
            { pokemon_id: 74, nombre: "Geodude", tipo: "rock/ground" },
            { pokemon_id: 95, nombre: "Onix", tipo: "rock/ground" },
            { pokemon_id: 111, nombre: "Rhyhorn", tipo: "ground/rock" },
            { pokemon_id: 76, nombre: "Golem", tipo: "rock/ground", leader: true }
        ]
    },
    {
        id: "misty",
        region: "kanto",
        order: 2,
        city: "Cerulean City",
        gymName: "Cerulean Gym",
        leader: "Misty",
        leaderSlug: "misty",
        type: "water",
        difficulty: "Easy+",
        recommendedLevel: 16,
        badge: "Cascade Badge",
        badgeSlug: "cascade",
        rewardMoney: 1600,
        rewardExp: 700,
        description: "Faster tempo with Water pressure, cleaner offense, and less room for weak type matchups.",
        hint: "Electric and Grass attackers become much more valuable from this point forward.",
        enemyStyle: "Speed control",
        roster: [
            { pokemon_id: 60, nombre: "Poliwag", tipo: "water" },
            { pokemon_id: 54, nombre: "Psyduck", tipo: "water" },
            { pokemon_id: 120, nombre: "Staryu", tipo: "water" },
            { pokemon_id: 121, nombre: "Starmie", tipo: "water/psychic", leader: true }
        ]
    },
    {
        id: "ltsurge",
        region: "kanto",
        order: 3,
        city: "Vermilion City",
        gymName: "Vermilion Gym",
        leader: "Lt. Surge",
        leaderSlug: "ltsurge",
        type: "electric",
        difficulty: "Medium",
        recommendedLevel: 22,
        badge: "Thunder Badge",
        badgeSlug: "thunder",
        rewardMoney: 2200,
        rewardExp: 900,
        description: "A much sharper difficulty spike built around burst turns, speed and electric coverage.",
        hint: "Ground coverage and sturdy pivots reduce the danger of fast electric pressure.",
        enemyStyle: "Burst offense",
        roster: [
            { pokemon_id: 100, nombre: "Voltorb", tipo: "electric" },
            { pokemon_id: 81, nombre: "Magnemite", tipo: "electric/steel" },
            { pokemon_id: 101, nombre: "Electrode", tipo: "electric" },
            { pokemon_id: 26, nombre: "Raichu", tipo: "electric", leader: true }
        ]
    },
    {
        id: "erika",
        region: "kanto",
        order: 4,
        city: "Celadon City",
        gymName: "Celadon Gym",
        leader: "Erika",
        leaderSlug: "erika",
        type: "grass",
        difficulty: "Medium",
        recommendedLevel: 28,
        badge: "Rainbow Badge",
        badgeSlug: "rainbow",
        rewardMoney: 2800,
        rewardExp: 1100,
        description: "Control-heavy route with status pressure, sustain and layered defensive typing.",
        hint: "Fire, Flying and good tempo management make this route much smoother.",
        enemyStyle: "Status control",
        roster: [
            { pokemon_id: 43, nombre: "Oddish", tipo: "grass/poison" },
            { pokemon_id: 70, nombre: "Weepinbell", tipo: "grass/poison" },
            { pokemon_id: 71, nombre: "Victreebel", tipo: "grass/poison" },
            { pokemon_id: 45, nombre: "Vileplume", tipo: "grass/poison", leader: true }
        ]
    },
    {
        id: "koga",
        region: "kanto",
        order: 5,
        city: "Fuchsia City",
        gymName: "Fuchsia Gym",
        leader: "Koga",
        leaderSlug: "koga",
        type: "poison",
        difficulty: "Hard",
        recommendedLevel: 34,
        badge: "Soul Badge",
        badgeSlug: "soul",
        rewardMoney: 3400,
        rewardExp: 1325,
        description: "Tactical chip damage, poison pressure and deceptive durability define this stretch of the route.",
        hint: "A balanced team with enough sustain will feel safer than pure glass cannon offense.",
        enemyStyle: "Attrition",
        roster: [
            { pokemon_id: 23, nombre: "Ekans", tipo: "poison" },
            { pokemon_id: 49, nombre: "Venomoth", tipo: "bug/poison" },
            { pokemon_id: 109, nombre: "Koffing", tipo: "poison" },
            { pokemon_id: 110, nombre: "Weezing", tipo: "poison", leader: true }
        ]
    },
    {
        id: "sabrina",
        region: "kanto",
        order: 6,
        city: "Saffron City",
        gymName: "Saffron Gym",
        leader: "Sabrina",
        leaderSlug: "sabrina",
        type: "psychic",
        difficulty: "Hard+",
        recommendedLevel: 40,
        badge: "Marsh Badge",
        badgeSlug: "marsh",
        rewardMoney: 4200,
        rewardExp: 1550,
        description: "High special pressure, control tools and fast sweeper threats raise the skill check sharply.",
        hint: "Dark and Bug answers reduce the stress of the Psychic damage curve.",
        enemyStyle: "Special burst",
        roster: [
            { pokemon_id: 64, nombre: "Kadabra", tipo: "psychic" },
            { pokemon_id: 80, nombre: "Slowbro", tipo: "water/psychic" },
            { pokemon_id: 122, nombre: "Mr. Mime", tipo: "psychic/fairy" },
            { pokemon_id: 65, nombre: "Alakazam", tipo: "psychic", leader: true }
        ]
    },
    {
        id: "blaine",
        region: "kanto",
        order: 7,
        city: "Cinnabar Island",
        gymName: "Cinnabar Gym",
        leader: "Blaine",
        leaderSlug: "blaine",
        type: "fire",
        difficulty: "Elite",
        recommendedLevel: 46,
        badge: "Volcano Badge",
        badgeSlug: "volcano",
        rewardMoney: 5200,
        rewardExp: 1850,
        description: "Explosive late-route test where resistances and clean switch decisions matter much more.",
        hint: "Water and Rock options stabilize the route, especially against the leader ace.",
        enemyStyle: "Heat burst",
        roster: [
            { pokemon_id: 58, nombre: "Growlithe", tipo: "fire" },
            { pokemon_id: 78, nombre: "Rapidash", tipo: "fire" },
            { pokemon_id: 59, nombre: "Arcanine", tipo: "fire" },
            { pokemon_id: 126, nombre: "Magmar", tipo: "fire", leader: true }
        ]
    },
    {
        id: "giovanni",
        region: "kanto",
        order: 8,
        city: "Viridian City",
        gymName: "Viridian Gym",
        leader: "Giovanni",
        leaderSlug: "giovanni",
        type: "ground",
        difficulty: "Master",
        recommendedLevel: 52,
        badge: "Earth Badge",
        badgeSlug: "earth",
        rewardMoney: 6500,
        rewardExp: 2200,
        description: "End-of-region benchmark with heavy hits, layered Ground threats and stronger endgame pressure.",
        hint: "Water, Grass and Ice coverage plus a balanced squad help the most here.",
        enemyStyle: "Heavy impact",
        roster: [
            { pokemon_id: 28, nombre: "Sandslash", tipo: "ground" },
            { pokemon_id: 31, nombre: "Nidoqueen", tipo: "poison/ground" },
            { pokemon_id: 34, nombre: "Nidoking", tipo: "poison/ground" },
            { pokemon_id: 112, nombre: "Rhydon", tipo: "ground/rock", leader: true }
        ]
    },
    {
        id: "falkner",
        region: "johto",
        order: 1,
        city: "Violet City",
        gymName: "Violet Gym",
        leader: "Falkner",
        leaderSlug: "falkner",
        type: "flying",
        difficulty: "Beginner",
        recommendedLevel: 12,
        badge: "Zephyr Badge",
        badgeSlug: "zephyr",
        rewardMoney: 1350,
        rewardExp: 620,
        description: "Fast Flying openers designed to test early coverage and reliable hit timing.",
        hint: "Electric, Rock and Ice tools give you the cleanest answers.",
        enemyStyle: "Aerial tempo",
        roster: [
            { pokemon_id: 16, nombre: "Pidgey", tipo: "normal/flying" },
            { pokemon_id: 21, nombre: "Spearow", tipo: "normal/flying" },
            { pokemon_id: 17, nombre: "Pidgeotto", tipo: "normal/flying", leader: true }
        ]
    },
    {
        id: "bugsy",
        region: "johto",
        order: 2,
        city: "Azalea Town",
        gymName: "Azalea Gym",
        leader: "Bugsy",
        leaderSlug: "bugsy",
        type: "bug",
        difficulty: "Easy+",
        recommendedLevel: 18,
        badge: "Hive Badge",
        badgeSlug: "hive",
        rewardMoney: 1750,
        rewardExp: 760,
        description: "Bug pressure arrives with better speed control and a more swarm-like structure.",
        hint: "Fire, Flying and Rock attacks cut through the route effectively.",
        enemyStyle: "Swarm tempo",
        roster: [
            { pokemon_id: 14, nombre: "Kakuna", tipo: "bug/poison" },
            { pokemon_id: 11, nombre: "Metapod", tipo: "bug" },
            { pokemon_id: 123, nombre: "Scyther", tipo: "bug/flying", leader: true }
        ]
    },
    {
        id: "whitney",
        region: "johto",
        order: 3,
        city: "Goldenrod City",
        gymName: "Goldenrod Gym",
        leader: "Whitney",
        leaderSlug: "whitney",
        type: "normal",
        difficulty: "Medium",
        recommendedLevel: 24,
        badge: "Plain Badge",
        badgeSlug: "plain",
        rewardMoney: 2300,
        rewardExp: 980,
        description: "Normal-type route with simple typing but punishing raw stat pressure.",
        hint: "Fighting answers are the safest way to keep the pace under control.",
        enemyStyle: "Raw stats",
        roster: [
            { pokemon_id: 35, nombre: "Clefairy", tipo: "fairy" },
            { pokemon_id: 241, nombre: "Miltank", tipo: "normal", leader: true },
            { pokemon_id: 39, nombre: "Jigglypuff", tipo: "normal/fairy" }
        ]
    },
    {
        id: "morty",
        region: "johto",
        order: 4,
        city: "Ecruteak City",
        gymName: "Ecruteak Gym",
        leader: "Morty",
        leaderSlug: "morty",
        type: "ghost",
        difficulty: "Medium",
        recommendedLevel: 30,
        badge: "Fog Badge",
        badgeSlug: "fog",
        rewardMoney: 2950,
        rewardExp: 1180,
        description: "Ghost control route with disruptive pressure and less predictable resist lines.",
        hint: "Dark tools, clean speed control and strong neutral damage help a lot.",
        enemyStyle: "Control tricks",
        roster: [
            { pokemon_id: 92, nombre: "Gastly", tipo: "ghost/poison" },
            { pokemon_id: 93, nombre: "Haunter", tipo: "ghost/poison" },
            { pokemon_id: 94, nombre: "Gengar", tipo: "ghost/poison", leader: true }
        ]
    },
    {
        id: "chuck",
        region: "johto",
        order: 5,
        city: "Cianwood City",
        gymName: "Cianwood Gym",
        leader: "Chuck",
        leaderSlug: "chuck",
        type: "fighting",
        difficulty: "Hard",
        recommendedLevel: 36,
        badge: "Storm Badge",
        badgeSlug: "storm",
        rewardMoney: 3600,
        rewardExp: 1420,
        description: "Direct Fighting pressure with heavier physical hits and less time to set up.",
        hint: "Flying and Psychic answers reduce the stress of this route.",
        enemyStyle: "Impact brawler",
        roster: [
            { pokemon_id: 106, nombre: "Hitmonlee", tipo: "fighting" },
            { pokemon_id: 107, nombre: "Hitmonchan", tipo: "fighting" },
            { pokemon_id: 237, nombre: "Hitmontop", tipo: "fighting" },
            { pokemon_id: 62, nombre: "Poliwrath", tipo: "water/fighting", leader: true }
        ]
    },
    {
        id: "jasmine",
        region: "johto",
        order: 6,
        city: "Olivine City",
        gymName: "Olivine Gym",
        leader: "Jasmine",
        leaderSlug: "jasmine",
        type: "steel",
        difficulty: "Hard+",
        recommendedLevel: 42,
        badge: "Mineral Badge",
        badgeSlug: "mineral",
        rewardMoney: 4400,
        rewardExp: 1680,
        description: "Steel route with slow but durable threats and much stronger defensive punish windows.",
        hint: "Fire, Ground and Fighting coverage keep the pressure from snowballing.",
        enemyStyle: "Armor wall",
        roster: [
            { pokemon_id: 81, nombre: "Magnemite", tipo: "electric/steel" },
            { pokemon_id: 82, nombre: "Magneton", tipo: "electric/steel" },
            { pokemon_id: 208, nombre: "Steelix", tipo: "steel/ground", leader: true }
        ]
    },
    {
        id: "pryce",
        region: "johto",
        order: 7,
        city: "Mahogany Town",
        gymName: "Mahogany Gym",
        leader: "Pryce",
        leaderSlug: "pryce",
        type: "ice",
        difficulty: "Elite",
        recommendedLevel: 47,
        badge: "Glacier Badge",
        badgeSlug: "glacier",
        rewardMoney: 5300,
        rewardExp: 1920,
        description: "Ice specialists hit hard if you fail to control tempo and resist lines.",
        hint: "Fire, Rock, Steel and Fighting answers help stabilize the challenge.",
        enemyStyle: "Freeze pressure",
        roster: [
            { pokemon_id: 221, nombre: "Piloswine", tipo: "ice/ground" },
            { pokemon_id: 124, nombre: "Jynx", tipo: "ice/psychic" },
            { pokemon_id: 87, nombre: "Dewgong", tipo: "water/ice" },
            { pokemon_id: 131, nombre: "Lapras", tipo: "water/ice", leader: true }
        ]
    },
    {
        id: "clair",
        region: "johto",
        order: 8,
        city: "Blackthorn City",
        gymName: "Blackthorn Gym",
        leader: "Clair",
        leaderSlug: "clair",
        type: "dragon",
        difficulty: "Master",
        recommendedLevel: 54,
        badge: "Rising Badge",
        badgeSlug: "rising",
        rewardMoney: 6700,
        rewardExp: 2280,
        description: "The Johto finale leans into Dragon pressure, speed and punishing neutral damage.",
        hint: "Ice and Dragon coverage help, but balanced survivability matters too.",
        enemyStyle: "Dragon surge",
        roster: [
            { pokemon_id: 148, nombre: "Dragonair", tipo: "dragon" },
            { pokemon_id: 230, nombre: "Kingdra", tipo: "water/dragon", leader: true },
            { pokemon_id: 149, nombre: "Dragonite", tipo: "dragon/flying" }
        ]
    },
    {
        id: "roxanne",
        region: "hoenn",
        order: 1,
        city: "Rustboro City",
        gymName: "Rustboro Gym",
        leader: "Roxanne",
        leaderSlug: "roxanne",
        type: "rock",
        difficulty: "Beginner",
        recommendedLevel: 14,
        badge: "Stone Badge",
        badgeSlug: "stone",
        rewardMoney: 1500,
        rewardExp: 680,
        description: "Early Hoenn route with stronger Rock identity and very readable weaknesses.",
        hint: "Water and Grass coverage remain your cleanest route to an early clear.",
        enemyStyle: "Rock discipline",
        roster: [
            { pokemon_id: 74, nombre: "Geodude", tipo: "rock/ground" },
            { pokemon_id: 299, nombre: "Nosepass", tipo: "rock", leader: true },
            { pokemon_id: 95, nombre: "Onix", tipo: "rock/ground" }
        ]
    },
    {
        id: "brawly",
        region: "hoenn",
        order: 2,
        city: "Dewford Town",
        gymName: "Dewford Gym",
        leader: "Brawly",
        leaderSlug: "brawly",
        type: "fighting",
        difficulty: "Easy+",
        recommendedLevel: 20,
        badge: "Knuckle Badge",
        badgeSlug: "knuckle",
        rewardMoney: 1900,
        rewardExp: 830,
        description: "Compact Fighting route that tests whether your squad can handle raw physical pressure.",
        hint: "Flying and Psychic options create the safest path through this Gym.",
        enemyStyle: "Aggressive melee",
        roster: [
            { pokemon_id: 66, nombre: "Machop", tipo: "fighting" },
            { pokemon_id: 67, nombre: "Machoke", tipo: "fighting" },
            { pokemon_id: 307, nombre: "Meditite", tipo: "fighting/psychic" },
            { pokemon_id: 308, nombre: "Medicham", tipo: "fighting/psychic", leader: true }
        ]
    },
    {
        id: "wattson",
        region: "hoenn",
        order: 3,
        city: "Mauville City",
        gymName: "Mauville Gym",
        leader: "Wattson",
        leaderSlug: "wattson",
        type: "electric",
        difficulty: "Medium",
        recommendedLevel: 26,
        badge: "Dynamo Badge",
        badgeSlug: "dynamo",
        rewardMoney: 2450,
        rewardExp: 1020,
        description: "Electric route with sharper speed pressure and more punishing matchup swings.",
        hint: "Ground tools are still premium here, especially against the final ace.",
        enemyStyle: "Charge burst",
        roster: [
            { pokemon_id: 309, nombre: "Electrike", tipo: "electric" },
            { pokemon_id: 82, nombre: "Magneton", tipo: "electric/steel" },
            { pokemon_id: 310, nombre: "Manectric", tipo: "electric", leader: true }
        ]
    },
    {
        id: "flannery",
        region: "hoenn",
        order: 4,
        city: "Lavaridge Town",
        gymName: "Lavaridge Gym",
        leader: "Flannery",
        leaderSlug: "flannery",
        type: "fire",
        difficulty: "Medium",
        recommendedLevel: 32,
        badge: "Heat Badge",
        badgeSlug: "heat",
        rewardMoney: 3100,
        rewardExp: 1220,
        description: "A hotter mid-route fight with dangerous Fire damage and fewer safe switch windows.",
        hint: "Water and Rock answers become much more valuable the longer the fight lasts.",
        enemyStyle: "Heat ramp",
        roster: [
            { pokemon_id: 322, nombre: "Numel", tipo: "fire/ground" },
            { pokemon_id: 324, nombre: "Torkoal", tipo: "fire", leader: true },
            { pokemon_id: 78, nombre: "Rapidash", tipo: "fire" }
        ]
    },
    {
        id: "norman",
        region: "hoenn",
        order: 5,
        city: "Petalburg City",
        gymName: "Petalburg Gym",
        leader: "Norman",
        leaderSlug: "norman",
        type: "normal",
        difficulty: "Hard",
        recommendedLevel: 38,
        badge: "Balance Badge",
        badgeSlug: "balance",
        rewardMoney: 3850,
        rewardExp: 1480,
        description: "Normal route centered around raw stat checks and durable pressure pieces.",
        hint: "Fighting coverage prevents this route from becoming an attrition wall.",
        enemyStyle: "Balanced impact",
        roster: [
            { pokemon_id: 287, nombre: "Slakoth", tipo: "normal" },
            { pokemon_id: 288, nombre: "Vigoroth", tipo: "normal" },
            { pokemon_id: 289, nombre: "Slaking", tipo: "normal", leader: true }
        ]
    },
    {
        id: "winona",
        region: "hoenn",
        order: 6,
        city: "Fortree City",
        gymName: "Fortree Gym",
        leader: "Winona",
        leaderSlug: "winona",
        type: "flying",
        difficulty: "Hard+",
        recommendedLevel: 44,
        badge: "Feather Badge",
        badgeSlug: "feather",
        rewardMoney: 4700,
        rewardExp: 1750,
        description: "Flying specialists stack tempo pressure and strong neutral damage into your team order.",
        hint: "Electric, Rock and Ice options help slow the pace down.",
        enemyStyle: "Sky pressure",
        roster: [
            { pokemon_id: 278, nombre: "Wingull", tipo: "water/flying" },
            { pokemon_id: 279, nombre: "Pelipper", tipo: "water/flying" },
            { pokemon_id: 227, nombre: "Skarmory", tipo: "steel/flying" },
            { pokemon_id: 277, nombre: "Swellow", tipo: "normal/flying", leader: true }
        ]
    },
    {
        id: "tateliza",
        region: "hoenn",
        order: 7,
        city: "Mossdeep City",
        gymName: "Mossdeep Gym",
        leader: "Tate & Liza",
        leaderSlug: "tateliza",
        type: "psychic",
        difficulty: "Elite",
        recommendedLevel: 50,
        badge: "Mind Badge",
        badgeSlug: "mind",
        rewardMoney: 5750,
        rewardExp: 2050,
        description: "Dual-leader feel with layered Psychic threats and better scaling into endgame PvE.",
        hint: "Dark, Ghost and Bug coverage help, but speed control is just as important.",
        enemyStyle: "Twin control",
        roster: [
            { pokemon_id: 337, nombre: "Lunatone", tipo: "rock/psychic" },
            { pokemon_id: 338, nombre: "Solrock", tipo: "rock/psychic" },
            { pokemon_id: 344, nombre: "Claydol", tipo: "ground/psychic" },
            { pokemon_id: 375, nombre: "Metang", tipo: "steel/psychic", leader: true }
        ]
    },
    {
        id: "juan",
        region: "hoenn",
        order: 8,
        city: "Sootopolis City",
        gymName: "Sootopolis Gym",
        leader: "Juan",
        leaderSlug: "juan",
        type: "water",
        difficulty: "Master",
        recommendedLevel: 56,
        badge: "Rain Badge",
        badgeSlug: "rain",
        rewardMoney: 7100,
        rewardExp: 2400,
        description: "Hoenn finale with elegant Water pressure, strong sustain and dangerous ace scaling.",
        hint: "Electric and Grass answers matter, but the route also rewards strong overall balance.",
        enemyStyle: "Elegant pressure",
        roster: [
            { pokemon_id: 367, nombre: "Huntail", tipo: "water" },
            { pokemon_id: 368, nombre: "Gorebyss", tipo: "water" },
            { pokemon_id: 272, nombre: "Ludicolo", tipo: "water/grass" },
            { pokemon_id: 340, nombre: "Whiscash", tipo: "water/ground" },
            { pokemon_id: 130, nombre: "Gyarados", tipo: "water/flying", leader: true }
        ]
    }
];

const gymsState = {
    regionId: "kanto",
    selectedGymId: null,
    team: [],
    progress: {
        byRegion: {
            kanto: [],
            johto: [],
            hoenn: []
        }
    }
};

function escapeHtmlGyms(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizeTypeKey(type) {
    const raw = String(type || "").toLowerCase().trim();
    const map = {
        planta: "grass",
        veneno: "poison",
        fuego: "fire",
        agua: "water",
        eléctrico: "electric",
        electrico: "electric",
        roca: "rock",
        tierra: "ground",
        psíquico: "psychic",
        psiquico: "psychic",
        lucha: "fighting",
        volador: "flying",
        normal: "normal",
        acero: "steel",
        hielo: "ice",
        dragón: "dragon",
        dragon: "dragon",
        fantasma: "ghost",
        bicho: "bug",
        hada: "fairy"
    };
    return map[raw] || raw;
}

function getTypeLabel(typeKey) {
    const labels = {
        normal: "Normal",
        fire: "Fire",
        water: "Water",
        electric: "Electric",
        grass: "Grass",
        ice: "Ice",
        fighting: "Fighting",
        poison: "Poison",
        ground: "Ground",
        flying: "Flying",
        psychic: "Psychic",
        bug: "Bug",
        rock: "Rock",
        ghost: "Ghost",
        dragon: "Dragon",
        dark: "Dark",
        steel: "Steel",
        fairy: "Fairy"
    };
    return labels[normalizeTypeKey(typeKey)] || String(typeKey || "—");
}

function getTypeClass(typeKey) {
    return `type-${normalizeTypeKey(typeKey)}`;
}

function buildTrainerImagePath(regionId, leaderSlug) {
    return `${TRAINER_ASSET_ROOT}/${regionId}/${leaderSlug}.png`;
}

function buildBadgeImagePath(regionId, badgeSlug) {
    return `${BADGE_ASSET_ROOT}/${regionId}/${badgeSlug}.png`;
}

function getSpriteFromPokemon(pokemon) {
    const pokemonId = Number(pokemon?.pokemon_id || pokemon?.id || 0);
    if (pokemon?.es_shiny && pokemonId > 0) {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`;
    }
    if (pokemon?.imagen) return pokemon.imagen;
    if (pokemonId > 0) {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
    }
    return "img/pokeball.png";
}

function getStorageJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function setStorageJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn("Could not save gyms local data:", key, error);
    }
}

function getGymsForRegion(regionId = gymsState.regionId) {
    return GYMS_CONFIG.filter(gym => gym.region === regionId).sort((a, b) => a.order - b.order);
}

function getGymById(gymId) {
    return GYMS_CONFIG.find(gym => gym.id === gymId) || null;
}

function getRegionByGymId(gymId) {
    return getGymById(gymId)?.region || null;
}

function getSelectedGym() {
    return getGymById(gymsState.selectedGymId) || getFirstOpenGym(gymsState.regionId) || getGymsForRegion(gymsState.regionId)[0] || null;
}

function migrateLegacyProgress(raw) {
    if (!Array.isArray(raw?.clearedGymIds)) return null;
    return {
        byRegion: {
            kanto: [],
            johto: [],
            hoenn: []
        }
    };
}

function loadGymsProgress() {
    const raw = getStorageJson(GYMS_PROGRESS_STORAGE_KEY, null);
    const legacy = getStorageJson("mastersmon_gyms_progress_v1", null);
    const base = {
        byRegion: {
            kanto: [],
            johto: [],
            hoenn: []
        }
    };

    const candidate = raw || migrateLegacyProgress(legacy) || base;

    REGION_ORDER.forEach(regionId => {
        const gymIds = Array.isArray(candidate?.byRegion?.[regionId]) ? candidate.byRegion[regionId] : [];
        base.byRegion[regionId] = [...new Set(gymIds.filter(id => getGymById(id)?.region === regionId))];
    });

    gymsState.progress = base;
}

function persistGymsProgress() {
    setStorageJson(GYMS_PROGRESS_STORAGE_KEY, gymsState.progress);
}

function loadSelectedState() {
    const stored = getStorageJson(GYMS_SELECTED_STORAGE_KEY, null);
    const regionId = REGION_ORDER.includes(stored?.regionId) ? stored.regionId : "kanto";
    gymsState.regionId = regionId;

    const gyms = getGymsForRegion(regionId);
    const openGym = getFirstOpenGym(regionId) || gyms[0] || null;
    const storedGym = getGymById(stored?.gymId);
    gymsState.selectedGymId = storedGym?.region === regionId ? storedGym.id : openGym?.id || null;
}

function persistSelectedState() {
    setStorageJson(GYMS_SELECTED_STORAGE_KEY, {
        regionId: gymsState.regionId,
        gymId: gymsState.selectedGymId
    });
}

function loadBattleTeam() {
    const raw = getStorageJson(GYMS_TEAM_STORAGE_KEY, []);
    gymsState.team = Array.isArray(raw) ? raw.slice(0, 6) : [];
}

function getRegionClearedIds(regionId = gymsState.regionId) {
    return Array.isArray(gymsState.progress.byRegion?.[regionId]) ? gymsState.progress.byRegion[regionId] : [];
}

function isGymCleared(gymId) {
    const regionId = getRegionByGymId(gymId);
    if (!regionId) return false;
    return getRegionClearedIds(regionId).includes(gymId);
}

function isGymOpen(gymId) {
    const gym = getGymById(gymId);
    if (!gym) return false;
    const gyms = getGymsForRegion(gym.region);
    const index = gyms.findIndex(item => item.id === gym.id);
    if (index <= 0) return true;
    const previousGym = gyms[index - 1];
    return isGymCleared(previousGym.id);
}

function getGymStatus(gymId) {
    if (isGymCleared(gymId)) return "cleared";
    if (isGymOpen(gymId)) return "open";
    return "locked";
}

function getFirstOpenGym(regionId = gymsState.regionId) {
    return getGymsForRegion(regionId).find(gym => getGymStatus(gym.id) === "open") || null;
}

function getRegionProgressPercent(regionId = gymsState.regionId) {
    const gyms = getGymsForRegion(regionId);
    if (!gyms.length) return 0;
    return Math.round((getRegionClearedIds(regionId).length / gyms.length) * 100);
}

function getTotalClearedCount() {
    return REGION_ORDER.reduce((sum, regionId) => sum + getRegionClearedIds(regionId).length, 0);
}

function getTotalGymCount() {
    return GYMS_CONFIG.length;
}

function getAverageTeamLevel() {
    if (!gymsState.team.length) return 0;
    const total = gymsState.team.reduce((sum, pokemon) => sum + Number(pokemon?.nivel || 0), 0);
    return Math.round(total / gymsState.team.length);
}

function getDominantTeamType() {
    if (!gymsState.team.length) return "—";

    const counts = {};
    gymsState.team.forEach(pokemon => {
        const raw = Array.isArray(pokemon?.tipo)
            ? pokemon.tipo
            : String(pokemon?.tipo || "")
                .split(/[\/,|-]/)
                .map(item => item.trim())
                .filter(Boolean);

        raw.forEach(type => {
            const key = normalizeTypeKey(type);
            counts[key] = (counts[key] || 0) + 1;
        });
    });

    const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    return winner ? getTypeLabel(winner) : "—";
}

function buildEnemyStats(level, slotIndex, isLeader) {
    const leaderBoost = isLeader ? 1.18 : 1;
    const tierBoost = 1 + (slotIndex * 0.05);
    const scalar = level * tierBoost * leaderBoost;

    return {
        hp: Math.round(90 + scalar * 5.2),
        ataque: Math.round(32 + scalar * 1.9),
        defensa: Math.round(28 + scalar * 1.75),
        velocidad: Math.round(24 + scalar * 1.55),
        ataque_especial: Math.round(30 + scalar * 1.85),
        defensa_especial: Math.round(28 + scalar * 1.7)
    };
}

function buildGymBattleSession(gym) {
    const enemyTeam = (gym.roster || []).map((pokemon, index) => {
        const isLeader = Boolean(pokemon.leader || index === (gym.roster.length - 1));
        const level = Math.max(gym.recommendedLevel, gym.recommendedLevel + index - 1 + (isLeader ? 2 : 0));
        return {
            pokemon_id: pokemon.pokemon_id,
            nombre: pokemon.nombre,
            tipo: pokemon.tipo,
            nivel: level,
            posicion: index + 1,
            side: "enemy",
            es_lider: isLeader,
            ...buildEnemyStats(level, index, isLeader)
        };
    });

    return {
        mode: "gym",
        session_id: `gym-${gym.region}-${gym.id}-${Date.now()}`,
        region: gym.region,
        gym_id: gym.id,
        city: gym.city,
        leader: gym.leader,
        leader_image: buildTrainerImagePath(gym.region, gym.leaderSlug),
        badge: gym.badge,
        badge_image: buildBadgeImagePath(gym.region, gym.badgeSlug),
        type: gym.type,
        difficulty: gym.difficulty,
        recommendedLevel: gym.recommendedLevel,
        reward_money: gym.rewardMoney,
        reward_exp: gym.rewardExp,
        description: gym.description,
        hint: gym.hint,
        enemyStyle: gym.enemyStyle,
        enemy_team: enemyTeam
    };
}

function startGymBattle(gym) {
    if (!gym) return;

    const status = getGymStatus(gym.id);
    if (status === "locked") {
        alert("This Gym is still locked. Clear the previous leader first.");
        return;
    }
    if (status === "cleared") {
        const retry = window.confirm("You already cleared this Gym locally. Do you want to start the challenge again?");
        if (!retry) return;
    }

    if (gymsState.team.length !== 6) {
        alert("Save a full team of 6 Pokémon in Battle IA before starting a Gym challenge.");
        return;
    }

    const averageLevel = getAverageTeamLevel();
    if (averageLevel && averageLevel < gym.recommendedLevel) {
        const confirmed = window.confirm(`Your team average is Lv. ${averageLevel}, while ${gym.gymName} recommends Lv. ${gym.recommendedLevel}. Continue anyway?`);
        if (!confirmed) return;
    }

    try {
        const session = buildGymBattleSession(gym);
        sessionStorage.setItem(GYMS_ARENA_MODE_KEY, "gym");
        sessionStorage.setItem(GYMS_BATTLE_SESSION_KEY, JSON.stringify(session));
        window.location.href = "battle-arena.html?modo=gym";
    } catch (error) {
        console.error("Could not build the Gym session:", error);
        alert("Could not start the Gym challenge. Please try again.");
    }
}

function setRegion(regionId) {
    if (!REGION_ORDER.includes(regionId)) return;
    gymsState.regionId = regionId;
    const currentRegionGyms = getGymsForRegion(regionId);
    const firstOpen = getFirstOpenGym(regionId) || currentRegionGyms[0] || null;
    if (!currentRegionGyms.some(gym => gym.id === gymsState.selectedGymId)) {
        gymsState.selectedGymId = firstOpen?.id || null;
    }
    persistSelectedState();
    renderAllGymsSections();
}

function selectGym(gymId, { focus = false } = {}) {
    const gym = getGymById(gymId);
    if (!gym) return;
    gymsState.regionId = gym.region;
    gymsState.selectedGymId = gym.id;
    persistSelectedState();
    renderAllGymsSections();

    if (focus) {
        document.getElementById("selectedGymPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function clearGymDemo(gymId) {
    const gym = getGymById(gymId);
    if (!gym) return;
    if (!isGymOpen(gym.id) && !isGymCleared(gym.id)) return;

    const regionId = gym.region;
    const current = getRegionClearedIds(regionId);
    if (!current.includes(gym.id)) {
        gymsState.progress.byRegion[regionId] = [...current, gym.id];
        persistGymsProgress();
    }

    const nextGym = getGymsForRegion(regionId).find(item => getGymStatus(item.id) === "open" && !isGymCleared(item.id));
    gymsState.selectedGymId = nextGym?.id || gym.id;
    persistSelectedState();
    renderAllGymsSections();
}

function resetCurrentRegionProgress() {
    const region = REGION_CONFIG[gymsState.regionId];
    const confirmed = window.confirm(`Reset all local progress for ${region.name}?`);
    if (!confirmed) return;

    gymsState.progress.byRegion[gymsState.regionId] = [];
    const firstGym = getGymsForRegion(gymsState.regionId)[0] || null;
    gymsState.selectedGymId = firstGym?.id || null;
    persistGymsProgress();
    persistSelectedState();
    renderAllGymsSections();
}

function handleImageFallback(event, titleText = "") {
    const target = event.currentTarget;
    const wrapper = target.parentElement;
    if (!wrapper) return;
    wrapper.classList.add("is-fallback");
    const fallback = document.createElement("span");
    fallback.className = "asset-fallback";
    fallback.textContent = titleText ? titleText.slice(0, 2).toUpperCase() : "MM";
    wrapper.appendChild(fallback);
    target.remove();
}

function renderHeroPreview() {
    const container = document.getElementById("heroSelectedGymCard");
    const statbar = document.getElementById("gymsHeroStatbar");
    if (!container || !statbar) return;

    const gym = getSelectedGym();
    const region = REGION_CONFIG[gymsState.regionId];
    const cleared = getRegionClearedIds(gymsState.regionId).length;
    const total = getGymsForRegion(gymsState.regionId).length;

    statbar.innerHTML = `
        <div class="gyms-hero-stat">
            <span>Current region</span>
            <strong>${escapeHtmlGyms(region.name)}</strong>
        </div>
        <div class="gyms-hero-stat">
            <span>Region badges</span>
            <strong>${cleared} / ${total}</strong>
        </div>
        <div class="gyms-hero-stat">
            <span>Saved team</span>
            <strong>${escapeHtmlGyms(gymsState.team.length)} / 6</strong>
        </div>
    `;

    if (!gym) {
        container.innerHTML = `<div class="hero-preview-empty">No Gym available in this region yet.</div>`;
        return;
    }

    container.className = `gyms-hero-preview ${getTypeClass(gym.type)}`;
    container.innerHTML = `
        <div class="hero-preview-top">
            <span class="gyms-pill">${escapeHtmlGyms(region.shortName)}</span>
            <span class="hero-preview-status">${escapeHtmlGyms(getGymStatus(gym.id) === "cleared" ? "Cleared" : getGymStatus(gym.id) === "open" ? "Challenge ready" : "Locked")}</span>
        </div>
        <div class="hero-preview-main">
            <div class="trainer-portrait hero-portrait">
                <img src="${escapeHtmlGyms(buildTrainerImagePath(gym.region, gym.leaderSlug))}" alt="${escapeHtmlGyms(gym.leader)}" onerror="window.__gymsImageFallback(event, '${escapeHtmlGyms(gym.leader)}')">
            </div>
            <div class="hero-preview-copy">
                <small>${escapeHtmlGyms(gym.gymName)}</small>
                <h2>${escapeHtmlGyms(gym.leader)}</h2>
                <p>${escapeHtmlGyms(getTypeLabel(gym.type))} specialist · ${escapeHtmlGyms(gym.badge)}</p>
            </div>
            <div class="badge-portrait hero-badge-portrait">
                <img src="${escapeHtmlGyms(buildBadgeImagePath(gym.region, gym.badgeSlug))}" alt="${escapeHtmlGyms(gym.badge)}" onerror="window.__gymsImageFallback(event, '${escapeHtmlGyms(gym.badge)}')">
            </div>
        </div>
        <div class="hero-preview-footer">
            <div>
                <span>Recommended</span>
                <strong>Lv. ${escapeHtmlGyms(gym.recommendedLevel)}</strong>
            </div>
            <div>
                <span>Style</span>
                <strong>${escapeHtmlGyms(gym.enemyStyle)}</strong>
            </div>
            <div>
                <span>Unlock note</span>
                <strong>${escapeHtmlGyms(region.unlockText)}</strong>
            </div>
        </div>
    `;
}

function renderOverviewStats() {
    const container = document.getElementById("gymsOverviewStats");
    if (!container) return;

    const totalCleared = getTotalClearedCount();
    const totalGyms = getTotalGymCount();
    const averageLevel = getAverageTeamLevel();
    const dominantType = getDominantTeamType();
    const region = REGION_CONFIG[gymsState.regionId];

    const stats = [
        {
            label: "Total badges",
            value: `${totalCleared} / ${totalGyms}`,
            hint: "This progress is currently local, but the visual contract is ready for backend sync."
        },
        {
            label: "Active route",
            value: region.name,
            hint: region.description
        },
        {
            label: "Saved team",
            value: `${gymsState.team.length} / 6 Pokémon`,
            hint: gymsState.team.length === 6 ? "Your Battle IA squad is ready for structured Gym attempts." : "Save a full team in Battle IA for the best Gym flow."
        },
        {
            label: "Average level",
            value: averageLevel || "—",
            hint: averageLevel ? `Dominant type: ${dominantType}` : "No saved squad detected yet."
        }
    ];

    container.innerHTML = stats.map(stat => `
        <article class="gyms-stat-card">
            <span>${escapeHtmlGyms(stat.label)}</span>
            <strong>${escapeHtmlGyms(stat.value)}</strong>
            <small>${escapeHtmlGyms(stat.hint)}</small>
        </article>
    `).join("");
}

function renderRegionTabs() {
    const tabsContainer = document.getElementById("gymRegionTabs");
    const summaryContainer = document.getElementById("gymRegionSummary");
    const pill = document.getElementById("gymsRegionProgressPill");
    const roadTitle = document.getElementById("gymsRoadmapTitle");
    const roadText = document.getElementById("gymsRoadmapText");
    const roadCounter = document.getElementById("gymsRoadmapCounter");

    if (!tabsContainer || !summaryContainer || !pill || !roadTitle || !roadText || !roadCounter) return;

    tabsContainer.innerHTML = REGION_ORDER.map(regionId => {
        const region = REGION_CONFIG[regionId];
        const cleared = getRegionClearedIds(regionId).length;
        const total = getGymsForRegion(regionId).length;
        const activeClass = regionId === gymsState.regionId ? "is-active" : "";
        return `
            <button class="gym-region-tab ${activeClass} ${getTypeClass(region.accent)}" type="button" data-region-tab="${escapeHtmlGyms(regionId)}">
                <span>${escapeHtmlGyms(region.name)}</span>
                <strong>${cleared} / ${total}</strong>
                <small>${escapeHtmlGyms(region.shortName)}</small>
            </button>
        `;
    }).join("");

    const region = REGION_CONFIG[gymsState.regionId];
    const cleared = getRegionClearedIds(gymsState.regionId).length;
    const total = getGymsForRegion(gymsState.regionId).length;
    const nextGym = getFirstOpenGym(gymsState.regionId);

    pill.textContent = `${region.name} · ${cleared}/${total} badges`;
    roadTitle.textContent = `${region.name} leaders`;
    roadText.textContent = `${region.description} ${region.championNote}`;
    roadCounter.textContent = `${total} gyms`;

    summaryContainer.innerHTML = `
        <article class="gym-region-summary-card ${getTypeClass(region.accent)}">
            <div>
                <span class="gyms-section-kicker">${escapeHtmlGyms(region.bannerTitle)}</span>
                <h4>${escapeHtmlGyms(region.name)} route progress</h4>
                <p>${escapeHtmlGyms(region.unlockText)}</p>
            </div>
            <div class="gym-region-summary-meta">
                <div>
                    <span>Current open leader</span>
                    <strong>${escapeHtmlGyms(nextGym ? nextGym.leader : `${region.name} complete`)}</strong>
                </div>
                <div>
                    <span>Completion</span>
                    <strong>${getRegionProgressPercent(gymsState.regionId)}%</strong>
                </div>
            </div>
        </article>
    `;
}

function renderGymsGrid() {
    const container = document.getElementById("gymsGrid");
    if (!container) return;

    const gyms = getGymsForRegion(gymsState.regionId);
    container.innerHTML = gyms.map(gym => {
        const status = getGymStatus(gym.id);
        const selectedClass = gymsState.selectedGymId === gym.id ? "is-selected" : "";
        const statusLabel = status === "cleared" ? "Cleared" : status === "open" ? "Open" : "Locked";
        const badgeLabel = gym.badge.replace(" Badge", "");
        const rosterPreview = (gym.roster || []).slice(0, 4).map(pokemon => `
            <span class="gym-roster-mini ${getTypeClass(String(pokemon.tipo).split('/')[0])}">
                <img src="${escapeHtmlGyms(getSpriteFromPokemon(pokemon))}" alt="${escapeHtmlGyms(pokemon.nombre)}">
            </span>
        `).join("");

        return `
            <article class="gym-card ${selectedClass} ${getTypeClass(gym.type)}" data-status="${escapeHtmlGyms(status)}">
                <div class="gym-card-glow"></div>
                <div class="gym-card-top">
                    <span class="gym-status">${escapeHtmlGyms(statusLabel)}</span>
                    <span class="gym-type ${getTypeClass(gym.type)}">${escapeHtmlGyms(getTypeLabel(gym.type))}</span>
                </div>

                <div class="gym-card-main">
                    <div class="trainer-portrait gym-card-portrait">
                        <img src="${escapeHtmlGyms(buildTrainerImagePath(gym.region, gym.leaderSlug))}" alt="${escapeHtmlGyms(gym.leader)}" onerror="window.__gymsImageFallback(event, '${escapeHtmlGyms(gym.leader)}')">
                    </div>
                    <div class="gym-card-copy">
                        <small>${escapeHtmlGyms(gym.gymName)}</small>
                        <h4 class="gym-title">${escapeHtmlGyms(gym.leader)}</h4>
                        <p class="gym-city">${escapeHtmlGyms(gym.city)}</p>
                    </div>
                    <div class="badge-portrait gym-card-badge">
                        <img src="${escapeHtmlGyms(buildBadgeImagePath(gym.region, gym.badgeSlug))}" alt="${escapeHtmlGyms(gym.badge)}" onerror="window.__gymsImageFallback(event, '${escapeHtmlGyms(badgeLabel)}')">
                    </div>
                </div>

                <p class="gym-desc">${escapeHtmlGyms(gym.description)}</p>

                <div class="gym-meta-grid">
                    <div class="gym-meta-item">
                        <span>Difficulty</span>
                        <strong>${escapeHtmlGyms(gym.difficulty)}</strong>
                    </div>
                    <div class="gym-meta-item">
                        <span>Recommended</span>
                        <strong>Lv. ${escapeHtmlGyms(gym.recommendedLevel)}</strong>
                    </div>
                    <div class="gym-meta-item">
                        <span>Badge</span>
                        <strong>${escapeHtmlGyms(badgeLabel)}</strong>
                    </div>
                </div>

                <div class="gym-roster-preview">${rosterPreview}</div>

                <div class="gym-actions">
                    <button class="gyms-btn-secondary" type="button" data-select-gym="${escapeHtmlGyms(gym.id)}">Inspect</button>
                    <button class="gyms-btn-ghost" type="button" data-focus-gym="${escapeHtmlGyms(gym.id)}" ${status === "locked" ? "disabled" : ""}>
                        ${status === "cleared" ? "Replay" : status === "open" ? "Challenge" : "Locked"}
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function renderSelectedGymPanel() {
    const container = document.getElementById("selectedGymPanel");
    if (!container) return;

    const gym = getSelectedGym();
    if (!gym) {
        container.innerHTML = `<p class="gym-empty-note">No Gym available in this route right now.</p>`;
        return;
    }

    const status = getGymStatus(gym.id);
    const teamReady = gymsState.team.length === 6;
    const averageLevel = getAverageTeamLevel();
    const levelReady = averageLevel >= gym.recommendedLevel;
    const rosterHtml = (gym.roster || []).map((pokemon, index) => {
        const primaryType = String(pokemon.tipo).split("/")[0];
        return `
            <article class="gym-roster-card ${getTypeClass(primaryType)} ${pokemon.leader ? 'is-leader' : ''}">
                <div class="gym-roster-card-top">
                    <img src="${escapeHtmlGyms(getSpriteFromPokemon(pokemon))}" alt="${escapeHtmlGyms(pokemon.nombre)}">
                    <div>
                        <strong>${escapeHtmlGyms(pokemon.nombre)}</strong>
                        <p>${escapeHtmlGyms(String(pokemon.tipo).split('/').map(getTypeLabel).join(' / '))}</p>
                    </div>
                </div>
                <span class="gym-team-chip ${pokemon.leader ? 'leader' : ''}">${pokemon.leader ? 'Leader ace' : `Slot ${index + 1}`}</span>
            </article>
        `;
    }).join("");

    container.innerHTML = `
        <article class="gym-detail-card ${getTypeClass(gym.type)}">
            <div class="gym-detail-hero">
                <div class="trainer-portrait gym-detail-portrait">
                    <img src="${escapeHtmlGyms(buildTrainerImagePath(gym.region, gym.leaderSlug))}" alt="${escapeHtmlGyms(gym.leader)}" onerror="window.__gymsImageFallback(event, '${escapeHtmlGyms(gym.leader)}')">
                </div>
                <div class="gym-detail-copy">
                    <div class="gym-detail-topline">
                        <span class="gym-status">${escapeHtmlGyms(status === 'cleared' ? 'Cleared' : status === 'open' ? 'Available' : 'Locked')}</span>
                        <span class="gym-type ${getTypeClass(gym.type)}">${escapeHtmlGyms(getTypeLabel(gym.type))}</span>
                    </div>
                    <small>${escapeHtmlGyms(gym.gymName)}</small>
                    <h4>${escapeHtmlGyms(gym.leader)}</h4>
                    <p>${escapeHtmlGyms(gym.city)} · ${escapeHtmlGyms(gym.enemyStyle)}</p>
                </div>
                <div class="badge-portrait gym-detail-badge">
                    <img src="${escapeHtmlGyms(buildBadgeImagePath(gym.region, gym.badgeSlug))}" alt="${escapeHtmlGyms(gym.badge)}" onerror="window.__gymsImageFallback(event, '${escapeHtmlGyms(gym.badge)}')">
                </div>
            </div>

            <p class="gym-detail-note">${escapeHtmlGyms(gym.description)}</p>

            <div class="gym-detail-meta">
                <div class="gym-detail-meta-item">
                    <span>Recommended</span>
                    <strong>Lv. ${escapeHtmlGyms(gym.recommendedLevel)}</strong>
                </div>
                <div class="gym-detail-meta-item">
                    <span>Difficulty</span>
                    <strong>${escapeHtmlGyms(gym.difficulty)}</strong>
                </div>
                <div class="gym-detail-meta-item">
                    <span>Region</span>
                    <strong>${escapeHtmlGyms(REGION_CONFIG[gym.region].name)}</strong>
                </div>
                <div class="gym-detail-meta-item">
                    <span>Reward</span>
                    <strong>$${escapeHtmlGyms(gym.rewardMoney.toLocaleString())}</strong>
                </div>
            </div>

            <div class="gym-sidebar-list">
                <div class="gym-sidebar-item">
                    <strong>Challenge hint</strong>
                    <p>${escapeHtmlGyms(gym.hint)}</p>
                </div>
                <div class="gym-sidebar-item">
                    <strong>Readiness</strong>
                    <p>${teamReady ? 'Full team saved' : 'Team incomplete'} · ${averageLevel ? `Avg Lv. ${averageLevel}` : 'No level data'} · ${levelReady ? 'Recommended level reached' : 'Keep leveling your squad'}</p>
                </div>
            </div>

            <div class="gym-roster-stack">
                <div class="gym-roster-stack-head">
                    <strong>Leader roster preview</strong>
                    <span>${escapeHtmlGyms(gym.badge)}</span>
                </div>
                <div class="gym-roster-grid">${rosterHtml}</div>
            </div>

            <div class="gym-detail-actions">
                <button class="gyms-btn-secondary" type="button" id="btnGymPrepare" ${status === 'locked' ? 'disabled' : ''}>Start Gym Battle</button>
                <button class="gyms-btn" type="button" id="btnGymCompleteDemo" ${status === 'locked' ? 'disabled' : ''}>Mark cleared (demo)</button>
                <button class="gyms-btn-danger" type="button" id="btnGymResetProgress">Reset region</button>
            </div>
        </article>
    `;

    document.getElementById("btnGymPrepare")?.addEventListener("click", () => startGymBattle(gym));
    document.getElementById("btnGymCompleteDemo")?.addEventListener("click", () => clearGymDemo(gym.id));
    document.getElementById("btnGymResetProgress")?.addEventListener("click", resetCurrentRegionProgress);
}

function buildTeamCard(pokemon, index) {
    const sprite = getSpriteFromPokemon(pokemon);
    const rawType = Array.isArray(pokemon?.tipo)
        ? pokemon.tipo[0]
        : String(pokemon?.tipo || "").split(/[\/,|-]/).map(item => item.trim()).filter(Boolean)[0] || "normal";
    const typeKey = normalizeTypeKey(rawType);
    const hp = pokemon?.hp_actual ?? pokemon?.hp_max ?? "—";
    const attack = pokemon?.ataque ?? "—";
    const defense = pokemon?.defensa ?? "—";
    const shinyBadge = pokemon?.es_shiny ? `<span class="gym-team-chip shiny">Shiny</span>` : "";

    return `
        <article class="gym-team-card ${getTypeClass(typeKey)}">
            <div class="gym-team-card-art">
                <img src="${escapeHtmlGyms(sprite)}" alt="${escapeHtmlGyms(pokemon?.nombre || 'Pokemon')}">
            </div>
            <div class="gym-team-card-body">
                <div class="gym-team-card-head">
                    <h4>${index + 1}. ${escapeHtmlGyms(pokemon?.nombre || 'Pokemon')}</h4>
                    ${shinyBadge}
                </div>
                <p>${escapeHtmlGyms(String(pokemon?.tipo || '—'))}</p>
                <div class="gym-team-card-meta">
                    <span class="gym-team-chip">Lv. ${escapeHtmlGyms(pokemon?.nivel ?? '—')}</span>
                    <span class="gym-team-chip">HP ${escapeHtmlGyms(hp)}</span>
                    <span class="gym-team-chip">ATK ${escapeHtmlGyms(attack)}</span>
                    <span class="gym-team-chip">DEF ${escapeHtmlGyms(defense)}</span>
                </div>
            </div>
        </article>
    `;
}

function renderTeamPanel() {
    const summaryContainer = document.getElementById("gymTeamSummary");
    const listContainer = document.getElementById("gymTeamList");
    if (!summaryContainer || !listContainer) return;

    const averageLevel = getAverageTeamLevel();
    const dominantType = getDominantTeamType();
    const ready = gymsState.team.length === 6;

    summaryContainer.innerHTML = `
        <div class="gym-team-summary-grid">
            <div class="gym-summary-box">
                <span>Saved team</span>
                <strong>${escapeHtmlGyms(gymsState.team.length)} / 6</strong>
            </div>
            <div class="gym-summary-box">
                <span>Average level</span>
                <strong>${escapeHtmlGyms(averageLevel || '—')}</strong>
            </div>
            <div class="gym-summary-box">
                <span>Dominant type</span>
                <strong>${escapeHtmlGyms(dominantType)}</strong>
            </div>
        </div>
        <p class="gym-detail-note">${ready ? 'Your Battle IA squad is ready to enter badge progression.' : 'Save a full team in Battle IA so Gyms feel complete and balanced.'}</p>
    `;

    if (!gymsState.team.length) {
        listContainer.innerHTML = `<div class="gym-team-empty">No saved team found yet. Go to Battle IA, lock your squad, and it will appear here automatically.</div>`;
        return;
    }

    listContainer.innerHTML = gymsState.team.map(buildTeamCard).join("");
}

function renderProgressPanel() {
    const container = document.getElementById("gymProgressPanel");
    if (!container) return;

    const gyms = getGymsForRegion(gymsState.regionId);
    const clearedIds = getRegionClearedIds(gymsState.regionId);
    const percent = getRegionProgressPercent(gymsState.regionId);
    const nextGym = getFirstOpenGym(gymsState.regionId);
    const region = REGION_CONFIG[gymsState.regionId];

    container.innerHTML = `
        <div class="gym-progress-wrap">
            <div class="gym-sidebar-list">
                <div class="gym-sidebar-item">
                    <strong>Badges completed</strong>
                    <p>${clearedIds.length} out of ${gyms.length} gyms cleared in ${region.name}.</p>
                </div>
                <div class="gym-sidebar-item">
                    <strong>Next open leader</strong>
                    <p>${escapeHtmlGyms(nextGym ? `${nextGym.leader} · ${nextGym.badge}` : `${region.name} route complete`)}</p>
                </div>
                <div class="gym-sidebar-item">
                    <strong>Unlock rule</strong>
                    <p>Sequential by region for now. Beat one leader to open the next badge in that route.</p>
                </div>
            </div>

            <div class="gym-progress-bar" aria-hidden="true">
                <div class="gym-progress-fill" style="width:${percent}%;"></div>
            </div>
            <p class="gym-progress-note">${region.championNote}</p>

            <div class="gym-badge-track">
                ${gyms.map(gym => {
                    const status = getGymStatus(gym.id);
                    const badgeShort = gym.badge.replace(" Badge", "");
                    return `
                        <div class="gym-badge-track-item ${status === 'cleared' ? 'cleared' : status === 'locked' ? 'locked' : 'open'}">
                            <div class="badge-portrait gym-badge-track-portrait">
                                <img src="${escapeHtmlGyms(buildBadgeImagePath(gym.region, gym.badgeSlug))}" alt="${escapeHtmlGyms(gym.badge)}" onerror="window.__gymsImageFallback(event, '${escapeHtmlGyms(badgeShort)}')">
                            </div>
                            <span>${escapeHtmlGyms(badgeShort)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function bindGymsEvents() {
    document.addEventListener("click", event => {
        const regionButton = event.target.closest("[data-region-tab]");
        if (regionButton) {
            setRegion(regionButton.getAttribute("data-region-tab"));
            return;
        }

        const selectButton = event.target.closest("[data-select-gym]");
        if (selectButton) {
            selectGym(selectButton.getAttribute("data-select-gym"));
            return;
        }

        const focusButton = event.target.closest("[data-focus-gym]");
        if (focusButton) {
            const gymId = focusButton.getAttribute("data-focus-gym");
            const status = getGymStatus(gymId);
            if (status === "locked") return;
            selectGym(gymId, { focus: true });
        }
    });
}

function setupMenuAndLanguage() {
    if (typeof getCurrentLang === "function") {
        const lang = getCurrentLang();
        const desktop = document.getElementById("languageSelect");
        const mobile = document.getElementById("languageSelectMobile");
        if (desktop) desktop.value = lang;
        if (mobile) mobile.value = lang;
    }

    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
}

function renderAllGymsSections() {
    renderHeroPreview();
    renderOverviewStats();
    renderRegionTabs();
    renderGymsGrid();
    renderSelectedGymPanel();
    renderTeamPanel();
    renderProgressPanel();
}

function initGymsPage() {
    window.__gymsImageFallback = handleImageFallback;
    setupMenuAndLanguage();
    loadGymsProgress();
    loadBattleTeam();
    loadSelectedState();
    bindGymsEvents();
    renderAllGymsSections();
}

document.addEventListener("DOMContentLoaded", initGymsPage);
window.addEventListener("languageChanged", renderAllGymsSections);
