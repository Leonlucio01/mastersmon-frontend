/* =========================================================
   BATTLE ARENA JS
   - Combate PvE fase 1
   - Daño base: ATK - DEF (mínimo 1)
   - Multiplicador por tipo: x2 / x1 / x0.5
   - Recompensas al ganar:
     * +5000 pokedólares
     * +1000 EXP a todos los Pokémon del equipo
========================================================= */

let arenaPlayerTeam = [];
let arenaEnemyTeam = [];
let arenaPlayerIndex = 0;
let arenaEnemyIndex = 0;
let arenaTurno = 1;
let arenaCombatEnded = false;
let arenaTurnoEnProceso = false;

const BATTLE_TEAM_STORAGE_KEY = "mastersmon_battle_team_v1";
const BATTLE_ARENA_PLAYER_TEAM_KEY = "mastersmon_battle_arena_team_v1";
const BATTLE_ENEMY_LEVEL_BONUS_KEY = "mastersmon_battle_enemy_level_bonus_v1";

/* =========================================================
   TABLA DE EFECTIVIDADES
========================================================= */
const ARENA_TYPE_EFFECTIVENESS = {
    normal: {},
    fuego: {
        planta: 2,
        bicho: 2,
        hielo: 2,
        acero: 2,
        agua: 0.5,
        fuego: 0.5,
        roca: 0.5,
        dragon: 0.5
    },
    agua: {
        fuego: 2,
        roca: 2,
        tierra: 2,
        agua: 0.5,
        planta: 0.5,
        dragon: 0.5
    },
    planta: {
        agua: 2,
        roca: 2,
        tierra: 2,
        fuego: 0.5,
        planta: 0.5,
        veneno: 0.5,
        volador: 0.5,
        bicho: 0.5,
        dragon: 0.5,
        acero: 0.5
    },
    electrico: {
        agua: 2,
        volador: 2,
        planta: 0.5,
        electrico: 0.5,
        dragon: 0.5,
        tierra: 0.5
    },
    hielo: {
        planta: 2,
        tierra: 2,
        volador: 2,
        dragon: 2,
        fuego: 0.5,
        agua: 0.5,
        hielo: 0.5,
        acero: 0.5
    },
    lucha: {
        normal: 2,
        hielo: 2,
        roca: 2,
        acero: 2,
        veneno: 0.5,
        volador: 0.5,
        psiquico: 0.5,
        bicho: 0.5
    },
    veneno: {
        planta: 2,
        hada: 2,
        veneno: 0.5,
        tierra: 0.5,
        roca: 0.5,
        fantasma: 0.5
    },
    tierra: {
        fuego: 2,
        electrico: 2,
        veneno: 2,
        roca: 2,
        acero: 2,
        planta: 0.5,
        bicho: 0.5
    },
    volador: {
        planta: 2,
        lucha: 2,
        bicho: 2,
        electrico: 0.5,
        roca: 0.5,
        acero: 0.5
    },
    psiquico: {
        lucha: 2,
        veneno: 2,
        psiquico: 0.5,
        acero: 0.5
    },
    bicho: {
        planta: 2,
        psiquico: 2,
        veneno: 0.5,
        lucha: 0.5,
        volador: 0.5,
        fantasma: 0.5,
        fuego: 0.5,
        acero: 0.5
    },
    roca: {
        fuego: 2,
        hielo: 2,
        volador: 2,
        bicho: 2,
        lucha: 0.5,
        tierra: 0.5,
        acero: 0.5
    },
    fantasma: {
        psiquico: 2,
        fantasma: 2,
        normal: 0.5
    },
    dragon: {
        dragon: 2,
        acero: 0.5
    },
    acero: {
        hielo: 2,
        roca: 2,
        hada: 2,
        fuego: 0.5,
        agua: 0.5,
        electrico: 0.5,
        acero: 0.5
    },
    hada: {
        lucha: 2,
        dragon: 2,
        fuego: 0.5,
        veneno: 0.5,
        acero: 0.5
    }
};

document.addEventListener("DOMContentLoaded", () => {
    inicializarArenaBattle();
});

/* =========================================================
   INIT / CONFIG
========================================================= */
async function inicializarArenaBattle() {
    sincronizarUsuarioArena();
    configurarEventosArena();

    try {
        await cargarEquipoJugadorArena();
        generarEquipoRivalFase1();
        renderArenaCompleta();
        agregarLogArena("El combate comienza. Ambos equipos están listos.");
        ocultarMensajeArena();
        habilitarAccionesArena();
    } catch (error) {
        console.error("Error iniciando arena:", error);
        mostrarMensajeArena("No se pudo iniciar la batalla. Vuelve a Battle y arma tu equipo.", "error");
        deshabilitarAccionesArena();
    }
}

function sincronizarUsuarioArena() {
    const nombreDesktop = document.getElementById("nombreUsuario");
    const nombreMobile = document.getElementById("nombreUsuarioMobile");
    const nombre = localStorage.getItem("usuario_nombre") || nombreDesktop?.textContent?.trim() || "Entrenador";

    if (nombreDesktop) nombreDesktop.textContent = nombre;
    if (nombreMobile) nombreMobile.textContent = nombre;
}

function configurarEventosArena() {
    const btnAtacar = document.getElementById("btnArenaAtacar");
    const btnCambiar = document.getElementById("btnArenaCambiar");
    const btnAuto = document.getElementById("btnArenaAuto");
    const btnSalir = document.getElementById("btnArenaSalir");

    const btnCerrarCambio = document.getElementById("btnCerrarCambioArena");
    const btnVolverBattle = document.getElementById("btnArenaVolverBattle");
    const btnReintentar = document.getElementById("btnArenaReintentar");

    if (btnAtacar) btnAtacar.addEventListener("click", ejecutarTurnoAtaqueArena);
    if (btnCambiar) btnCambiar.addEventListener("click", abrirModalCambioArena);
    if (btnAuto) btnAuto.addEventListener("click", ejecutarTurnoAtaqueArena);
    if (btnSalir) btnSalir.addEventListener("click", () => window.location.href = "battle.html");

    if (btnCerrarCambio) {
        btnCerrarCambio.addEventListener("click", () => {
            document.getElementById("arenaChangeModal")?.classList.add("oculto");
        });
    }

    if (btnVolverBattle) {
        btnVolverBattle.addEventListener("click", () => {
            window.location.href = "battle.html";
        });
    }

    if (btnReintentar) {
        btnReintentar.addEventListener("click", () => {
            window.location.reload();
        });
    }
}

/* =========================================================
   DATA
========================================================= */
async function cargarEquipoJugadorArena() {
    let equipoGuardado = [];

    try {
        const rawSession = sessionStorage.getItem(BATTLE_ARENA_PLAYER_TEAM_KEY);
        if (rawSession) {
            equipoGuardado = JSON.parse(rawSession);
        }
    } catch (error) {
        console.warn("No se pudo leer equipo de arena desde sessionStorage:", error);
    }

    if (!Array.isArray(equipoGuardado) || equipoGuardado.length !== 6) {
        try {
            const rawLocal = localStorage.getItem(BATTLE_TEAM_STORAGE_KEY);
            equipoGuardado = rawLocal ? JSON.parse(rawLocal) : [];
        } catch (error) {
            console.warn("No se pudo leer equipo desde localStorage:", error);
            equipoGuardado = [];
        }
    }

    if (!Array.isArray(equipoGuardado) || equipoGuardado.length !== 6) {
        throw new Error("Necesitas un equipo completo de 6 Pokémon.");
    }

    arenaPlayerTeam = equipoGuardado.slice(0, 6).map((pokemon, index) =>
        normalizarPokemonArena(pokemon, "player", index)
    );
}

function generarEquipoRivalFase1() {
    const basePool = [
        { pokemon_id: 1, nombre: "Bulbasaur", tipo: "Planta/Veneno", hp: 45, ataque: 49, defensa: 49, velocidad: 45 },
        { pokemon_id: 4, nombre: "Charmander", tipo: "Fuego", hp: 39, ataque: 52, defensa: 43, velocidad: 65 },
        { pokemon_id: 7, nombre: "Squirtle", tipo: "Agua", hp: 44, ataque: 48, defensa: 65, velocidad: 43 },
        { pokemon_id: 10, nombre: "Caterpie", tipo: "Bicho", hp: 45, ataque: 30, defensa: 35, velocidad: 45 },
        { pokemon_id: 13, nombre: "Weedle", tipo: "Bicho/Veneno", hp: 40, ataque: 35, defensa: 30, velocidad: 50 },
        { pokemon_id: 16, nombre: "Pidgey", tipo: "Normal/Volador", hp: 40, ataque: 45, defensa: 40, velocidad: 56 },
        { pokemon_id: 19, nombre: "Rattata", tipo: "Normal", hp: 30, ataque: 56, defensa: 35, velocidad: 72 },
        { pokemon_id: 21, nombre: "Spearow", tipo: "Normal/Volador", hp: 40, ataque: 60, defensa: 30, velocidad: 70 },
        { pokemon_id: 25, nombre: "Pikachu", tipo: "Electrico", hp: 35, ataque: 55, defensa: 40, velocidad: 90 },
        { pokemon_id: 43, nombre: "Oddish", tipo: "Planta/Veneno", hp: 45, ataque: 50, defensa: 55, velocidad: 30 },
        { pokemon_id: 54, nombre: "Psyduck", tipo: "Agua", hp: 50, ataque: 52, defensa: 48, velocidad: 55 },
        { pokemon_id: 60, nombre: "Poliwag", tipo: "Agua", hp: 40, ataque: 50, defensa: 40, velocidad: 90 }
    ];

    const promedioNivel = calcularPromedioNivelArena(arenaPlayerTeam) || 5;
    const bonusNivel = obtenerBonusNivelRivalArena();
    const nivelBaseRival = promedioNivel + bonusNivel;
    const rivales = [];

    for (let i = 0; i < 6; i++) {
        const elegido = { ...basePool[Math.floor(Math.random() * basePool.length)] };
        const nivel = Math.max(1, nivelBaseRival + numeroRandomEntre(-1, 1));

        const hpFinal = elegido.hp + (nivel * 5);
        const ataqueFinal = elegido.ataque + (nivel * 2);
        const defensaFinal = elegido.defensa + (nivel * 2);
        const velocidadFinal = elegido.velocidad + nivel;

        rivales.push({
            id: `enemy-${i + 1}-${elegido.pokemon_id}`,
            pokemon_id: elegido.pokemon_id,
            nombre: elegido.nombre,
            tipo: elegido.tipo,
            nivel,
            hp_max: hpFinal,
            hp_actual: hpFinal,
            ataque: ataqueFinal,
            defensa: defensaFinal,
            velocidad: velocidadFinal,
            es_shiny: false,
            side: "enemy",
            slotIndex: i,
            defeated: false
        });
    }

    arenaEnemyTeam = rivales;
}

function normalizarPokemonArena(pokemon, side = "player", slotIndex = 0) {
    const hpMax = Number(pokemon.hp_max ?? pokemon.hp_actual ?? pokemon.hp ?? 1);
    const hpActual = Number(pokemon.hp_actual ?? hpMax);

    return {
        id: pokemon.id ?? `${side}-${slotIndex}-${pokemon.pokemon_id}`,
        pokemon_id: Number(pokemon.pokemon_id),
        nombre: pokemon.nombre || "Pokémon",
        tipo: pokemon.tipo || "Normal",
        nivel: Number(pokemon.nivel ?? 1),
        hp_max: hpMax,
        hp_actual: Math.max(0, hpActual),
        ataque: Number(pokemon.ataque ?? 1),
        defensa: Number(pokemon.defensa ?? 1),
        velocidad: Number(pokemon.velocidad ?? 1),
        experiencia: Number(pokemon.experiencia ?? 0),
        es_shiny: !!pokemon.es_shiny,
        side,
        slotIndex,
        defeated: hpActual <= 0
    };
}

function calcularPromedioNivelArena(team = []) {
    if (!team.length) return 1;
    const total = team.reduce((acc, p) => acc + Number(p.nivel || 0), 0);
    return Math.max(1, Math.round(total / team.length));
}

function numeroRandomEntre(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function obtenerBonusNivelRivalArena() {
    const bonus = Number(sessionStorage.getItem(BATTLE_ENEMY_LEVEL_BONUS_KEY) || 0);
    return Number.isNaN(bonus) ? 0 : Math.max(0, bonus);
}

/* =========================================================
   RENDER GENERAL
========================================================= */
function renderArenaCompleta() {
    renderPokemonActivoArena();
    renderEquiposMiniArena();
    renderEstadoArena();
    actualizarTurnoArena();
}

function renderPokemonActivoArena() {
    const playerBox = document.getElementById("playerActivePokemon");
    const enemyBox = document.getElementById("enemyActivePokemon");

    const playerPokemon = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);
    const enemyPokemon = obtenerPokemonActivoArena(arenaEnemyTeam, arenaEnemyIndex);

    if (playerBox) {
        playerBox.innerHTML = playerPokemon
            ? renderActivePokemonCardArena(playerPokemon)
            : renderSinPokemonActivo("Tu equipo sin Pokémon disponibles");
    }

    if (enemyBox) {
        enemyBox.innerHTML = enemyPokemon
            ? renderActivePokemonCardArena(enemyPokemon)
            : renderSinPokemonActivo("El rival no tiene Pokémon disponibles");
    }
}

function renderActivePokemonCardArena(pokemon) {
    const tipoClase = obtenerClaseTipoArena(pokemon.tipo);
    const imagen = obtenerImagenPokemonArena(pokemon);
    const hpPercent = calcularHpPercentArena(pokemon);
    const hpClass = obtenerClaseHpArena(hpPercent);
    const sideClass = pokemon.side === "enemy" ? "enemy-card" : "player-card";

    const expActual = calcularExpActualArena(pokemon);
    const expObjetivo = calcularExpObjetivoArena(pokemon.nivel);
    const expPercent = calcularExpPercentArena(pokemon);

    return `
        <div class="arena-active-inner arena-card ${sideClass} ${tipoClase} ${pokemon.defeated ? "is-ko" : ""}">
            <div class="arena-pokemon-top">
                <div class="arena-pokemon-sprite-wrap">
                    <img src="${imagen}" alt="${escapeHtmlArena(pokemon.nombre)}" class="arena-pokemon-sprite">
                </div>

                <div class="arena-pokemon-info">
                    <div class="arena-pokemon-name-row">
                        <h3>${escapeHtmlArena(pokemon.nombre)}</h3>
                        ${pokemon.es_shiny ? `<span class="arena-shiny-badge">✦ Shiny</span>` : ""}
                    </div>

                    <div class="arena-type-pill ${tipoClase}">
                        ${escapeHtmlArena(pokemon.tipo)}
                    </div>
                </div>
            </div>

            <div class="arena-stats-grid">
                <div class="arena-stat-card">
                    <span>Nivel</span>
                    <strong>${pokemon.nivel}</strong>
                </div>
                <div class="arena-stat-card">
                    <span>ATK</span>
                    <strong>${pokemon.ataque}</strong>
                </div>
                <div class="arena-stat-card">
                    <span>DEF</span>
                    <strong>${pokemon.defensa}</strong>
                </div>
                <div class="arena-stat-card">
                    <span>VEL</span>
                    <strong>${pokemon.velocidad}</strong>
                </div>
            </div>

            <div class="arena-hp-block">
                <div class="arena-hp-top">
                    <span>HP</span>
                    <strong>${pokemon.hp_actual} / ${pokemon.hp_max}</strong>
                </div>

                <div class="arena-hp-bar">
                    <div class="arena-hp-fill ${hpClass}" style="width:${hpPercent}%"></div>
                </div>

                <div class="arena-status-label ${pokemon.defeated ? "fainted" : ""}">
                    ${pokemon.defeated ? "Debilitado" : "En combate"}
                </div>
            </div>

            ${pokemon.side !== "enemy" ? `
                <div class="arena-exp-block">
                    <div class="arena-exp-top">
                        <span>EXP</span>
                        <strong>${expActual} / ${expObjetivo}</strong>
                    </div>
                    <div class="arena-exp-bar">
                        <div class="arena-exp-fill" style="width:${expPercent}%"></div>
                    </div>
                </div>
            ` : ""}
        </div>
    `;
}

function renderSinPokemonActivo(texto) {
    return `
        <div class="arena-active-empty">
            <p>${escapeHtmlArena(texto)}</p>
        </div>
    `;
}

function renderEquiposMiniArena() {
    const playerGrid = document.getElementById("arenaPlayerTeam");
    const enemyGrid = document.getElementById("arenaEnemyTeam");

    if (playerGrid) {
        playerGrid.innerHTML = arenaPlayerTeam.map((pokemon, index) =>
            renderMiniPokemonArena(pokemon, index === arenaPlayerIndex, false)
        ).join("");
    }

    if (enemyGrid) {
        enemyGrid.innerHTML = arenaEnemyTeam.map((pokemon, index) =>
            renderMiniPokemonArena(pokemon, index === arenaEnemyIndex, true)
        ).join("");
    }
}

function renderMiniPokemonArena(pokemon, isActive = false, isEnemy = false) {
    const imagen = obtenerImagenPokemonArena(pokemon);
    const expActual = calcularExpActualArena(pokemon);
    const expObjetivo = calcularExpObjetivoArena(pokemon.nivel);
    const expPercent = calcularExpPercentArena(pokemon);

    return `
        <article class="arena-mini-card ${isActive ? (isEnemy ? "enemy-active" : "active") : ""} ${pokemon.defeated ? "fainted" : ""}">
            <img src="${imagen}" alt="${escapeHtmlArena(pokemon.nombre)}">
            <h4>${escapeHtmlArena(pokemon.nombre)}</h4>

            <div class="arena-mini-meta">
                <span class="hp">HP ${pokemon.hp_actual}</span>
                <span class="atk">ATK ${pokemon.ataque}</span>
                <span class="def">DEF ${pokemon.defensa}</span>
            </div>

            ${!isEnemy ? `
                <div class="arena-mini-exp-wrap">
                    <div class="arena-mini-exp-bar">
                        <div class="arena-mini-exp-fill" style="width:${expPercent}%"></div>
                    </div>
                    <small class="arena-mini-exp-text">EXP ${expActual}/${expObjetivo}</small>
                </div>
            ` : ""}

            ${pokemon.defeated ? `<span class="arena-mini-dead">KO</span>` : ""}
        </article>
    `;
}

function renderEstadoArena() {
    const playerAlive = document.getElementById("arenaPlayerAlive");
    const enemyAlive = document.getElementById("arenaEnemyAlive");
    const estadoGeneral = document.getElementById("arenaEstadoGeneral");

    const vivosPlayer = contarVivosArena(arenaPlayerTeam);
    const vivosEnemy = contarVivosArena(arenaEnemyTeam);

    if (playerAlive) playerAlive.textContent = vivosPlayer;
    if (enemyAlive) enemyAlive.textContent = vivosEnemy;

    if (estadoGeneral) {
        if (arenaCombatEnded) {
            estadoGeneral.textContent = vivosPlayer > 0 ? "Victoria" : "Derrota";
        } else {
            estadoGeneral.textContent = "Combate en curso";
        }
    }
}

function actualizarTurnoArena() {
    const turnoEl = document.getElementById("arenaTurnoActual");
    if (turnoEl) turnoEl.textContent = arenaTurno;
}

/* =========================================================
   ANIMACIONES DE COMBATE
========================================================= */
function animarAtaqueArena(esJugador = true) {
    const selector = esJugador
        ? "#playerActivePokemon .arena-card"
        : "#enemyActivePokemon .arena-card";

    const card = document.querySelector(selector);
    if (!card) return;

    card.classList.remove("is-attacking");
    void card.offsetWidth;
    card.classList.add("is-attacking");

    setTimeout(() => {
        card.classList.remove("is-attacking");
    }, 420);
}

function animarGolpeArena(esJugador = true) {
    const selector = esJugador
        ? "#playerActivePokemon .arena-card"
        : "#enemyActivePokemon .arena-card";

    const card = document.querySelector(selector);
    if (!card) return;

    card.classList.remove("is-hit");
    void card.offsetWidth;
    card.classList.add("is-hit");

    setTimeout(() => {
        card.classList.remove("is-hit");
    }, 360);
}

function mostrarDanioFlotanteArena(esJugador, valor, multiplicador = 1) {
    const selector = esJugador
        ? "#playerActivePokemon .arena-card"
        : "#enemyActivePokemon .arena-card";

    const card = document.querySelector(selector);
    if (!card) return;

    const pop = document.createElement("div");
    pop.className = "arena-damage-pop";
    pop.textContent = multiplicador > 1 ? `-${valor} x2` : multiplicador < 1 ? `-${valor} x0.5` : `-${valor}`;
    card.appendChild(pop);

    setTimeout(() => {
        pop.remove();
    }, 800);
}

function esperarArena(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* =========================================================
   CÁLCULO DE TIPOS
========================================================= */
function normalizarTipoCombate(valor = "") {
    return String(valor)
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function obtenerTiposPokemonArena(tipoTexto = "") {
    return String(tipoTexto || "")
        .split("/")
        .map(t => normalizarTipoCombate(t))
        .filter(Boolean);
}

function obtenerMultiplicadorTipoArena(tipoAtacante, tipoDefensor) {
    const atacante = normalizarTipoCombate(tipoAtacante);
    const defensor = normalizarTipoCombate(tipoDefensor);

    const tabla = ARENA_TYPE_EFFECTIVENESS[atacante] || {};
    return Number(tabla[defensor] || 1);
}

function calcularMultiplicadorContraDefensorArena(atacante, defensor) {
    const tiposAtacante = obtenerTiposPokemonArena(atacante.tipo);
    const tiposDefensor = obtenerTiposPokemonArena(defensor.tipo);

    if (!tiposAtacante.length || !tiposDefensor.length) {
        return 1;
    }

    let resultadoFinal = 1;

    for (const tipoAtk of tiposAtacante) {
        const resultados = tiposDefensor.map(tipoDef =>
            obtenerMultiplicadorTipoArena(tipoAtk, tipoDef)
        );

        const tieneDebilidad = resultados.includes(2);
        const tieneResistencia = resultados.includes(0.5);

        let resultadoActual = 1;

        if (tieneDebilidad && tieneResistencia) {
            resultadoActual = 1;
        } else if (tieneDebilidad) {
            resultadoActual = 2;
        } else if (tieneResistencia) {
            resultadoActual = 0.5;
        }

        if (resultadoActual === 2) return 2;
        if (resultadoActual === 0.5) resultadoFinal = 0.5;
    }

    return resultadoFinal;
}

function describirMultiplicadorArena(mult = 1) {
    if (mult >= 2) return "¡Es muy efectivo!";
    if (mult <= 0.5) return "No es muy efectivo.";
    return "";
}

/* =========================================================
   COMBATE
========================================================= */
async function ejecutarTurnoAtaqueArena() {
    if (arenaCombatEnded || arenaTurnoEnProceso) return;

    const atacantePlayer = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);
    const atacanteEnemy = obtenerPokemonActivoArena(arenaEnemyTeam, arenaEnemyIndex);

    if (!atacantePlayer || !atacanteEnemy) {
        await verificarFinCombateArena();
        return;
    }

    arenaTurnoEnProceso = true;
    deshabilitarAccionesArena();

    try {
        const playerPrimero = Number(atacantePlayer.velocidad || 0) >= Number(atacanteEnemy.velocidad || 0);

        if (playerPrimero) {
            await resolverAtaqueArena(atacantePlayer, atacanteEnemy, true);

            if (!(await verificarFinCombateArena())) {
                const nuevoEnemy = obtenerPokemonActivoArena(arenaEnemyTeam, arenaEnemyIndex);
                const nuevoPlayer = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);
                if (nuevoEnemy && nuevoPlayer) {
                    await resolverAtaqueArena(nuevoEnemy, nuevoPlayer, false);
                }
            }
        } else {
            await resolverAtaqueArena(atacanteEnemy, atacantePlayer, false);

            if (!(await verificarFinCombateArena())) {
                const nuevoEnemy = obtenerPokemonActivoArena(arenaEnemyTeam, arenaEnemyIndex);
                const nuevoPlayer = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);
                if (nuevoEnemy && nuevoPlayer) {
                    await resolverAtaqueArena(nuevoPlayer, nuevoEnemy, true);
                }
            }
        }

        arenaTurno += 1;
        renderArenaCompleta();
        await verificarFinCombateArena();
    } finally {
        arenaTurnoEnProceso = false;
        if (!arenaCombatEnded) {
            habilitarAccionesArena();
        }
    }
}

async function resolverAtaqueArena(atacante, defensor, esAtaqueJugador = false) {
    if (!atacante || !defensor || atacante.defeated || defensor.defeated) return;

    animarAtaqueArena(esAtaqueJugador);
    await esperarArena(220);

    const resultadoDanio = calcularDanioArena(atacante, defensor);
    defensor.hp_actual = Math.max(0, Number(defensor.hp_actual) - resultadoDanio.danio);

    animarGolpeArena(!esAtaqueJugador);
    mostrarDanioFlotanteArena(!esAtaqueJugador, resultadoDanio.danio, resultadoDanio.multiplicador);

    agregarLogArena(
        `${atacante.nombre} atacó a ${defensor.nombre} y causó ${resultadoDanio.danio} de daño.`,
        esAtaqueJugador ? "Tu equipo" : "Rival"
    );

    if (resultadoDanio.textoEfectividad) {
        agregarLogArena(resultadoDanio.textoEfectividad, "Sistema");
    }

    renderArenaCompleta();
    await esperarArena(420);

    if (defensor.hp_actual <= 0) {
        defensor.hp_actual = 0;
        defensor.defeated = true;

        agregarLogArena(`${defensor.nombre} quedó debilitado.`, "Sistema");
        renderArenaCompleta();

        const vivosRestantes = contarVivosArena(
            defensor.side === "enemy" ? arenaEnemyTeam : arenaPlayerTeam
        );

        if (vivosRestantes <= 0) {
            await verificarFinCombateArena();
            return;
        }

        await esperarArena(300);

        if (defensor.side === "enemy") {
            const siguiente = encontrarSiguienteVivoArena(arenaEnemyTeam);
            if (siguiente !== -1) {
                arenaEnemyIndex = siguiente;
                agregarLogArena(`${arenaEnemyTeam[siguiente].nombre} entra al combate por el rival.`, "Rival");
                renderArenaCompleta();
                await esperarArena(250);
            }
        } else {
            const siguiente = encontrarSiguienteVivoArena(arenaPlayerTeam);
            if (siguiente !== -1) {
                arenaPlayerIndex = siguiente;
                agregarLogArena(`${arenaPlayerTeam[siguiente].nombre} entra al combate por tu equipo.`, "Tu equipo");
                renderArenaCompleta();
                await esperarArena(250);
            }
        }
    }
}

function calcularDanioArena(atacante, defensor) {
    const atk = Number(atacante.ataque || 0);
    const def = Number(defensor.defensa || 0);
    const base = Math.max(1, atk - def);

    const multiplicador = calcularMultiplicadorContraDefensorArena(atacante, defensor);
    const danio = Math.max(1, Math.round(base * multiplicador));

    return {
        base,
        multiplicador,
        danio,
        textoEfectividad: describirMultiplicadorArena(multiplicador)
    };
}

async function verificarFinCombateArena() {
    const vivosPlayer = contarVivosArena(arenaPlayerTeam);
    const vivosEnemy = contarVivosArena(arenaEnemyTeam);

    if (vivosPlayer <= 0 || vivosEnemy <= 0) {
        arenaCombatEnded = true;
        renderArenaCompleta();
        deshabilitarAccionesArena();

        if (vivosPlayer > 0) {
            await procesarRecompensasVictoriaArena();
            mostrarResultadoArena(true);
        } else {
            mostrarResultadoArena(false);
        }

        return true;
    }

    return false;
}

function contarVivosArena(team = []) {
    return team.filter(p => !p.defeated && Number(p.hp_actual) > 0).length;
}

function obtenerPokemonActivoArena(team = [], index = 0) {
    const pokemon = team[index];
    if (!pokemon) return null;

    if (!pokemon.defeated && Number(pokemon.hp_actual) > 0) {
        return pokemon;
    }

    const siguiente = encontrarSiguienteVivoArena(team);
    if (siguiente === -1) return null;

    if (team === arenaPlayerTeam) arenaPlayerIndex = siguiente;
    if (team === arenaEnemyTeam) arenaEnemyIndex = siguiente;

    return team[siguiente];
}

function encontrarSiguienteVivoArena(team = []) {
    return team.findIndex(p => !p.defeated && Number(p.hp_actual) > 0);
}

function deshabilitarAccionesArena() {
    const ids = ["btnArenaAtacar", "btnArenaCambiar", "btnArenaAuto", "btnArenaSalir"];
    ids.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = true;
    });
}

function habilitarAccionesArena() {
    const ids = ["btnArenaAtacar", "btnArenaCambiar", "btnArenaAuto", "btnArenaSalir"];
    ids.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = false;
    });
}

/* =========================================================
   CAMBIO DE POKÉMON
========================================================= */
function abrirModalCambioArena() {
    if (arenaCombatEnded || arenaTurnoEnProceso) return;

    const modal = document.getElementById("arenaChangeModal");
    const optionsBox = document.getElementById("arenaChangeOptions");
    if (!modal || !optionsBox) return;

    optionsBox.innerHTML = arenaPlayerTeam.map((pokemon, index) => {
        const disabled = pokemon.defeated || index === arenaPlayerIndex;
        return `
            <button
                type="button"
                class="arena-change-option ${disabled ? "disabled" : ""}"
                data-change-index="${index}"
                ${disabled ? "disabled" : ""}
            >
                <strong>${escapeHtmlArena(pokemon.nombre)}</strong>
                <span>Nv ${pokemon.nivel} · HP ${pokemon.hp_actual}/${pokemon.hp_max} · ATK ${pokemon.ataque} · DEF ${pokemon.defensa}</span>
            </button>
        `;
    }).join("");

    optionsBox.querySelectorAll("[data-change-index]").forEach(btn => {
        btn.addEventListener("click", () => {
            const newIndex = Number(btn.dataset.changeIndex);
            if (Number.isNaN(newIndex)) return;

            arenaPlayerIndex = newIndex;
            agregarLogArena(`${arenaPlayerTeam[newIndex].nombre} entra al combate por tu equipo.`, "Tu equipo");
            modal.classList.add("oculto");
            renderArenaCompleta();
        });
    });

    modal.classList.remove("oculto");
}

/* =========================================================
   RECOMPENSAS
========================================================= */
async function procesarRecompensasVictoriaArena() {
    try {
        const data = await otorgarRecompensasVictoriaArena(1000, 5000);

        agregarLogArena(
            `Recompensas obtenidas: +${data?.pokedolares_ganados ?? 5000} pokedólares y +${data?.exp_ganada ?? 1000} EXP para todo tu equipo.`,
            "Sistema"
        );
    } catch (error) {
        console.warn("No se pudieron aplicar las recompensas de victoria:", error);
        agregarLogArena("La batalla terminó, pero hubo un problema al aplicar las recompensas.", "Sistema");
    }
}

/* =========================================================
   RESULTADO / LOG
========================================================= */
function mostrarResultadoArena(victoria = true) {
    const modal = document.getElementById("arenaResultModal");
    const icon = document.getElementById("arenaResultIcon");
    const title = document.getElementById("arenaResultTitle");
    const text = document.getElementById("arenaResultText");

    if (!modal || !icon || !title || !text) return;

    if (victoria) {
        icon.textContent = "🏆";
        icon.style.background = "#dcfce7";
        icon.style.color = "#15803d";
        title.textContent = "¡Victoria!";
        text.textContent = "Has derrotado al equipo rival de la fase 1. Recompensas: +5000 pokedólares y +1000 EXP para tu equipo.";
        mostrarMensajeArena("¡Ganaste la batalla!", "ok");
    } else {
        icon.textContent = "✖";
        icon.style.background = "#fee2e2";
        icon.style.color = "#b91c1c";
        title.textContent = "Derrota";
        text.textContent = "Tu equipo fue derrotado. Puedes volver a intentarlo.";
        mostrarMensajeArena("Tu equipo fue derrotado.", "error");
    }

    modal.classList.remove("oculto");
}

function agregarLogArena(texto, autor = "Sistema") {
    const log = document.getElementById("arenaBattleLog");
    if (!log) return;

    const item = document.createElement("div");
    item.className = "arena-log-item";
    item.innerHTML = `
        <small>${escapeHtmlArena(autor)} · Turno ${arenaTurno}</small>
        <strong>${escapeHtmlArena(texto)}</strong>
    `;

    log.prepend(item);
}

function mostrarMensajeArena(mensaje, tipo = "ok") {
    const box = document.getElementById("arenaMensaje");
    if (!box) return;

    box.textContent = mensaje;
    box.className = "arena-message";
    box.classList.add(tipo);
}

function ocultarMensajeArena() {
    const box = document.getElementById("arenaMensaje");
    if (!box) return;
    box.className = "arena-message oculto";
    box.textContent = "";
}

/* =========================================================
   HELPERS
========================================================= */
function obtenerImagenPokemonArena(pokemon) {
    if (pokemon.es_shiny) {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.pokemon_id}.png`;
    }

    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`;
}

function calcularHpPercentArena(pokemon) {
    const hpMax = Math.max(1, Number(pokemon.hp_max || 1));
    const hpActual = Math.max(0, Number(pokemon.hp_actual || 0));
    return Math.max(0, Math.min(100, Math.round((hpActual / hpMax) * 100)));
}

function calcularExpObjetivoArena(nivel = 1) {
    return Math.max(50, Number(nivel || 1) * 50);
}

function calcularExpActualArena(pokemon) {
    return Math.max(0, Number(pokemon?.experiencia || 0));
}

function calcularExpPercentArena(pokemon) {
    const expActual = calcularExpActualArena(pokemon);
    const expObjetivo = calcularExpObjetivoArena(pokemon?.nivel || 1);
    return Math.min(100, Math.floor((expActual / expObjetivo) * 100));
}

function obtenerClaseHpArena(percent) {
    if (percent <= 0) return "zero";
    if (percent <= 25) return "low";
    if (percent <= 55) return "medium";
    return "";
}

function obtenerClaseTipoArena(tipo = "") {
    const valor = normalizarTipoCombate(tipo);

    if (valor.includes("agua")) return "type-agua";
    if (valor.includes("fuego")) return "type-fuego";
    if (valor.includes("planta")) return "type-planta";
    if (valor.includes("electrico")) return "type-electrico";
    if (valor.includes("psiquico")) return "type-psiquico";
    if (valor.includes("roca")) return "type-roca";
    if (valor.includes("veneno")) return "type-veneno";
    if (valor.includes("volador")) return "type-volador";
    if (valor.includes("fantasma")) return "type-fantasma";
    if (valor.includes("bicho")) return "type-bicho";
    if (valor.includes("lucha")) return "type-lucha";
    if (valor.includes("normal")) return "type-normal";
    if (valor.includes("tierra")) return "type-tierra";
    if (valor.includes("hielo")) return "type-hielo";
    if (valor.includes("dragon")) return "type-dragon";
    if (valor.includes("acero")) return "type-acero";
    if (valor.includes("hada")) return "type-hada";

    return "type-default";
}

async function fetchJsonArena(url, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        throw new Error(data?.detail || data?.mensaje || `HTTP ${response.status}`);
    }

    return data;
}

function escapeHtmlArena(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function otorgarRecompensasVictoriaArena(expGanada = 1000, pokedolaresGanados = 5000) {
    const token = typeof getAccessToken === "function" ? getAccessToken() : null;
    const usuarioId = Number(localStorage.getItem("usuario_id"));

    if (!token || !usuarioId || typeof API_BASE === "undefined") {
        throw new Error("No se pudo identificar al usuario actual.");
    }

    const usuarioPokemonIds = arenaPlayerTeam
        .map(p => Number(p.id))
        .filter(id => !Number.isNaN(id) && id > 0);

    if (!usuarioPokemonIds.length) {
        throw new Error("No se encontraron Pokémon válidos para otorgar recompensas.");
    }

    const data = await fetchJsonArena(`${API_BASE}/battle/recompensa-victoria`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            usuario_id: usuarioId,
            usuario_pokemon_ids: usuarioPokemonIds,
            exp_ganada: Number(expGanada),
            pokedolares_ganados: Number(pokedolaresGanados)
        })
    });

    if (!data?.ok) {
        throw new Error(data?.mensaje || "No se pudieron aplicar las recompensas.");
    }

    if (typeof data.pokedolares_actuales !== "undefined") {
        localStorage.setItem("usuario_pokedolares", String(data.pokedolares_actuales));
    }

    if (Array.isArray(data.pokemon_actualizados)) {
        for (const actualizado of data.pokemon_actualizados) {
            const pokeLocal = arenaPlayerTeam.find(p => Number(p.id) === Number(actualizado.usuario_pokemon_id));
            if (!pokeLocal) continue;

            pokeLocal.nivel = actualizado.nivel;
            pokeLocal.experiencia = actualizado.experiencia;
            pokeLocal.hp_max = actualizado.hp_max;
            pokeLocal.hp_actual = actualizado.hp_max;
            pokeLocal.ataque = actualizado.ataque;
            pokeLocal.defensa = actualizado.defensa;
            pokeLocal.velocidad = actualizado.velocidad;
        }
    }

    try {
        localStorage.setItem(BATTLE_TEAM_STORAGE_KEY, JSON.stringify(arenaPlayerTeam));
    } catch (error) {
        console.warn("No se pudo refrescar el equipo guardado después de la recompensa:", error);
    }

    return data;
}