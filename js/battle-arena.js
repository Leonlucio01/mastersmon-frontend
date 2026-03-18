/* =========================================================
   BATTLE ARENA JS
========================================================= */

let arenaPlayerTeam = [];
let arenaEnemyTeam = [];
let arenaPlayerIndex = 0;
let arenaEnemyIndex = 0;
let arenaTurno = 1;
let arenaCombatEnded = false;
let arenaTurnoEnProceso = false;
let arenaAutoTurnoActivo = false;
let arenaUltimoResultado = null;

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
    configurarMenuMobileArena();
    configurarIdiomaArena();
    inicializarArenaBattle();

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            cerrarMenuMobileArena();
        }
    });
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
        agregarLogArena(tSafeArena("arena_log_start"), tSafeArena("arena_system"));
        ocultarMensajeArena();
        habilitarAccionesArena();
        actualizarBotonAutoTurnoArena();
    } catch (error) {
        console.error("Error iniciando arena:", error);
        mostrarMensajeArena(tSafeArena("arena_init_error"), "error");
        deshabilitarAccionesArena();
        actualizarBotonAutoTurnoArena();
    }
}

function sincronizarUsuarioArena() {
    const nombreDesktop = document.getElementById("nombreUsuario");
    const nombreMobile = document.getElementById("nombreUsuarioMobile");
    const usuario = typeof getUsuarioLocal === "function" ? getUsuarioLocal() : null;
    const nombre = usuario?.nombre || localStorage.getItem("google_user_name") || "Entrenador";

    if (nombreDesktop) nombreDesktop.textContent = `👤 ${nombre}`;
    if (nombreMobile) nombreMobile.textContent = `👤 ${nombre}`;
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
    if (btnAuto) btnAuto.addEventListener("click", ejecutarAutoTurnoArena);
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

function configurarMenuMobileArena() {
    const menuToggle = document.getElementById("menuToggle");
    const menuMobile = document.getElementById("menuMobile");

    if (!menuToggle || !menuMobile) return;

    menuToggle.addEventListener("click", () => {
        menuMobile.classList.toggle("menu-open");
    });
}

function cerrarMenuMobileArena() {
    const menuMobile = document.getElementById("menuMobile");
    if (menuMobile) {
        menuMobile.classList.remove("menu-open");
    }
}

function configurarIdiomaArena() {
    const languageSelect = document.getElementById("languageSelect");

    if (languageSelect && typeof getCurrentLang === "function") {
        languageSelect.value = getCurrentLang();
        languageSelect.addEventListener("change", (e) => {
            if (typeof setCurrentLang === "function") {
                setCurrentLang(e.target.value);
            }
        });
    }

    document.addEventListener("languageChanged", refrescarUIArenaPorIdioma);

    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
}

function refrescarUIArenaPorIdioma() {
    if (typeof applyTranslations === "function") {
        applyTranslations();
    }

    actualizarBotonAutoTurnoArena();

    if (arenaPlayerTeam.length || arenaEnemyTeam.length) {
        renderArenaCompleta();
    }

    const modalCambio = document.getElementById("arenaChangeModal");
    if (modalCambio && !modalCambio.classList.contains("oculto") && !arenaCombatEnded) {
        abrirModalCambioArena();
    }

    const modalResultado = document.getElementById("arenaResultModal");
    if (modalResultado && !modalResultado.classList.contains("oculto") && arenaUltimoResultado) {
        mostrarResultadoArena(
            arenaUltimoResultado.victoria,
            arenaUltimoResultado.recompensa,
            true
        );
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
        throw new Error(tSafeArena("arena_need_full_team"));
    }

    arenaPlayerTeam = equipoGuardado.slice(0, 6).map((pokemon, index) =>
        normalizarPokemonArena(pokemon, "player", index)
    );
}

function obtenerPoolRivalesArena() {
    const bonusNivel = obtenerBonusNivelRivalArena();

    const poolNormal = [
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

    const poolDesafio = [
        { pokemon_id: 2, nombre: "Ivysaur", tipo: "Planta/Veneno", hp: 60, ataque: 62, defensa: 63, velocidad: 60 },
        { pokemon_id: 5, nombre: "Charmeleon", tipo: "Fuego", hp: 58, ataque: 64, defensa: 58, velocidad: 80 },
        { pokemon_id: 8, nombre: "Wartortle", tipo: "Agua", hp: 59, ataque: 63, defensa: 80, velocidad: 58 },
        { pokemon_id: 17, nombre: "Pidgeotto", tipo: "Normal/Volador", hp: 63, ataque: 60, defensa: 55, velocidad: 71 },
        { pokemon_id: 22, nombre: "Fearow", tipo: "Normal/Volador", hp: 65, ataque: 90, defensa: 65, velocidad: 100 },
        { pokemon_id: 24, nombre: "Arbok", tipo: "Veneno", hp: 60, ataque: 95, defensa: 69, velocidad: 80 },
        { pokemon_id: 26, nombre: "Raichu", tipo: "Electrico", hp: 60, ataque: 90, defensa: 55, velocidad: 110 },
        { pokemon_id: 31, nombre: "Nidoqueen", tipo: "Veneno/Tierra", hp: 90, ataque: 92, defensa: 87, velocidad: 76 },
        { pokemon_id: 34, nombre: "Nidoking", tipo: "Veneno/Tierra", hp: 81, ataque: 102, defensa: 77, velocidad: 85 },
        { pokemon_id: 44, nombre: "Gloom", tipo: "Planta/Veneno", hp: 60, ataque: 65, defensa: 70, velocidad: 40 },
        { pokemon_id: 67, nombre: "Machoke", tipo: "Lucha", hp: 80, ataque: 100, defensa: 70, velocidad: 45 },
        { pokemon_id: 75, nombre: "Graveler", tipo: "Roca/Tierra", hp: 55, ataque: 95, defensa: 115, velocidad: 35 }
    ];

    const poolExperto = [
        { pokemon_id: 3, nombre: "Venusaur", tipo: "Planta/Veneno", hp: 80, ataque: 82, defensa: 83, velocidad: 80 },
        { pokemon_id: 6, nombre: "Charizard", tipo: "Fuego/Volador", hp: 78, ataque: 84, defensa: 78, velocidad: 100 },
        { pokemon_id: 9, nombre: "Blastoise", tipo: "Agua", hp: 79, ataque: 83, defensa: 100, velocidad: 78 },
        { pokemon_id: 18, nombre: "Pidgeot", tipo: "Normal/Volador", hp: 83, ataque: 80, defensa: 75, velocidad: 101 },
        { pokemon_id: 45, nombre: "Vileplume", tipo: "Planta/Veneno", hp: 75, ataque: 80, defensa: 85, velocidad: 50 },
        { pokemon_id: 59, nombre: "Arcanine", tipo: "Fuego", hp: 90, ataque: 110, defensa: 80, velocidad: 95 },
        { pokemon_id: 62, nombre: "Poliwrath", tipo: "Agua/Lucha", hp: 90, ataque: 95, defensa: 95, velocidad: 70 },
        { pokemon_id: 65, nombre: "Alakazam", tipo: "Psiquico", hp: 55, ataque: 50, defensa: 45, velocidad: 120 },
        { pokemon_id: 68, nombre: "Machamp", tipo: "Lucha", hp: 90, ataque: 130, defensa: 80, velocidad: 55 },
        { pokemon_id: 76, nombre: "Golem", tipo: "Roca/Tierra", hp: 80, ataque: 120, defensa: 130, velocidad: 45 },
        { pokemon_id: 82, nombre: "Magneton", tipo: "Electrico/Acero", hp: 50, ataque: 60, defensa: 95, velocidad: 70 },
        { pokemon_id: 94, nombre: "Gengar", tipo: "Fantasma/Veneno", hp: 60, ataque: 65, defensa: 60, velocidad: 110 }
    ];

    const poolMaestro = [
        { pokemon_id: 65, nombre: "Alakazam", tipo: "Psiquico", hp: 55, ataque: 50, defensa: 45, velocidad: 120 },
        { pokemon_id: 68, nombre: "Machamp", tipo: "Lucha", hp: 90, ataque: 130, defensa: 80, velocidad: 55 },
        { pokemon_id: 94, nombre: "Gengar", tipo: "Fantasma/Veneno", hp: 60, ataque: 65, defensa: 60, velocidad: 110 },
        { pokemon_id: 112, nombre: "Rhydon", tipo: "Tierra/Roca", hp: 105, ataque: 130, defensa: 120, velocidad: 40 },
        { pokemon_id: 130, nombre: "Gyarados", tipo: "Agua/Volador", hp: 95, ataque: 125, defensa: 79, velocidad: 81 },
        { pokemon_id: 131, nombre: "Lapras", tipo: "Agua/Hielo", hp: 130, ataque: 85, defensa: 80, velocidad: 60 },
        { pokemon_id: 134, nombre: "Vaporeon", tipo: "Agua", hp: 130, ataque: 65, defensa: 60, velocidad: 65 },
        { pokemon_id: 135, nombre: "Jolteon", tipo: "Electrico", hp: 65, ataque: 65, defensa: 60, velocidad: 130 },
        { pokemon_id: 136, nombre: "Flareon", tipo: "Fuego", hp: 65, ataque: 130, defensa: 60, velocidad: 65 },
        { pokemon_id: 143, nombre: "Snorlax", tipo: "Normal", hp: 160, ataque: 110, defensa: 65, velocidad: 30 },
        { pokemon_id: 149, nombre: "Dragonite", tipo: "Dragon/Volador", hp: 91, ataque: 134, defensa: 95, velocidad: 80 },
        { pokemon_id: 150, nombre: "Mewtwo", tipo: "Psiquico", hp: 106, ataque: 110, defensa: 90, velocidad: 130 }
    ];

    if (bonusNivel >= 6) return poolMaestro;
    if (bonusNivel >= 4) return poolExperto;
    if (bonusNivel >= 2) return poolDesafio;
    return poolNormal;
}

function generarEquipoRivalFase1() {
    const basePool = obtenerPoolRivalesArena();
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
            id: `enemy-${i + 1}-${elegido.pokemon_id}-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
            pokemon_id: elegido.pokemon_id,
            nombre: elegido.nombre,
            tipo: elegido.tipo,
            nivel,
            hp_max: hpFinal,
            hp_actual: hpFinal,
            ataque: ataqueFinal,
            defensa: defensaFinal,
            velocidad: velocidadFinal,
            experiencia: 0,
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

function obtenerRecompensasPorDificultadArena() {
    const bonusNivel = obtenerBonusNivelRivalArena();

    if (bonusNivel >= 6) {
        return {
            nombre: tSafeArena("battle_difficulty_master"),
            exp: 6000,
            pokedolares: 15000
        };
    }

    if (bonusNivel >= 4) {
        return {
            nombre: tSafeArena("battle_difficulty_expert"),
            exp: 4500,
            pokedolares: 10000
        };
    }

    if (bonusNivel >= 2) {
        return {
            nombre: tSafeArena("battle_difficulty_challenge"),
            exp: 3500,
            pokedolares: 5000
        };
    }

    return {
        nombre: tSafeArena("battle_difficulty_normal"),
        exp: 2500,
        pokedolares: 2500
    };
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
            : renderSinPokemonActivo(tSafeArena("arena_no_available_player"));
    }

    if (enemyBox) {
        enemyBox.innerHTML = enemyPokemon
            ? renderActivePokemonCardArena(enemyPokemon)
            : renderSinPokemonActivo(tSafeArena("arena_no_available_enemy"));
    }
}

function renderActivePokemonCardArena(pokemon) {
    const tipoClase = obtenerClaseTipoArena(pokemon.tipo);
    const tipoTraducido = traducirTipoPokemonArena(pokemon.tipo);
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
                        ${escapeHtmlArena(tipoTraducido)}
                    </div>
                </div>
            </div>

            <div class="arena-stats-grid">
                <div class="arena-stat-card">
                    <span>${tSafeArena("maps_level")}</span>
                    <strong>${pokemon.nivel}</strong>
                </div>
                <div class="arena-stat-card">
                    <span>${tSafeArena("pokemon_attack")}</span>
                    <strong>${pokemon.ataque}</strong>
                </div>
                <div class="arena-stat-card">
                    <span>${tSafeArena("pokemon_defense")}</span>
                    <strong>${pokemon.defensa}</strong>
                </div>
                <div class="arena-stat-card">
                    <span>${tSafeArena("arena_speed")}</span>
                    <strong>${pokemon.velocidad}</strong>
                </div>
            </div>

            <div class="arena-hp-block">
                <div class="arena-hp-top">
                    <span>${tSafeArena("maps_hp")}</span>
                    <strong>${pokemon.hp_actual} / ${pokemon.hp_max}</strong>
                </div>

                <div class="arena-hp-bar">
                    <div class="arena-hp-fill ${hpClass}" style="width:${hpPercent}%"></div>
                </div>

                <div class="arena-status-label ${pokemon.defeated ? "fainted" : ""}">
                    ${pokemon.defeated ? tSafeArena("arena_fainted") : tSafeArena("arena_in_battle")}
                </div>
            </div>

            ${pokemon.side !== "enemy" ? `
                <div class="arena-exp-block">
                    <div class="arena-exp-top">
                        <span>${tSafeArena("arena_exp")}</span>
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
    const tipoTraducido = traducirTipoPokemonArena(pokemon.tipo);
    const expActual = calcularExpActualArena(pokemon);
    const expObjetivo = calcularExpObjetivoArena(pokemon.nivel);
    const expPercent = calcularExpPercentArena(pokemon);

    return `
        <article class="arena-mini-card ${isActive ? (isEnemy ? "enemy-active" : "active") : ""} ${pokemon.defeated ? "fainted" : ""}">
            <img src="${imagen}" alt="${escapeHtmlArena(pokemon.nombre)}">
            <h4>${escapeHtmlArena(pokemon.nombre)}</h4>
            <p class="arena-mini-type">${escapeHtmlArena(tipoTraducido)}</p>

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
                    <small class="arena-mini-exp-text">${tSafeArena("arena_exp")} ${expActual}/${expObjetivo}</small>
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
            estadoGeneral.textContent = vivosPlayer > 0
                ? tSafeArena("arena_victory")
                : tSafeArena("arena_defeat_title");
        } else {
            estadoGeneral.textContent = tSafeArena("arena_in_progress");
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
    if (mult >= 2) return tSafeArena("arena_effective");
    if (mult <= 0.5) return tSafeArena("arena_not_effective");
    return "";
}

/* =========================================================
   COMBATE
========================================================= */
async function ejecutarTurnoAtaqueArena(desdeAuto = false) {
    if (arenaCombatEnded || arenaTurnoEnProceso) return;

    const atacantePlayer = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);
    const atacanteEnemy = obtenerPokemonActivoArena(arenaEnemyTeam, arenaEnemyIndex);

    if (!atacantePlayer || !atacanteEnemy) {
        await verificarFinCombateArena();
        return;
    }

    arenaTurnoEnProceso = true;

    if (!desdeAuto) {
        deshabilitarAccionesArena(false);
    }

    try {
        const playerPrimero =
            Number(atacantePlayer.velocidad || 0) >= Number(atacanteEnemy.velocidad || 0);

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

        if (!arenaCombatEnded && !arenaAutoTurnoActivo) {
            habilitarAccionesArena();
        }
    }
}

async function ejecutarAutoTurnoArena() {
    if (arenaCombatEnded || arenaTurnoEnProceso) return;

    if (arenaAutoTurnoActivo) {
        detenerAutoTurnoArena();
        agregarLogArena(tSafeArena("arena_auto_stopped"), tSafeArena("arena_system"));
        habilitarAccionesArena();
        return;
    }

    const playerInicial = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);
    const enemyInicial = obtenerPokemonActivoArena(arenaEnemyTeam, arenaEnemyIndex);

    if (!playerInicial || !enemyInicial) {
        await verificarFinCombateArena();
        return;
    }

    const playerInicialId = String(playerInicial.id);
    const enemyInicialId = String(enemyInicial.id);

    arenaAutoTurnoActivo = true;
    actualizarBotonAutoTurnoArena();
    deshabilitarAccionesArena(true);

    agregarLogArena(
        tfArena("arena_auto_activated", { pokemon: playerInicial.nombre }),
        tSafeArena("arena_system")
    );

    try {
        while (!arenaCombatEnded && arenaAutoTurnoActivo) {
            const playerActual = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);
            const enemyActual = obtenerPokemonActivoArena(arenaEnemyTeam, arenaEnemyIndex);

            if (!playerActual || !enemyActual) {
                await verificarFinCombateArena();
                break;
            }

            const mismoPlayer = String(playerActual.id) === playerInicialId;
            const mismoEnemy = String(enemyActual.id) === enemyInicialId;

            if (!mismoPlayer || !mismoEnemy) {
                break;
            }

            await ejecutarTurnoAtaqueArena(true);

            if (arenaCombatEnded || !arenaAutoTurnoActivo) {
                break;
            }

            const playerDespues = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);
            const enemyDespues = obtenerPokemonActivoArena(arenaEnemyTeam, arenaEnemyIndex);

            const sigueMismoPlayer =
                playerDespues &&
                String(playerDespues.id) === playerInicialId &&
                !playerDespues.defeated;

            const sigueMismoEnemy =
                enemyDespues &&
                String(enemyDespues.id) === enemyInicialId &&
                !enemyDespues.defeated;

            if (!sigueMismoPlayer || !sigueMismoEnemy) {
                break;
            }

            await esperarArena(320);
        }
    } finally {
        arenaAutoTurnoActivo = false;
        actualizarBotonAutoTurnoArena();

        if (!arenaCombatEnded) {
            habilitarAccionesArena();
        }
    }
}

function detenerAutoTurnoArena() {
    arenaAutoTurnoActivo = false;
    actualizarBotonAutoTurnoArena();
}

function actualizarBotonAutoTurnoArena() {
    const btnAuto = document.getElementById("btnArenaAuto");
    if (!btnAuto) return;

    btnAuto.classList.remove("btn-arena-light", "btn-arena-primary", "auto-turno-activo");

    if (arenaAutoTurnoActivo) {
        btnAuto.classList.add("btn-arena-primary", "auto-turno-activo");
        btnAuto.textContent = tSafeArena("arena_action_auto_active");
    } else {
        btnAuto.classList.add("btn-arena-light");
        btnAuto.textContent = tSafeArena("arena_action_auto");
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
        tfArena("arena_log_attack", {
            attacker: atacante.nombre,
            defender: defensor.nombre,
            damage: resultadoDanio.danio
        }),
        esAtaqueJugador ? tSafeArena("battle_your_team") : tSafeArena("battle_rival")
    );

    if (resultadoDanio.textoEfectividad) {
        agregarLogArena(resultadoDanio.textoEfectividad, tSafeArena("arena_system"));
    }

    renderArenaCompleta();
    await esperarArena(420);

    if (defensor.hp_actual <= 0) {
        defensor.hp_actual = 0;
        defensor.defeated = true;

        agregarLogArena(
            tfArena("arena_log_fainted", { pokemon: defensor.nombre }),
            tSafeArena("arena_system")
        );

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
                agregarLogArena(
                    tfArena("arena_log_enemy_enters", { pokemon: arenaEnemyTeam[siguiente].nombre }),
                    tSafeArena("battle_rival")
                );
                renderArenaCompleta();
                await esperarArena(250);
            }
        } else {
            const siguiente = encontrarSiguienteVivoArena(arenaPlayerTeam);
            if (siguiente !== -1) {
                arenaPlayerIndex = siguiente;
                agregarLogArena(
                    tfArena("arena_log_player_enters", { pokemon: arenaPlayerTeam[siguiente].nombre }),
                    tSafeArena("battle_your_team")
                );
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
            const recompensaResultado = await procesarRecompensasVictoriaArena();
            mostrarResultadoArena(true, recompensaResultado);
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

function deshabilitarAccionesArena(mantenerAuto = false) {
    const ids = ["btnArenaAtacar", "btnArenaCambiar", "btnArenaSalir"];
    ids.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = true;
    });

    const btnAuto = document.getElementById("btnArenaAuto");
    if (btnAuto) {
        btnAuto.disabled = !mantenerAuto;
    }

    actualizarBotonAutoTurnoArena();
}

function habilitarAccionesArena() {
    const ids = ["btnArenaAtacar", "btnArenaCambiar", "btnArenaAuto", "btnArenaSalir"];
    ids.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = false;
    });

    actualizarBotonAutoTurnoArena();
}

/* =========================================================
   CAMBIO DE POKÉMON
========================================================= */
function abrirModalCambioArena() {
    if (arenaCombatEnded || arenaTurnoEnProceso) return;

    detenerAutoTurnoArena();

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
                <span>${tSafeArena("arena_level_short")} ${pokemon.nivel} · HP ${pokemon.hp_actual}/${pokemon.hp_max} · ATK ${pokemon.ataque} · DEF ${pokemon.defensa}</span>
            </button>
        `;
    }).join("");

    optionsBox.querySelectorAll("[data-change-index]").forEach(btn => {
        btn.addEventListener("click", () => {
            const newIndex = Number(btn.dataset.changeIndex);
            if (Number.isNaN(newIndex)) return;

            arenaPlayerIndex = newIndex;
            agregarLogArena(
                tfArena("arena_log_player_enters", { pokemon: arenaPlayerTeam[newIndex].nombre }),
                tSafeArena("battle_your_team")
            );
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
        const recompensa = obtenerRecompensasPorDificultadArena();

        const data = await otorgarRecompensasVictoriaArena(
            recompensa.exp,
            recompensa.pokedolares
        );

        agregarLogArena(
            tfArena("arena_rewards_log", {
                difficulty: recompensa.nombre,
                coins: data?.pokedolares_ganados ?? recompensa.pokedolares,
                exp: data?.exp_ganada ?? recompensa.exp
            }),
            tSafeArena("arena_system")
        );

        return {
            exp: recompensa.exp,
            pokedolares: recompensa.pokedolares,
            data
        };
    } catch (error) {
        console.warn("No se pudieron aplicar las recompensas de victoria:", error);
        agregarLogArena(tSafeArena("arena_rewards_error"), tSafeArena("arena_system"));
        return null;
    }
}

/* =========================================================
   RESULTADO / LOG
========================================================= */
function mostrarResultadoArena(victoria = true, recompensa = null, soloRefresco = false) {
    const modal = document.getElementById("arenaResultModal");
    const icon = document.getElementById("arenaResultIcon");
    const title = document.getElementById("arenaResultTitle");
    const text = document.getElementById("arenaResultText");

    if (!modal || !icon || !title || !text) return;

    arenaUltimoResultado = { victoria, recompensa };

    if (victoria) {
        const recompensaFinal = recompensa || obtenerRecompensasPorDificultadArena();
        const dificultadTexto = obtenerRecompensasPorDificultadArena().nombre;

        icon.textContent = "🏆";
        icon.style.background = "#dcfce7";
        icon.style.color = "#15803d";
        title.textContent = tSafeArena("arena_victory");
        text.textContent = tfArena("arena_result_victory_text", {
            difficulty: dificultadTexto,
            coins: recompensaFinal?.pokedolares ?? 0,
            exp: recompensaFinal?.exp ?? 0
        });

        if (!soloRefresco) {
            mostrarMensajeArena(tSafeArena("arena_victory_message"), "ok");
        }
    } else {
        icon.textContent = "✖";
        icon.style.background = "#fee2e2";
        icon.style.color = "#b91c1c";
        title.textContent = tSafeArena("arena_defeat_title");
        text.textContent = tSafeArena("arena_defeat_text");

        if (!soloRefresco) {
            mostrarMensajeArena(tSafeArena("arena_defeat_message"), "error");
        }
    }

    modal.classList.remove("oculto");
}

function agregarLogArena(texto, autor = null) {
    const log = document.getElementById("arenaBattleLog");
    if (!log) return;

    const item = document.createElement("div");
    item.className = "arena-log-item";
    item.innerHTML = `
        <small>${escapeHtmlArena(autor || tSafeArena("arena_system"))} · ${tSafeArena("arena_turn")} ${arenaTurno}</small>
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

    if (valor.includes("agua") || valor.includes("water")) return "type-agua";
    if (valor.includes("fuego") || valor.includes("fire")) return "type-fuego";
    if (valor.includes("planta") || valor.includes("grass")) return "type-planta";
    if (valor.includes("electrico") || valor.includes("electric")) return "type-electrico";
    if (valor.includes("psiquico") || valor.includes("psychic")) return "type-psiquico";
    if (valor.includes("roca") || valor.includes("rock")) return "type-roca";
    if (valor.includes("veneno") || valor.includes("poison")) return "type-veneno";
    if (valor.includes("volador") || valor.includes("flying")) return "type-volador";
    if (valor.includes("fantasma") || valor.includes("ghost")) return "type-fantasma";
    if (valor.includes("bicho") || valor.includes("bug")) return "type-bicho";
    if (valor.includes("lucha") || valor.includes("fighting")) return "type-lucha";
    if (valor.includes("normal")) return "type-normal";
    if (valor.includes("tierra") || valor.includes("ground")) return "type-tierra";
    if (valor.includes("hielo") || valor.includes("ice")) return "type-hielo";
    if (valor.includes("dragon")) return "type-dragon";
    if (valor.includes("acero") || valor.includes("steel")) return "type-acero";
    if (valor.includes("hada") || valor.includes("fairy")) return "type-hada";

    return "type-default";
}

function traducirTipoPokemonArena(tipo = "") {
    const mapa = {
        "Normal": "type_normal",
        "normal": "type_normal",
        "Fuego": "type_fire",
        "fuego": "type_fire",
        "Fire": "type_fire",
        "fire": "type_fire",
        "Agua": "type_water",
        "agua": "type_water",
        "Water": "type_water",
        "water": "type_water",
        "Planta": "type_grass",
        "planta": "type_grass",
        "Grass": "type_grass",
        "grass": "type_grass",
        "Electrico": "type_electric",
        "Eléctrico": "type_electric",
        "electrico": "type_electric",
        "eléctrico": "type_electric",
        "Electric": "type_electric",
        "electric": "type_electric",
        "Hielo": "type_ice",
        "hielo": "type_ice",
        "Ice": "type_ice",
        "ice": "type_ice",
        "Lucha": "type_fighting",
        "lucha": "type_fighting",
        "Fighting": "type_fighting",
        "fighting": "type_fighting",
        "Veneno": "type_poison",
        "veneno": "type_poison",
        "Poison": "type_poison",
        "poison": "type_poison",
        "Tierra": "type_ground",
        "tierra": "type_ground",
        "Ground": "type_ground",
        "ground": "type_ground",
        "Volador": "type_flying",
        "volador": "type_flying",
        "Flying": "type_flying",
        "flying": "type_flying",
        "Psiquico": "type_psychic",
        "Psíquico": "type_psychic",
        "psiquico": "type_psychic",
        "psíquico": "type_psychic",
        "Psychic": "type_psychic",
        "psychic": "type_psychic",
        "Bicho": "type_bug",
        "bicho": "type_bug",
        "Bug": "type_bug",
        "bug": "type_bug",
        "Roca": "type_rock",
        "roca": "type_rock",
        "Rock": "type_rock",
        "rock": "type_rock",
        "Fantasma": "type_ghost",
        "fantasma": "type_ghost",
        "Ghost": "type_ghost",
        "ghost": "type_ghost",
        "Dragon": "type_dragon",
        "Dragón": "type_dragon",
        "dragon": "type_dragon",
        "dragón": "type_dragon",
        "Acero": "type_steel",
        "acero": "type_steel",
        "Steel": "type_steel",
        "steel": "type_steel",
        "Hada": "type_fairy",
        "hada": "type_fairy",
        "Fairy": "type_fairy",
        "fairy": "type_fairy"
    };

    return String(tipo || "")
        .split("/")
        .map(parte => {
            const limpio = parte.trim();
            const key = mapa[limpio];
            return key ? tSafeArena(key) : limpio;
        })
        .join("/");
}

function tSafeArena(key) {
    if (typeof t === "function") {
        return t(key);
    }
    return key;
}

function tfArena(key, values = {}) {
    let texto = tSafeArena(key);

    for (const [campo, valor] of Object.entries(values)) {
        texto = texto.replaceAll(`{${campo}}`, String(valor));
    }

    return texto;
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