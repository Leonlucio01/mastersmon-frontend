/* =========================================================
   IDLE PAGE JS
   - Página separada para Idle Expedition
   - Reutiliza el equipo guardado de Battle
   - Mantiene las rutas backend existentes de Idle
========================================================= */

const IDLE_TEAM_STORAGE_KEY = "mastersmon_battle_team_v1";
const IDLE_SESSION_STORAGE_KEY = "mastersmon_battle_idle_session_v1";
const IDLE_LAST_RESULT_STORAGE_KEY = "mastersmon_idle_last_result_v1";
const IDLE_PREMIUM_SHOP_URL = "pokemart.html";

const IDLE_TIER_CONFIG = {
    ruta: {
        label: "Route",
        description: "Stable farming route with safer pacing and consistent rewards.",
        difficulty: "Starter",
        tickSegundos: 45,
        baseExp: 16,
        baseCoins: 26,
        enemyPower: 1.0,
        accent: "route",
        drops: [
            { itemCode: "potion", label: "Potion", chance: 0.12 },
            { itemCode: "poke_ball", label: "Poké Ball", chance: 0.08 }
        ]
    },
    elite: {
        label: "Elite",
        description: "Balanced expedition with better scaling and stronger enemy pressure.",
        difficulty: "Mid",
        tickSegundos: 55,
        baseExp: 28,
        baseCoins: 52,
        enemyPower: 1.25,
        accent: "elite",
        drops: [
            { itemCode: "potion", label: "Potion", chance: 0.18 },
            { itemCode: "super_ball", label: "Super Ball", chance: 0.10 },
            { itemCode: "ultra_ball", label: "Ultra Ball", chance: 0.035 }
        ]
    },
    legend: {
        label: "Legend",
        description: "High-end expedition with tougher scaling and better drop quality.",
        difficulty: "High",
        tickSegundos: 65,
        baseExp: 42,
        baseCoins: 84,
        enemyPower: 1.55,
        accent: "legend",
        drops: [
            { itemCode: "potion", label: "Potion", chance: 0.22 },
            { itemCode: "super_ball", label: "Super Ball", chance: 0.16 },
            { itemCode: "ultra_ball", label: "Ultra Ball", chance: 0.08 }
        ]
    },
    masters: {
        label: "Masters",
        description: "Premium expedition tier with stronger rewards and rare Master Ball access.",
        difficulty: "Premium",
        tickSegundos: 65,
        baseExp: 84,
        baseCoins: 108,
        enemyPower: 1.55,
        accent: "masters",
        drops: [
            { itemCode: "potion", label: "Potion", chance: 0.24 },
            { itemCode: "super_ball", label: "Super Ball", chance: 0.18 },
            { itemCode: "ultra_ball", label: "Ultra Ball", chance: 0.12 },
            { itemCode: "master_ball", label: "Master Ball", chance: 0.0045 }
        ]
    }
};

const IDLE_ALLOWED_DURATIONS = [3600, 7200, 14400, 28800];

const idleState = {
    team: [],
    idleData: null,
    benefits: [],
    mastersBenefit: null,
    mastersActive: false,
    serverOffsetMs: 0,
    startedAtMs: 0,
    endsAtMs: 0,
    lastSyncMs: 0,
    remainingBaseSeconds: 0,
    totalSessionSeconds: 0,
    syncInProgress: false,
    countdownFinished: false,
    clockInterval: null,
    selectedTier: "ruta",
    selectedDuration: 3600,
    lastResult: null
};

document.addEventListener("DOMContentLoaded", () => {
    inicializarIdlePage();
});

async function inicializarIdlePage() {
    configurarMenuIdle();
    configurarIdiomaIdle();
    configurarEventosIdle();
    cargarResultadoAnteriorIdle();
    cargarEquipoLocalIdle();
    renderTierCardsIdle();
    renderSelectedPlanIdle();
    renderEstimateIdle();
    renderTeamIdle();
    renderLastResultIdle();
    renderMastersPanelIdle();
    renderStatusIdle();
    applyDocumentMetaIdle();

    try {
        await cargarEquipoServidorIdle();
        await cargarBeneficiosActivosIdle();
        await cargarEstadoIdle(true);
    } catch (error) {
        console.warn("No se pudo inicializar Idle completamente:", error);
    }

    renderTierCardsIdle();
    renderSelectedPlanIdle();
    renderEstimateIdle();
    renderTeamIdle();
    renderLastResultIdle();
    renderMastersPanelIdle();
    renderStatusIdle();

    iniciarRelojIdle();

    document.addEventListener("languageChanged", () => {
        if (typeof applyTranslations === "function") {
            applyTranslations();
        }
        sincronizarIdiomaVisualIdle();
        applyDocumentMetaIdle();
        renderTierCardsIdle();
        renderSelectedPlanIdle();
        renderEstimateIdle();
        renderTeamIdle();
        renderLastResultIdle();
        renderMastersPanelIdle();
        renderStatusIdle();
    });

    document.addEventListener("usuarioSesionActualizada", async () => {
        cargarEquipoLocalIdle();
        await cargarEquipoServidorIdle();
        await cargarBeneficiosActivosIdle();
        await cargarEstadoIdle(true);
        renderTierCardsIdle();
        renderSelectedPlanIdle();
        renderEstimateIdle();
        renderTeamIdle();
        renderLastResultIdle();
        renderMastersPanelIdle();
        renderStatusIdle();
    });
}

function configurarMenuIdle() {
    const menuToggle = document.getElementById("menuToggle");
    const menuMobile = document.getElementById("menuMobile");

    if (menuToggle && menuMobile) {
        menuToggle.addEventListener("click", () => {
            menuMobile.classList.toggle("menu-open");
        });
    }
}

function configurarIdiomaIdle() {
    const desktopSelect = document.getElementById("languageSelect");
    const mobileSelect = document.getElementById("languageSelectMobile");

    const onChange = (event) => {
        const lang = String(event?.target?.value || "en");
        if (typeof setCurrentLang === "function") {
            setCurrentLang(lang);
        }
        sincronizarIdiomaVisualIdle(lang);
        applyDocumentMetaIdle();
    };

    if (desktopSelect) {
        desktopSelect.addEventListener("change", onChange);
    }

    if (mobileSelect) {
        mobileSelect.addEventListener("change", onChange);
    }

    sincronizarIdiomaVisualIdle();

    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
}

function sincronizarIdiomaVisualIdle(nextLang = null) {
    const currentLang = nextLang || (typeof getCurrentLang === "function" ? getCurrentLang() : "en");
    const desktopSelect = document.getElementById("languageSelect");
    const mobileSelect = document.getElementById("languageSelectMobile");

    if (desktopSelect) desktopSelect.value = currentLang;
    if (mobileSelect) mobileSelect.value = currentLang;
}

function applyDocumentMetaIdle() {
    document.title = tIdle("idle_page_title", "Mastersmon - Idle Expedition");
}

function configurarEventosIdle() {
    const tierSelect = document.getElementById("idleTierSelect");
    const durationSelect = document.getElementById("idleDurationSelect");
    const btnStart = document.getElementById("btnStartIdlePage");
    const btnClaim = document.getElementById("btnClaimIdlePage");
    const btnCancel = document.getElementById("btnCancelIdlePage");
    const btnRefresh = document.getElementById("btnRefreshIdlePage");

    if (tierSelect) {
        tierSelect.addEventListener("change", () => {
            idleState.selectedTier = normalizarTierIdle(tierSelect.value);
            renderTierCardsIdle();
            renderSelectedPlanIdle();
            renderEstimateIdle();
            renderMastersPanelIdle();
            renderStatusIdle();
        });
    }

    if (durationSelect) {
        durationSelect.addEventListener("change", () => {
            idleState.selectedDuration = normalizarDuracionIdle(durationSelect.value);
            renderSelectedPlanIdle();
            renderEstimateIdle();
            renderStatusIdle();
        });
    }

    if (btnStart) btnStart.addEventListener("click", iniciarIdlePage);
    if (btnClaim) btnClaim.addEventListener("click", reclamarIdlePage);
    if (btnCancel) btnCancel.addEventListener("click", cancelarIdlePage);
    if (btnRefresh) btnRefresh.addEventListener("click", async () => {
        await cargarBeneficiosActivosIdle();
        await cargarEstadoIdle(false);
        renderMastersPanelIdle();
        renderStatusIdle();
    });
}

function tIdle(key, fallback, params = {}) {
    try {
        if (typeof t === "function") {
            const translated = t(key, params);
            if (translated && translated !== key) return translated;
        }
    } catch (error) {
        // no-op
    }
    return fallback;
}

function getLocaleIdle() {
    try {
        return typeof getCurrentLang === "function" && getCurrentLang() === "es" ? "es-PE" : "en-US";
    } catch (error) {
        return "en-US";
    }
}

function getIdleTierMeta(tierCode = "ruta") {
    const tier = normalizarTierIdle(tierCode);
    const cfg = IDLE_TIER_CONFIG[tier] || IDLE_TIER_CONFIG.ruta;

    const translated = {
        ruta: {
            label: tIdle("idle_tier_route_label", cfg.label),
            description: tIdle("idle_tier_route_desc", cfg.description),
            difficulty: tIdle("idle_tier_route_difficulty", cfg.difficulty)
        },
        elite: {
            label: tIdle("idle_tier_elite_label", cfg.label),
            description: tIdle("idle_tier_elite_desc", cfg.description),
            difficulty: tIdle("idle_tier_elite_difficulty", cfg.difficulty)
        },
        legend: {
            label: tIdle("idle_tier_legend_label", cfg.label),
            description: tIdle("idle_tier_legend_desc", cfg.description),
            difficulty: tIdle("idle_tier_legend_difficulty", cfg.difficulty)
        },
        masters: {
            label: tIdle("idle_tier_masters_label", cfg.label),
            description: tIdle("idle_tier_masters_desc", cfg.description),
            difficulty: tIdle("idle_tier_masters_difficulty", cfg.difficulty)
        }
    };

    return { ...cfg, ...(translated[tier] || {}) };
}

function getIdleDropLabel(itemCode = "", fallback = "Item") {
    const map = {
        potion: tIdle("item_potion", "Potion"),
        poke_ball: tIdle("item_poke_ball", "Poké Ball"),
        super_ball: tIdle("item_super_ball", "Super Ball"),
        ultra_ball: tIdle("item_ultra_ball", "Ultra Ball"),
        master_ball: tIdle("item_master_ball", "Master Ball")
    };
    return map[itemCode] || fallback || itemCode || tIdle("idle_item_generic", "Item");
}


function getPrimaryTypeKeyIdle(rawType = "") {
    const first = String(rawType || "")
        .split(/[\/,|]/)[0]
        .trim()
        .toLowerCase();

    const map = {
        normal: "normal",
        fuego: "fire", fire: "fire",
        agua: "water", water: "water",
        planta: "grass", grass: "grass",
        electrico: "electric", eléctrico: "electric", electric: "electric",
        hielo: "ice", ice: "ice",
        lucha: "fighting", fighting: "fighting",
        veneno: "poison", poison: "poison",
        tierra: "ground", ground: "ground",
        volador: "flying", flying: "flying",
        psiquico: "psychic", psíquico: "psychic", psychic: "psychic",
        bicho: "bug", bug: "bug",
        roca: "rock", rock: "rock",
        fantasma: "ghost", ghost: "ghost",
        dragon: "dragon", dragón: "dragon", dragon: "dragon",
        acero: "steel", steel: "steel",
        hada: "fairy", fairy: "fairy"
    };

    return map[first] || "default";
}

function getPokemonSpriteIdle(pokemon = {}) {
    const direct = pokemon?.imagen || pokemon?.imagen_url || pokemon?.image || pokemon?.sprite || pokemon?.official_artwork || "";
    const lowered = String(direct || "").toLowerCase();
    const looksLikeItemBall = lowered.includes('/items/poke-ball') || lowered.endsWith('poke-ball.png');

    if (direct && !looksLikeItemBall) {
        return String(direct);
    }

    const pokemonId = Number(
        pokemon?.pokemon_id ||
        pokemon?.id_pokemon ||
        pokemon?.pokedex_id ||
        pokemon?.species_id ||
        0
    );

    if (pokemonId > 0) {
        const shiny = Boolean(pokemon?.es_shiny);
        if (shiny) {
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`;
        }
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
    }

    return direct || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
}

function formatIdleType(rawType) {
    if (!rawType) return tIdle("idle_type_unknown", "Unknown type");
    try {
        if (typeof traducirTipoPokemon === "function") {
            return traducirTipoPokemon(String(rawType));
        }
    } catch (error) {
        // no-op
    }
    return String(rawType);
}

function escapeHtmlIdle(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatNumberIdle(value = 0) {
    return new Intl.NumberFormat(getLocaleIdle()).format(Number(value || 0));
}

function formatSecondsIdle(totalSeconds = 0) {
    const safe = Math.max(0, Number(totalSeconds || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = Math.floor(safe % 60);

    if (hours > 0) {
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDurationLabelIdle(seconds = 3600) {
    const hours = Math.round(Number(seconds || 0) / 3600);
    if (hours <= 1) return tIdle("battle_idle_duration_1h", "1 hour");
    if (hours === 2) return tIdle("battle_idle_duration_2h", "2 hours");
    if (hours === 4) return tIdle("battle_idle_duration_4h", "4 hours");
    if (hours === 8) return tIdle("battle_idle_duration_8h", "8 hours");
    return `${hours}h`;
}

function formatDateTimeIdle(isoValue = "") {
    if (!isoValue) return "—";
    try {
        return new Intl.DateTimeFormat(getLocaleIdle(), {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(isoValue));
    } catch (error) {
        return String(isoValue);
    }
}

function normalizarTierIdle(value = "ruta") {
    const normalized = String(value || "ruta").toLowerCase();
    return Object.prototype.hasOwnProperty.call(IDLE_TIER_CONFIG, normalized) ? normalized : "ruta";
}

function normalizarDuracionIdle(value = 3600) {
    const numeric = Number(value || 3600);
    return IDLE_ALLOWED_DURATIONS.includes(numeric) ? numeric : 3600;
}

function readJsonStorageIdle(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeJsonStorageIdle(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn("No se pudo guardar en localStorage:", error);
    }
}

function cargarResultadoAnteriorIdle() {
    idleState.lastResult = readJsonStorageIdle(IDLE_LAST_RESULT_STORAGE_KEY, null);
}

function persistirResultadoAnteriorIdle(result = null) {
    idleState.lastResult = result || null;
    if (result) {
        writeJsonStorageIdle(IDLE_LAST_RESULT_STORAGE_KEY, result);
        return;
    }
    try {
        localStorage.removeItem(IDLE_LAST_RESULT_STORAGE_KEY);
    } catch (error) {
        // no-op
    }
}

function cargarEquipoLocalIdle() {
    const team = readJsonStorageIdle(IDLE_TEAM_STORAGE_KEY, []);
    idleState.team = Array.isArray(team) ? team.slice(0, 6) : [];
}

async function cargarEquipoServidorIdle() {
    if (!getAccessToken() || typeof fetchAuth !== "function" || typeof API_BASE === "undefined") {
        return false;
    }

    try {
        const data = await fetchAuth(`${API_BASE}/usuario/me/equipo`);
        const equipoServidor = Array.isArray(data?.equipo) ? data.equipo.slice(0, 6) : [];
        if (!equipoServidor.length) return false;
        idleState.team = equipoServidor;
        writeJsonStorageIdle(IDLE_TEAM_STORAGE_KEY, equipoServidor);
        return true;
    } catch (error) {
        console.warn("No se pudo cargar el equipo servidor para Idle:", error);
        return false;
    }
}

async function cargarBeneficiosActivosIdle() {
    if (!getAccessToken()) {
        idleState.benefits = [];
        idleState.mastersBenefit = null;
        idleState.mastersActive = false;
        return [];
    }

    try {
        let data = null;

        if (typeof obtenerBeneficiosActivos === "function") {
            data = await obtenerBeneficiosActivos();
        } else if (typeof fetchAuth === "function" && typeof API_BASE !== "undefined") {
            data = await fetchAuth(`${API_BASE}/payments/beneficios/activos`);
        }

        const benefits = Array.isArray(data?.beneficios) ? data.beneficios : [];
        idleState.benefits = benefits;
        idleState.mastersBenefit = benefits.find(benefit => String(benefit?.beneficio_codigo || "") === "idle_masters") || null;
        idleState.mastersActive = Boolean(idleState.mastersBenefit);
        return benefits;
    } catch (error) {
        console.warn("No se pudieron cargar los beneficios premium activos:", error);
        idleState.benefits = [];
        idleState.mastersBenefit = null;
        idleState.mastersActive = false;
        return [];
    }
}

function obtenerIdsEquipoIdle() {
    return idleState.team
        .map(pokemon => Number(pokemon?.usuario_pokemon_id || pokemon?.id || 0))
        .filter(id => Number.isInteger(id) && id > 0)
        .slice(0, 6);
}

function getAverageTeamLevelIdle() {
    if (!idleState.team.length) return 0;
    const total = idleState.team.reduce((sum, pokemon) => sum + Number(pokemon?.nivel || 0), 0);
    return Math.round(total / idleState.team.length);
}

function hasMastersBenefitIdle() {
    return Boolean(idleState.mastersActive);
}

function isMastersSelectedLockedIdle() {
    return normalizarTierIdle(idleState.selectedTier) === "masters" && !hasMastersBenefitIdle();
}

function computeIdleEstimate(team = [], tierCode = "ruta", durationSeconds = 3600) {
    const tier = IDLE_TIER_CONFIG[normalizarTierIdle(tierCode)];
    const duration = normalizarDuracionIdle(durationSeconds);
    const safeTeam = Array.isArray(team) ? team : [];

    if (!safeTeam.length) {
        return {
            ticks: Math.max(1, Math.floor(duration / tier.tickSegundos)),
            successRate: 0,
            wins: 0,
            defeats: 0,
            exp: 0,
            coins: 0,
            drops: tier.drops.map(drop => ({ ...drop, expected: 0 }))
        };
    }

    const ticks = Math.max(1, Math.floor(duration / tier.tickSegundos));
    const avgNivel = safeTeam.reduce((sum, p) => sum + Number(p?.nivel || 1), 0) / safeTeam.length;
    const avgHp = safeTeam.reduce((sum, p) => sum + Number(p?.hp_max || p?.hp_actual || 1), 0) / safeTeam.length;
    const avgAtk = safeTeam.reduce((sum, p) => sum + Number(p?.ataque || 1), 0) / safeTeam.length;
    const avgDef = safeTeam.reduce((sum, p) => sum + Number(p?.defensa || 1), 0) / safeTeam.length;
    const avgSpAtk = safeTeam.reduce((sum, p) => sum + Number(p?.ataque_especial || p?.ataque || 1), 0) / safeTeam.length;
    const avgSpDef = safeTeam.reduce((sum, p) => sum + Number(p?.defensa_especial || p?.defensa || 1), 0) / safeTeam.length;

    const powerTeam = (avgNivel * 1.8) + (avgHp * 0.10) + (avgAtk * 0.15) + (avgDef * 0.12) + (avgSpAtk * 0.14) + (avgSpDef * 0.11);
    const powerEnemy = Math.max(1.0, powerTeam * Number(tier.enemyPower || 1));
    const ratio = powerEnemy > 0 ? (powerTeam / powerEnemy) : 1;
    const successRate = Math.max(0.55, Math.min(0.95, 0.70 + ((ratio - 1.0) * 0.25)));
    const wins = Math.round(ticks * successRate);
    const defeats = Math.max(0, ticks - wins);
    const exp = wins * Number(tier.baseExp || 0);
    const coins = wins * Number(tier.baseCoins || 0);
    const drops = tier.drops.map(drop => ({
        ...drop,
        expected: Number((ticks * Number(drop.chance || 0)).toFixed(2))
    }));

    return { ticks, successRate, wins, defeats, exp, coins, drops };
}

function renderTierCardsIdle() {
    const container = document.getElementById("idleTierCards");
    if (!container) return;

    const activeSession = idleState.idleData?.sesion && idleState.idleData?.activa
        ? idleState.idleData.sesion
        : null;
    const runningTier = activeSession ? normalizarTierIdle(activeSession.tier_codigo || "ruta") : null;
    const runningState = String(activeSession?.estado || "").toLowerCase();

    container.innerHTML = Object.keys(IDLE_TIER_CONFIG).map((tierCode) => {
        const cfg = getIdleTierMeta(tierCode);
        const isSelected = tierCode === idleState.selectedTier;
        const isRunning = Boolean(runningTier) && tierCode === runningTier;
        const active = (isSelected || isRunning) ? " active" : "";
        const runningClass = isRunning ? " is-running" : "";
        const locked = tierCode === "masters" && !hasMastersBenefitIdle();
        const lockedClass = locked ? " is-locked" : "";
        const estimate = computeIdleEstimate(idleState.team, tierCode, idleState.selectedDuration);

        const badges = [];
        if (tierCode === "masters") {
            badges.push(
                hasMastersBenefitIdle()
                    ? `<span class="idle-mini-chip idle-mini-chip-active">${escapeHtmlIdle(tIdle("idle_masters_active_chip", "Benefit active"))}</span>`
                    : `<span class="idle-mini-chip idle-mini-chip-locked">${escapeHtmlIdle(tIdle("idle_masters_locked_chip", "Premium"))}</span>`
            );
        }
        if (isRunning) {
            badges.push(`<span class="idle-mini-chip idle-mini-chip-running">${escapeHtmlIdle(runningState === "reclamable" ? tIdle("battle_idle_status_ready", "Ready") : tIdle("battle_idle_status_active", "Active"))}</span>`);
        } else if (isSelected) {
            badges.push(`<span class="idle-mini-chip idle-mini-chip-selected">${escapeHtmlIdle(tIdle("battle_mode_selected", "Selected"))}</span>`);
        }

        return `
            <button type="button" class="idle-tier-card idle-tier-${escapeHtmlIdle(tierCode)}${active}${runningClass}${lockedClass}" data-tier="${escapeHtmlIdle(tierCode)}" data-locked="${locked ? "1" : "0"}">
                <div class="idle-tier-card-top">
                    <div>
                        <h4>${escapeHtmlIdle(cfg.label)}</h4>
                        <p>${escapeHtmlIdle(cfg.description)}</p>
                    </div>
                    <div class="idle-tier-card-badges">${badges.join("")}</div>
                </div>
                <div class="idle-tier-card-metrics">
                    <strong>${formatNumberIdle(estimate.exp)} EXP</strong>
                    <small>${formatNumberIdle(estimate.coins)} ${escapeHtmlIdle(tIdle("idle_currency_label", "Pokédollars"))}</small>
                </div>
                <div class="idle-tier-card-footer">
                    <span>${Math.round(estimate.successRate * 100)}% ${escapeHtmlIdle(tIdle("idle_success_short", "success"))}</span>
                    <span>${escapeHtmlIdle(cfg.difficulty)}</span>
                </div>
            </button>
        `;
    }).join("");

    container.querySelectorAll(".idle-tier-card").forEach(card => {
        card.addEventListener("click", () => {
            const session = idleState.idleData?.sesion && idleState.idleData?.activa
                ? idleState.idleData.sesion
                : null;

            if (session) {
                const sessionTier = normalizarTierIdle(session.tier_codigo || "ruta");
                idleState.selectedTier = sessionTier;
                const tierSelectLocked = document.getElementById("idleTierSelect");
                if (tierSelectLocked) tierSelectLocked.value = sessionTier;
                setFeedbackIdle(
                    tIdle(
                        "idle_active_tier_locked_feedback",
                        "An expedition is already in progress. The active tier stays highlighted until you claim or cancel the run."
                    ),
                    "info"
                );
                renderTierCardsIdle();
                renderSelectedPlanIdle();
                renderEstimateIdle();
                renderMastersPanelIdle();
                renderStatusIdle();
                return;
            }

            idleState.selectedTier = normalizarTierIdle(card.dataset.tier || "ruta");
            const tierSelect = document.getElementById("idleTierSelect");
            if (tierSelect) tierSelect.value = idleState.selectedTier;

            if (card.dataset.locked === "1") {
                setFeedbackIdle(tIdle("idle_masters_locked_feedback", "Masters is a premium tier. Activate the Idle Masters benefit in Shop to launch it."), "info");
            } else if (document.getElementById("idleFeedback")?.classList.contains("idle-feedback-info")) {
                setFeedbackIdle("");
            }

            renderTierCardsIdle();
            renderSelectedPlanIdle();
            renderEstimateIdle();
            renderMastersPanelIdle();
            renderStatusIdle();
        });
    });
}

function renderSelectedPlanIdle() {
    const panel = document.getElementById("idleSelectedPlan");
    const tierSelect = document.getElementById("idleTierSelect");
    const durationSelect = document.getElementById("idleDurationSelect");
    if (!panel) return;

    const tierCode = normalizarTierIdle(tierSelect?.value || idleState.selectedTier);
    const duration = normalizarDuracionIdle(durationSelect?.value || idleState.selectedDuration);
    idleState.selectedTier = tierCode;
    idleState.selectedDuration = duration;

    const cfg = getIdleTierMeta(tierCode);
    const estimate = computeIdleEstimate(idleState.team, tierCode, duration);
    const lockedMasters = tierCode === "masters" && !hasMastersBenefitIdle();

    panel.innerHTML = `
        <div class="idle-plan-header">
            <div>
                <h4>${escapeHtmlIdle(cfg.label)} ${escapeHtmlIdle(tIdle("idle_plan_suffix", "plan"))}</h4>
                <p>${escapeHtmlIdle(cfg.description)}</p>
            </div>
            ${tierCode === "masters"
                ? `<span class="idle-mini-chip ${lockedMasters ? "idle-mini-chip-locked" : "idle-mini-chip-active"}">${escapeHtmlIdle(lockedMasters ? tIdle("idle_masters_locked_chip", "Premium") : tIdle("idle_masters_active_chip", "Benefit active"))}</span>`
                : ""
            }
        </div>

        <div class="idle-selected-plan-grid">
            <article>
                <span>${escapeHtmlIdle(tIdle("idle_duration_label", "Duration"))}</span>
                <strong>${escapeHtmlIdle(formatDurationLabelIdle(duration))}</strong>
            </article>
            <article>
                <span>${escapeHtmlIdle(tIdle("idle_tick_label", "Tick"))}</span>
                <strong>${escapeHtmlIdle(formatSecondsIdle(cfg.tickSegundos))}</strong>
            </article>
            <article>
                <span>${escapeHtmlIdle(tIdle("idle_difficulty_label", "Difficulty"))}</span>
                <strong>${escapeHtmlIdle(cfg.difficulty)}</strong>
            </article>
            <article>
                <span>${escapeHtmlIdle(tIdle("idle_estimated_wins_label", "Estimated wins"))}</span>
                <strong>${formatNumberIdle(estimate.wins)}</strong>
            </article>
        </div>

        <div class="idle-plan-note ${lockedMasters ? "is-warning" : ""}">
            ${lockedMasters
                ? `${escapeHtmlIdle(tIdle("idle_masters_requires_benefit", "The Masters tier requires the Idle Masters premium benefit before launch."))} <a href="${escapeHtmlIdle(IDLE_PREMIUM_SHOP_URL)}">${escapeHtmlIdle(tIdle("idle_masters_go_shop", "Open Shop"))}</a>`
                : escapeHtmlIdle(tIdle("idle_plan_note_standard", "This page uses the same team already saved in Battle IA."))
            }
        </div>
    `;
}

function renderEstimateIdle() {
    const estimate = computeIdleEstimate(idleState.team, idleState.selectedTier, idleState.selectedDuration);

    const map = {
        idleEstimateTicks: estimate.ticks,
        idleEstimateWins: estimate.wins,
        idleEstimateExp: estimate.exp,
        idleEstimateCoins: estimate.coins,
        idleHeroEstimateExp: estimate.exp
    };

    Object.entries(map).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = formatNumberIdle(value);
    });

    const successRate = document.getElementById("idleEstimateSuccessRate");
    if (successRate) {
        successRate.textContent = `${tIdle("idle_success_rate_label", "Success rate")} ${Math.round(estimate.successRate * 100)}%`;
    }

    const drops = document.getElementById("idleEstimateDrops");
    if (drops) {
        drops.innerHTML = estimate.drops.map(drop => `
            <article class="idle-drop-item">
                <div>
                    <strong>${escapeHtmlIdle(getIdleDropLabel(drop.itemCode, drop.label))}</strong>
                    <span>${escapeHtmlIdle(drop.itemCode)}</span>
                </div>
                <span>${escapeHtmlIdle(tIdle("idle_avg_drop_prefix", "Avg."))} ${escapeHtmlIdle(drop.expected)} ${escapeHtmlIdle(tIdle("idle_per_run_suffix", "per run"))}</span>
            </article>
        `).join("");
    }

    const heroCount = document.getElementById("idleHeroTeamCount");
    const heroLevel = document.getElementById("idleHeroTeamLevel");
    if (heroCount) heroCount.textContent = `${idleState.team.length} / 6`;
    if (heroLevel) heroLevel.textContent = String(getAverageTeamLevelIdle());
}

function renderTeamIdle() {
    const summary = document.getElementById("idleTeamSummary");
    const grid = document.getElementById("idleTeamGrid");
    if (!summary || !grid) return;

    const completeTeam = idleState.team.length === 6;
    const avgLevel = getAverageTeamLevelIdle();
    const highestLevel = idleState.team.length
        ? Math.max(...idleState.team.map(p => Number(p?.nivel || 0)))
        : 0;

    summary.innerHTML = `
        <article class="idle-team-summary-card">
            <span>${escapeHtmlIdle(tIdle("idle_saved_members_label", "Saved members"))}</span>
            <strong>${idleState.team.length} / 6</strong>
        </article>
        <article class="idle-team-summary-card">
            <span>${escapeHtmlIdle(tIdle("idle_average_level_label", "Average level"))}</span>
            <strong>${avgLevel}</strong>
        </article>
        <article class="idle-team-summary-card">
            <span>${escapeHtmlIdle(tIdle("idle_status_label", "Status"))}</span>
            <strong>${completeTeam ? escapeHtmlIdle(tIdle("idle_status_ready", "Ready")) : escapeHtmlIdle(tIdle("idle_status_incomplete", "Incomplete"))}</strong>
        </article>
    `;

    if (!idleState.team.length) {
        grid.innerHTML = `
            <div class="idle-empty-card">
                ${tIdle("idle_no_team_message", "No Battle team found yet. Go to Battle IA, save a 6-Pokémon team, and then come back to launch Idle Expedition.")}
            </div>
        `;
        return;
    }

    grid.innerHTML = idleState.team.map(pokemon => {
        const sprite = getPokemonSpriteIdle(pokemon);
        const primaryType = getPrimaryTypeKeyIdle(pokemon?.tipo || "");
        const shinyTag = pokemon?.es_shiny ? `<span class="idle-team-tag idle-team-tag-shiny">${escapeHtmlIdle(tIdle("pokemon_shiny", "Shiny"))}</span>` : "";
        return `
            <article class="idle-team-card idle-team-type-${escapeHtmlIdle(primaryType)}">
                <div class="idle-team-avatar idle-team-avatar-${escapeHtmlIdle(primaryType)}">
                    <img src="${escapeHtmlIdle(sprite)}" alt="${escapeHtmlIdle(pokemon?.nombre || tIdle("idle_pokemon_fallback", "Pokemon"))}" loading="lazy" decoding="async">
                </div>
                <div class="idle-team-meta">
                    <h4>${escapeHtmlIdle(pokemon?.nombre || tIdle("idle_unknown_name", "Unknown"))}</h4>
                    <p>${escapeHtmlIdle(tIdle("idle_level_prefix", "Lv."))} ${formatNumberIdle(pokemon?.nivel || 0)} · ${escapeHtmlIdle(formatIdleType(pokemon?.tipo || tIdle("idle_type_unknown", "Unknown type")))}</p>
                    <div class="idle-team-tags">
                        <span class="idle-team-tag">HP ${formatNumberIdle(pokemon?.hp_max || pokemon?.hp_actual || 0)}</span>
                        <span class="idle-team-tag">ATK ${formatNumberIdle(pokemon?.ataque || 0)}</span>
                        <span class="idle-team-tag">DEF ${formatNumberIdle(pokemon?.defensa || 0)}</span>
                        <span class="idle-team-tag">${escapeHtmlIdle(tIdle("idle_peak_level_label", "Peak Lv"))} ${highestLevel}</span>
                        ${shinyTag}
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function renderLastResultIdle() {
    const panel = document.getElementById("idleLastResult");
    if (!panel) return;

    const result = idleState.lastResult;
    if (!result) {
        panel.removeAttribute("data-tier");
        panel.innerHTML = `
            <div class="idle-empty-card">
                ${tIdle("idle_no_previous_claim", "No previous claim saved yet. Once you claim an expedition, the latest result will stay visible here.")}
            </div>
        `;
        return;
    }

    const tierCode = normalizarTierIdle(result?.tier_codigo || "ruta");
    panel.setAttribute("data-tier", tierCode);

    const items = Array.isArray(result?.items_ganados) ? result.items_ganados : [];
    const itemsHtml = items.length
        ? items.map(item => {
            const itemCode = String(item.item_code || item.itemCode || "item");
            return `<span class="idle-drop-pill idle-drop-pill-${escapeHtmlIdle(itemCode)}">${escapeHtmlIdle(getIdleDropLabel(itemCode, itemCode))} × ${formatNumberIdle(item.cantidad || 0)}</span>`;
        }).join("")
        : `<span class="idle-drop-pill idle-drop-pill-empty">${escapeHtmlIdle(tIdle("idle_no_item_drops", "No item drops"))}</span>`;

    panel.innerHTML = `
        <div class="idle-last-result-shell idle-last-result-tier-${escapeHtmlIdle(tierCode)}">
            <div class="idle-last-result-top">
                <div class="idle-last-result-copy">
                    <span class="idle-mini-chip idle-mini-chip-selected">${escapeHtmlIdle(tIdle("idle_latest_claim_label", "Latest claim"))}</span>
                    <h4>${escapeHtmlIdle(traducirTierIdle(tierCode))} ${escapeHtmlIdle(tIdle("idle_result_title_suffix", "Expedition"))}</h4>
                    <p>${tIdle("idle_latest_claim_copy", "Latest claim saved locally so you can keep track of your most recent run without touching backend again.")}</p>
                </div>
                <div class="idle-last-result-badge">
                    <span>${escapeHtmlIdle(tIdle("idle_drop_pressure_label", "Reward mix"))}</span>
                    <strong>${escapeHtmlIdle(traducirTierIdle(tierCode))}</strong>
                </div>
            </div>

            <div class="idle-result-grid">
                <article>
                    <span>EXP</span>
                    <strong>${formatNumberIdle(result?.exp_ganada || 0)}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_currency_label", "Pokédollars"))}</span>
                    <strong>${formatNumberIdle(result?.pokedolares_ganados || 0)}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_estimated_wins_label", "Estimated wins"))}</span>
                    <strong>${formatNumberIdle(result?.victorias_estimadas || 0)}</strong>
                </article>
                <article>
                    <span>${escapeHtmlIdle(tIdle("idle_ticks_label", "Ticks"))}</span>
                    <strong>${formatNumberIdle(result?.ticks || 0)}</strong>
                </article>
            </div>

            <div class="idle-last-result-drops">
                <div class="idle-last-result-drops-head">
                    <span>${escapeHtmlIdle(tIdle("idle_rewards_drops_title", "Drops secured"))}</span>
                    <strong>${formatNumberIdle(items.reduce((sum, item) => sum + Number(item?.cantidad || 0), 0))}</strong>
                </div>
                <div class="idle-team-tags idle-team-tags-result idle-drop-pill-list">
                    ${itemsHtml}
                </div>
            </div>
        </div>
    `;
}

function renderMastersPanelIdle() {
    const panel = document.getElementById("idleMastersPanel");
    if (!panel) return;

    const featureItems = [
        tIdle("premium_idle_feature_1", "+100% EXP vs Legend"),
        tIdle("premium_idle_feature_2", "+28% GOLD vs Legend"),
        tIdle("premium_idle_feature_3", "Ultra Ball 12% per tick"),
        tIdle("premium_idle_feature_4", "Master Ball 0.45% per tick")
    ].map(feature => `<li>${escapeHtmlIdle(feature)}</li>`).join("");

    const locked = !hasMastersBenefitIdle();
    const selectedMasters = normalizarTierIdle(idleState.selectedTier) === "masters";
    const chipClass = locked ? "idle-mini-chip-locked" : "idle-mini-chip-active";
    const chipText = locked ? tIdle("idle_masters_locked_chip", "Premium") : tIdle("idle_masters_active_chip", "Benefit active");
    const expiry = idleState.mastersBenefit?.expira_en
        ? tIdle("idle_masters_active_until", "Active until {date}", { date: formatDateTimeIdle(idleState.mastersBenefit.expira_en) })
        : "";

    panel.innerHTML = `
        <div class="idle-masters-card ${locked ? "is-locked" : "is-active"}">
            <div class="idle-masters-top">
                <span class="idle-mini-chip ${chipClass}">${escapeHtmlIdle(chipText)}</span>
                ${selectedMasters ? `<span class="idle-mini-chip idle-mini-chip-selected">${escapeHtmlIdle(tIdle("battle_mode_selected", "Selected"))}</span>` : ""}
            </div>

            <h4>${escapeHtmlIdle(locked ? tIdle("idle_masters_locked_title", "Masters is locked") : tIdle("idle_masters_active_title", "Masters unlocked"))}</h4>
            <p>${escapeHtmlIdle(locked
                ? tIdle("idle_masters_locked_text", "Activate the Idle Masters subscription to unlock the premium tier and its rare drop table.")
                : tIdle("idle_masters_active_text", "Your account can already launch Masters runs with premium rewards and rare drops.")
            )}</p>

            ${expiry ? `<div class="idle-masters-expiry">${escapeHtmlIdle(expiry)}</div>` : ""}

            <ul class="idle-masters-list">
                ${featureItems}
            </ul>

            <div class="idle-masters-actions">
                <a href="${escapeHtmlIdle(IDLE_PREMIUM_SHOP_URL)}" class="idle-action ${locked ? "idle-action-primary" : "idle-action-ghost"}">${escapeHtmlIdle(locked ? tIdle("idle_masters_go_shop", "Open Shop") : tIdle("idle_masters_manage_shop", "Open Premium Shop"))}</a>
            </div>
        </div>
    `;
}

function setFeedbackIdle(message = "", type = "info") {
    const box = document.getElementById("idleFeedback");
    if (!box) return;

    if (!message) {
        box.className = "idle-feedback oculto";
        box.textContent = "";
        return;
    }

    box.className = `idle-feedback idle-feedback-${type}`;
    box.textContent = message;
}

function renderHeroStatusIdle() {
    const title = document.getElementById("idleHeroStatusTitle");
    const text = document.getElementById("idleHeroStatusText");
    if (!title || !text) return;

    if (!getAccessToken()) {
        title.textContent = tIdle("idle_login_required_title", "Login required");
        text.textContent = tIdle("idle_login_required_text", "Sign in first to sync expedition state, launch runs, and claim backend rewards.");
        return;
    }

    const sesion = idleState.idleData?.sesion || null;
    if (!sesion || !idleState.idleData?.activa) {
        if (isMastersSelectedLockedIdle()) {
            title.textContent = tIdle("idle_masters_locked_title", "Masters is locked");
            text.textContent = tIdle("idle_masters_requires_benefit", "The Masters tier requires the Idle Masters premium benefit before launch.");
            return;
        }

        title.textContent = idleState.team.length === 6
            ? tIdle("idle_ready_to_launch", "Ready to launch")
            : tIdle("idle_team_incomplete_title", "Team incomplete");
        text.textContent = idleState.team.length === 6
            ? tIdle("idle_ready_team_text", "Your saved Battle team is ready for a new Idle Expedition.")
            : tIdle("idle_requires_six_text", "Idle requires exactly 6 Pokémon in the saved Battle team before launching.");
        return;
    }

    if (String(sesion.estado || "").toLowerCase() === "reclamable") {
        title.textContent = tIdle("idle_rewards_ready_title", "Rewards ready");
        text.textContent = tIdle("idle_rewards_ready_text", "The expedition is complete and waiting for you to claim the rewards.");
        return;
    }

    title.textContent = tIdle("idle_active_title", "Expedition active");
    text.textContent = `${tIdle("idle_active_text_prefix", "Your")} ${traducirTierIdle(idleState.idleData?.sesion?.tier_codigo)} ${tIdle("idle_active_text_suffix", "run is currently in progress.")}`;
}

function renderStatusIdle() {
    const tierSelect = document.getElementById("idleTierSelect");
    const durationSelect = document.getElementById("idleDurationSelect");
    const badge = document.getElementById("idleStatusBadge");
    const timerLabel = document.getElementById("idleTimerLabel");
    const timerValue = document.getElementById("idleTimerValue");
    const progressFill = document.getElementById("idleProgressFill");
    const progressText = document.getElementById("idleProgressText");
    const btnStart = document.getElementById("btnStartIdlePage");
    const btnClaim = document.getElementById("btnClaimIdlePage");
    const btnCancel = document.getElementById("btnCancelIdlePage");

    if (!tierSelect || !durationSelect || !badge || !timerLabel || !timerValue || !progressFill || !progressText || !btnStart || !btnClaim || !btnCancel) {
        return;
    }

    renderHeroStatusIdle();

    const tierValue = normalizarTierIdle(tierSelect.value || idleState.selectedTier);
    const durationValue = normalizarDuracionIdle(durationSelect.value || idleState.selectedDuration);
    idleState.selectedTier = tierValue;
    idleState.selectedDuration = durationValue;

    if (!getAccessToken()) {
        badge.textContent = tIdle("idle_login_badge", "Login");
        timerLabel.textContent = tIdle("battle_idle_remaining", "Remaining");
        timerValue.textContent = "—";
        progressFill.style.width = "0%";
        progressText.textContent = tIdle("battle_idle_login_text", "Sign in to use Idle Expedition.");
        btnStart.disabled = true;
        btnClaim.disabled = true;
        btnCancel.disabled = true;
        tierSelect.disabled = false;
        durationSelect.disabled = false;
        return;
    }

    const activeSession = idleState.idleData?.sesion || null;
    if (!activeSession || !idleState.idleData?.activa) {
        const teamReady = obtenerIdsEquipoIdle().length === 6;
        const lockedMasters = isMastersSelectedLockedIdle();

        badge.textContent = lockedMasters
            ? tIdle("idle_masters_locked_chip", "Premium")
            : tIdle("battle_idle_status_idle", "Ready");
        timerLabel.textContent = tIdle("battle_idle_remaining", "Remaining");
        timerValue.textContent = "—";
        progressFill.style.width = "0%";
        progressText.textContent = lockedMasters
            ? tIdle("idle_masters_requires_benefit", "The Masters tier requires the Idle Masters premium benefit before launch.")
            : (teamReady
                ? tIdle("battle_idle_status_idle_text", "Choose a tier and duration, then start the expedition.")
                : tIdle("idle_need_six_saved_text", "Idle Expedition requires exactly 6 saved Pokémon in your Battle team."));
        btnStart.disabled = !teamReady || lockedMasters;
        btnClaim.disabled = true;
        btnCancel.disabled = true;
        tierSelect.disabled = false;
        durationSelect.disabled = false;
        return;
    }

    const sessionState = String(activeSession.estado || "activa").toLowerCase();
    const progress = Math.max(0, Math.min(100, Number(activeSession.progreso_pct || 0)));
    progressFill.style.width = `${progress}%`;
    timerValue.textContent = sessionState === "reclamable"
        ? "100%"
        : formatSecondsIdle(Number(activeSession.segundos_restantes || 0));

    tierSelect.value = normalizarTierIdle(activeSession.tier_codigo || idleState.selectedTier);
    durationSelect.value = String(normalizarDuracionIdle(activeSession.duracion_segundos || idleState.selectedDuration));
    idleState.selectedTier = normalizarTierIdle(activeSession.tier_codigo || idleState.selectedTier);
    idleState.selectedDuration = normalizarDuracionIdle(activeSession.duracion_segundos || idleState.selectedDuration);
    tierSelect.disabled = true;
    durationSelect.disabled = true;

    if (sessionState === "reclamable") {
        badge.textContent = tIdle("battle_idle_status_ready", "Ready");
        timerLabel.textContent = tIdle("battle_idle_progress", "Progress");
        progressText.textContent = tIdle("battle_idle_ready_message", "Your rewards are ready to claim.");
        btnStart.disabled = true;
        btnClaim.disabled = false;
        btnCancel.disabled = true;
        return;
    }

    badge.textContent = tIdle("battle_idle_status_active", "Active");
    timerLabel.textContent = tIdle("battle_idle_remaining", "Remaining");
    progressText.textContent = `${tIdle("idle_running_prefix", "Expedition")} ${traducirTierIdle(activeSession.tier_codigo)} ${tIdle("idle_running_middle", "running")} · ${progress}% ${tIdle("idle_complete_suffix", "complete")}.`;
    btnStart.disabled = true;
    btnClaim.disabled = true;
    btnCancel.disabled = false;
}

function traducirTierIdle(tierCode = "ruta") {
    const tier = normalizarTierIdle(tierCode);
    if (tier === "masters") return tIdle("battle_idle_tier_masters", "Masters");
    if (tier === "legend") return tIdle("battle_idle_tier_legend", "Legend");
    if (tier === "elite") return tIdle("battle_idle_tier_elite", "Elite");
    return tIdle("battle_idle_tier_ruta", "Route");
}

function registrarEstadoIdle(data = null) {
    idleState.idleData = data || null;
    idleState.lastSyncMs = Date.now();
    idleState.countdownFinished = false;

    if (!data?.sesion) {
        idleState.serverOffsetMs = 0;
        idleState.startedAtMs = 0;
        idleState.endsAtMs = 0;
        idleState.remainingBaseSeconds = 0;
        idleState.totalSessionSeconds = 0;
        return;
    }

    const serverNowMs = Date.parse(data?.hora_server || "");
    if (Number.isFinite(serverNowMs)) {
        idleState.serverOffsetMs = serverNowMs - Date.now();
    }

    idleState.startedAtMs = Date.parse(data?.sesion?.iniciado_en || "") || 0;
    idleState.endsAtMs = Date.parse(data?.sesion?.termina_en || "") || 0;
    idleState.remainingBaseSeconds = Math.max(0, Number(data?.sesion?.segundos_restantes || 0));
    idleState.totalSessionSeconds = Math.max(1, Number(data?.sesion?.duracion_segundos || 1));

    const currentTier = normalizarTierIdle(data?.sesion?.tier_codigo || idleState.selectedTier);
    const currentDuration = normalizarDuracionIdle(data?.sesion?.duracion_segundos || idleState.selectedDuration);
    idleState.selectedTier = currentTier;
    idleState.selectedDuration = currentDuration;
}

function obtenerAhoraServidorIdleMs() {
    return Date.now() + Number(idleState.serverOffsetMs || 0);
}

function actualizarRelojVisualIdle() {
    const sesion = idleState.idleData?.sesion;
    if (!sesion || String(sesion.estado || "").toLowerCase() !== "activa") return;

    const timerValue = document.getElementById("idleTimerValue");
    const progressFill = document.getElementById("idleProgressFill");
    const progressText = document.getElementById("idleProgressText");
    if (!timerValue || !progressFill || !progressText) return;

    const elapsedSinceSyncSeconds = Math.max(0, Math.floor((Date.now() - Number(idleState.lastSyncMs || Date.now())) / 1000));
    const totalSeconds = Math.max(1, Number(idleState.totalSessionSeconds || sesion.duracion_segundos || 1));
    const remainingSeconds = Math.max(0, Number(idleState.remainingBaseSeconds || 0) - elapsedSinceSyncSeconds);
    const elapsedSeconds = Math.max(0, Math.min(totalSeconds, totalSeconds - remainingSeconds));
    const progress = Math.max(0, Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100)));

    timerValue.textContent = formatSecondsIdle(remainingSeconds);
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${tIdle("idle_running_prefix", "Expedition")} ${traducirTierIdle(sesion.tier_codigo)} ${tIdle("idle_running_middle", "running")} · ${progress}% ${tIdle("idle_complete_suffix", "complete")}.`;

    if (remainingSeconds <= 0 && !idleState.countdownFinished) {
        idleState.countdownFinished = true;
        if (idleState.idleData?.sesion) {
            idleState.idleData.sesion.estado = "reclamable";
            idleState.idleData.sesion.progreso_pct = 100;
            idleState.idleData.sesion.segundos_restantes = 0;
        }
        renderStatusIdle();
        cargarEstadoIdle(true);
    }
}

function iniciarRelojIdle() {
    if (idleState.clockInterval) {
        clearInterval(idleState.clockInterval);
    }

    idleState.clockInterval = setInterval(() => {
        actualizarRelojVisualIdle();
        refrescarEstadoIdleSilencioso(false);
    }, 1000);
}

async function refrescarEstadoIdleSilencioso(forzar = false) {
    if (!getAccessToken()) return null;
    if (idleState.syncInProgress) return null;

    const nowMs = Date.now();
    if (!forzar && (nowMs - idleState.lastSyncMs) < 45000) {
        return null;
    }

    idleState.syncInProgress = true;
    if (!forzar) idleState.lastSyncMs = nowMs;

    try {
        return await cargarEstadoIdle(true);
    } catch (error) {
        console.warn("No se pudo refrescar Idle en segundo plano:", error);
        return null;
    } finally {
        idleState.syncInProgress = false;
    }
}

async function cargarEstadoIdle(silent = true) {
    if (!getAccessToken()) {
        registrarEstadoIdle(null);
        renderSelectedPlanIdle();
        renderEstimateIdle();
        renderMastersPanelIdle();
        renderStatusIdle();
        return null;
    }

    try {
        const data = await fetchAuth(`${API_BASE}/battle/idle/estado`);
        registrarEstadoIdle(data || null);
        renderSelectedPlanIdle();
        renderEstimateIdle();
        renderTierCardsIdle();
        renderMastersPanelIdle();
        renderStatusIdle();
        return data;
    } catch (error) {
        if (!silent) {
            setFeedbackIdle(error?.message || tIdle("battle_idle_load_error", "The Idle Expedition state could not be loaded."), "error");
        }
        registrarEstadoIdle({ ok: false, activa: false, sesion: null, error: error?.message || "error" });
        renderSelectedPlanIdle();
        renderEstimateIdle();
        renderTierCardsIdle();
        renderMastersPanelIdle();
        renderStatusIdle();
        return null;
    }
}

async function iniciarIdlePage() {
    setFeedbackIdle("");

    if (!getAccessToken()) {
        setFeedbackIdle(tIdle("battle_mode_requires_login", "You must sign in first."), "warning");
        renderStatusIdle();
        return;
    }

    if (obtenerIdsEquipoIdle().length !== 6) {
        setFeedbackIdle(tIdle("battle_need_six", "You need 6 Pokémon in your team."), "warning");
        renderStatusIdle();
        return;
    }

    if (idleState.idleData?.sesion && ["activa", "reclamable"].includes(String(idleState.idleData.sesion.estado || "").toLowerCase())) {
        setFeedbackIdle(tIdle("battle_idle_active_message_fixed", "You already have an active Idle Expedition."), "info");
        return;
    }

    const tierCodigo = normalizarTierIdle(document.getElementById("idleTierSelect")?.value || idleState.selectedTier);
    const duracionSegundos = normalizarDuracionIdle(document.getElementById("idleDurationSelect")?.value || idleState.selectedDuration);

    if (tierCodigo === "masters" && !hasMastersBenefitIdle()) {
        setFeedbackIdle(tIdle("idle_masters_requires_benefit", "The Masters tier requires the Idle Masters premium benefit before launch."), "warning");
        renderMastersPanelIdle();
        renderStatusIdle();
        return;
    }

    try {
        const data = await fetchAuth(`${API_BASE}/battle/idle/iniciar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tier_codigo: tierCodigo,
                duracion_segundos: duracionSegundos,
                usuario_pokemon_ids: obtenerIdsEquipoIdle(),
                guardar_equipo: true
            })
        });

        if (!data?.ok || !data?.idle_session_token) {
            throw new Error(data?.mensaje || tIdle("battle_idle_start_error", "The Idle Expedition could not be started."));
        }

        sessionStorage.setItem(IDLE_SESSION_STORAGE_KEY, String(data.idle_session_token));
        await cargarEstadoIdle(true);
        setFeedbackIdle(tIdle("battle_idle_started_ok", "Idle Expedition started successfully."), "success");
    } catch (error) {
        console.error("No se pudo iniciar Idle Expedition:", error);
        setFeedbackIdle(error?.message || tIdle("battle_idle_start_error", "The Idle Expedition could not be started."), "error");
    }
}

async function reclamarIdlePage() {
    setFeedbackIdle("");

    if (!getAccessToken()) {
        setFeedbackIdle(tIdle("battle_mode_requires_login", "You must sign in first."), "warning");
        return;
    }

    try {
        const data = await fetchAuth(`${API_BASE}/battle/idle/reclamar`, { method: "POST" });
        if (!data?.ok) {
            throw new Error(data?.mensaje || tIdle("battle_idle_claim_error", "Idle rewards could not be claimed."));
        }

        if (typeof data?.pokedolares_actuales !== "undefined") {
            localStorage.setItem("usuario_pokedolares", String(data.pokedolares_actuales));
        }

        sessionStorage.removeItem(IDLE_SESSION_STORAGE_KEY);
        persistirResultadoAnteriorIdle(data?.resultado || null);
        renderLastResultIdle();
        await cargarEstadoIdle(true);

        const resultado = data?.resultado || {};
        setFeedbackIdle(
            `${tIdle("idle_claim_success_prefix", "Idle rewards claimed:")} +${formatNumberIdle(resultado?.pokedolares_ganados || 0)} ${tIdle("idle_currency_label", "Pokédollars")}, +${formatNumberIdle(resultado?.exp_ganada || 0)} EXP ${tIdle("idle_claim_success_and", "and")} ${formatNumberIdle(resultado?.victorias_estimadas || 0)} ${tIdle("idle_estimated_wins_label", "estimated wins")}.`,
            "success"
        );
    } catch (error) {
        console.error("No se pudo reclamar Idle:", error);
        setFeedbackIdle(error?.message || tIdle("battle_idle_claim_error", "Idle rewards could not be claimed."), "error");
    }
}

async function cancelarIdlePage() {
    setFeedbackIdle("");

    if (!getAccessToken()) {
        setFeedbackIdle(tIdle("battle_mode_requires_login", "You must sign in first."), "warning");
        return;
    }

    const currentToken = idleState.idleData?.sesion?.token || sessionStorage.getItem(IDLE_SESSION_STORAGE_KEY) || "";
    if (!currentToken) {
        setFeedbackIdle(tIdle("idle_no_active_session", "There is no active Idle Expedition."), "info");
        return;
    }

    const confirmed = window.confirm(tIdle("battle_idle_cancel_confirm", "Your current Idle Expedition will be cancelled and no rewards will be granted."));
    if (!confirmed) return;

    try {
        const data = await fetchAuth(`${API_BASE}/battle/idle/cancelar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idle_session_token: currentToken })
        });

        if (!data?.ok) {
            throw new Error(data?.mensaje || tIdle("battle_idle_cancel_error", "The Idle Expedition could not be cancelled."));
        }

        sessionStorage.removeItem(IDLE_SESSION_STORAGE_KEY);
        await cargarEstadoIdle(true);
        setFeedbackIdle(tIdle("battle_idle_cancelled", "Idle Expedition cancelled."), "warning");
    } catch (error) {
        console.error("No se pudo cancelar Idle:", error);
        setFeedbackIdle(error?.message || tIdle("battle_idle_cancel_error", "The Idle Expedition could not be cancelled."), "error");
    }
}
