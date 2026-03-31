let battlePokemonUsuario = [];
let battleEquipo = [];
let battleTabActual = "todos";
let battleModoActual = "arena";
let battleBossEstadoActual = null;
let battleBossRankingActual = [];
let battleIdleEstadoActual = null;
let battleModosTimer = null;
let battleIdleServerOffsetMs = 0;
let battleIdleStartsAtMs = 0;
let battleIdleEndsAtMs = 0;
let battleIdleUltimaSincronizacionMs = 0;
let battleIdleSyncEnProceso = false;
let battleIdleCountdownFinalizado = false;
let battleBeneficiosActivos = [];
let battleBeneficiosSyncEnProceso = false;

const BATTLE_TEAM_STORAGE_KEY = "mastersmon_battle_team_v1";
const BATTLE_ENEMY_LEVEL_BONUS_KEY = "mastersmon_battle_enemy_level_bonus_v1";
const BATTLE_ARENA_DIFFICULTY_KEY = "mastersmon_battle_arena_difficulty_v1";
const BATTLE_ACTIVITY_SESSION_KEY = "mastersmon_battle_activity_session_v1";
const BATTLE_MODE_STORAGE_KEY = "mastersmon_battle_mode_v1";
const BATTLE_ARENA_MODE_KEY = "mastersmon_battle_arena_mode_v1";
const BATTLE_BOSS_SESSION_TOKEN_KEY = "mastersmon_battle_boss_session_token_v1";
const BATTLE_BOSS_DATA_KEY = "mastersmon_battle_boss_data_v1";
const BATTLE_BOSS_EVENT_KEY = "mastersmon_battle_boss_event_v1";
const BATTLE_IDLE_SESSION_KEY = "mastersmon_battle_idle_session_v1";

let battleActividadTimer = null;

const BATTLE_PREMIUM_PRODUCT_CODES = {
    exp: "battle_exp_x2_pack5",
    gold: "battle_gold_x2_pack5"
};

let battlePremiumProductosCatalogo = [];
let battlePremiumProductoSeleccionado = null;
let battlePremiumCheckoutEnProceso = false;

document.addEventListener("DOMContentLoaded", () => {
    inicializarBattle();
});


function esVistaBattleIABattle() {
    return !document.querySelector("[data-battle-mode]")
        && !document.getElementById("battleBossCard")
        && !document.getElementById("battleIdleCard")
        && !document.getElementById("battleModoActualCard");
}

function esVistaBattleIAFija() {
    return !document.querySelector("[data-battle-mode]")
        && !document.getElementById("battleModoActualCard")
        && !document.getElementById("battleIdleCard");
}

function tienePanelBossBattle() {
    return !!document.getElementById("battleBossCard");
}

function tienePanelIdleBattle() {
    return !!document.getElementById("battleIdleCard");
}

async function inicializarBattle() {
    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect && typeof getCurrentLang === "function") {
        languageSelect.value = getCurrentLang();
        languageSelect.addEventListener("change", (e) => {
            setCurrentLang(e.target.value);
        });
    }

    document.addEventListener("languageChanged", () => {
        refrescarUIBattlePorIdioma();
    });

    if (typeof applyTranslations === "function") {
        applyTranslations();
    }

    configurarResumenUsuarioBattle();
    cargarModoBattle();

    if (esVistaBattleIAFija()) {
        battleModoActual = "arena";
        persistirModoBattle();
    }
    configurarEventosBattle();
    cargarEquipoGuardadoBattle();
    cargarDificultadBattle();
    renderSlotsEquipoBattle();
    renderResumenEquipoBattle();
    renderBattleBoostersBanner();
    renderPanelModoActualBattle();
    if (tienePanelBossBattle()) renderBossBattle();
    if (tienePanelIdleBattle()) renderIdleBattle();
    renderColeccionBattleLoading();
    iniciarRelojModosBattle();

    try {
        await cargarPokemonUsuarioBattle();
        await intentarCargarEquipoServidorBattle();
        sincronizarEquipoBattleConColeccion();
        renderSlotsEquipoBattle();
        renderColeccionBattle();
        renderResumenEquipoBattle();
        const cargasLaterales = [cargarBeneficiosActivosBattle(true)];
        if (tienePanelBossBattle()) cargasLaterales.push(cargarEstadoBossBattle(true));
        if (tienePanelIdleBattle()) cargasLaterales.push(cargarEstadoIdleBattle(true));
        if (cargasLaterales.length) {
            await Promise.all(cargasLaterales);
        }
        iniciarHeartbeatActividadBattle();
    } catch (error) {
        console.error("Error iniciando Battle:", error);
        renderColeccionBattleError();

        setTimeout(async () => {
            try {
                renderColeccionBattleLoading();
                await cargarPokemonUsuarioBattle();
                await intentarCargarEquipoServidorBattle();
                sincronizarEquipoBattleConColeccion();
                renderSlotsEquipoBattle();
                renderColeccionBattle();
                renderResumenEquipoBattle();
                const cargasLateralesRetry = [cargarBeneficiosActivosBattle(true)];
                if (tienePanelBossBattle()) cargasLateralesRetry.push(cargarEstadoBossBattle(true));
                if (tienePanelIdleBattle()) cargasLateralesRetry.push(cargarEstadoIdleBattle(true));
                if (cargasLateralesRetry.length) {
                    await Promise.all(cargasLateralesRetry);
                }
                iniciarHeartbeatActividadBattle();
            } catch (retryError) {
                console.error("Error en reintento de Battle:", retryError);
                renderColeccionBattleError();
            }
        }, 1200);
    }
}

function refrescarUIBattlePorIdioma() {
    if (typeof applyTranslations === "function") {
        applyTranslations();
    }

    poblarFiltroTiposBattle();
    cargarDificultadBattle();
    actualizarUISelectorModoBattle();
    renderSlotsEquipoBattle();
    renderResumenEquipoBattle();
    renderBattleBoostersBanner();
    renderPanelModoActualBattle();
    if (tienePanelBossBattle()) renderBossBattle();
    if (tienePanelIdleBattle()) renderIdleBattle();
    renderColeccionBattle();
    refrescarModalCompraPremiumBattleAbierto();
}

/* =========================
   CONFIG / EVENTOS
========================= */
function configurarEventosBattle() {
    const btnLimpiar = document.getElementById("btnLimpiarEquipo");
    const btnGuardar = document.getElementById("btnGuardarEquipo");
    const btnIniciar = document.getElementById("btnIniciarBatalla");

    const buscador = document.getElementById("buscarPokemonBattle");
    const filtroTipo = document.getElementById("filtroTipoBattle");
    const filtroEstado = document.getElementById("filtroEstadoBattle");
    const filtroOrden = document.getElementById("filtroOrdenBattle");
    const selectDificultad = document.getElementById("battleDificultadRival");
    const btnBoss = document.getElementById("btnIniciarBoss");
    const btnBossRefresh = document.getElementById("btnRefrescarBoss");
    const btnIdleStart = document.getElementById("btnIniciarIdle");
    const btnIdleClaim = document.getElementById("btnReclamarIdle");
    const btnIdleCancel = document.getElementById("btnCancelarIdle");
    const idleTier = document.getElementById("battleIdleTier");
    const idleDuration = document.getElementById("battleIdleDuration");

    if (selectDificultad) {
        selectDificultad.addEventListener("change", guardarDificultadBattle);
    }

    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", () => {
            if (!battleEquipo.length) {
                mostrarModalBattle(t("battle_empty_team_clear"), "info");
                return;
            }

            mostrarConfirmacionBattle({
                titulo: t("battle_confirm_clear_title"),
                mensaje: t("battle_confirm_clear_text"),
                textoAceptar: t("battle_confirm_clear_accept"),
                tipo: "warning",
                onConfirm: () => {
                    battleEquipo = [];
                    persistirEquipoBattle();
                    renderSlotsEquipoBattle();
                    renderColeccionBattle();
                    renderResumenEquipoBattle();
                    mostrarModalBattle(t("battle_team_cleared"), "warning");
                }
            });
        });
    }

    if (btnGuardar) {
        btnGuardar.addEventListener("click", async () => {
            try {
                persistirEquipoBattle();

                if (!battleEquipo.length) {
                    mostrarModalBattle(
                        tBattleSafe("battle_team_empty_local_only", "The local team is empty. Nothing was synced to the account."),
                        "warning"
                    );
                    return;
                }

                await guardarEquipoServidorBattle();
                mostrarModalBattle(t("battle_team_saved"), "ok");
            } catch (error) {
                console.error("No se pudo guardar el equipo de Battle:", error);
                mostrarModalBattle(
                    error?.message || tBattleSafe("battle_team_save_server_error", "The team could not be saved to your account."),
                    "error"
                );
            }
        });
    }

    if (btnIniciar) {
        btnIniciar.addEventListener("click", ejecutarModoSeleccionadoBattle);
    }

    if (buscador) buscador.addEventListener("input", renderColeccionBattle);
    if (filtroTipo) filtroTipo.addEventListener("change", renderColeccionBattle);
    if (filtroEstado) filtroEstado.addEventListener("change", renderColeccionBattle);
    if (filtroOrden) filtroOrden.addEventListener("change", renderColeccionBattle);

    document.querySelectorAll("[data-battle-mode]").forEach(btn => {
        btn.addEventListener("click", () => {
            seleccionarModoBattle(btn.dataset.battleMode || "arena");
        });
    });

    if (btnBoss) btnBoss.addEventListener("click", iniciarModoBossBattle);
    if (btnBossRefresh) btnBossRefresh.addEventListener("click", () => cargarEstadoBossBattle(false));
    if (btnIdleStart) btnIdleStart.addEventListener("click", iniciarModoIdleBattle);
    if (btnIdleClaim) btnIdleClaim.addEventListener("click", reclamarIdleBattle);
    if (btnIdleCancel) btnIdleCancel.addEventListener("click", cancelarIdleBattle);

    if (idleTier) {
        idleTier.addEventListener("change", () => {
            if (!(battleIdleEstadoActual?.sesion?.estado)) renderIdleBattle();
        });
    }

    if (idleDuration) {
        idleDuration.addEventListener("change", () => {
            if (!(battleIdleEstadoActual?.sesion?.estado)) renderIdleBattle();
        });
    }

    document.querySelectorAll("[data-battle-tab]").forEach(btn => {
        btn.addEventListener("click", () => {
            battleTabActual = btn.dataset.battleTab;
            document.querySelectorAll("[data-battle-tab]").forEach(x => x.classList.remove("active"));
            btn.classList.add("active");
            renderColeccionBattle();
        });
    });

    document.querySelectorAll("[data-battle-chip]").forEach(btn => {
        btn.addEventListener("click", () => {
            const selectTipo = document.getElementById("filtroTipoBattle");
            if (selectTipo) {
                selectTipo.value = btn.dataset.battleChip;
                renderColeccionBattle();
            }
        });
    });

    document.querySelectorAll("[data-battle-chip-clear]").forEach(btn => {
        btn.addEventListener("click", () => {
            const selectTipo = document.getElementById("filtroTipoBattle");
            if (selectTipo) selectTipo.value = "";

            const selectEstado = document.getElementById("filtroEstadoBattle");
            if (selectEstado) selectEstado.value = "todos";

            renderColeccionBattle();
        });
    });

    const roster = document.getElementById("coleccionBattle");
    if (roster) {
        roster.addEventListener("click", (event) => {
            const addBtn = event.target.closest("[data-add-pokemon-id]");
            if (!addBtn) return;

            const pokemonInstanceId = Number(addBtn.dataset.addPokemonId);
            agregarPokemonAEquipoBattle(pokemonInstanceId);
        });
    }

    const slots = document.getElementById("equipoSlots");
    if (slots) {
        slots.addEventListener("click", (event) => {
            const removeBtn = event.target.closest("[data-remove-slot]");
            if (!removeBtn) return;

            const slotIndex = Number(removeBtn.dataset.removeSlot);
            quitarPokemonDeEquipoBattle(slotIndex);
        });
    }

    const modal = document.getElementById("battleModal");
    const btnCerrarModal = document.getElementById("battleModalClose");
    const btnCancelarConfirm = document.getElementById("battleConfirmCancel");
    const btnAceptarConfirm = document.getElementById("battleConfirmAccept");

    if (btnCerrarModal) btnCerrarModal.addEventListener("click", cerrarModalBattle);
    if (btnCancelarConfirm) btnCancelarConfirm.addEventListener("click", cerrarModalBattle);

    if (btnAceptarConfirm) {
        btnAceptarConfirm.addEventListener("click", () => {
            if (typeof window._battleConfirmAction === "function") {
                const accion = window._battleConfirmAction;
                window._battleConfirmAction = null;
                cerrarModalBattle();
                accion();
            }
        });
    }

    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) cerrarModalBattle();
        });
    }

    const boostersList = document.getElementById("battleBoostersActive");
    if (boostersList) {
        boostersList.addEventListener("click", async (event) => {
            const buyBtn = event.target.closest("[data-battle-buy-booster]");
            if (!buyBtn) return;

            event.preventDefault();
            await abrirModalCompraPremiumBattle(String(buyBtn.dataset.battleBuyBooster || ""));
        });
    }

    const premiumModal = document.getElementById("battlePremiumPurchaseModal");
    const premiumCloseBtn = document.getElementById("battlePremiumModalCloseBtn");
    const premiumCancelBtn = document.getElementById("battlePremiumModalCancelBtn");
    const premiumConfirmBtn = document.getElementById("battlePremiumModalConfirmBtn");

    if (premiumCloseBtn) premiumCloseBtn.addEventListener("click", cerrarModalCompraPremiumBattle);
    if (premiumCancelBtn) premiumCancelBtn.addEventListener("click", cerrarModalCompraPremiumBattle);
    if (premiumConfirmBtn) premiumConfirmBtn.addEventListener("click", confirmarCompraPremiumBattle);
    if (premiumModal) {
        premiumModal.addEventListener("click", (event) => {
            if (event.target === premiumModal) cerrarModalCompraPremiumBattle();
        });
    }

    window.addEventListener("pagehide", detenerHeartbeatActividadBattle);
    window.addEventListener("beforeunload", detenerHeartbeatActividadBattle);
    window.addEventListener("focus", () => {
        refrescarEstadoIdleBattleSilencioso(true);
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            refrescarEstadoIdleBattleSilencioso(true);
        }
    });
}

function configurarResumenUsuarioBattle() {
    const nombreDesktop = document.getElementById("nombreUsuario");
    const nombreMobile = document.getElementById("nombreUsuarioMobile");

    const nombre = localStorage.getItem("usuario_nombre") || nombreDesktop?.textContent?.trim() || t("battle_trainer_default");
    if (nombreDesktop) nombreDesktop.textContent = nombre;
    if (nombreMobile) nombreMobile.textContent = nombre;
}

/* =========================
   DATA
========================= */
async function cargarPokemonUsuarioBattle() {
    if (!getAccessToken()) {
        battlePokemonUsuario = [];
        throw new Error(t("battle_no_token"));
    }

    const data = await obtenerPokemonUsuarioActualBattle();
    battlePokemonUsuario = Array.isArray(data) ? data : [];
    poblarFiltroTiposBattle();
}

async function obtenerPokemonUsuarioActualBattle() {
    const token = getAccessToken();
    let usuarioId = localStorage.getItem("usuario_id");

    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
        if (token) {
            return await fetchJsonBattle(`${API_BASE}/usuario/me/pokemon`, { headers });
        }
    } catch (error) {
        console.warn("Fallo /usuario/me/pokemon, intentando fallback:", error);
    }

    if (!usuarioId && typeof obtenerUsuarioActual === "function") {
        try {
            const usuario = await obtenerUsuarioActual();
            if (usuario?.id) {
                usuarioId = usuario.id;
                localStorage.setItem("usuario_id", String(usuario.id));
            }
        } catch (error) {
            console.warn("No se pudo obtener usuario actual en Battle:", error);
        }
    }

    if (!usuarioId) {
        throw new Error(t("battle_user_not_found"));
    }

    return await fetchJsonBattle(`${API_BASE}/usuario/${usuarioId}/pokemon`, { headers });
}

/* =========================
   STORAGE
========================= */
function normalizarValorDificultadBattle(raw) {
    const valor = String(raw ?? "").trim().toLowerCase();

    if (valor === "" || valor === "normal") return 0;
    if (valor === "challenge") return 2;
    if (valor === "expert") return 4;
    if (valor === "master") return 6;

    const numero = Number(valor);
    if ([0, 2, 4, 6].includes(numero)) return numero;

    return 0;
}

function obtenerCodigoDificultadBattleDesdeBonus(bonus = 0) {
    const valor = Number(bonus || 0);

    if (valor >= 6) return "master";
    if (valor >= 4) return "expert";
    if (valor >= 2) return "challenge";
    return "normal";
}

function cargarEquipoGuardadoBattle() {
    try {
        const raw = localStorage.getItem(BATTLE_TEAM_STORAGE_KEY);
        battleEquipo = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(battleEquipo)) battleEquipo = [];
        battleEquipo = battleEquipo.slice(0, 6);
    } catch (error) {
        console.warn("No se pudo leer el equipo guardado de Battle:", error);
        battleEquipo = [];
    }
}

function persistirEquipoBattle() {
    try {
        localStorage.setItem(BATTLE_TEAM_STORAGE_KEY, JSON.stringify(battleEquipo));
    } catch (error) {
        console.warn("No se pudo guardar el equipo de Battle:", error);
    }
}

async function intentarCargarEquipoServidorBattle() {
    if (!getAccessToken() || typeof API_BASE === "undefined") {
        return false;
    }

    try {
        const data = await fetchBattleAuth(`${API_BASE}/usuario/me/equipo`);

        const equipoServidor = Array.isArray(data?.equipo)
            ? data.equipo.slice(0, 6)
            : [];

        if (!equipoServidor.length) {
            return false;
        }

        battleEquipo = equipoServidor;
        persistirEquipoBattle();
        return true;
    } catch (error) {
        console.warn("No se pudo cargar el equipo desde el servidor en Battle:", error);
        return false;
    }
}

function obtenerIdsEquipoBattle() {
    return [...new Set(
        (Array.isArray(battleEquipo) ? battleEquipo : [])
            .map(p => Number(p?.id))
            .filter(id => !Number.isNaN(id) && id > 0)
    )].slice(0, 6);
}

async function guardarEquipoServidorBattle(opciones = {}) {
    const { exigirSeis = false } = opciones;

    if (!getAccessToken()) {
        throw new Error(tBattleSafe("battle_no_token", "You must sign in first."));
    }

    const usuarioPokemonIds = obtenerIdsEquipoBattle();

    if (exigirSeis && usuarioPokemonIds.length !== 6) {
        throw new Error(tBattleSafe("battle_need_six", "You need 6 Pokémon in your team."));
    }

    if (!usuarioPokemonIds.length) {
        throw new Error(tBattleSafe("battle_team_empty_server_save", "Add at least 1 Pokémon before saving your team."));
    }

    const data = await fetchBattleAuth(`${API_BASE}/usuario/me/equipo`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            usuario_pokemon_ids: usuarioPokemonIds
        })
    });

    if (!data?.ok) {
        throw new Error(data?.mensaje || tBattleSafe("battle_team_save_server_error", "The team could not be saved to your account."));
    }

    if (Array.isArray(data?.equipo) && data.equipo.length) {
        battleEquipo = data.equipo.slice(0, 6);
        persistirEquipoBattle();
    }

    if (typeof mostrarToastRecompensasOnboarding === "function" && data?.onboarding) {
        mostrarToastRecompensasOnboarding(data.onboarding);
    }

    return data;
}

function sincronizarEquipoBattleConColeccion() {
    if (!Array.isArray(battleEquipo) || !battleEquipo.length) return false;
    if (!Array.isArray(battlePokemonUsuario) || !battlePokemonUsuario.length) return false;

    let huboCambios = false;

    battleEquipo = battleEquipo
        .map(pokemonGuardado => {
            const actualizado = battlePokemonUsuario.find(p => Number(p.id) === Number(pokemonGuardado.id));

            if (!actualizado) {
                return pokemonGuardado;
            }

            const cambioDetectado =
                Number(actualizado.pokemon_id) !== Number(pokemonGuardado.pokemon_id) ||
                String(actualizado.nombre || "") !== String(pokemonGuardado.nombre || "") ||
                String(actualizado.tipo || "") !== String(pokemonGuardado.tipo || "") ||
                Number(actualizado.nivel || 0) !== Number(pokemonGuardado.nivel || 0) ||
                Number(actualizado.hp_max || 0) !== Number(pokemonGuardado.hp_max || 0) ||
                Number(actualizado.hp_actual || 0) !== Number(pokemonGuardado.hp_actual || 0) ||
                Number(actualizado.ataque || 0) !== Number(pokemonGuardado.ataque || 0) ||
                Number(actualizado.defensa || 0) !== Number(pokemonGuardado.defensa || 0) ||
                Number(actualizado.velocidad || 0) !== Number(pokemonGuardado.velocidad || 0) ||
                Number(actualizado.experiencia || 0) !== Number(pokemonGuardado.experiencia || 0) ||
                Boolean(actualizado.es_shiny) !== Boolean(pokemonGuardado.es_shiny);

            if (cambioDetectado) {
                huboCambios = true;
            }

            return actualizado;
        })
        .slice(0, 6);

    if (huboCambios) {
        persistirEquipoBattle();
    }

    return huboCambios;
}

function cargarDificultadBattle() {
    const select = document.getElementById("battleDificultadRival");
    const texto = document.getElementById("battleDificultadTexto");
    if (!select) return;

    const rawGuardado = sessionStorage.getItem(BATTLE_ENEMY_LEVEL_BONUS_KEY);
    const bonus = normalizarValorDificultadBattle(rawGuardado);

    select.value = String(bonus);
    sessionStorage.setItem(BATTLE_ENEMY_LEVEL_BONUS_KEY, String(bonus));
    sessionStorage.setItem(BATTLE_ARENA_DIFFICULTY_KEY, obtenerCodigoDificultadBattleDesdeBonus(bonus));

    actualizarTextoDificultadBattle(bonus, texto);
}

function guardarDificultadBattle() {
    const select = document.getElementById("battleDificultadRival");
    const texto = document.getElementById("battleDificultadTexto");
    if (!select) return;

    const bonus = normalizarValorDificultadBattle(select.value || 0);

    select.value = String(bonus);
    sessionStorage.setItem(BATTLE_ENEMY_LEVEL_BONUS_KEY, String(bonus));
    sessionStorage.setItem(BATTLE_ARENA_DIFFICULTY_KEY, obtenerCodigoDificultadBattleDesdeBonus(bonus));

    actualizarTextoDificultadBattle(bonus, texto);
}

function actualizarTextoDificultadBattle(bonus = 0, textoEl = null) {
    const el = textoEl || document.getElementById("battleDificultadTexto");
    if (!el) return;

    if (bonus <= 0) {
        el.textContent = t("battle_difficulty_help");
        return;
    }

    el.textContent = formatBattleText("battle_difficulty_help_bonus", { bonus });
}

/* =========================
   EQUIPO
========================= */
function agregarPokemonAEquipoBattle(pokemonInstanceId) {
    if (battleEquipo.length >= 6) {
        mostrarModalBattle(t("battle_team_full"), "warning");
        return;
    }

    const existe = battleEquipo.some(p => Number(p.id) === Number(pokemonInstanceId));
    if (existe) {
        mostrarModalBattle(t("battle_already_in_team"), "warning");
        return;
    }

    const pokemon = battlePokemonUsuario.find(p => Number(p.id) === Number(pokemonInstanceId));
    if (!pokemon) {
        mostrarModalBattle(t("battle_not_found_in_collection"), "error");
        return;
    }

    battleEquipo.push(pokemon);
    persistirEquipoBattle();
    renderSlotsEquipoBattle();
    renderColeccionBattle();
    renderResumenEquipoBattle();
}

function quitarPokemonDeEquipoBattle(slotIndex) {
    if (slotIndex < 0 || slotIndex >= battleEquipo.length) return;

    battleEquipo.splice(slotIndex, 1);
    persistirEquipoBattle();
    renderSlotsEquipoBattle();
    renderColeccionBattle();
    renderResumenEquipoBattle();
}

function renderSlotsEquipoBattle() {
    const container = document.getElementById("equipoSlots");
    if (!container) return;

    let html = "";

    for (let i = 0; i < 6; i++) {
        const pokemon = battleEquipo[i];

        if (!pokemon) {
            html += `
                <article class="battle-team-slot empty">
                    <div class="team-slot-index">${i + 1}</div>
                    <div class="team-slot-content">
                        <div class="team-slot-icon">+</div>
                        <h4>${t("battle_empty_slot")}</h4>
                        <p>${t("battle_add_pokemon")}</p>
                    </div>
                </article>
            `;
            continue;
        }

        const imagen = pokemon.es_shiny
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.pokemon_id}.png`
            : (pokemon.imagen || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`);

        const leadBadge = i === 0 ? `<span class="team-lead-badge">${t("battle_leader")}</span>` : "";
        const tipoClase = obtenerClaseTipoBattle(pokemon.tipo);

        const expActual = calcularExpActualBattle(pokemon);
        const expObjetivo = calcularExpObjetivoBattle(pokemon.nivel);
        const expPercent = calcularExpPercentBattle(pokemon);

        html += `
            <article class="battle-team-slot filled ${i === 0 ? "team-slot-lead" : ""} ${tipoClase}">
                <div class="team-slot-index">${i + 1}</div>
                <button class="team-slot-remove" type="button" data-remove-slot="${i}" aria-label="${t("battle_remove_pokemon")}">×</button>

                <div class="team-slot-filled">
                    <img src="${imagen}" alt="${escapeHtmlBattle(pokemon.nombre)}" class="team-slot-sprite">

                    <div class="team-slot-info">
                        <div class="team-slot-headline">
                            <h4>${escapeHtmlBattle(pokemon.nombre)}</h4>
                            ${pokemon.es_shiny ? `<span class="team-shiny-icon" title="${t("battle_shiny_title")}">✦</span>` : ""}
                            ${leadBadge}
                        </div>

                        <p>${escapeHtmlBattle(traducirTipoBattle(pokemon.tipo || "—"))}</p>

                        <div class="team-slot-meta">
                            <span class="meta-level">${t("battle_level_short")} ${pokemon.nivel ?? "—"}</span>
                            <span class="meta-hp">${t("battle_stat_hp_short")} ${pokemon.hp_actual ?? pokemon.hp_max ?? "—"}</span>
                            <span class="meta-atk">${t("battle_stat_atk_short")} ${pokemon.ataque ?? "—"}</span>
                            <span class="meta-def">${t("battle_stat_def_short")} ${pokemon.defensa ?? "—"}</span>
                        </div>

                        <div class="team-slot-exp-wrap">
                            <div class="team-slot-exp-label">${t("battle_exp_label")} ${expActual} / ${expObjetivo}</div>
                            <div class="team-slot-exp-bar">
                                <div class="team-slot-exp-fill" style="width:${expPercent}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    container.innerHTML = html;
}

/* =========================
   RESUMEN
========================= */
function renderResumenEquipoBattle() {
    const contador = document.getElementById("contadorEquipo");
    if (contador) contador.textContent = `${battleEquipo.length} / 6`;

    const stats = calcularResumenEquipoBattle();

    const promedioNivel = document.getElementById("battlePromedioNivel");
    const tipoDominante = document.getElementById("battleTipoDominante");
    const estado = document.getElementById("battleEstadoEquipo");
    const btnIniciar = document.getElementById("btnIniciarBatalla");

    if (promedioNivel) promedioNivel.textContent = stats.promedioNivel;
    if (tipoDominante) tipoDominante.textContent = stats.tipoDominante === "—" ? "—" : traducirTipoBattle(stats.tipoDominante);
    if (estado) estado.textContent = battleEquipo.length === 6 ? t("battle_team_status_ready") : t("battle_team_status_preparing");

    // Lo dejamos siempre habilitado para que el usuario reciba el modal de advertencia
    if (btnIniciar) btnIniciar.disabled = false;

    actualizarEstadoModoSeleccionadoBattle();

    const resumenAtaque = document.getElementById("battleResumenAtaque");
    const resumenBalance = document.getElementById("battleResumenBalance");
    const resumenVelocidad = document.getElementById("battleResumenVelocidad");

    if (resumenAtaque) resumenAtaque.textContent = stats.resumenAtaque;
    if (resumenBalance) resumenBalance.textContent = stats.resumenBalance;
    if (resumenVelocidad) resumenVelocidad.textContent = stats.resumenVelocidad;
}


function renderBattleBoostersBanner() {
    const wrap = document.getElementById("battleBoostersStrip");
    const title = document.getElementById("battleBoostersTitle");
    const list = document.getElementById("battleBoostersActive");
    if (!wrap || !title || !list) return;

    if (!getAccessToken()) {
        title.textContent = tBattleSafe("battle_boosters_locked_title", "Sign in to use battle boosters");
        list.innerHTML = `
            <article class="battle-booster-card is-idle">
                <div class="battle-booster-top">
                    <span class="battle-booster-badge">Locked</span>
                    <div class="battle-booster-icon">🔒</div>
                </div>
                <h5>${escapeHtmlBattle(tBattleSafe("battle_boosters_login_title", "Battle boosters"))}</h5>
                <p>${escapeHtmlBattle(tBattleSafe("battle_boosters_login_text", "Sign in, activate your x2 EXP or x2 GOLD from Collection, and start the arena with the boost already armed."))}</p>
            </article>
            <article class="battle-booster-card is-idle">
                <div class="battle-booster-top">
                    <span class="battle-booster-badge">Ready</span>
                    <div class="battle-booster-icon">🎒</div>
                </div>
                <h5>${escapeHtmlBattle(tBattleSafe("battle_boosters_manage_title", "Manage your charges"))}</h5>
                <p>${escapeHtmlBattle(tBattleSafe("battle_boosters_manage_text", "Use each booster manually from Collection. Every activation lasts 24 hours per charge."))}</p>
            </article>`;
        return;
    }

    const activos = obtenerBoostersBatallaActivosBattle();
    if (!activos.length) {
        title.textContent = tBattleSafe("battle_boosters_none_title", "No active battle boosters");
        list.innerHTML = `
            <article class="battle-booster-card is-idle">
                <div class="battle-booster-top">
                    <span class="battle-booster-badge">Inactive</span>
                    <div class="battle-booster-icon">⚡</div>
                </div>
                <h5>${escapeHtmlBattle(tBattleSafe("battle_boosters_exp_title", "EXP x2"))}</h5>
                <p>${escapeHtmlBattle(tBattleSafe("battle_boosters_none_text_exp", "Activate this boost from Collection before entering Battle IA to double the official EXP reward for the run."))}</p>
                <div class="battle-booster-meta">
                    <span class="battle-booster-chip">${escapeHtmlBattle(tBattleSafe("battle_boosters_manual_activation", "Manual activation"))}</span>
                    <span class="battle-booster-chip strong">24h ${escapeHtmlBattle(tBattleSafe("battle_boosters_per_use", "per use"))}</span>
                </div>
                <div class="battle-booster-actions">
                    <button class="battle-booster-buy-btn" type="button" data-battle-buy-booster="${BATTLE_PREMIUM_PRODUCT_CODES.exp}">${escapeHtmlBattle(tBattleSafe("pokemart_premium_buy_now", "Buy with PayPal"))}</button>
                </div>
            </article>
            <article class="battle-booster-card is-idle">
                <div class="battle-booster-top">
                    <span class="battle-booster-badge">Inactive</span>
                    <div class="battle-booster-icon">💰</div>
                </div>
                <h5>${escapeHtmlBattle(tBattleSafe("battle_boosters_gold_title", "GOLD x2"))}</h5>
                <p>${escapeHtmlBattle(tBattleSafe("battle_boosters_none_text_gold", "Activate this boost from Collection before entering Battle IA to double the official Pokédollar reward for the run."))}</p>
                <div class="battle-booster-meta">
                    <span class="battle-booster-chip">${escapeHtmlBattle(tBattleSafe("battle_boosters_manual_activation", "Manual activation"))}</span>
                    <span class="battle-booster-chip strong">24h ${escapeHtmlBattle(tBattleSafe("battle_boosters_per_use", "per use"))}</span>
                </div>
                <div class="battle-booster-actions">
                    <button class="battle-booster-buy-btn gold" type="button" data-battle-buy-booster="${BATTLE_PREMIUM_PRODUCT_CODES.gold}">${escapeHtmlBattle(tBattleSafe("pokemart_premium_buy_now", "Buy with PayPal"))}</button>
                </div>
            </article>`;
        return;
    }

    title.textContent = tBattleSafe("battle_boosters_active_title", "Active boosters for your next Battle IA");
    list.innerHTML = activos.map(renderBoosterActivoBattleCard).join("");
}

function obtenerBoostersBatallaActivosBattle() {
    const beneficios = Array.isArray(battleBeneficiosActivos) ? battleBeneficiosActivos : [];
    return beneficios
        .filter(item => {
            const codigo = String(item?.beneficio_codigo || "").toLowerCase();
            return codigo === "battle_exp_x2" || codigo === "battle_gold_x2";
        })
        .sort((a, b) => {
            const order = codigo => codigo === "battle_exp_x2" ? 0 : 1;
            return order(String(a?.beneficio_codigo || "")) - order(String(b?.beneficio_codigo || ""));
        });
}

function renderBoosterActivoBattleCard(beneficio) {
    const codigo = String(beneficio?.beneficio_codigo || "").toLowerCase();
    const esExp = codigo === "battle_exp_x2";
    const clase = esExp ? "booster-exp" : "booster-gold";
    const icono = esExp ? "⚡" : "💰";
    const titulo = esExp
        ? tBattleSafe("battle_boosters_exp_title", "EXP x2")
        : tBattleSafe("battle_boosters_gold_title", "GOLD x2");
    const descripcion = esExp
        ? tBattleSafe("battle_boosters_exp_active_text", "The next Battle IA sessions you start while this boost is active will lock double EXP in their reward snapshot.")
        : tBattleSafe("battle_boosters_gold_active_text", "The next Battle IA sessions you start while this boost is active will lock double Pokédollars in their reward snapshot.");
    const restante = formatearRestanteBeneficioBattle(beneficio?.expira_en);
    const expiracion = formatearExpiracionBeneficioBattle(beneficio?.expira_en);

    return `
        <article class="battle-booster-card is-active ${clase}">
            <div class="battle-booster-top">
                <span class="battle-booster-badge">${escapeHtmlBattle(tBattleSafe("battle_boosters_active_badge", "Active"))}</span>
                <div class="battle-booster-icon">${icono}</div>
            </div>
            <h5>${escapeHtmlBattle(titulo)}</h5>
            <p>${escapeHtmlBattle(descripcion)}</p>
            <div class="battle-booster-meta">
                <span class="battle-booster-chip strong">${escapeHtmlBattle(restante)}</span>
                <span class="battle-booster-chip">${escapeHtmlBattle(expiracion)}</span>
            </div>
        </article>`;
}

function formatearRestanteBeneficioBattle(expiraEn) {
    const restanteMs = obtenerRestanteBeneficioBattleMs(expiraEn);
    if (restanteMs <= 0) {
        return tBattleSafe("battle_boosters_expired", "Expired");
    }
    return `${tBattleSafe("battle_boosters_time_left", "Time left")}: ${formatSecondsBattle(Math.floor(restanteMs / 1000))}`;
}

function formatearExpiracionBeneficioBattle(expiraEn) {
    const expiraMs = Date.parse(expiraEn || "");
    if (!Number.isFinite(expiraMs)) {
        return tBattleSafe("battle_boosters_snapshot_hint", "Applies when the battle starts");
    }
    try {
        const texto = new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(expiraMs));
        return `${tBattleSafe("battle_boosters_until", "Until")} ${texto}`;
    } catch (_) {
        return tBattleSafe("battle_boosters_snapshot_hint", "Applies when the battle starts");
    }
}

function obtenerRestanteBeneficioBattleMs(expiraEn) {
    const expiraMs = Date.parse(expiraEn || "");
    if (!Number.isFinite(expiraMs)) return 0;
    return Math.max(0, expiraMs - Date.now());
}

async function cargarBeneficiosActivosBattle(silencioso = true) {
    if (!getAccessToken()) {
        battleBeneficiosActivos = [];
        renderBattleBoostersBanner();
        return [];
    }

    if (battleBeneficiosSyncEnProceso) {
        return battleBeneficiosActivos;
    }

    battleBeneficiosSyncEnProceso = true;
    try {
        const data = await obtenerBeneficiosActivosBattleApi();
        battleBeneficiosActivos = Array.isArray(data?.beneficios) ? data.beneficios : [];
        renderBattleBoostersBanner();
        return battleBeneficiosActivos;
    } catch (error) {
        console.warn("No se pudieron cargar los boosters activos de batalla:", error);
        battleBeneficiosActivos = [];
        renderBattleBoostersBanner();
        if (!silencioso) {
            mostrarModalBattle(error?.message || tBattleSafe("battle_boosters_load_error", "The active battle boosters could not be loaded."), "error");
        }
        return [];
    } finally {
        battleBeneficiosSyncEnProceso = false;
    }
}

function calcularResumenEquipoBattle() {
    if (!battleEquipo.length) {
        return {
            promedioNivel: "—",
            tipoDominante: "—",
            resumenAtaque: t("battle_attack_summary_empty"),
            resumenBalance: t("battle_balance_summary_empty"),
            resumenVelocidad: t("battle_speed_summary_empty")
        };
    }

    const sumaNiveles = battleEquipo.reduce((acc, p) => acc + Number(p.nivel || 0), 0);
    const promedioNivel = Math.round(sumaNiveles / battleEquipo.length);

    const sumaAtaque = battleEquipo.reduce((acc, p) => acc + Number(p.ataque || 0), 0);
    const sumaDefensa = battleEquipo.reduce((acc, p) => acc + Number(p.defensa || 0), 0);
    const sumaVelocidad = battleEquipo.reduce((acc, p) => acc + Number(p.velocidad || 0), 0);
    const promedioVelocidad = Math.round(sumaVelocidad / battleEquipo.length);

    const contadorTipos = {};
    battleEquipo.forEach(p => {
        const tipos = String(p.tipo || "")
            .split("/")
            .map(t => t.trim())
            .filter(Boolean);

        tipos.forEach(tipo => {
            contadorTipos[tipo] = (contadorTipos[tipo] || 0) + 1;
        });
    });

    let tipoDominante = "—";
    let max = 0;

    for (const [tipo, cantidad] of Object.entries(contadorTipos)) {
        if (cantidad > max) {
            max = cantidad;
            tipoDominante = tipo;
        }
    }

    let resumenAtaque = t("battle_attack_profile_empty");
    if (sumaAtaque >= 500) resumenAtaque = t("battle_attack_profile_strong");
    else if (sumaAtaque >= 350) resumenAtaque = t("battle_attack_profile_mid");
    else resumenAtaque = t("battle_attack_profile_low");

    let resumenBalance = t("battle_balance_building");
    if (sumaDefensa > sumaAtaque + 80) resumenBalance = t("battle_balance_defensive");
    else if (sumaAtaque > sumaDefensa + 80) resumenBalance = t("battle_balance_offensive");
    else resumenBalance = t("battle_balance_mixed");

    const resumenVelocidad = formatBattleText("battle_speed_avg_summary", {
        speed: promedioVelocidad,
        extra: promedioVelocidad >= 70 ? t("battle_speed_fast_suffix") : t("battle_speed_slow_suffix")
    });

    return {
        promedioNivel,
        tipoDominante,
        resumenAtaque,
        resumenBalance,
        resumenVelocidad
    };
}

/* =========================
   COLECCIÓN
========================= */
function poblarFiltroTiposBattle() {
    const select = document.getElementById("filtroTipoBattle");
    if (!select) return;

    const valorActual = select.value;
    const tipos = new Set();

    battlePokemonUsuario.forEach(p => {
        String(p.tipo || "")
            .split("/")
            .map(t => t.trim())
            .filter(Boolean)
            .forEach(tipo => tipos.add(tipo));
    });

    const opciones = [`<option value="">${t("battle_all_types")}</option>`]
        .concat(
            Array.from(tipos)
                .sort((a, b) => a.localeCompare(b))
                .map(tipo => `<option value="${escapeHtmlBattle(tipo)}">${escapeHtmlBattle(traducirTipoBattle(tipo))}</option>`)
        );

    select.innerHTML = opciones.join("");

    const existeValor = Array.from(select.options).some(option => option.value === valorActual);
    select.value = existeValor ? valorActual : "";
}

function renderColeccionBattleLoading() {
    const container = document.getElementById("coleccionBattle");
    if (!container) return;

    container.innerHTML = `
        <div class="battle-empty-state">
            <h4>${t("battle_loading_collection_title")}</h4>
            <p>${t("battle_loading_collection_text")}</p>
        </div>
    `;
}

function renderColeccionBattleError() {
    const container = document.getElementById("coleccionBattle");
    if (!container) return;

    container.innerHTML = `
        <div class="battle-empty-state">
            <h4>${t("battle_collection_error_title")}</h4>
            <p>${t("battle_collection_error_text")}</p>
        </div>
    `;
}

function renderColeccionBattle() {
    const container = document.getElementById("coleccionBattle");
    const buscador = document.getElementById("buscarPokemonBattle");
    const filtroTipo = document.getElementById("filtroTipoBattle");
    const filtroEstado = document.getElementById("filtroEstadoBattle");
    const filtroOrden = document.getElementById("filtroOrdenBattle");

    if (!container) return;

    const termino = (buscador?.value || "").trim().toLowerCase();
    const tipoFiltro = (filtroTipo?.value || "").trim().toLowerCase();
    const estadoFiltro = (filtroEstado?.value || "todos").trim().toLowerCase();
    const ordenFiltro = (filtroOrden?.value || "id_pokemon").trim().toLowerCase();

    let filtrados = battlePokemonUsuario.filter(pokemon => {
        const nombreOk = String(pokemon.nombre || "").toLowerCase().includes(termino);

        const tipos = String(pokemon.tipo || "")
            .toLowerCase()
            .split("/")
            .map(t => t.trim());

        const tipoOk = !tipoFiltro || tipos.includes(tipoFiltro);

        let estadoOk = true;
        if (estadoFiltro === "normal") estadoOk = !pokemon.es_shiny;
        else if (estadoFiltro === "shiny") estadoOk = !!pokemon.es_shiny;

        return nombreOk && tipoOk && estadoOk;
    });

    if (battleTabActual === "equipo") {
        filtrados = filtrados.filter(p => battleEquipo.some(x => Number(x.id) === Number(p.id)));
    } else if (battleTabActual === "disponibles") {
        filtrados = filtrados.filter(p => !battleEquipo.some(x => Number(x.id) === Number(p.id)));
    } else if (battleTabActual === "shiny") {
        filtrados = filtrados.filter(p => !!p.es_shiny);
    }

    filtrados.sort((a, b) => compararPokemonBattle(a, b, ordenFiltro));

    if (!filtrados.length) {
        container.innerHTML = `
            <div class="battle-empty-state">
                <h4>${t("battle_empty_filtered_title")}</h4>
                <p>${t("battle_empty_filtered_text")}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtrados.map(pokemon => {
        const yaEnEquipo = battleEquipo.some(p => Number(p.id) === Number(pokemon.id));
        const equipoLleno = battleEquipo.length >= 6;
        const deshabilitado = yaEnEquipo || equipoLleno;

        const imagen = pokemon.es_shiny
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.pokemon_id}.png`
            : (pokemon.imagen || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`);

        const claseTipo = obtenerClaseTipoBattle(pokemon.tipo);
        const expActual = calcularExpActualBattle(pokemon);
        const expObjetivo = calcularExpObjetivoBattle(pokemon.nivel);
        const expPercent = calcularExpPercentBattle(pokemon);

        return `
            <article class="battle-pokemon-card ${yaEnEquipo ? "selected" : ""} ${claseTipo}">
                <img src="${imagen}" alt="${escapeHtmlBattle(pokemon.nombre)}" class="battle-pokemon-sprite">

                <div class="battle-card-name-row">
                    <h4>${escapeHtmlBattle(pokemon.nombre)}</h4>
                    ${pokemon.es_shiny ? `<span class="battle-card-shiny-dot" title="${t("battle_shiny_title")}">✦</span>` : ""}
                </div>

                <p>${escapeHtmlBattle(traducirTipoBattle(pokemon.tipo || "—"))}</p>

                <div class="battle-card-meta battle-card-meta-pro">
                    <span class="battle-card-level">${t("battle_level_short")} ${pokemon.nivel ?? "—"}</span>
                    <span class="battle-card-hp">${t("battle_stat_hp_short")} ${pokemon.hp_actual ?? pokemon.hp_max ?? "—"}</span>
                    <span class="battle-card-atk">${t("battle_stat_atk_short")} ${pokemon.ataque ?? "—"}</span>
                    <span class="battle-card-def">${t("battle_stat_def_short")} ${pokemon.defensa ?? "—"}</span>
                </div>

                <div class="battle-card-exp-wrap">
                    <div class="battle-card-exp-label">${t("battle_exp_label")} ${expActual} / ${expObjetivo}</div>
                    <div class="battle-card-exp-bar">
                        <div class="battle-card-exp-fill" style="width:${expPercent}%"></div>
                    </div>
                </div>

                <button
                    type="button"
                    class="battle-card-btn ${yaEnEquipo ? "in-team" : ""}"
                    data-add-pokemon-id="${pokemon.id}"
                    ${deshabilitado ? "disabled" : ""}
                >
                    ${yaEnEquipo ? t("battle_in_team") : equipoLleno ? t("battle_team_full_short") : t("battle_add_button")}
                </button>
            </article>
        `;
    }).join("");
}

function compararPokemonBattle(a, b, orden) {
    if (orden === "hp") return Number(b.hp_max || b.hp_actual || 0) - Number(a.hp_max || a.hp_actual || 0);
    if (orden === "atk") return Number(b.ataque || 0) - Number(a.ataque || 0);
    if (orden === "def") return Number(b.defensa || 0) - Number(a.defensa || 0);
    if (orden === "nivel") return Number(b.nivel || 0) - Number(a.nivel || 0);
    if (orden === "reciente") {
        const fechaA = a.fecha_captura ? new Date(a.fecha_captura).getTime() : 0;
        const fechaB = b.fecha_captura ? new Date(b.fecha_captura).getTime() : 0;
        return fechaB - fechaA;
    }

    return Number(a.pokemon_id || 0) - Number(b.pokemon_id || 0);
}

/* =========================
   ACCIONES
========================= */
async function ejecutarModoSeleccionadoBattle() {
    if (battleModoActual === "boss") return iniciarModoBossBattle();
    if (battleModoActual === "idle") return iniciarModoIdleBattle();
    return iniciarBatallaDemo();
}

async function iniciarBatallaDemo() {
    if (battleEquipo.length !== 6) {
        mostrarModalBattle(t("battle_need_six"), "warning");
        return;
    }

    try {
        const selectDificultad = document.getElementById("battleDificultadRival");
        const bonusNivel = normalizarValorDificultadBattle(selectDificultad?.value || 0);

        await guardarEquipoServidorBattle({ exigirSeis: true });
        registrarActividadBattle("view", `equipo:${battleEquipo.length}`).catch(() => {});

        sessionStorage.setItem(BATTLE_ARENA_PLAYER_TEAM_KEY_SAFE(), JSON.stringify(battleEquipo));
        sessionStorage.setItem("mastersmon_battle_enemy_level_bonus_v1", String(bonusNivel));
        sessionStorage.setItem("mastersmon_battle_arena_difficulty_v1", obtenerCodigoDificultadBattleDesdeBonus(bonusNivel));
        sessionStorage.setItem(BATTLE_ARENA_MODE_KEY, "arena");
        sessionStorage.removeItem("mastersmon_battle_arena_session_token_v1");
        sessionStorage.removeItem("mastersmon_battle_arena_session_expires_v1");
        sessionStorage.removeItem(BATTLE_BOSS_SESSION_TOKEN_KEY);
        sessionStorage.removeItem(BATTLE_BOSS_DATA_KEY);
        sessionStorage.removeItem(BATTLE_BOSS_EVENT_KEY);

        window.location.href = "battle-arena.html?modo=arena";
    } catch (error) {
        console.error("No se pudo preparar la arena de combate:", error);
        mostrarModalBattle(error?.message || t("battle_prepare_combat_error"), "error");
    }
}

async function iniciarModoBossBattle() {
    if (!getAccessToken()) {
        mostrarModalBattle(tBattleSafe("battle_mode_requires_login", "You must sign in first."), "warning");
        return;
    }

    if (battleEquipo.length !== 6) {
        mostrarModalBattle(t("battle_need_six"), "warning");
        return;
    }

    try {
        await guardarEquipoServidorBattle({ exigirSeis: true });
        const data = await iniciarBossBattleApi(obtenerIdsEquipoBattle(), true);

        if (!data?.ok || !data?.boss_session_token || !data?.boss) {
            throw new Error(data?.mensaje || tBattleSafe("battle_boss_start_error", "The Alpha Boss could not be started."));
        }

        sessionStorage.setItem(BATTLE_ARENA_MODE_KEY, "boss");
        sessionStorage.setItem(BATTLE_BOSS_SESSION_TOKEN_KEY, String(data.boss_session_token));
        sessionStorage.setItem(BATTLE_BOSS_DATA_KEY, JSON.stringify(data.boss));
        sessionStorage.setItem(BATTLE_BOSS_EVENT_KEY, JSON.stringify({ boss_evento_id: data.boss_evento_id || null, fecha_evento: data.fecha_evento || null }));
        sessionStorage.setItem(BATTLE_ARENA_PLAYER_TEAM_KEY_SAFE(), JSON.stringify(Array.isArray(data.snapshot_equipo) ? data.snapshot_equipo : battleEquipo));

        window.location.href = "battle-arena.html?modo=boss";
    } catch (error) {
        console.error("No se pudo iniciar el Boss:", error);
        mostrarModalBattle(error?.message || tBattleSafe("battle_boss_start_error", "The Alpha Boss could not be started."), "error");
    }
}

async function iniciarModoIdleBattle() {
    if (!getAccessToken()) {
        mostrarModalBattle(tBattleSafe("battle_mode_requires_login", "You must sign in first."), "warning");
        return;
    }

    if (battleEquipo.length !== 6) {
        mostrarModalBattle(t("battle_need_six"), "warning");
        return;
    }

    if (battleIdleEstadoActual?.sesion && ["activa", "reclamable"].includes(String(battleIdleEstadoActual.sesion.estado || ""))) {
        mostrarModalBattle(tBattleSafe("battle_idle_active_message_fixed", "You already have an active Idle Expedition."), "info");
        return;
    }

    try {
        await guardarEquipoServidorBattle({ exigirSeis: true });
        const tierCodigo = document.getElementById("battleIdleTier")?.value || "ruta";
        const duracionSegundos = Number(document.getElementById("battleIdleDuration")?.value || 3600);
        const data = await iniciarIdleBattleApi(tierCodigo, duracionSegundos, obtenerIdsEquipoBattle(), true);

        if (!data?.ok || !data?.idle_session_token) {
            throw new Error(data?.mensaje || tBattleSafe("battle_idle_start_error", "The Idle Expedition could not be started."));
        }

        sessionStorage.setItem(BATTLE_IDLE_SESSION_KEY, String(data.idle_session_token));
        await cargarEstadoIdleBattle(true);
        seleccionarModoBattle("idle", { persistir: true, refrescar: true });
        mostrarModalBattle(tBattleSafe("battle_idle_started_ok", "Idle Expedition started successfully."), "ok");
    } catch (error) {
        console.error("No se pudo iniciar el modo Idle:", error);
        mostrarModalBattle(error?.message || tBattleSafe("battle_idle_start_error", "The Idle Expedition could not be started."), "error");
    }
}

async function reclamarIdleBattle() {
    if (!getAccessToken()) {
        mostrarModalBattle(tBattleSafe("battle_mode_requires_login", "You must sign in first."), "warning");
        return;
    }

    try {
        const data = await reclamarIdleBattleApi();
        if (!data?.ok) {
            throw new Error(data?.mensaje || tBattleSafe("battle_idle_claim_error", "Idle rewards could not be claimed."));
        }

        if (typeof data.pokedolares_actuales !== "undefined") {
            localStorage.setItem("usuario_pokedolares", String(data.pokedolares_actuales));
        }

        sessionStorage.removeItem(BATTLE_IDLE_SESSION_KEY);
        await cargarEstadoIdleBattle(true);

        const resultado = data?.resultado || {};
        mostrarModalBattle(
            formatBattleText("battle_idle_claimed_text", {
                coins: Number(resultado?.pokedolares_ganados || 0),
                exp: Number(resultado?.exp_ganada || 0),
                wins: Number(resultado?.victorias_estimadas || 0)
            }),
            "ok"
        );
    } catch (error) {
        console.error("No se pudo reclamar Idle:", error);
        mostrarModalBattle(error?.message || tBattleSafe("battle_idle_claim_error", "Idle rewards could not be claimed."), "error");
    }
}

async function cancelarIdleBattle() {
    if (!getAccessToken()) {
        mostrarModalBattle(tBattleSafe("battle_mode_requires_login", "You must sign in first."), "warning");
        return;
    }

    if (!battleIdleEstadoActual?.sesion?.token) {
        mostrarModalBattle(tBattleSafe("battle_idle_status_idle", "No active Idle Expedition."), "info");
        return;
    }

    mostrarConfirmacionBattle({
        titulo: tBattleSafe("battle_idle_cancel_title", "Cancel Idle Expedition?"),
        mensaje: tBattleSafe("battle_idle_cancel_confirm", "Your current Idle Expedition will be cancelled and no rewards will be granted."),
        textoAceptar: tBattleSafe("battle_idle_cancel", "Cancel idle"),
        tipo: "warning",
        onConfirm: async () => {
            try {
                const data = await cancelarIdleBattleApi(battleIdleEstadoActual?.sesion?.token || "");
                if (!data?.ok) {
                    throw new Error(data?.mensaje || tBattleSafe("battle_idle_cancel_error", "The Idle Expedition could not be cancelled."));
                }

                sessionStorage.removeItem(BATTLE_IDLE_SESSION_KEY);
                await cargarEstadoIdleBattle(true);
                mostrarModalBattle(tBattleSafe("battle_idle_cancelled", "Idle Expedition cancelled."), "warning");
            } catch (error) {
                console.error("No se pudo cancelar Idle:", error);
                mostrarModalBattle(error?.message || tBattleSafe("battle_idle_cancel_error", "The Idle Expedition could not be cancelled."), "error");
            }
        }
    });
}

/* =========================
   MODOS / BOSS / IDLE
========================= */
function BATTLE_ARENA_PLAYER_TEAM_KEY_SAFE() {
    return "mastersmon_battle_arena_team_v1";
}

function cargarModoBattle() {
    const guardado = localStorage.getItem(BATTLE_MODE_STORAGE_KEY) || sessionStorage.getItem(BATTLE_MODE_STORAGE_KEY) || "arena";
    if (esVistaBattleIAFija()) {
        battleModoActual = "arena";
    } else {
        battleModoActual = ["arena", "boss", "idle"].includes(String(guardado).toLowerCase()) ? String(guardado).toLowerCase() : "arena";
    }
    actualizarUISelectorModoBattle();
}

function persistirModoBattle() {
    localStorage.setItem(BATTLE_MODE_STORAGE_KEY, battleModoActual);
    sessionStorage.setItem(BATTLE_MODE_STORAGE_KEY, battleModoActual);
}

function seleccionarModoBattle(modo = "arena", opciones = {}) {
    const { persistir = true, refrescar = true } = opciones;
    battleModoActual = ["arena", "boss", "idle"].includes(String(modo).toLowerCase()) ? String(modo).toLowerCase() : "arena";
    if (persistir) persistirModoBattle();
    actualizarUISelectorModoBattle();
    actualizarEstadoModoSeleccionadoBattle();
    if (refrescar) {
        renderPanelModoActualBattle();
        renderBossBattle();
        renderIdleBattle();
    }
}

function actualizarUISelectorModoBattle() {
    document.querySelectorAll("[data-battle-mode]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.battleMode === battleModoActual);
    });
}

function actualizarEstadoModoSeleccionadoBattle() {
    const btnIniciar = document.getElementById("btnIniciarBatalla");
    const selectDificultad = document.getElementById("battleDificultadRival");
    const diffCard = document.getElementById("battleDifficultyCard");

    if (selectDificultad) selectDificultad.disabled = battleModoActual !== "arena";
    if (diffCard) diffCard.classList.toggle("battle-mode-hidden", battleModoActual !== "arena");

    if (btnIniciar) {
        const key = battleModoActual === "boss" ? "battle_start_boss" : battleModoActual === "idle" ? "battle_start_idle" : "battle_start_arena";
        btnIniciar.textContent = tBattleSafe(key, battleModoActual === "boss" ? "Enter Boss" : battleModoActual === "idle" ? "Start idle" : "Start battle");
    }
}

function renderPanelModoActualBattle() {
    const pill = document.getElementById("battleModoActualPill");
    const nombre = document.getElementById("battleModoActualNombre");
    const descripcion = document.getElementById("battleModoActualDescripcion");
    const hint = document.getElementById("battleModoActualHint");
    if (!pill || !nombre || !descripcion || !hint) return;

    if (battleModoActual === "boss") {
        pill.textContent = tBattleSafe("battle_mode_boss_title", "Alpha Boss");
        nombre.textContent = tBattleSafe("battle_mode_boss_title", "Alpha Boss");
        descripcion.textContent = tBattleSafe("battle_mode_boss_desc", "Use your 6 Pokémon against a single Alpha Boss that opens at 20:00 server time.");
        hint.textContent = tBattleSafe("battle_mode_start_hint_boss", "Save your team and enter during the event window.");
        return;
    }

    if (battleModoActual === "idle") {
        pill.textContent = tBattleSafe("battle_mode_idle_title", "Idle Expedition");
        nombre.textContent = tBattleSafe("battle_mode_idle_title", "Idle Expedition");
        descripcion.textContent = tBattleSafe("battle_mode_idle_desc", "Send your team to farm EXP, Pokédollars and items over time.");
        hint.textContent = tBattleSafe("battle_mode_start_hint_idle", "Start the expedition and return later to claim the rewards.");
        return;
    }

    pill.textContent = tBattleSafe("battle_mode_arena_title", "Tactical Arena");
    nombre.textContent = tBattleSafe("battle_mode_arena_title", "Tactical Arena");
    descripcion.textContent = tBattleSafe("battle_mode_arena_desc", "Classic 6 vs 6 turn-based battle with selectable difficulty.");
    hint.textContent = tBattleSafe("battle_mode_start_hint_arena", "Save your team and enter the arena.");
}

function iniciarRelojModosBattle() {
    detenerRelojModosBattle();
    battleModosTimer = window.setInterval(actualizarTemporizadoresLocalesBattle, 1000);
}

function detenerRelojModosBattle() {
    if (battleModosTimer) {
        window.clearInterval(battleModosTimer);
        battleModosTimer = null;
    }
}

function actualizarTemporizadoresLocalesBattle() {
    if (esVistaBattleIABattle()) return;
    if (battleBossEstadoActual?.hora_inicio && battleBossEstadoActual?.hora_fin) {
        const ahora = Date.now();
        const inicioMs = Date.parse(battleBossEstadoActual.hora_inicio);
        const finMs = Date.parse(battleBossEstadoActual.hora_fin);
        if (Number.isFinite(inicioMs) && Number.isFinite(finMs)) {
            battleBossEstadoActual.segundos_para_inicio = Math.max(0, Math.floor((inicioMs - ahora) / 1000));
            battleBossEstadoActual.segundos_para_fin = Math.max(0, Math.floor((finMs - ahora) / 1000));
            battleBossEstadoActual.activo = ahora >= inicioMs && ahora < finMs;
            battleBossEstadoActual.estado = battleBossEstadoActual.activo ? "activo" : (ahora < inicioMs ? "programado" : "cerrado");
        }
    }

    if (battleIdleEstadoActual?.sesion?.termina_en) {
        const terminaMs = Number.isFinite(battleIdleEndsAtMs) && battleIdleEndsAtMs > 0
            ? battleIdleEndsAtMs
            : Date.parse(battleIdleEstadoActual.sesion.termina_en);
        const iniciaMs = Number.isFinite(battleIdleStartsAtMs) && battleIdleStartsAtMs > 0
            ? battleIdleStartsAtMs
            : Date.parse(battleIdleEstadoActual.sesion.iniciado_en || battleIdleEstadoActual.sesion.termina_en);

        if (Number.isFinite(terminaMs)) {
            const ahoraServidorMs = obtenerAhoraServidorIdleBattleMs();
            const restante = Math.max(0, Math.floor((terminaMs - ahoraServidorMs) / 1000));
            const total = Math.max(1, Math.floor((terminaMs - (Number.isFinite(iniciaMs) ? iniciaMs : ahoraServidorMs)) / 1000));
            const transcurrido = Math.max(0, total - restante);

            battleIdleEstadoActual.sesion.segundos_restantes = restante;
            battleIdleEstadoActual.sesion.progreso_pct = Math.max(0, Math.min(100, Math.round((transcurrido / total) * 100)));

            if (restante <= 0) {
                if (battleIdleEstadoActual.sesion.estado === "activa") {
                    battleIdleEstadoActual.sesion.estado = "reclamable";
                }

                if (!battleIdleCountdownFinalizado) {
                    battleIdleCountdownFinalizado = true;
                    refrescarEstadoIdleBattleSilencioso(true);
                }
            } else {
                battleIdleCountdownFinalizado = false;
                if ((Date.now() - battleIdleUltimaSincronizacionMs) >= 45000) {
                    refrescarEstadoIdleBattleSilencioso(false);
                }
            }
        }
    }

    if (obtenerBoostersBatallaActivosBattle().some(item => obtenerRestanteBeneficioBattleMs(item?.expira_en) <= 0) && !battleBeneficiosSyncEnProceso) {
        cargarBeneficiosActivosBattle(true);
    }

    renderBossBattle();
    renderIdleBattle();
    renderBattleBoostersBanner();
}

async function cargarEstadoBossBattle(silencioso = true) {
    if (!getAccessToken()) {
        battleBossEstadoActual = null;
        battleBossRankingActual = [];
        renderBossBattle();
        return null;
    }

    try {
        const [estado, ranking] = await Promise.all([
            obtenerEstadoBossBattleApi(),
            obtenerRankingBossBattleApi(8).catch(() => ({ ranking: [] }))
        ]);
        battleBossEstadoActual = estado || null;
        battleBossRankingActual = Array.isArray(ranking?.ranking) ? ranking.ranking : [];
        renderBossBattle();
        return estado;
    } catch (error) {
        if (!silencioso) {
            mostrarModalBattle(error?.message || tBattleSafe("battle_boss_load_error", "The Alpha Boss state could not be loaded."), "error");
        }
        battleBossEstadoActual = { ok: false, activo: false, error: error?.message || "error" };
        battleBossRankingActual = [];
        renderBossBattle();
        return null;
    }
}

function renderBossBattle() {
    const badge = document.getElementById("battleBossEstadoBadge");
    const nombre = document.getElementById("battleBossNombre");
    const descripcion = document.getElementById("battleBossDescripcion");
    const timerLabel = document.getElementById("battleBossTimerLabel");
    const timer = document.getElementById("battleBossTimer");
    const damage = document.getElementById("battleBossDamage");
    const btnBoss = document.getElementById("btnIniciarBoss");
    const rankingBox = document.getElementById("battleBossRankingList");
    if (!badge || !nombre || !descripcion || !timerLabel || !timer || !damage || !btnBoss || !rankingBox) return;

    if (!getAccessToken()) {
        badge.textContent = tBattleSafe("battle_boss_login_badge", "Login");
        nombre.textContent = tBattleSafe("battle_mode_boss_title", "Alpha Boss");
        descripcion.textContent = tBattleSafe("battle_boss_login_text", "Sign in to view today’s Alpha Boss event.");
        timerLabel.textContent = tBattleSafe("battle_boss_starts_in", "Starts in");
        timer.textContent = "—";
        damage.textContent = "—";
        btnBoss.disabled = true;
        btnBoss.textContent = tBattleSafe("battle_boss_enter", "Enter Boss");
        rankingBox.innerHTML = `<div class="battle-ranking-empty">${escapeHtmlBattle(tBattleSafe("battle_boss_ranking_empty", "No Boss attempts yet."))}</div>`;
        return;
    }

    const estado = battleBossEstadoActual || {};
    const participacion = estado?.participacion || null;
    const boss = estado?.boss || null;
    nombre.textContent = boss?.nombre || tBattleSafe("battle_mode_boss_title", "Alpha Boss");
    descripcion.textContent = boss?.descripcion || tBattleSafe("battle_mode_boss_desc", "Use your 6 Pokémon against a single Alpha Boss that opens at 20:00 server time.");
    damage.textContent = participacion ? String(Number(participacion.damage_total || 0)) : "0";

    if (participacion?.reclamado_en) {
        badge.textContent = tBattleSafe("battle_boss_status_done", "Completed");
        timerLabel.textContent = tBattleSafe("battle_boss_schedule", "Schedule");
        timer.textContent = tBattleSafe("battle_boss_schedule_value", "20:00 server");
        btnBoss.disabled = true;
        btnBoss.textContent = tBattleSafe("battle_boss_status_done", "Completed");
    } else if (estado?.activo) {
        badge.textContent = tBattleSafe("battle_boss_status_active", "Active");
        timerLabel.textContent = tBattleSafe("battle_boss_ends_in", "Ends in");
        timer.textContent = formatSecondsBattle(Number(estado?.segundos_para_fin || 0));
        btnBoss.disabled = false;
        btnBoss.textContent = tBattleSafe("battle_boss_enter", "Enter Boss");
    } else {
        badge.textContent = tBattleSafe("battle_boss_status_closed", "Closed");
        timerLabel.textContent = tBattleSafe("battle_boss_starts_in", "Starts in");
        timer.textContent = Number(estado?.segundos_para_inicio || 0) > 0 ? formatSecondsBattle(Number(estado?.segundos_para_inicio || 0)) : tBattleSafe("battle_boss_schedule_value", "20:00 server");
        btnBoss.disabled = true;
        btnBoss.textContent = tBattleSafe("battle_boss_enter", "Enter Boss");
    }

    if (!battleBossRankingActual.length) {
        rankingBox.innerHTML = `<div class="battle-ranking-empty">${escapeHtmlBattle(tBattleSafe("battle_boss_ranking_empty", "No Boss attempts yet."))}</div>`;
        return;
    }

    rankingBox.innerHTML = battleBossRankingActual.slice(0, 8).map(item => {
        const porcentaje = Number(item?.boss_hp_total || 0) > 0 ? Math.min(100, Math.round((Number(item.damage_total || 0) / Number(item.boss_hp_total || 1)) * 100)) : 0;
        return `
            <div class="battle-boss-ranking-item">
                <div class="battle-boss-ranking-left">
                    <div class="battle-boss-ranking-place">${item.puesto ?? "-"}</div>
                    <div>
                        <div class="battle-boss-ranking-name">${escapeHtmlBattle(item.nombre || tBattleSafe("maps_trainer_default", "Trainer"))}</div>
                        <span class="battle-boss-ranking-meta">${porcentaje}% HP</span>
                    </div>
                </div>
                <div class="battle-boss-ranking-right">
                    <strong>${Number(item.damage_total || 0).toLocaleString()}</strong>
                    <span>${escapeHtmlBattle(tBattleSafe("battle_boss_top_damage", "Damage"))}</span>
                    ${item.boss_derrotado ? `<div class="battle-boss-clear-badge">${escapeHtmlBattle(tBattleSafe("battle_boss_defeated_badge", "Cleared"))}</div>` : ""}
                </div>
            </div>`;
    }).join("");
}

async function cargarEstadoIdleBattle(silencioso = true) {
    if (!getAccessToken()) {
        registrarEstadoIdleBattle(null);
        renderIdleBattle();
        return null;
    }
    try {
        const data = await obtenerEstadoIdleBattleApi();
        registrarEstadoIdleBattle(data || null);
        renderIdleBattle();
        return data;
    } catch (error) {
        if (!silencioso) {
            mostrarModalBattle(error?.message || tBattleSafe("battle_idle_load_error", "The Idle Expedition state could not be loaded."), "error");
        }
        registrarEstadoIdleBattle({ ok: false, activa: false, sesion: null, error: error?.message || "error" });
        renderIdleBattle();
        return null;
    }
}

function renderIdleBattle() {
    const badge = document.getElementById("battleIdleEstadoBadge");
    const tier = document.getElementById("battleIdleTier");
    const duration = document.getElementById("battleIdleDuration");
    const timerLabel = document.getElementById("battleIdleTimerLabel");
    const timer = document.getElementById("battleIdleTimer");
    const progressFill = document.getElementById("battleIdleProgressFill");
    const progressText = document.getElementById("battleIdleProgressText");
    const btnStart = document.getElementById("btnIniciarIdle");
    const btnClaim = document.getElementById("btnReclamarIdle");
    const btnCancel = document.getElementById("btnCancelarIdle");
    if (!badge || !tier || !duration || !timerLabel || !timer || !progressFill || !progressText || !btnStart || !btnClaim || !btnCancel) return;

    if (!getAccessToken()) {
        badge.textContent = tBattleSafe("battle_boss_login_badge", "Login");
        timerLabel.textContent = tBattleSafe("battle_idle_remaining", "Remaining");
        timer.textContent = "—";
        progressFill.style.width = "0%";
        progressText.textContent = tBattleSafe("battle_idle_login_text", "Sign in to use Idle Expedition.");
        btnStart.disabled = true;
        btnClaim.disabled = true;
        btnCancel.disabled = true;
        tier.disabled = false;
        duration.disabled = false;
        return;
    }

    const sesion = battleIdleEstadoActual?.sesion || null;
    if (!sesion || !battleIdleEstadoActual?.activa) {
        badge.textContent = tBattleSafe("battle_idle_status_idle", "Ready");
        timerLabel.textContent = tBattleSafe("battle_idle_remaining", "Remaining");
        timer.textContent = "—";
        progressFill.style.width = "0%";
        progressText.textContent = tBattleSafe("battle_idle_status_idle_text", "Choose a tier and duration, then start the expedition.");
        btnStart.disabled = false;
        btnClaim.disabled = true;
        btnCancel.disabled = true;
        tier.disabled = false;
        duration.disabled = false;
        return;
    }

    const estado = String(sesion.estado || "activa").toLowerCase();
    const progreso = Math.max(0, Math.min(100, Number(sesion.progreso_pct || 0)));
    progressFill.style.width = `${progreso}%`;
    timer.textContent = formatSecondsBattle(Number(sesion.segundos_restantes || 0));
    tier.value = sesion.tier_codigo || tier.value;
    duration.value = String(sesion.duracion_segundos || duration.value || 3600);
    tier.disabled = true;
    duration.disabled = true;

    if (estado === "reclamable") {
        badge.textContent = tBattleSafe("battle_idle_status_ready", "Ready");
        timerLabel.textContent = tBattleSafe("battle_idle_progress", "Progress");
        timer.textContent = "100%";
        progressText.textContent = tBattleSafe("battle_idle_ready_message", "Your rewards are ready to claim.");
        btnStart.disabled = true;
        btnClaim.disabled = false;
        btnCancel.disabled = true;
        return;
    }

    badge.textContent = tBattleSafe("battle_idle_status_active", "Active");
    timerLabel.textContent = tBattleSafe("battle_idle_remaining", "Remaining");
    progressText.textContent = formatBattleText("battle_idle_active_message", { tier: traducirTierIdleBattle(sesion.tier_codigo), progress: progreso });
    btnStart.disabled = true;
    btnClaim.disabled = true;
    btnCancel.disabled = false;
}

function traducirTierIdleBattle(codigo = "ruta") {
    const valor = String(codigo || "ruta").toLowerCase();
    if (valor === "legend") return tBattleSafe("battle_idle_tier_legend", "Legend");
    if (valor === "elite") return tBattleSafe("battle_idle_tier_elite", "Elite");
    return tBattleSafe("battle_idle_tier_ruta", "Route");
}

function registrarEstadoIdleBattle(data = null) {
    battleIdleEstadoActual = data || null;
    battleIdleUltimaSincronizacionMs = Date.now();
    battleIdleCountdownFinalizado = false;

    if (!data?.sesion) {
        battleIdleServerOffsetMs = 0;
        battleIdleStartsAtMs = 0;
        battleIdleEndsAtMs = 0;
        return;
    }

    const horaServerMs = Date.parse(data?.hora_server || "");
    if (Number.isFinite(horaServerMs)) {
        battleIdleServerOffsetMs = horaServerMs - Date.now();
    }

    battleIdleStartsAtMs = Date.parse(data?.sesion?.iniciado_en || "") || 0;
    battleIdleEndsAtMs = Date.parse(data?.sesion?.termina_en || "") || 0;
}

function obtenerAhoraServidorIdleBattleMs() {
    return Date.now() + Number(battleIdleServerOffsetMs || 0);
}

async function refrescarEstadoIdleBattleSilencioso(forzar = false) {
    if (!getAccessToken()) return null;
    if (battleIdleSyncEnProceso) return null;

    const ahoraLocalMs = Date.now();
    if (!forzar && (ahoraLocalMs - battleIdleUltimaSincronizacionMs) < 45000) {
        return null;
    }

    battleIdleSyncEnProceso = true;
    if (!forzar) {
        battleIdleUltimaSincronizacionMs = ahoraLocalMs;
    }

    try {
        return await cargarEstadoIdleBattle(true);
    } catch (error) {
        console.warn("No se pudo refrescar el estado Idle en segundo plano:", error);
        return null;
    } finally {
        battleIdleSyncEnProceso = false;
    }
}

function formatSecondsBattle(seconds = 0) {
    const total = Math.max(0, Number(seconds || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

async function obtenerBeneficiosActivosBattleApi() {
    if (typeof obtenerBeneficiosActivos === "function") return await obtenerBeneficiosActivos();
    return await fetchBattleAuth(`${API_BASE}/payments/beneficios/activos`);
}

async function obtenerEstadoBossBattleApi() {
    if (typeof obtenerEstadoBossMundo === "function") return await obtenerEstadoBossMundo();
    return await fetchBattleAuth(`${API_BASE}/battle/boss/estado`);
}

async function obtenerRankingBossBattleApi(limit = 8) {
    if (typeof obtenerRankingBossMundo === "function") return await obtenerRankingBossMundo(limit);
    return await fetchBattleAuth(`${API_BASE}/battle/boss/ranking?limit=${encodeURIComponent(limit)}`);
}

async function iniciarBossBattleApi(usuarioPokemonIds = [], guardarEquipo = true) {
    if (typeof iniciarBossMundo === "function") return await iniciarBossMundo(usuarioPokemonIds, guardarEquipo);
    return await fetchBattleAuth(`${API_BASE}/battle/boss/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_pokemon_ids: Array.isArray(usuarioPokemonIds) ? usuarioPokemonIds : null, guardar_equipo: Boolean(guardarEquipo) })
    });
}

async function obtenerEstadoIdleBattleApi() {
    if (typeof obtenerEstadoIdle === "function") return await obtenerEstadoIdle();
    return await fetchBattleAuth(`${API_BASE}/battle/idle/estado`);
}

async function iniciarIdleBattleApi(tierCodigo = "ruta", duracionSegundos = 3600, usuarioPokemonIds = [], guardarEquipo = true) {
    if (typeof iniciarModoIdle === "function") return await iniciarModoIdle(tierCodigo, duracionSegundos, usuarioPokemonIds, guardarEquipo);
    return await fetchBattleAuth(`${API_BASE}/battle/idle/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier_codigo: tierCodigo, duracion_segundos: duracionSegundos, usuario_pokemon_ids: Array.isArray(usuarioPokemonIds) ? usuarioPokemonIds : null, guardar_equipo: Boolean(guardarEquipo) })
    });
}

async function reclamarIdleBattleApi() {
    if (typeof reclamarModoIdle === "function") return await reclamarModoIdle();
    return await fetchBattleAuth(`${API_BASE}/battle/idle/reclamar`, { method: "POST" });
}

async function cancelarIdleBattleApi(idleSessionToken = "") {
    if (typeof cancelarModoIdle === "function") return await cancelarModoIdle(idleSessionToken);
    return await fetchBattleAuth(`${API_BASE}/battle/idle/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idle_session_token: String(idleSessionToken || "") })
    });
}

function obtenerCatalogoPagosBattleCompat() {
    if (typeof obtenerCatalogoPagos === "function") {
        return obtenerCatalogoPagos();
    }
    return fetchBattleAuth(`${API_BASE}/payments/catalogo`);
}

async function cargarCatalogoPremiumBattle(force = false) {
    if (!getAccessToken()) {
        battlePremiumProductosCatalogo = [];
        return [];
    }

    if (!force && Array.isArray(battlePremiumProductosCatalogo) && battlePremiumProductosCatalogo.length) {
        return battlePremiumProductosCatalogo;
    }

    const data = await obtenerCatalogoPagosBattleCompat();
    battlePremiumProductosCatalogo = Array.isArray(data?.productos)
        ? data.productos.filter((producto) => [BATTLE_PREMIUM_PRODUCT_CODES.exp, BATTLE_PREMIUM_PRODUCT_CODES.gold].includes(String(producto?.codigo || "")))
        : [];

    return battlePremiumProductosCatalogo;
}

function obtenerProductoPremiumBattle(productCode = "") {
    return (Array.isArray(battlePremiumProductosCatalogo) ? battlePremiumProductosCatalogo : [])
        .find((producto) => String(producto?.codigo || "") === String(productCode || "")) || null;
}

function obtenerTituloPremiumBattle(producto) {
    const codigo = String(producto?.codigo || "");
    if (codigo === BATTLE_PREMIUM_PRODUCT_CODES.exp) return tBattleSafe("pokemart_premium_exp_title", "Pack 5 boosters x2 EXP Battle 24h");
    if (codigo === BATTLE_PREMIUM_PRODUCT_CODES.gold) return tBattleSafe("pokemart_premium_gold_title", "Pack 5 boosters x2 GOLD Battle 24h");
    return producto?.nombre || "Premium";
}

function obtenerDescripcionPremiumBattle(producto) {
    const codigo = String(producto?.codigo || "");
    if (codigo === BATTLE_PREMIUM_PRODUCT_CODES.exp) return tBattleSafe("pokemart_premium_exp_desc", "Receive 5 consumable boosters. Each one activates x2 EXP in Battle for 24 hours after use.");
    if (codigo === BATTLE_PREMIUM_PRODUCT_CODES.gold) return tBattleSafe("pokemart_premium_gold_desc", "Receive 5 consumable boosters. Each one activates x2 GOLD in Battle for 24 hours after use.");
    return producto?.descripcion || producto?.nombre || "";
}

function obtenerTipoPremiumBattle(producto) {
    const tipo = String(producto?.tipo || "").toLowerCase();
    if (tipo === "pack_item") return tBattleSafe("pokemart_premium_type_pack", "Item pack");
    if (tipo === "suscripcion") return tBattleSafe("pokemart_premium_type_subscription", "Subscription");
    if (tipo === "battle_pass") return tBattleSafe("pokemart_premium_type_battle_pass", "Battle Pass");
    return producto?.tipo || tBattleSafe("pokemart_premium_type_premium", "Premium");
}

function obtenerDeliveryPremiumBattle(producto) {
    const tipo = String(producto?.tipo || "").toLowerCase();
    if (tipo === "pack_item") return tBattleSafe("pokemart_premium_delivery_items", "Items added to inventory");
    if (tipo === "suscripcion") return tBattleSafe("pokemart_premium_delivery_benefit", "Benefit linked to account");
    return tBattleSafe("pokemart_premium_delivery_generic", "Delivered after payment");
}

function obtenerHighlightsPremiumBattle(producto) {
    const codigo = String(producto?.codigo || "");
    if (codigo === BATTLE_PREMIUM_PRODUCT_CODES.exp) {
        return [
            tBattleSafe("premium_exp_feature_1", "5 charges in inventory"),
            tBattleSafe("premium_exp_feature_2", "x2 EXP in Battle"),
            tBattleSafe("premium_exp_feature_3", "24h per use"),
            tBattleSafe("premium_exp_feature_4", "Manual activation")
        ];
    }
    return [
        tBattleSafe("premium_gold_feature_1", "5 charges in inventory"),
        tBattleSafe("premium_gold_feature_2", "x2 GOLD in Battle"),
        tBattleSafe("premium_gold_feature_3", "24h per use"),
        tBattleSafe("premium_gold_feature_4", "Manual activation")
    ];
}

function formatearPrecioPremiumBattle(producto) {
    const monto = Number(producto?.precio_usd || 0);
    return `$${monto.toFixed(2)} USD`;
}

function obtenerIconoPremiumBattle(producto) {
    return String(producto?.codigo || "") === BATTLE_PREMIUM_PRODUCT_CODES.gold ? "💰" : "⚡";
}

function mostrarErrorModalCompraPremiumBattle(mensaje = "") {
    const errorBox = document.getElementById("battlePremiumModalError");
    if (!errorBox) return;

    if (!mensaje) {
        errorBox.textContent = "";
        errorBox.classList.add("oculto");
        return;
    }

    errorBox.textContent = mensaje;
    errorBox.classList.remove("oculto");
}

function popularModalCompraPremiumBattle(producto) {
    const icon = document.getElementById("battlePremiumModalIcon");
    const title = document.getElementById("battlePremiumModalTitle");
    const subtitle = document.getElementById("battlePremiumModalSubtitle");
    const badge = document.getElementById("battlePremiumModalBadge");
    const productName = document.getElementById("battlePremiumModalProductName");
    const price = document.getElementById("battlePremiumModalPrice");
    const type = document.getElementById("battlePremiumModalType");
    const delivery = document.getElementById("battlePremiumModalDelivery");
    const description = document.getElementById("battlePremiumModalDescription");
    const highlights = document.getElementById("battlePremiumModalHighlights");
    const confirmText = document.getElementById("battlePremiumModalCheckConfirmText");
    const termsText = document.getElementById("battlePremiumModalCheckTermsText");
    const cancelBtn = document.getElementById("battlePremiumModalCancelBtn");
    const confirmBtn = document.getElementById("battlePremiumModalConfirmBtn");
    const productLabel = document.getElementById("battlePremiumModalProductLabel");
    const priceLabel = document.getElementById("battlePremiumModalPriceLabel");
    const typeLabel = document.getElementById("battlePremiumModalTypeLabel");
    const deliveryLabel = document.getElementById("battlePremiumModalDeliveryLabel");
    const detailsLabel = document.getElementById("battlePremiumModalDetailsLabel");

    if (icon) icon.textContent = obtenerIconoPremiumBattle(producto);
    if (title) title.textContent = tBattleSafe("pokemart_premium_modal_title", "Confirm premium purchase");
    if (subtitle) subtitle.textContent = tBattleSafe("pokemart_premium_modal_subtitle", "Review the product details and authorize the payment before opening PayPal.");
    if (badge) badge.textContent = tBattleSafe("pokemart_premium_tag_booster_pack", "Booster pack");
    if (productLabel) productLabel.textContent = tBattleSafe("pokemart_premium_modal_product", "Product");
    if (priceLabel) priceLabel.textContent = tBattleSafe("pokemart_premium_modal_price", "Price");
    if (typeLabel) typeLabel.textContent = tBattleSafe("pokemart_premium_modal_type", "Type");
    if (deliveryLabel) deliveryLabel.textContent = tBattleSafe("pokemart_premium_modal_delivery", "Delivery");
    if (detailsLabel) detailsLabel.textContent = tBattleSafe("pokemart_premium_modal_details", "Description");
    if (productName) productName.textContent = obtenerTituloPremiumBattle(producto);
    if (price) price.textContent = formatearPrecioPremiumBattle(producto);
    if (type) type.textContent = obtenerTipoPremiumBattle(producto);
    if (delivery) delivery.textContent = obtenerDeliveryPremiumBattle(producto);
    if (description) description.textContent = obtenerDescripcionPremiumBattle(producto);
    if (highlights) {
        highlights.innerHTML = obtenerHighlightsPremiumBattle(producto)
            .map((item) => `<li>${escapeHtmlBattle(item)}</li>`)
            .join("");
    }
    if (confirmText) confirmText.textContent = tBattleSafe("pokemart_premium_modal_check_authorize", "I authorize this payment and understand that the charge will be processed by PayPal.");
    if (termsText) termsText.textContent = tBattleSafe("pokemart_premium_modal_check_terms", "I reviewed the product scope, duration, and delivery details before continuing.");
    if (cancelBtn) cancelBtn.textContent = tBattleSafe("pokemart_premium_modal_cancel", "Cancel");
    if (confirmBtn) {
        confirmBtn.textContent = tBattleSafe("pokemart_premium_modal_pay", "Continue to PayPal");
        confirmBtn.disabled = false;
    }

    const checkConfirm = document.getElementById("battlePremiumModalCheckConfirm");
    const checkTerms = document.getElementById("battlePremiumModalCheckTerms");
    if (checkConfirm) checkConfirm.checked = false;
    if (checkTerms) checkTerms.checked = false;

    mostrarErrorModalCompraPremiumBattle("");
}

function estaModalCompraPremiumBattleAbierto() {
    const modal = document.getElementById("battlePremiumPurchaseModal");
    return !!modal && !modal.classList.contains("oculto");
}

function refrescarModalCompraPremiumBattleAbierto() {
    if (!estaModalCompraPremiumBattleAbierto() || !battlePremiumProductoSeleccionado) return;
    popularModalCompraPremiumBattle(battlePremiumProductoSeleccionado);
}

async function abrirModalCompraPremiumBattle(productCode = "") {
    if (!getAccessToken()) {
        mostrarModalBattle(tBattleSafe("battle_mode_requires_login", "You must sign in first."), "warning");
        return;
    }

    try {
        await cargarCatalogoPremiumBattle(false);
        const producto = obtenerProductoPremiumBattle(productCode);
        if (!producto) {
            throw new Error(tBattleSafe("pokemart_premium_product_not_found", "The premium product could not be found."));
        }

        battlePremiumProductoSeleccionado = producto;
        popularModalCompraPremiumBattle(producto);

        const modal = document.getElementById("battlePremiumPurchaseModal");
        if (modal) {
            modal.classList.remove("oculto");
            modal.setAttribute("aria-hidden", "false");
        }
    } catch (error) {
        console.error("No se pudo abrir la compra premium desde Battle:", error);
        mostrarModalBattle(error?.message || tBattleSafe("pokemart_premium_load_error", "The premium catalog could not be loaded."), "error");
    }
}

function cerrarModalCompraPremiumBattle() {
    if (battlePremiumCheckoutEnProceso) return;

    const modal = document.getElementById("battlePremiumPurchaseModal");
    if (modal) {
        modal.classList.add("oculto");
        modal.setAttribute("aria-hidden", "true");
    }

    battlePremiumProductoSeleccionado = null;
    mostrarErrorModalCompraPremiumBattle("");
}

async function confirmarCompraPremiumBattle() {
    if (!battlePremiumProductoSeleccionado) return;

    const checkConfirm = document.getElementById("battlePremiumModalCheckConfirm");
    const checkTerms = document.getElementById("battlePremiumModalCheckTerms");
    const confirmBtn = document.getElementById("battlePremiumModalConfirmBtn");

    if (!checkConfirm?.checked || !checkTerms?.checked) {
        mostrarErrorModalCompraPremiumBattle(tBattleSafe("pokemart_premium_modal_missing_checks", "You must confirm both checkboxes before continuing to PayPal."));
        return;
    }

    try {
        battlePremiumCheckoutEnProceso = true;
        mostrarErrorModalCompraPremiumBattle("");
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = tBattleSafe("pokemart_premium_redirecting", "Opening PayPal...");
        }

        const data = typeof crearOrdenPaypalPago === "function"
            ? await crearOrdenPaypalPago({
                productCode: battlePremiumProductoSeleccionado.codigo,
                quantity: 1,
                confirmacionAceptada: true,
                versionTerminos: "v1"
            })
            : await fetchBattleAuth(`${API_BASE}/payments/paypal/order/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    product_code: battlePremiumProductoSeleccionado.codigo,
                    quantity: 1,
                    confirmacion_aceptada: true,
                    version_terminos: "v1"
                })
            });

        if (!data?.approval_url) {
            throw new Error(tBattleSafe("pokemart_premium_checkout_error", "The secure PayPal order could not be created."));
        }

        window.location.href = data.approval_url;
    } catch (error) {
        console.error("No se pudo crear la orden PayPal desde Battle:", error);
        mostrarErrorModalCompraPremiumBattle(error?.message || tBattleSafe("pokemart_premium_checkout_error", "The secure PayPal order could not be created."));
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = tBattleSafe("pokemart_premium_modal_pay", "Continue to PayPal");
        }
    } finally {
        battlePremiumCheckoutEnProceso = false;
    }
}

/* =========================
   MODAL
========================= */
function mostrarModalBattle(mensaje, tipo = "ok") {
    const modal = document.getElementById("battleModal");
    const title = document.getElementById("battleModalTitle");
    const text = document.getElementById("battleModalText");
    const icon = document.getElementById("battleModalIcon");
    const confirmActions = document.getElementById("battleConfirmActions");
    const singleClose = document.getElementById("battleSingleClose");

    if (!modal || !title || !text || !icon || !confirmActions || !singleClose) return;

    modal.className = "battle-modal-overlay";
    modal.classList.add(`battle-modal-${tipo}`);

    confirmActions.classList.add("oculto");
    singleClose.classList.remove("oculto");

    if (tipo === "ok") {
        title.textContent = t("battle_modal_saved_title");
        icon.textContent = "✓";
    } else if (tipo === "warning") {
        title.textContent = t("battle_modal_warning_title");
        icon.textContent = "!";
    } else if (tipo === "error") {
        title.textContent = t("battle_modal_error_title");
        icon.textContent = "×";
    } else {
        title.textContent = t("battle_modal_info_title");
        icon.textContent = "i";
    }

    text.textContent = mensaje;
    modal.classList.remove("oculto");
}

function mostrarConfirmacionBattle({ titulo, mensaje, textoAceptar = null, tipo = "warning", onConfirm }) {
    const modal = document.getElementById("battleModal");
    const title = document.getElementById("battleModalTitle");
    const text = document.getElementById("battleModalText");
    const icon = document.getElementById("battleModalIcon");
    const confirmActions = document.getElementById("battleConfirmActions");
    const singleClose = document.getElementById("battleSingleClose");
    const acceptBtn = document.getElementById("battleConfirmAccept");

    if (!modal || !title || !text || !icon || !confirmActions || !singleClose || !acceptBtn) return;

    modal.className = "battle-modal-overlay";
    modal.classList.add(`battle-modal-${tipo}`);

    singleClose.classList.add("oculto");
    confirmActions.classList.remove("oculto");

    title.textContent = titulo || t("battle_confirm_title");
    text.textContent = mensaje || "";
    icon.textContent = tipo === "warning" ? "!" : "?";
    acceptBtn.textContent = textoAceptar || t("battle_confirm");

    window._battleConfirmAction = onConfirm;
    modal.classList.remove("oculto");
}

function cerrarModalBattle() {
    const modal = document.getElementById("battleModal");
    if (modal) modal.classList.add("oculto");
    window._battleConfirmAction = null;
}

/* =========================
   HELPERS
========================= */
function calcularExpObjetivoBattle(nivel = 1) {
    return Math.max(50, Number(nivel || 1) * 50);
}

function calcularExpActualBattle(pokemon) {
    return Math.max(0, Number(pokemon?.experiencia || 0));
}

function calcularExpPercentBattle(pokemon) {
    const expActual = calcularExpActualBattle(pokemon);
    const expObjetivo = calcularExpObjetivoBattle(pokemon?.nivel || 1);
    return Math.min(100, Math.floor((expActual / expObjetivo) * 100));
}

function formatBattleText(key, vars = {}) {
    let texto = t(key);

    Object.entries(vars).forEach(([clave, valor]) => {
        texto = texto.replaceAll(`{${clave}}`, String(valor));
    });

    return texto;
}

function obtenerClaveTipoBattle(tipo = "") {
    const limpio = String(tipo || "").trim().toLowerCase();

    const mapa = {
        normal: "normal",
        fuego: "fire",
        fire: "fire",
        agua: "water",
        water: "water",
        planta: "grass",
        grass: "grass",
        electrico: "electric",
        eléctrico: "electric",
        electric: "electric",
        hielo: "ice",
        ice: "ice",
        lucha: "fighting",
        fighting: "fighting",
        veneno: "poison",
        poison: "poison",
        tierra: "ground",
        ground: "ground",
        volador: "flying",
        flying: "flying",
        psiquico: "psychic",
        psíquico: "psychic",
        psychic: "psychic",
        bicho: "bug",
        bug: "bug",
        roca: "rock",
        rock: "rock",
        fantasma: "ghost",
        ghost: "ghost",
        dragon: "dragon",
        dragón: "dragon",
        acero: "steel",
        steel: "steel",
        hada: "fairy",
        fairy: "fairy"
    };

    return mapa[limpio] || "";
}

function traducirTipoBattle(tipo = "") {
    const mapa = {
        normal: "type_normal",
        fire: "type_fire",
        water: "type_water",
        grass: "type_grass",
        electric: "type_electric",
        ice: "type_ice",
        fighting: "type_fighting",
        poison: "type_poison",
        ground: "type_ground",
        flying: "type_flying",
        psychic: "type_psychic",
        bug: "type_bug",
        rock: "type_rock",
        ghost: "type_ghost",
        dragon: "type_dragon",
        steel: "type_steel",
        fairy: "type_fairy"
    };

    return String(tipo || "")
        .split("/")
        .map(parte => {
            const clave = obtenerClaveTipoBattle(parte);
            return clave ? t(mapa[clave]) : parte.trim();
        })
        .join("/");
}

function obtenerClaseTipoBattle(tipo = "") {
    const partes = String(tipo || "")
        .split("/")
        .map(t => t.trim())
        .filter(Boolean);

    const clavePrincipal = partes.length ? obtenerClaveTipoBattle(partes[0]) : "";

    const mapaClases = {
        water: "type-agua",
        fire: "type-fuego",
        grass: "type-planta",
        electric: "type-electrico",
        psychic: "type-psiquico",
        rock: "type-roca",
        poison: "type-veneno",
        flying: "type-volador",
        ghost: "type-fantasma",
        bug: "type-bicho",
        fighting: "type-lucha",
        normal: "type-normal",
        ground: "type-tierra",
        ice: "type-hielo",
        dragon: "type-dragon",
        steel: "type-acero",
        fairy: "type-hada"
    };

    return mapaClases[clavePrincipal] || "type-default";
}

function tBattleSafe(key, fallback = "") {
    if (typeof t === "function") {
        const traducido = t(key);
        if (traducido && traducido !== key) {
            return traducido;
        }
    }
    return fallback || key;
}

function obtenerSesionActividadBattle() {
    try {
        let token = sessionStorage.getItem(BATTLE_ACTIVITY_SESSION_KEY);
        if (token) return token;

        token = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `battle_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

        sessionStorage.setItem(BATTLE_ACTIVITY_SESSION_KEY, token);
        return token;
    } catch (error) {
        return `battle_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }
}

async function registrarActividadBattle(accion = "heartbeat", detalle = "") {
    if (!getAccessToken() || typeof API_BASE === "undefined") {
        return false;
    }

    try {
        await fetchBattleAuth(`${API_BASE}/usuario/actividad`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pagina: "battle",
                accion,
                detalle: detalle || null,
                sesion_token: obtenerSesionActividadBattle(),
                online: true
            })
        });
        return true;
    } catch (error) {
        console.warn("No se pudo registrar actividad en Battle:", error);
        return false;
    }
}

function iniciarHeartbeatActividadBattle() {
    detenerHeartbeatActividadBattle();

    registrarActividadBattle("view", `equipo:${battleEquipo.length}`).catch(() => {});

    battleActividadTimer = window.setInterval(() => {
        registrarActividadBattle("heartbeat", `equipo:${battleEquipo.length}`).catch(() => {});
    }, 20000);
}

function detenerHeartbeatActividadBattle() {
    if (battleActividadTimer) {
        window.clearInterval(battleActividadTimer);
        battleActividadTimer = null;
    }
    detenerRelojModosBattle();
}

async function fetchBattleAuth(url, options = {}) {
    if (typeof fetchAuth === "function") {
        return await fetchAuth(url, options);
    }

    const token = typeof getAccessToken === "function" ? getAccessToken() : "";
    if (!token) {
        throw new Error("NO_TOKEN");
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    return await fetchJsonBattle(url, {
        ...options,
        headers
    });
}

async function fetchJsonBattle(url, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        throw new Error(data?.detail || data?.mensaje || `HTTP ${response.status}`);
    }

    return data;
}

function escapeHtmlBattle(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}