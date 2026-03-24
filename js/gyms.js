const GYMS_TEAM_STORAGE_KEY = "mastersmon_battle_team_v1";
const GYMS_PROGRESS_STORAGE_KEY = "mastersmon_gyms_progress_v1";
const GYMS_SELECTED_STORAGE_KEY = "mastersmon_gyms_selected_v1";
const GYMS_REGION_NAME = "Kanto";
const GYMS_ARENA_MODE_KEY = "mastersmon_battle_arena_mode_v1";
const GYMS_BATTLE_SESSION_KEY = "mastersmon_battle_gym_session_v1";

const GYM_ENEMY_TEAM_MAP = {
    pewter: [
        { pokemon_id: 74, nombre: "Geodude", tipo: "Roca/Tierra", hp: 40, ataque: 80, defensa: 100, velocidad: 20 },
        { pokemon_id: 27, nombre: "Sandshrew", tipo: "Tierra", hp: 50, ataque: 75, defensa: 85, velocidad: 40 },
        { pokemon_id: 95, nombre: "Onix", tipo: "Roca/Tierra", hp: 35, ataque: 45, defensa: 160, velocidad: 70 },
        { pokemon_id: 111, nombre: "Rhyhorn", tipo: "Tierra/Roca", hp: 80, ataque: 85, defensa: 95, velocidad: 25 },
        { pokemon_id: 75, nombre: "Graveler", tipo: "Roca/Tierra", hp: 55, ataque: 95, defensa: 115, velocidad: 35 },
        { pokemon_id: 76, nombre: "Golem", tipo: "Roca/Tierra", hp: 80, ataque: 120, defensa: 130, velocidad: 45, es_lider: true }
    ],
    cerulean: [
        { pokemon_id: 60, nombre: "Poliwag", tipo: "Agua", hp: 40, ataque: 50, defensa: 40, velocidad: 90 },
        { pokemon_id: 54, nombre: "Psyduck", tipo: "Agua", hp: 50, ataque: 52, defensa: 48, velocidad: 55 },
        { pokemon_id: 90, nombre: "Shellder", tipo: "Agua", hp: 30, ataque: 65, defensa: 100, velocidad: 40 },
        { pokemon_id: 61, nombre: "Poliwhirl", tipo: "Agua", hp: 65, ataque: 65, defensa: 65, velocidad: 90 },
        { pokemon_id: 120, nombre: "Staryu", tipo: "Agua", hp: 30, ataque: 45, defensa: 55, velocidad: 85 },
        { pokemon_id: 121, nombre: "Starmie", tipo: "Agua/Psíquico", hp: 60, ataque: 75, defensa: 85, velocidad: 115, ataque_especial: 100, defensa_especial: 85, es_lider: true }
    ],
    vermilion: [
        { pokemon_id: 100, nombre: "Voltorb", tipo: "Electrico", hp: 40, ataque: 30, defensa: 50, velocidad: 100 },
        { pokemon_id: 81, nombre: "Magnemite", tipo: "Electrico/Acero", hp: 25, ataque: 35, defensa: 70, velocidad: 45, ataque_especial: 95, defensa_especial: 55 },
        { pokemon_id: 82, nombre: "Magneton", tipo: "Electrico/Acero", hp: 50, ataque: 60, defensa: 95, velocidad: 70, ataque_especial: 120, defensa_especial: 70 },
        { pokemon_id: 25, nombre: "Pikachu", tipo: "Electrico", hp: 35, ataque: 55, defensa: 40, velocidad: 90, ataque_especial: 50, defensa_especial: 50 },
        { pokemon_id: 101, nombre: "Electrode", tipo: "Electrico", hp: 60, ataque: 50, defensa: 70, velocidad: 150, ataque_especial: 80, defensa_especial: 80 },
        { pokemon_id: 26, nombre: "Raichu", tipo: "Electrico", hp: 60, ataque: 90, defensa: 55, velocidad: 110, ataque_especial: 90, defensa_especial: 80, es_lider: true }
    ],
    celadon: [
        { pokemon_id: 69, nombre: "Bellsprout", tipo: "Planta/Veneno", hp: 50, ataque: 75, defensa: 35, velocidad: 40 },
        { pokemon_id: 43, nombre: "Oddish", tipo: "Planta/Veneno", hp: 45, ataque: 50, defensa: 55, velocidad: 30, ataque_especial: 75, defensa_especial: 65 },
        { pokemon_id: 70, nombre: "Weepinbell", tipo: "Planta/Veneno", hp: 65, ataque: 90, defensa: 50, velocidad: 55, ataque_especial: 85, defensa_especial: 45 },
        { pokemon_id: 71, nombre: "Victreebel", tipo: "Planta/Veneno", hp: 80, ataque: 105, defensa: 65, velocidad: 70, ataque_especial: 100, defensa_especial: 70 },
        { pokemon_id: 44, nombre: "Gloom", tipo: "Planta/Veneno", hp: 60, ataque: 65, defensa: 70, velocidad: 40, ataque_especial: 85, defensa_especial: 75 },
        { pokemon_id: 45, nombre: "Vileplume", tipo: "Planta/Veneno", hp: 75, ataque: 80, defensa: 85, velocidad: 50, ataque_especial: 110, defensa_especial: 90, es_lider: true }
    ],
    fuchsia: [
        { pokemon_id: 23, nombre: "Ekans", tipo: "Veneno", hp: 35, ataque: 60, defensa: 44, velocidad: 55 },
        { pokemon_id: 24, nombre: "Arbok", tipo: "Veneno", hp: 60, ataque: 95, defensa: 69, velocidad: 80 },
        { pokemon_id: 48, nombre: "Venonat", tipo: "Bicho/Veneno", hp: 60, ataque: 55, defensa: 50, velocidad: 45, ataque_especial: 40, defensa_especial: 55 },
        { pokemon_id: 49, nombre: "Venomoth", tipo: "Bicho/Veneno", hp: 70, ataque: 65, defensa: 60, velocidad: 90, ataque_especial: 90, defensa_especial: 75 },
        { pokemon_id: 109, nombre: "Koffing", tipo: "Veneno", hp: 40, ataque: 65, defensa: 95, velocidad: 35 },
        { pokemon_id: 110, nombre: "Weezing", tipo: "Veneno", hp: 65, ataque: 90, defensa: 120, velocidad: 60, es_lider: true }
    ],
    saffron: [
        { pokemon_id: 63, nombre: "Abra", tipo: "Psíquico", hp: 25, ataque: 20, defensa: 15, velocidad: 90, ataque_especial: 105, defensa_especial: 55 },
        { pokemon_id: 64, nombre: "Kadabra", tipo: "Psíquico", hp: 40, ataque: 35, defensa: 30, velocidad: 105, ataque_especial: 120, defensa_especial: 70 },
        { pokemon_id: 79, nombre: "Slowpoke", tipo: "Agua/Psíquico", hp: 90, ataque: 65, defensa: 65, velocidad: 15, ataque_especial: 40, defensa_especial: 40 },
        { pokemon_id: 80, nombre: "Slowbro", tipo: "Agua/Psíquico", hp: 95, ataque: 75, defensa: 110, velocidad: 30, ataque_especial: 100, defensa_especial: 80 },
        { pokemon_id: 122, nombre: "Mr. Mime", tipo: "Psíquico/Hada", hp: 40, ataque: 45, defensa: 65, velocidad: 90, ataque_especial: 100, defensa_especial: 120 },
        { pokemon_id: 65, nombre: "Alakazam", tipo: "Psíquico", hp: 55, ataque: 50, defensa: 45, velocidad: 120, ataque_especial: 135, defensa_especial: 95, es_lider: true }
    ],
    cinnabar: [
        { pokemon_id: 37, nombre: "Vulpix", tipo: "Fuego", hp: 38, ataque: 41, defensa: 40, velocidad: 65, ataque_especial: 50, defensa_especial: 65 },
        { pokemon_id: 58, nombre: "Growlithe", tipo: "Fuego", hp: 55, ataque: 70, defensa: 45, velocidad: 60 },
        { pokemon_id: 77, nombre: "Ponyta", tipo: "Fuego", hp: 50, ataque: 85, defensa: 55, velocidad: 90 },
        { pokemon_id: 78, nombre: "Rapidash", tipo: "Fuego", hp: 65, ataque: 100, defensa: 70, velocidad: 105 },
        { pokemon_id: 59, nombre: "Arcanine", tipo: "Fuego", hp: 90, ataque: 110, defensa: 80, velocidad: 95 },
        { pokemon_id: 126, nombre: "Magmar", tipo: "Fuego", hp: 65, ataque: 95, defensa: 57, velocidad: 93, ataque_especial: 100, defensa_especial: 85, es_lider: true }
    ],
    viridian: [
        { pokemon_id: 27, nombre: "Sandshrew", tipo: "Tierra", hp: 50, ataque: 75, defensa: 85, velocidad: 40 },
        { pokemon_id: 28, nombre: "Sandslash", tipo: "Tierra", hp: 75, ataque: 100, defensa: 110, velocidad: 65 },
        { pokemon_id: 31, nombre: "Nidoqueen", tipo: "Veneno/Tierra", hp: 90, ataque: 92, defensa: 87, velocidad: 76, ataque_especial: 75, defensa_especial: 85 },
        { pokemon_id: 34, nombre: "Nidoking", tipo: "Veneno/Tierra", hp: 81, ataque: 102, defensa: 77, velocidad: 85, ataque_especial: 85, defensa_especial: 75 },
        { pokemon_id: 112, nombre: "Rhydon", tipo: "Tierra/Roca", hp: 105, ataque: 130, defensa: 120, velocidad: 40 },
        { pokemon_id: 51, nombre: "Dugtrio", tipo: "Tierra", hp: 35, ataque: 100, defensa: 50, velocidad: 120, es_lider: true }
    ]
};

const GYMS_CONFIG = [
    {
        id: "pewter",
        city: "Pewter Gym",
        leader: "Brock",
        type: "Rock",
        difficulty: "Beginner",
        recommendedLevel: 10,
        badge: "Boulder Badge",
        rewardSummary: ["Badge", "Pokédollars", "EXP"],
        description: "Starter Gym with strong defensive pressure. Great for teaching badge progression and type counters.",
        hint: "Water and Grass squads usually have an easier first clear.",
        phase: "Starter route",
        enemyStyle: "High defense and steady pressure"
    },
    {
        id: "cerulean",
        city: "Cerulean Gym",
        leader: "Misty",
        type: "Water",
        difficulty: "Easy+",
        recommendedLevel: 16,
        badge: "Cascade Badge",
        rewardSummary: ["Badge", "Pokédollars", "EXP"],
        description: "Second badge route with faster tempo and more offensive pressure after clearing the first Gym.",
        hint: "Electric and Grass pressure become more valuable here.",
        phase: "Second route",
        enemyStyle: "Speed tempo and water pressure"
    },
    {
        id: "vermilion",
        city: "Vermilion Gym",
        leader: "Lt. Surge",
        type: "Electric",
        difficulty: "Medium",
        recommendedLevel: 22,
        badge: "Thunder Badge",
        rewardSummary: ["Badge", "Pokédollars", "EXP"],
        description: "Faster Gym designed to punish slow teams and reward good speed planning.",
        hint: "Ground coverage and fast pivots help a lot.",
        phase: "Mid route",
        enemyStyle: "Fast offense and burst turns"
    },
    {
        id: "celadon",
        city: "Celadon Gym",
        leader: "Erika",
        type: "Grass",
        difficulty: "Medium",
        recommendedLevel: 28,
        badge: "Rainbow Badge",
        rewardSummary: ["Badge", "Pokédollars", "EXP"],
        description: "Mid-run control Gym with sustain, status pressure, and better reward scaling.",
        hint: "Fire, Flying, and status removal matter more here.",
        phase: "Control route",
        enemyStyle: "Sustain, healing, and status control"
    },
    {
        id: "fuchsia",
        city: "Fuchsia Gym",
        leader: "Koga",
        type: "Poison",
        difficulty: "Hard",
        recommendedLevel: 34,
        badge: "Soul Badge",
        rewardSummary: ["Badge", "Pokédollars", "EXP"],
        description: "Late-game tactical fight where accuracy and sustained damage become more important.",
        hint: "Balanced teams with good durability perform better.",
        phase: "Tactical route",
        enemyStyle: "Chip damage and pressure over time"
    },
    {
        id: "saffron",
        city: "Saffron Gym",
        leader: "Sabrina",
        type: "Psychic",
        difficulty: "Hard+",
        recommendedLevel: 40,
        badge: "Marsh Badge",
        rewardSummary: ["Badge", "Pokédollars", "EXP"],
        description: "High-pressure Gym designed for stronger squads with good damage spread and speed control.",
        hint: "Dark and Bug options become much more valuable.",
        phase: "Advanced route",
        enemyStyle: "Special pressure and fast control"
    },
    {
        id: "cinnabar",
        city: "Cinnabar Gym",
        leader: "Blaine",
        type: "Fire",
        difficulty: "Elite",
        recommendedLevel: 46,
        badge: "Volcano Badge",
        rewardSummary: ["Badge", "Pokédollars", "EXP"],
        description: "Burst-damage Gym where resistances and team order will matter much more.",
        hint: "Water, Rock, and disciplined switching help stabilize the run.",
        phase: "Elite route",
        enemyStyle: "Burst damage and matchup checks"
    },
    {
        id: "viridian",
        city: "Viridian Gym",
        leader: "Giovanni",
        type: "Ground",
        difficulty: "Master",
        recommendedLevel: 52,
        badge: "Earth Badge",
        rewardSummary: ["Badge", "Pokédollars", "EXP", "Endgame unlock"],
        description: "Final regional Gym and perfect bridge into later Elite content, tournaments, or seasonal boss ladders.",
        hint: "Ice, Water, and Grass answers plus high team balance are ideal.",
        phase: "Final route",
        enemyStyle: "Heavy hits and endgame pressure"
    }
];

const gymsState = {
    selectedGymId: null,
    team: [],
    progress: { clearedGymIds: [] }
};

function tGyms(key, fallback) {
    try {
        if (typeof t === "function") return t(key);
    } catch (error) {
        // no-op
    }
    return fallback;
}

function escapeHtmlGyms(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getGymById(gymId) {
    return GYMS_CONFIG.find(gym => gym.id === gymId) || null;
}

function getGymIndex(gymId) {
    return GYMS_CONFIG.findIndex(gym => gym.id === gymId);
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
        console.warn("No se pudo guardar en localStorage:", key, error);
    }
}

function loadGymsProgress() {
    const raw = getStorageJson(GYMS_PROGRESS_STORAGE_KEY, { clearedGymIds: [] });
    const clearedGymIds = Array.isArray(raw?.clearedGymIds) ? raw.clearedGymIds : [];
    gymsState.progress = {
        clearedGymIds: [...new Set(clearedGymIds.filter(id => !!getGymById(id)))]
    };
}

function persistGymsProgress() {
    setStorageJson(GYMS_PROGRESS_STORAGE_KEY, gymsState.progress);
}

function loadSelectedGym() {
    const stored = localStorage.getItem(GYMS_SELECTED_STORAGE_KEY);
    const availableGymId = getFirstAvailableGym()?.id || GYMS_CONFIG[0]?.id || null;
    gymsState.selectedGymId = getGymById(stored)?.id || availableGymId;
}

function persistSelectedGym() {
    if (!gymsState.selectedGymId) return;
    localStorage.setItem(GYMS_SELECTED_STORAGE_KEY, gymsState.selectedGymId);
}

function loadBattleTeam() {
    const raw = getStorageJson(GYMS_TEAM_STORAGE_KEY, []);
    gymsState.team = Array.isArray(raw) ? raw.slice(0, 6) : [];
}

function getClearedCount() {
    return gymsState.progress.clearedGymIds.length;
}

function isGymCleared(gymId) {
    return gymsState.progress.clearedGymIds.includes(gymId);
}

function isGymAvailable(gymId) {
    const index = getGymIndex(gymId);
    if (index === 0) return true;
    const previousGym = GYMS_CONFIG[index - 1];
    return Boolean(previousGym && isGymCleared(previousGym.id));
}

function getGymStatus(gymId) {
    if (isGymCleared(gymId)) return "cleared";
    if (isGymAvailable(gymId)) return "open";
    return "locked";
}

function getFirstAvailableGym() {
    return GYMS_CONFIG.find(gym => getGymStatus(gym.id) === "open") || GYMS_CONFIG[0] || null;
}

function getCurrentRegionLabel() {
    const cleared = getClearedCount();
    if (cleared >= GYMS_CONFIG.length) return `${GYMS_REGION_NAME} Complete`;
    return GYMS_REGION_NAME;
}

function getProgressPercent() {
    if (!GYMS_CONFIG.length) return 0;
    return Math.max(0, Math.min(100, (getClearedCount() / GYMS_CONFIG.length) * 100));
}

function getAverageTeamLevel() {
    if (!gymsState.team.length) return 0;
    const total = gymsState.team.reduce((sum, pokemon) => sum + Number(pokemon?.nivel || 0), 0);
    return Math.round(total / gymsState.team.length);
}

function getRecommendedGymBattleLevel(gym) {
    const averageLevel = getAverageTeamLevel();
    const recommended = Number(gym?.recommendedLevel || 1);
    if (!averageLevel) return recommended;
    return Math.max(recommended, Math.min(recommended + 4, averageLevel));
}

function buildGymBattleSession(gym) {
    const enemyBaseTeam = Array.isArray(GYM_ENEMY_TEAM_MAP[gym.id]) ? GYM_ENEMY_TEAM_MAP[gym.id] : [];
    return {
        mode: "gym",
        session_id: `gym-${gym.id}-${Date.now()}`,
        region: GYMS_REGION_NAME,
        gym_id: gym.id,
        city: gym.city,
        leader: gym.leader,
        type: gym.type,
        difficulty: gym.difficulty,
        recommendedLevel: Number(gym.recommendedLevel || 1),
        targetLevel: getRecommendedGymBattleLevel(gym),
        badge: gym.badge,
        rewardSummary: Array.isArray(gym.rewardSummary) ? gym.rewardSummary : [],
        description: gym.description,
        hint: gym.hint,
        enemyStyle: gym.enemyStyle,
        enemy_team: enemyBaseTeam.map((pokemon, index) => ({
            ...pokemon,
            side: "enemy",
            slotIndex: index,
            posicion: index + 1,
            es_lider: Boolean(pokemon.es_lider || index === enemyBaseTeam.length - 1)
        }))
    };
}

function startGymBattle(gym) {
    if (!gym) return;

    if (!isGymAvailable(gym.id) || isGymCleared(gym.id)) {
        alert("This Gym is not available for a new challenge right now.");
        return;
    }

    if (gymsState.team.length !== 6) {
        alert("Save a full team of 6 Pokémon in Play Hub before challenging this Gym.");
        return;
    }

    const averageLevel = getAverageTeamLevel();
    const recommended = Number(gym.recommendedLevel || 1);
    if (averageLevel > 0 && averageLevel < recommended) {
        const confirmed = window.confirm(`Your team average is Lv. ${averageLevel} and ${gym.city} recommends Lv. ${recommended}. Do you want to continue anyway?`);
        if (!confirmed) return;
    }

    const session = buildGymBattleSession(gym);

    try {
        sessionStorage.setItem(GYMS_ARENA_MODE_KEY, "gym");
        sessionStorage.setItem(GYMS_BATTLE_SESSION_KEY, JSON.stringify(session));
        window.location.href = "battle-arena.html?modo=gym";
    } catch (error) {
        console.error("No se pudo crear la sesión del Gym:", error);
        alert("Could not start the Gym challenge. Please try again.");
    }
}

function getDominantTeamType() {
    if (!gymsState.team.length) return "—";

    const counter = {};
    gymsState.team.forEach(pokemon => {
        const rawType = pokemon?.tipo;
        const normalizedTypes = Array.isArray(rawType)
            ? rawType
            : String(rawType || "")
                .split(/[\/,|-]/)
                .map(item => item.trim())
                .filter(Boolean);

        normalizedTypes.forEach(type => {
            const key = type.toLowerCase();
            counter[key] = (counter[key] || 0) + 1;
        });
    });

    const [winner] = Object.entries(counter).sort((a, b) => b[1] - a[1])[0] || [];
    if (!winner) return "—";
    return winner.charAt(0).toUpperCase() + winner.slice(1);
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

function renderOverviewStats() {
    const container = document.getElementById("gymsOverviewStats");
    if (!container) return;

    const stats = [
        {
            label: "Badges earned",
            value: `${getClearedCount()} / ${GYMS_CONFIG.length}`,
            hint: getClearedCount() ? "Your local badge progress is active." : "Complete the first Gym to start the route."
        },
        {
            label: "Current region",
            value: getCurrentRegionLabel(),
            hint: "Kanto is the first structured Gym route."
        },
        {
            label: "Suggested team",
            value: `${gymsState.team.length} / 6 Pokémon`,
            hint: gymsState.team.length === 6 ? "Your Gym team is ready." : "Save a full team in Play Hub for best results."
        },
        {
            label: "Progression type",
            value: "Sequential",
            hint: "Beat one Gym, unlock the next, and scale your rewards."
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

function renderGymsGrid() {
    const container = document.getElementById("gymsGrid");
    if (!container) return;

    container.innerHTML = GYMS_CONFIG.map(gym => {
        const status = getGymStatus(gym.id);
        const selectedClass = gymsState.selectedGymId === gym.id ? "is-selected" : "";
        const statusLabel = status === "cleared" ? "Cleared" : status === "open" ? "Open" : "Locked";
        const primaryLabel = status === "locked"
            ? "Locked route"
            : status === "cleared"
                ? "Select Gym"
                : "Challenge ready";

        return `
            <article class="gym-card ${selectedClass}" data-status="${escapeHtmlGyms(status)}">
                <div class="gym-top">
                    <span class="gym-status">${escapeHtmlGyms(statusLabel)}</span>
                    <span class="gym-type">${escapeHtmlGyms(gym.type)}</span>
                </div>

                <div>
                    <h4 class="gym-title">${escapeHtmlGyms(gym.city)}</h4>
                    <p class="gym-leader">Leader · ${escapeHtmlGyms(gym.leader)}</p>
                </div>

                <p class="gym-desc">${escapeHtmlGyms(gym.description)}</p>

                <div class="gym-meta">
                    <div class="gym-meta-item">
                        <span>Difficulty</span>
                        <strong>${escapeHtmlGyms(gym.difficulty)}</strong>
                    </div>
                    <div class="gym-meta-item">
                        <span>Recommended</span>
                        <strong>Lv. ${escapeHtmlGyms(gym.recommendedLevel)}</strong>
                    </div>
                    <div class="gym-meta-item">
                        <span>Reward</span>
                        <strong>${escapeHtmlGyms(gym.badge.replace(" Badge", ""))}</strong>
                    </div>
                </div>

                <span class="gym-reward">Badge reward</span>

                <div class="gym-actions">
                    <button class="gyms-btn-secondary" type="button" data-select-gym="${escapeHtmlGyms(gym.id)}">Select Gym</button>
                    <button class="gyms-btn-ghost" type="button" data-focus-gym="${escapeHtmlGyms(gym.id)}" ${status === "locked" ? "disabled" : ""}>${escapeHtmlGyms(primaryLabel)}</button>
                </div>
            </article>
        `;
    }).join("");
}

function renderSelectedGymPanel() {
    const container = document.getElementById("selectedGymPanel");
    if (!container) return;

    const gym = getGymById(gymsState.selectedGymId) || getFirstAvailableGym();
    if (!gym) {
        container.innerHTML = `<p class="gym-empty-note">No Gym available right now.</p>`;
        return;
    }

    const status = getGymStatus(gym.id);
    const teamReady = gymsState.team.length === 6;
    const averageLevel = getAverageTeamLevel();
    const suggestedReady = averageLevel >= gym.recommendedLevel;
    const statusLabel = status === "cleared" ? "Cleared" : status === "open" ? "Available" : "Locked";
    const readyText = teamReady ? "Full team saved" : "Team incomplete";
    const levelText = averageLevel > 0 ? `Avg Lv. ${averageLevel}` : "No level data";

    container.innerHTML = `
        <div class="gym-detail-card">
            <div class="gym-detail-head">
                <div class="gym-detail-title-block">
                    <h4>${escapeHtmlGyms(gym.city)}</h4>
                    <p>Leader · ${escapeHtmlGyms(gym.leader)} · ${escapeHtmlGyms(gym.type)} specialist</p>
                </div>
                <div class="gym-detail-badges">
                    <span class="gym-status">${escapeHtmlGyms(statusLabel)}</span>
                    <span class="gym-type">${escapeHtmlGyms(gym.type)}</span>
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
                    <span>Style</span>
                    <strong>${escapeHtmlGyms(gym.enemyStyle)}</strong>
                </div>
            </div>

            <div class="gym-sidebar-list">
                <div class="gym-sidebar-item">
                    <strong>Challenge hint</strong>
                    <p>${escapeHtmlGyms(gym.hint)}</p>
                </div>
                <div class="gym-sidebar-item">
                    <strong>Readiness</strong>
                    <p>${escapeHtmlGyms(readyText)} · ${escapeHtmlGyms(levelText)} · ${suggestedReady ? "Recommended level reached" : "Keep leveling your squad"}</p>
                </div>
            </div>

            <div>
                <strong style="display:block; margin-bottom:10px; color:#0f172a;">Reward preview</strong>
                <div class="gym-detail-rewards">
                    <span class="gym-badge-chip ${status === "cleared" ? "cleared" : status === "locked" ? "locked" : ""}">${escapeHtmlGyms(gym.badge)}</span>
                    ${gym.rewardSummary.map(item => `<span class="gyms-pill">${escapeHtmlGyms(item)}</span>`).join("")}
                </div>
            </div>

            <div class="gym-detail-actions">
                <button class="gyms-btn-secondary" type="button" id="btnGymPrepare" ${status !== "open" ? "disabled" : ""}>Start Gym Battle</button>
                <button class="gyms-btn" type="button" id="btnGymCompleteDemo" ${status !== "open" ? "disabled" : ""}>Mark cleared (demo)</button>
                <button class="gyms-btn-danger" type="button" id="btnGymResetProgress">Reset progress</button>
            </div>
        </div>
    `;

    const btnPrepare = document.getElementById("btnGymPrepare");
    const btnCompleteDemo = document.getElementById("btnGymCompleteDemo");
    const btnResetProgress = document.getElementById("btnGymResetProgress");

    if (btnPrepare) {
        btnPrepare.addEventListener("click", () => {
            if (status !== "open") return;
            startGymBattle(gym);
        });
    }

    if (btnCompleteDemo) {
        btnCompleteDemo.addEventListener("click", () => {
            if (status !== "open") return;
            clearGymDemo(gym.id);
        });
    }

    if (btnResetProgress) {
        btnResetProgress.addEventListener("click", resetGymsProgress);
    }
}

function renderTeamPanel() {
    const summaryContainer = document.getElementById("gymTeamSummary");
    const listContainer = document.getElementById("gymTeamList");
    if (!summaryContainer || !listContainer) return;

    const averageLevel = getAverageTeamLevel();
    const dominantType = getDominantTeamType();
    const teamReady = gymsState.team.length === 6;

    summaryContainer.innerHTML = `
        <div class="gym-team-summary-grid">
            <div class="gym-summary-box">
                <span>Saved team</span>
                <strong>${escapeHtmlGyms(gymsState.team.length)} / 6</strong>
            </div>
            <div class="gym-summary-box">
                <span>Average level</span>
                <strong>${averageLevel || "—"}</strong>
            </div>
            <div class="gym-summary-box">
                <span>Dominant type</span>
                <strong>${escapeHtmlGyms(dominantType)}</strong>
            </div>
        </div>
        <p class="gym-detail-note">${teamReady ? "Your team is ready for structured Gym progression." : "Go to Play Hub and save a full team if you want Gyms to feel complete."}</p>
    `;

    if (!gymsState.team.length) {
        listContainer.innerHTML = `<div class="gym-team-empty">No team found yet. Save your squad in Battle / Play Hub and it will appear here automatically.</div>`;
        return;
    }

    listContainer.innerHTML = gymsState.team.map((pokemon, index) => {
        const sprite = getSpriteFromPokemon(pokemon);
        const level = Number(pokemon?.nivel || 0) || "—";
        const type = pokemon?.tipo || "—";
        const hp = pokemon?.hp_actual ?? pokemon?.hp_max ?? "—";
        const attack = pokemon?.ataque ?? "—";
        const shinyBadge = pokemon?.es_shiny ? `<span class="gym-team-chip shiny">Shiny</span>` : "";

        return `
            <article class="gym-team-card">
                <img src="${escapeHtmlGyms(sprite)}" alt="${escapeHtmlGyms(pokemon?.nombre || "Pokemon")}">
                <div class="gym-team-card-body">
                    <div class="gym-team-card-head">
                        <h4>${index + 1}. ${escapeHtmlGyms(pokemon?.nombre || "Pokemon")}</h4>
                        ${shinyBadge}
                    </div>
                    <p>${escapeHtmlGyms(String(type))}</p>
                    <div class="gym-team-card-meta">
                        <span class="gym-team-chip">Lv. ${escapeHtmlGyms(level)}</span>
                        <span class="gym-team-chip">HP ${escapeHtmlGyms(hp)}</span>
                        <span class="gym-team-chip">ATK ${escapeHtmlGyms(attack)}</span>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function renderProgressPanel() {
    const container = document.getElementById("gymProgressPanel");
    if (!container) return;

    const nextGym = GYMS_CONFIG.find(gym => getGymStatus(gym.id) === "open") || null;
    const percent = getProgressPercent();
    const clearedCount = getClearedCount();

    container.innerHTML = `
        <div class="gym-progress-wrap">
            <div class="gym-sidebar-list">
                <div class="gym-sidebar-item">
                    <strong>Badges completed</strong>
                    <p>${clearedCount} out of ${GYMS_CONFIG.length} Gyms cleared.</p>
                </div>
                <div class="gym-sidebar-item">
                    <strong>Next Gym</strong>
                    <p>${escapeHtmlGyms(nextGym ? `${nextGym.city} · ${nextGym.leader}` : "Kanto complete")}</p>
                </div>
                <div class="gym-sidebar-item">
                    <strong>Progression rule</strong>
                    <p>Sequential unlock. Complete the current Gym to open the next route.</p>
                </div>
            </div>

            <div class="gym-progress-bar" aria-hidden="true">
                <div class="gym-progress-fill" style="width:${percent}%;"></div>
            </div>
            <p class="gym-progress-note">Progress preview: ${clearedCount} badge${clearedCount === 1 ? "" : "s"} cleared. This currently uses localStorage and is ready to move to backend later.</p>

            <div class="gym-badge-track">
                ${GYMS_CONFIG.map(gym => {
                    const status = getGymStatus(gym.id);
                    return `<span class="gym-badge-chip ${status === "cleared" ? "cleared" : status === "locked" ? "locked" : ""}">${escapeHtmlGyms(gym.badge.replace(" Badge", ""))}</span>`;
                }).join("")}
            </div>
        </div>
    `;
}

function selectGym(gymId, options = {}) {
    const { focus = false } = options;
    const gym = getGymById(gymId);
    if (!gym) return;

    gymsState.selectedGymId = gym.id;
    persistSelectedGym();
    renderAllGymsSections();

    if (focus) {
        const panel = document.getElementById("selectedGymPanel");
        panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function clearGymDemo(gymId) {
    if (!getGymById(gymId)) return;
    if (!isGymAvailable(gymId)) return;

    if (!isGymCleared(gymId)) {
        gymsState.progress.clearedGymIds.push(gymId);
        gymsState.progress.clearedGymIds = [...new Set(gymsState.progress.clearedGymIds)];
        persistGymsProgress();
    }

    renderAllGymsSections();

    const nextGym = GYMS_CONFIG.find(gym => getGymStatus(gym.id) === "open" && !isGymCleared(gym.id));
    if (nextGym && nextGym.id !== gymId) {
        gymsState.selectedGymId = nextGym.id;
        persistSelectedGym();
        renderAllGymsSections();
    }
}

function resetGymsProgress() {
    const confirmed = window.confirm("Reset all local Gym progress and start again from the first Gym?");
    if (!confirmed) return;

    gymsState.progress = { clearedGymIds: [] };
    persistGymsProgress();

    const firstGym = GYMS_CONFIG[0] || null;
    gymsState.selectedGymId = firstGym?.id || null;
    persistSelectedGym();
    renderAllGymsSections();
}

function bindGymsEvents() {
    document.addEventListener("click", (event) => {
        const selectButton = event.target.closest("[data-select-gym]");
        if (selectButton) {
            selectGym(selectButton.getAttribute("data-select-gym"));
            return;
        }

        const focusButton = event.target.closest("[data-focus-gym]");
        if (focusButton) {
            const gymId = focusButton.getAttribute("data-focus-gym");
            if (!isGymAvailable(gymId) && !isGymCleared(gymId)) return;
            selectGym(gymId, { focus: true });
        }
    });
}

function setupMenuAndLanguage() {
    const menuToggle = document.getElementById("menuToggle");
    const menuMobile = document.getElementById("menuMobile");
    const languageSelect = document.getElementById("languageSelect");

    if (menuToggle && menuMobile) {
        menuToggle.addEventListener("click", () => {
            menuMobile.classList.toggle("menu-open");
        });
    }

    if (languageSelect && typeof getCurrentLang === "function") {
        languageSelect.value = getCurrentLang();
        languageSelect.addEventListener("change", (event) => {
            if (typeof setCurrentLang === "function") {
                setCurrentLang(event.target.value);
            }
        });
    }

    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
}

function renderAllGymsSections() {
    renderOverviewStats();
    renderGymsGrid();
    renderSelectedGymPanel();
    renderTeamPanel();
    renderProgressPanel();
}

function initGymsPage() {
    setupMenuAndLanguage();
    loadGymsProgress();
    loadBattleTeam();
    loadSelectedGym();
    bindGymsEvents();
    renderAllGymsSections();
}

document.addEventListener("DOMContentLoaded", initGymsPage);
