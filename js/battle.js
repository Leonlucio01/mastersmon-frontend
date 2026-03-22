let battlePokemonUsuario = [];
let battleEquipo = [];
let battleTabActual = "todos";

const BATTLE_TEAM_STORAGE_KEY = "mastersmon_battle_team_v1";
const BATTLE_ENEMY_LEVEL_BONUS_KEY = "mastersmon_battle_enemy_level_bonus_v1";
const BATTLE_ARENA_DIFFICULTY_KEY = "mastersmon_battle_arena_difficulty_v1";
const BATTLE_ACTIVITY_SESSION_KEY = "mastersmon_battle_activity_session_v1";

let battleActividadTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    inicializarBattle();
});

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
    configurarEventosBattle();
    cargarEquipoGuardadoBattle();
    cargarDificultadBattle();
    renderSlotsEquipoBattle();
    renderResumenEquipoBattle();
    renderColeccionBattleLoading();

    try {
        await cargarPokemonUsuarioBattle();
        await intentarCargarEquipoServidorBattle();
        sincronizarEquipoBattleConColeccion();
        renderSlotsEquipoBattle();
        renderColeccionBattle();
        renderResumenEquipoBattle();
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
    renderSlotsEquipoBattle();
    renderResumenEquipoBattle();
    renderColeccionBattle();
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
        btnIniciar.addEventListener("click", iniciarBatallaDemo);
    }

    if (buscador) buscador.addEventListener("input", renderColeccionBattle);
    if (filtroTipo) filtroTipo.addEventListener("change", renderColeccionBattle);
    if (filtroEstado) filtroEstado.addEventListener("change", renderColeccionBattle);
    if (filtroOrden) filtroOrden.addEventListener("change", renderColeccionBattle);

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

    window.addEventListener("pagehide", detenerHeartbeatActividadBattle);
    window.addEventListener("beforeunload", detenerHeartbeatActividadBattle);
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

    const resumenAtaque = document.getElementById("battleResumenAtaque");
    const resumenBalance = document.getElementById("battleResumenBalance");
    const resumenVelocidad = document.getElementById("battleResumenVelocidad");

    if (resumenAtaque) resumenAtaque.textContent = stats.resumenAtaque;
    if (resumenBalance) resumenBalance.textContent = stats.resumenBalance;
    if (resumenVelocidad) resumenVelocidad.textContent = stats.resumenVelocidad;
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

        sessionStorage.setItem("mastersmon_battle_arena_team_v1", JSON.stringify(battleEquipo));
        sessionStorage.setItem("mastersmon_battle_enemy_level_bonus_v1", String(bonusNivel));
        sessionStorage.setItem("mastersmon_battle_arena_difficulty_v1", obtenerCodigoDificultadBattleDesdeBonus(bonusNivel));

        window.location.href = "battle-arena.html";
    } catch (error) {
        console.error("No se pudo preparar la arena de combate:", error);
        mostrarModalBattle(error?.message || t("battle_prepare_combat_error"), "error");
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