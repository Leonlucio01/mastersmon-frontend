let battlePokemonUsuario = [];
let battleEquipo = [];
let battleTabActual = "todos";

const BATTLE_TEAM_STORAGE_KEY = "mastersmon_battle_team_v1";
const BATTLE_ENEMY_LEVEL_BONUS_KEY = "mastersmon_battle_enemy_level_bonus_v1";


document.addEventListener("DOMContentLoaded", () => {
    inicializarBattle();
});

async function inicializarBattle() {
    configurarResumenUsuarioBattle();
    configurarEventosBattle();
    cargarEquipoGuardadoBattle();
    renderSlotsEquipoBattle();
    renderResumenEquipoBattle();
    renderColeccionBattleLoading();

    try {
        await cargarPokemonUsuarioBattle();
        renderColeccionBattle();
        renderResumenEquipoBattle();
    } catch (error) {
        console.error("Error iniciando Battle:", error);
        renderColeccionBattleError();

        // Reintento automático por si la sesión todavía no estaba lista al recargar
        setTimeout(async () => {
            try {
                renderColeccionBattleLoading();
                await cargarPokemonUsuarioBattle();
                renderColeccionBattle();
                renderResumenEquipoBattle();
            } catch (retryError) {
                console.error("Error en reintento de Battle:", retryError);
                renderColeccionBattleError();
            }
        }, 1200);
    }
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
                mostrarModalBattle("No hay Pokémon en el equipo para limpiar.", "info");
                return;
            }

            mostrarConfirmacionBattle({
                titulo: "¿Limpiar equipo?",
                mensaje: "Se quitarán los Pokémon actuales del equipo.",
                textoAceptar: "Sí, limpiar",
                tipo: "warning",
                onConfirm: () => {
                    battleEquipo = [];
                    persistirEquipoBattle();
                    renderSlotsEquipoBattle();
                    renderColeccionBattle();
                    renderResumenEquipoBattle();
                    mostrarModalBattle("Equipo limpiado correctamente.", "warning");
                }
            });
        });
    }

    if (btnGuardar) {
        btnGuardar.addEventListener("click", () => {
            persistirEquipoBattle();
            mostrarModalBattle("Equipo guardado con éxito.", "ok");
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
}

function configurarResumenUsuarioBattle() {
    const nombreDesktop = document.getElementById("nombreUsuario");
    const nombreMobile = document.getElementById("nombreUsuarioMobile");

    const nombre = localStorage.getItem("usuario_nombre") || nombreDesktop?.textContent?.trim() || "Entrenador";
    if (nombreDesktop) nombreDesktop.textContent = nombre;
    if (nombreMobile) nombreMobile.textContent = nombre;
}

/* =========================
   DATA
========================= */
async function cargarPokemonUsuarioBattle() {
    if (!getAccessToken()) {
        battlePokemonUsuario = [];
        throw new Error("No hay access token disponible.");
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
        throw new Error("No se encontró el usuario actual.");
    }

    return await fetchJsonBattle(`${API_BASE}/usuario/${usuarioId}/pokemon`, { headers });
}

/* =========================
   STORAGE
========================= */
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

function cargarDificultadBattle() {
    const select = document.getElementById("battleDificultadRival");
    const texto = document.getElementById("battleDificultadTexto");
    if (!select) return;

    const valorGuardado = sessionStorage.getItem(BATTLE_ENEMY_LEVEL_BONUS_KEY) ?? "0";
    select.value = valorGuardado;

    actualizarTextoDificultadBattle(Number(valorGuardado), texto);
}

function guardarDificultadBattle() {
    const select = document.getElementById("battleDificultadRival");
    const texto = document.getElementById("battleDificultadTexto");
    if (!select) return;

    const bonus = Number(select.value || 0);
    sessionStorage.setItem(BATTLE_ENEMY_LEVEL_BONUS_KEY, String(bonus));
    actualizarTextoDificultadBattle(bonus, texto);
}

function actualizarTextoDificultadBattle(bonus = 0, textoEl = null) {
    const el = textoEl || document.getElementById("battleDificultadTexto");
    if (!el) return;

    if (bonus <= 0) {
        el.textContent = "Los rivales saldrán cerca del promedio de tu equipo.";
        return;
    }

    el.textContent = `Los rivales aparecerán con aproximadamente +${bonus} niveles sobre tu promedio.`;
}

/* =========================
   EQUIPO
========================= */
function agregarPokemonAEquipoBattle(pokemonInstanceId) {
    if (battleEquipo.length >= 6) {
        mostrarModalBattle("Tu equipo ya tiene 6 Pokémon.", "warning");
        return;
    }

    const existe = battleEquipo.some(p => Number(p.id) === Number(pokemonInstanceId));
    if (existe) {
        mostrarModalBattle("Ese Pokémon ya está en tu equipo.", "warning");
        return;
    }

    const pokemon = battlePokemonUsuario.find(p => Number(p.id) === Number(pokemonInstanceId));
    if (!pokemon) {
        mostrarModalBattle("No se encontró ese Pokémon en tu colección.", "error");
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
                        <h4>Slot vacío</h4>
                        <p>Agrega un Pokémon</p>
                    </div>
                </article>
            `;
            continue;
        }

        const imagen = pokemon.es_shiny
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.pokemon_id}.png`
            : (pokemon.imagen || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`);

        const leadBadge = i === 0 ? `<span class="team-lead-badge">Líder</span>` : "";
        const tipoClase = obtenerClaseTipoBattle(pokemon.tipo);

        const expActual = calcularExpActualBattle(pokemon);
        const expObjetivo = calcularExpObjetivoBattle(pokemon.nivel);
        const expPercent = calcularExpPercentBattle(pokemon);

        html += `
            <article class="battle-team-slot filled ${i === 0 ? "team-slot-lead" : ""} ${tipoClase}">
                <div class="team-slot-index">${i + 1}</div>
                <button class="team-slot-remove" type="button" data-remove-slot="${i}" aria-label="Quitar Pokémon">×</button>

                <div class="team-slot-filled">
                    <img src="${imagen}" alt="${escapeHtmlBattle(pokemon.nombre)}" class="team-slot-sprite">

                    <div class="team-slot-info">
                        <div class="team-slot-headline">
                            <h4>${escapeHtmlBattle(pokemon.nombre)}</h4>
                            ${pokemon.es_shiny ? `<span class="team-shiny-icon" title="Pokémon Shiny">✦</span>` : ""}
                            ${leadBadge}
                        </div>

                        <p>${escapeHtmlBattle(pokemon.tipo || "—")}</p>

                        <div class="team-slot-meta">
                            <span class="meta-level">Nv. ${pokemon.nivel ?? "—"}</span>
                            <span class="meta-hp">HP ${pokemon.hp_actual ?? pokemon.hp_max ?? "—"}</span>
                            <span class="meta-atk">ATK ${pokemon.ataque ?? "—"}</span>
                            <span class="meta-def">DEF ${pokemon.defensa ?? "—"}</span>
                        </div>

                        <div class="team-slot-exp-wrap">
                            <div class="team-slot-exp-label">EXP ${expActual} / ${expObjetivo}</div>
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
    if (tipoDominante) tipoDominante.textContent = stats.tipoDominante;
    if (estado) estado.textContent = battleEquipo.length === 6 ? "Listo para combatir" : "En preparación";
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
            resumenAtaque: "Forma tu equipo para ver tu perfil ofensivo.",
            resumenBalance: "Aún no hay suficiente información táctica.",
            resumenVelocidad: "Selecciona Pokémon para calcularla."
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

    let resumenAtaque = "Tu equipo aún no define un perfil ofensivo.";
    if (sumaAtaque >= 500) resumenAtaque = "Equipo ofensivo fuerte, ideal para presión rápida.";
    else if (sumaAtaque >= 350) resumenAtaque = "Perfil ofensivo equilibrado y estable.";
    else resumenAtaque = "Daño moderado, conviene reforzar atacantes.";

    let resumenBalance = "Equipo balanceado en construcción.";
    if (sumaDefensa > sumaAtaque + 80) resumenBalance = "Equipo resistente con enfoque defensivo.";
    else if (sumaAtaque > sumaDefensa + 80) resumenBalance = "Equipo agresivo con presión de daño.";
    else resumenBalance = "Buena mezcla entre daño y resistencia.";

    const resumenVelocidad = `Velocidad media: ${promedioVelocidad}. ${promedioVelocidad >= 70 ? "Buen ritmo para abrir combates." : "Conviene sumar Pokémon más rápidos."}`;

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

    const tipos = new Set();

    battlePokemonUsuario.forEach(p => {
        String(p.tipo || "")
            .split("/")
            .map(t => t.trim())
            .filter(Boolean)
            .forEach(tipo => tipos.add(tipo));
    });

    const opciones = ['<option value="">Todos los tipos</option>']
        .concat(
            Array.from(tipos)
                .sort((a, b) => a.localeCompare(b))
                .map(tipo => `<option value="${escapeHtmlBattle(tipo)}">${escapeHtmlBattle(tipo)}</option>`)
        );

    select.innerHTML = opciones.join("");
}

function renderColeccionBattleLoading() {
    const container = document.getElementById("coleccionBattle");
    if (!container) return;

    container.innerHTML = `
        <div class="battle-empty-state">
            <h4>Cargando tu colección...</h4>
            <p>Preparando tus Pokémon para Battle.</p>
        </div>
    `;
}

function renderColeccionBattleError() {
    const container = document.getElementById("coleccionBattle");
    if (!container) return;

    container.innerHTML = `
        <div class="battle-empty-state">
            <h4>No se pudo cargar tu colección</h4>
            <p>Verifica la conexión con el backend e inténtalo de nuevo.</p>
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
                <h4>No hay Pokémon para mostrar</h4>
                <p>Prueba con otro filtro o captura más Pokémon.</p>
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
                    ${pokemon.es_shiny ? `<span class="battle-card-shiny-dot" title="Pokémon Shiny">✦</span>` : ""}
                </div>

                <p>${escapeHtmlBattle(pokemon.tipo || "—")}</p>

                <div class="battle-card-meta battle-card-meta-pro">
                    <span class="battle-card-level">Nv ${pokemon.nivel ?? "—"}</span>
                    <span class="battle-card-hp">HP ${pokemon.hp_actual ?? pokemon.hp_max ?? "—"}</span>
                    <span class="battle-card-atk">ATK ${pokemon.ataque ?? "—"}</span>
                    <span class="battle-card-def">DEF ${pokemon.defensa ?? "—"}</span>
                </div>

                <div class="battle-card-exp-wrap">
                    <div class="battle-card-exp-label">EXP ${expActual} / ${expObjetivo}</div>
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
                    ${yaEnEquipo ? "✓ En el equipo" : equipoLleno ? "Equipo lleno" : "Agregar"}
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
function iniciarBatallaDemo() {
    if (battleEquipo.length !== 6) {
        mostrarModalBattle("Debes tener 6 Pokémon para iniciar combate.", "warning");
        return;
    }

    try {
        const dificultad = document.getElementById("battleDificultadRival");
        const bonusNivel = Number(dificultad?.value || 0);

        sessionStorage.setItem("mastersmon_battle_arena_team_v1", JSON.stringify(battleEquipo));
        sessionStorage.setItem(BATTLE_ENEMY_LEVEL_BONUS_KEY, String(bonusNivel));

        window.location.href = "battle-arena.html";
    } catch (error) {
        console.error("No se pudo preparar la arena de combate:", error);
        mostrarModalBattle("No se pudo preparar el combate.", "error");
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
        title.textContent = "Equipo guardado";
        icon.textContent = "✓";
    } else if (tipo === "warning") {
        title.textContent = "Atención";
        icon.textContent = "!";
    } else if (tipo === "error") {
        title.textContent = "Ocurrió un problema";
        icon.textContent = "×";
    } else {
        title.textContent = "Información";
        icon.textContent = "i";
    }

    text.textContent = mensaje;
    modal.classList.remove("oculto");
}

function mostrarConfirmacionBattle({ titulo, mensaje, textoAceptar = "Aceptar", tipo = "warning", onConfirm }) {
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

    title.textContent = titulo || "Confirmación";
    text.textContent = mensaje || "";
    icon.textContent = tipo === "warning" ? "!" : "?";
    acceptBtn.textContent = textoAceptar;

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

function obtenerClaseTipoBattle(tipo = "") {
    const valor = String(tipo).toLowerCase();

    if (valor.includes("agua")) return "type-agua";
    if (valor.includes("fuego")) return "type-fuego";
    if (valor.includes("planta")) return "type-planta";
    if (valor.includes("eléctrico") || valor.includes("electrico")) return "type-electrico";
    if (valor.includes("psíquico") || valor.includes("psiquico")) return "type-psiquico";
    if (valor.includes("roca")) return "type-roca";
    if (valor.includes("veneno")) return "type-veneno";
    if (valor.includes("volador")) return "type-volador";
    if (valor.includes("fantasma")) return "type-fantasma";
    if (valor.includes("bicho")) return "type-bicho";
    if (valor.includes("lucha")) return "type-lucha";
    if (valor.includes("normal")) return "type-normal";
    if (valor.includes("tierra")) return "type-tierra";
    if (valor.includes("hielo")) return "type-hielo";
    if (valor.includes("dragon") || valor.includes("dragón")) return "type-dragon";
    if (valor.includes("acero")) return "type-acero";
    if (valor.includes("hada")) return "type-hada";

    return "type-default";
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