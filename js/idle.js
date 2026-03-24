/* =========================================================
   IDLE PAGE JS
   - Página separada para Idle Expedition
   - Reutiliza el equipo guardado de Battle
   - Mantiene las rutas backend existentes de Idle
========================================================= */

const IDLE_TEAM_STORAGE_KEY = "mastersmon_battle_team_v1";
const IDLE_SESSION_STORAGE_KEY = "mastersmon_battle_idle_session_v1";
const IDLE_LAST_RESULT_STORAGE_KEY = "mastersmon_idle_last_result_v1";

const IDLE_TIER_CONFIG = {
    ruta: {
        label: "Route",
        description: "Safer baseline expedition with lower pressure and more stable early farming.",
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
        description: "Balanced expedition with better rewards and stronger enemy pressure.",
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
        description: "High-reward expedition with tougher scaling and better drop quality.",
        difficulty: "Late",
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
    }
};

const idleState = {
    team: [],
    idleData: null,
    serverOffsetMs: 0,
    startedAtMs: 0,
    endsAtMs: 0,
    lastSyncMs: 0,
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
    renderTeamIdle();
    renderEstimateIdle();
    renderLastResultIdle();
    renderStatusIdle();

    try {
        await cargarEquipoServidorIdle();
        renderTeamIdle();
        renderEstimateIdle();
        await cargarEstadoIdle(true);
    } catch (error) {
        console.warn("No se pudo inicializar Idle completamente:", error);
    }

    iniciarRelojIdle();

    document.addEventListener("languageChanged", () => {
        if (typeof applyTranslations === "function") {
            applyTranslations();
        }
        renderTierCardsIdle();
        renderSelectedPlanIdle();
        renderTeamIdle();
        renderEstimateIdle();
        renderLastResultIdle();
        renderStatusIdle();
    });

    document.addEventListener("usuarioSesionActualizada", async () => {
        cargarEquipoLocalIdle();
        await cargarEquipoServidorIdle();
        renderTeamIdle();
        renderEstimateIdle();
        await cargarEstadoIdle(true);
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
    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect && typeof getCurrentLang === "function") {
        languageSelect.value = getCurrentLang();
        languageSelect.addEventListener("change", (e) => {
            setCurrentLang(e.target.value);
        });
    }

    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
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
    if (btnRefresh) btnRefresh.addEventListener("click", () => cargarEstadoIdle(false));
}

function tIdle(key, fallback) {
    try {
        if (typeof t === "function") {
            const translated = t(key);
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
    const cfg = IDLE_TIER_CONFIG[tier];
    if (!cfg) return IDLE_TIER_CONFIG.ruta;

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
        }
    };

    return { ...cfg, ...(translated[tier] || {}) };
}

function getIdleDropLabel(itemCode = "", fallback = "Item") {
    const map = {
        potion: tIdle("item_potion", "Potion"),
        poke_ball: tIdle("item_poke_ball", "Poké Ball"),
        super_ball: tIdle("item_super_ball", "Super Ball"),
        ultra_ball: tIdle("item_ultra_ball", "Ultra Ball")
    };
    return map[itemCode] || fallback || itemCode || tIdle("idle_item_generic", "Item");
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

function formatNumberIdle(value) {
    return new Intl.NumberFormat(getLocaleIdle()).format(Number(value || 0));
}

function formatSecondsIdle(seconds = 0) {
    const total = Math.max(0, Number(seconds || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

function formatDurationLabelIdle(seconds = 3600) {
    const hours = Math.round(Number(seconds || 0) / 3600);
    if (hours <= 1) return tIdle("battle_idle_duration_1h", "1 hour");
    if (hours === 2) return tIdle("battle_idle_duration_2h", "2 hours");
    if (hours === 4) return tIdle("battle_idle_duration_4h", "4 hours");
    if (hours === 8) return tIdle("battle_idle_duration_8h", "8 hours");
    return `${hours}h`;
}

function normalizarTierIdle(value = "ruta") {
    const normalized = String(value || "ruta").toLowerCase();
    return Object.prototype.hasOwnProperty.call(IDLE_TIER_CONFIG, normalized) ? normalized : "ruta";
}

function normalizarDuracionIdle(value = 3600) {
    const allowed = [3600, 7200, 14400, 28800];
    const numeric = Number(value || 3600);
    return allowed.includes(numeric) ? numeric : 3600;
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
        console.warn("No se pudo guardar storage Idle:", key, error);
    }
}

function cargarResultadoAnteriorIdle() {
    idleState.lastResult = readJsonStorageIdle(IDLE_LAST_RESULT_STORAGE_KEY, null);
}

function persistirResultadoAnteriorIdle(resultado = null) {
    idleState.lastResult = resultado || null;
    if (!resultado) {
        localStorage.removeItem(IDLE_LAST_RESULT_STORAGE_KEY);
        return;
    }
    writeJsonStorageIdle(IDLE_LAST_RESULT_STORAGE_KEY, resultado);
}

function cargarEquipoLocalIdle() {
    const equipo = readJsonStorageIdle(IDLE_TEAM_STORAGE_KEY, []);
    idleState.team = Array.isArray(equipo) ? equipo.slice(0, 6) : [];
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

function obtenerIdsEquipoIdle() {
    return [...new Set(
        idleState.team
            .map(p => Number(p?.id))
            .filter(id => !Number.isNaN(id) && id > 0)
    )].slice(0, 6);
}

function getAverageTeamLevelIdle() {
    if (!idleState.team.length) return 0;
    const total = idleState.team.reduce((sum, pokemon) => sum + Number(pokemon?.nivel || 0), 0);
    return Math.round(total / idleState.team.length);
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

    container.innerHTML = Object.entries(IDLE_TIER_CONFIG).map(([tierCode, cfg]) => {
        const active = tierCode === idleState.selectedTier ? " active" : "";
        const estimate = computeIdleEstimate(idleState.team, tierCode, idleState.selectedDuration);
        return `
            <button type="button" class="idle-tier-card${active}" data-tier="${escapeHtmlIdle(tierCode)}">
                <h4>${escapeHtmlIdle(cfg.label)}</h4>
                <p>${escapeHtmlIdle(cfg.description)}</p>
                <strong>${formatNumberIdle(estimate.exp)} EXP</strong>
                <small>${formatNumberIdle(estimate.coins)} ${escapeHtmlIdle(tIdle("idle_currency_label", "Pokédollars"))} · ${Math.round(estimate.successRate * 100)}% ${escapeHtmlIdle(tIdle("idle_success_short", "success"))}</small>
            </button>
        `;
    }).join("");

    container.querySelectorAll(".idle-tier-card").forEach(card => {
        card.addEventListener("click", () => {
            idleState.selectedTier = normalizarTierIdle(card.dataset.tier || "ruta");
            const tierSelect = document.getElementById("idleTierSelect");
            if (tierSelect) tierSelect.value = idleState.selectedTier;
            renderTierCardsIdle();
            renderSelectedPlanIdle();
            renderEstimateIdle();
            renderStatusIdle();
        });
    });
}

function renderSelectedPlanIdle() {
    const panel = document.getElementById("idleSelectedPlan");
    if (!panel) return;

    const tierCode = normalizarTierIdle(document.getElementById("idleTierSelect")?.value || idleState.selectedTier);
    const duration = normalizarDuracionIdle(document.getElementById("idleDurationSelect")?.value || idleState.selectedDuration);
    idleState.selectedTier = tierCode;
    idleState.selectedDuration = duration;
    const cfg = getIdleTierMeta(tierCode);
    const estimate = computeIdleEstimate(idleState.team, tierCode, duration);

    panel.innerHTML = `
        <h4>${escapeHtmlIdle(cfg.label)} ${escapeHtmlIdle(tIdle("idle_plan_suffix", "plan"))}</h4>
        <p>${escapeHtmlIdle(cfg.description)}</p>
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
        const sprite = pokemon?.imagen || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
        const shinyTag = pokemon?.es_shiny ? `<span class="idle-team-tag">${escapeHtmlIdle(tIdle("pokemon_shiny", "Shiny"))}</span>` : '';
        return `
            <article class="idle-team-card">
                <div class="idle-team-avatar">
                    <img src="${escapeHtmlIdle(sprite)}" alt="${escapeHtmlIdle(pokemon?.nombre || tIdle('idle_pokemon_fallback', 'Pokemon'))}" loading="lazy" decoding="async">
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
        panel.innerHTML = `
            <div class="idle-empty-card">
                ${tIdle("idle_no_previous_claim", "No previous claim saved yet. Once you claim an expedition, the latest result will stay visible here.")}
            </div>
        `;
        return;
    }

    const items = Array.isArray(result?.items_ganados) ? result.items_ganados : [];
    const itemsHtml = items.length
        ? items.map(item => `<span class="idle-team-tag">${escapeHtmlIdle(item.item_code || 'item')} × ${formatNumberIdle(item.cantidad || 0)}</span>`).join("")
        : `<span class="idle-team-tag">${escapeHtmlIdle(tIdle("idle_no_item_drops", "No item drops"))}</span>`;

    panel.innerHTML = `
        <h4>${escapeHtmlIdle(IDLE_TIER_CONFIG[normalizarTierIdle(result?.tier_codigo || 'ruta')]?.label || 'Route')} Expedition</h4>
        <p>${tIdle("idle_latest_claim_copy", "Latest claim saved locally so you can keep track of your most recent run without touching backend again.")}</p>
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
        <div class="idle-team-tags" style="margin-top:14px;">
            ${itemsHtml}
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
        title.textContent = idleState.team.length === 6 ? tIdle("idle_ready_to_launch", "Ready to launch") : tIdle("idle_team_incomplete_title", "Team incomplete");
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
        badge.textContent = tIdle("battle_idle_status_idle", "Ready");
        timerLabel.textContent = tIdle("battle_idle_remaining", "Remaining");
        timerValue.textContent = "—";
        progressFill.style.width = "0%";
        progressText.textContent = teamReady
            ? tIdle("battle_idle_status_idle_text", "Choose a tier and duration, then start the expedition.")
            : tIdle("idle_need_six_saved_text", "Idle Expedition requires exactly 6 saved Pokémon in your Battle team.");
        btnStart.disabled = !teamReady;
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
        return;
    }

    const serverNowMs = Date.parse(data?.hora_server || "");
    if (Number.isFinite(serverNowMs)) {
        idleState.serverOffsetMs = serverNowMs - Date.now();
    }

    idleState.startedAtMs = Date.parse(data?.sesion?.iniciado_en || "") || 0;
    idleState.endsAtMs = Date.parse(data?.sesion?.termina_en || "") || 0;

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

    const nowServerMs = obtenerAhoraServidorIdleMs();
    const totalMs = Math.max(1000, idleState.endsAtMs - idleState.startedAtMs);
    const remainingMs = Math.max(0, idleState.endsAtMs - nowServerMs);
    const elapsedMs = Math.max(0, Math.min(totalMs, nowServerMs - idleState.startedAtMs));
    const progress = Math.max(0, Math.min(100, Math.round((elapsedMs / totalMs) * 100)));

    timerValue.textContent = formatSecondsIdle(Math.ceil(remainingMs / 1000));
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${tIdle("idle_running_prefix", "Expedition")} ${traducirTierIdle(sesion.tier_codigo)} ${tIdle("idle_running_middle", "running")} · ${progress}% ${tIdle("idle_complete_suffix", "complete")}.`;

    if (remainingMs <= 0 && !idleState.countdownFinished) {
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
        renderStatusIdle();
        return null;
    }

    try {
        const data = await fetchAuth(`${API_BASE}/battle/idle/estado`);
        registrarEstadoIdle(data || null);
        renderSelectedPlanIdle();
        renderEstimateIdle();
        renderStatusIdle();
        return data;
    } catch (error) {
        if (!silent) {
            setFeedbackIdle(error?.message || tIdle("battle_idle_load_error", "The Idle Expedition state could not be loaded."), "error");
        }
        registrarEstadoIdle({ ok: false, activa: false, sesion: null, error: error?.message || "error" });
        renderSelectedPlanIdle();
        renderEstimateIdle();
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

    try {
        const tierCodigo = normalizarTierIdle(document.getElementById("idleTierSelect")?.value || idleState.selectedTier);
        const duracionSegundos = normalizarDuracionIdle(document.getElementById("idleDurationSelect")?.value || idleState.selectedDuration);

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
        setFeedbackIdle(tIdle("battle_idle_status_idle", "No active Idle Expedition."), "info");
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
