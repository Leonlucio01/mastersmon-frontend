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
let arenaRecompensaProcesada = false;
let arenaRecompensaEnProceso = false;
let arenaUltimaRecompensaAplicada = null;
let arenaBattleSessionToken = null;
let arenaBattleSessionExpiraEn = null;
let arenaBattleSessionTtlSegundos = 0;
let arenaDificultadActual = "normal";
let arenaActividadHeartbeat = null;

let arenaMovesPanelAbierto = false;
let arenaMovimientoJugadorPendiente = null;


const BATTLE_TEAM_STORAGE_KEY = "mastersmon_battle_team_v1";
const BATTLE_ARENA_PLAYER_TEAM_KEY = "mastersmon_battle_arena_team_v1";
const BATTLE_ENEMY_LEVEL_BONUS_KEY = "mastersmon_battle_enemy_level_bonus_v1";
const BATTLE_ARENA_SESSION_TOKEN_KEY = "mastersmon_battle_arena_session_token_v1";
const BATTLE_ARENA_SESSION_EXPIRES_KEY = "mastersmon_battle_arena_session_expires_v1";
const BATTLE_ARENA_DIFFICULTY_KEY = "mastersmon_battle_arena_difficulty_v1";
const BATTLE_ARENA_ACTIVITY_SESSION_KEY = "mastersmon_battle_arena_activity_session_v1";
const ARENA_ACTIVITY_HEARTBEAT_MS = 60000;

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


const ARENA_MOVE_LIBRARY = {
    tackle:         { codigo: "tackle", nombre: "Tackle", tipo: "Normal",   categoria: "fisico",   potencia: 40,  precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    headbutt:       { codigo: "headbutt", nombre: "Headbutt", tipo: "Normal", categoria: "fisico", potencia: 55, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 6 },
    quick_attack:   { codigo: "quick_attack", nombre: "Quick Attack", tipo: "Normal", categoria: "fisico", potencia: 45, precision_pct: 100, cooldown_turnos: 0, prioridad: 1, nivel_requerido: 10 },
    swift:          { codigo: "swift", nombre: "Swift", tipo: "Normal", categoria: "especial", potencia: 60, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 18 },

    ember:          { codigo: "ember", nombre: "Ember", tipo: "Fire", categoria: "especial", potencia: 40, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    flame_wheel:    { codigo: "flame_wheel", nombre: "Flame Wheel", tipo: "Fire", categoria: "fisico", potencia: 60, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    flamethrower:   { codigo: "flamethrower", nombre: "Flamethrower", tipo: "Fire", categoria: "especial", potencia: 90, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    fire_blast:     { codigo: "fire_blast", nombre: "Fire Blast", tipo: "Fire", categoria: "especial", potencia: 110, precision_pct: 85, cooldown_turnos: 1, prioridad: 0, nivel_requerido: 42 },

    water_gun:      { codigo: "water_gun", nombre: "Water Gun", tipo: "Water", categoria: "especial", potencia: 40, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    bubble_beam:    { codigo: "bubble_beam", nombre: "Bubble Beam", tipo: "Water", categoria: "especial", potencia: 65, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    aqua_tail:      { codigo: "aqua_tail", nombre: "Aqua Tail", tipo: "Water", categoria: "fisico", potencia: 80, precision_pct: 90, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    hydro_pump:     { codigo: "hydro_pump", nombre: "Hydro Pump", tipo: "Water", categoria: "especial", potencia: 110, precision_pct: 80, cooldown_turnos: 1, prioridad: 0, nivel_requerido: 42 },

    vine_whip:      { codigo: "vine_whip", nombre: "Vine Whip", tipo: "Grass", categoria: "fisico", potencia: 45, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    razor_leaf:     { codigo: "razor_leaf", nombre: "Razor Leaf", tipo: "Grass", categoria: "fisico", potencia: 55, precision_pct: 95, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    giga_drain:     { codigo: "giga_drain", nombre: "Giga Drain", tipo: "Grass", categoria: "especial", potencia: 75, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    solar_beam:     { codigo: "solar_beam", nombre: "Solar Beam", tipo: "Grass", categoria: "especial", potencia: 120, precision_pct: 100, cooldown_turnos: 1, prioridad: 0, nivel_requerido: 42 },

    thunder_shock:  { codigo: "thunder_shock", nombre: "Thunder Shock", tipo: "Electric", categoria: "especial", potencia: 40, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    spark:          { codigo: "spark", nombre: "Spark", tipo: "Electric", categoria: "fisico", potencia: 65, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    thunderbolt:    { codigo: "thunderbolt", nombre: "Thunderbolt", tipo: "Electric", categoria: "especial", potencia: 90, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    thunder:        { codigo: "thunder", nombre: "Thunder", tipo: "Electric", categoria: "especial", potencia: 110, precision_pct: 70, cooldown_turnos: 1, prioridad: 0, nivel_requerido: 42 },

    powder_snow:    { codigo: "powder_snow", nombre: "Powder Snow", tipo: "Ice", categoria: "especial", potencia: 40, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    ice_shard:      { codigo: "ice_shard", nombre: "Ice Shard", tipo: "Ice", categoria: "fisico", potencia: 40, precision_pct: 100, cooldown_turnos: 0, prioridad: 1, nivel_requerido: 10 },
    ice_beam:       { codigo: "ice_beam", nombre: "Ice Beam", tipo: "Ice", categoria: "especial", potencia: 90, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    blizzard:       { codigo: "blizzard", nombre: "Blizzard", tipo: "Ice", categoria: "especial", potencia: 110, precision_pct: 70, cooldown_turnos: 1, prioridad: 0, nivel_requerido: 42 },

    karate_chop:    { codigo: "karate_chop", nombre: "Karate Chop", tipo: "Fighting", categoria: "fisico", potencia: 50, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    brick_break:    { codigo: "brick_break", nombre: "Brick Break", tipo: "Fighting", categoria: "fisico", potencia: 75, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 14 },
    cross_chop:     { codigo: "cross_chop", nombre: "Cross Chop", tipo: "Fighting", categoria: "fisico", potencia: 100, precision_pct: 80, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 28 },
    close_combat:   { codigo: "close_combat", nombre: "Close Combat", tipo: "Fighting", categoria: "fisico", potencia: 120, precision_pct: 100, cooldown_turnos: 1, prioridad: 0, nivel_requerido: 42 },

    poison_sting:   { codigo: "poison_sting", nombre: "Poison Sting", tipo: "Poison", categoria: "fisico", potencia: 35, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    acid:           { codigo: "acid", nombre: "Acid", tipo: "Poison", categoria: "especial", potencia: 40, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    sludge_bomb:    { codigo: "sludge_bomb", nombre: "Sludge Bomb", tipo: "Poison", categoria: "especial", potencia: 90, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    gunk_shot:      { codigo: "gunk_shot", nombre: "Gunk Shot", tipo: "Poison", categoria: "fisico", potencia: 110, precision_pct: 80, cooldown_turnos: 1, prioridad: 0, nivel_requerido: 42 },

    mud_slap:       { codigo: "mud_slap", nombre: "Mud Slap", tipo: "Ground", categoria: "especial", potencia: 35, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    bulldoze:       { codigo: "bulldoze", nombre: "Bulldoze", tipo: "Ground", categoria: "fisico", potencia: 60, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    dig:            { codigo: "dig", nombre: "Dig", tipo: "Ground", categoria: "fisico", potencia: 80, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    earthquake:     { codigo: "earthquake", nombre: "Earthquake", tipo: "Ground", categoria: "fisico", potencia: 100, precision_pct: 100, cooldown_turnos: 1, prioridad: 0, nivel_requerido: 42 },

    gust:           { codigo: "gust", nombre: "Gust", tipo: "Flying", categoria: "especial", potencia: 40, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    wing_attack:    { codigo: "wing_attack", nombre: "Wing Attack", tipo: "Flying", categoria: "fisico", potencia: 60, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    air_slash:      { codigo: "air_slash", nombre: "Air Slash", tipo: "Flying", categoria: "especial", potencia: 75, precision_pct: 95, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    drill_peck:     { codigo: "drill_peck", nombre: "Drill Peck", tipo: "Flying", categoria: "fisico", potencia: 90, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 42 },

    confusion:      { codigo: "confusion", nombre: "Confusion", tipo: "Psychic", categoria: "especial", potencia: 50, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    psybeam:        { codigo: "psybeam", nombre: "Psybeam", tipo: "Psychic", categoria: "especial", potencia: 65, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    psychic:        { codigo: "psychic", nombre: "Psychic", tipo: "Psychic", categoria: "especial", potencia: 90, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    future_sight:   { codigo: "future_sight", nombre: "Future Sight", tipo: "Psychic", categoria: "especial", potencia: 110, precision_pct: 100, cooldown_turnos: 1, prioridad: 0, nivel_requerido: 42 },

    bug_bite:       { codigo: "bug_bite", nombre: "Bug Bite", tipo: "Bug", categoria: "fisico", potencia: 60, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    signal_beam:    { codigo: "signal_beam", nombre: "Signal Beam", tipo: "Bug", categoria: "especial", potencia: 75, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    x_scissor:      { codigo: "x_scissor", nombre: "X-Scissor", tipo: "Bug", categoria: "fisico", potencia: 80, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    megahorn:       { codigo: "megahorn", nombre: "Megahorn", tipo: "Bug", categoria: "fisico", potencia: 120, precision_pct: 85, cooldown_turnos: 1, prioridad: 0, nivel_requerido: 42 },

    rock_throw:     { codigo: "rock_throw", nombre: "Rock Throw", tipo: "Rock", categoria: "fisico", potencia: 50, precision_pct: 90, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    rock_slide:     { codigo: "rock_slide", nombre: "Rock Slide", tipo: "Rock", categoria: "fisico", potencia: 75, precision_pct: 90, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    power_gem:      { codigo: "power_gem", nombre: "Power Gem", tipo: "Rock", categoria: "especial", potencia: 80, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    stone_edge:     { codigo: "stone_edge", nombre: "Stone Edge", tipo: "Rock", categoria: "fisico", potencia: 100, precision_pct: 80, cooldown_turnos: 1, prioridad: 0, nivel_requerido: 42 },

    lick:           { codigo: "lick", nombre: "Lick", tipo: "Ghost", categoria: "fisico", potencia: 30, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    shadow_punch:   { codigo: "shadow_punch", nombre: "Shadow Punch", tipo: "Ghost", categoria: "fisico", potencia: 60, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    shadow_ball:    { codigo: "shadow_ball", nombre: "Shadow Ball", tipo: "Ghost", categoria: "especial", potencia: 80, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    phantom_force:  { codigo: "phantom_force", nombre: "Phantom Force", tipo: "Ghost", categoria: "fisico", potencia: 100, precision_pct: 100, cooldown_turnos: 1, prioridad: 0, nivel_requerido: 42 },

    twister:        { codigo: "twister", nombre: "Twister", tipo: "Dragon", categoria: "especial", potencia: 40, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    dragon_breath:  { codigo: "dragon_breath", nombre: "Dragon Breath", tipo: "Dragon", categoria: "especial", potencia: 60, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    dragon_claw:    { codigo: "dragon_claw", nombre: "Dragon Claw", tipo: "Dragon", categoria: "fisico", potencia: 80, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    dragon_pulse:   { codigo: "dragon_pulse", nombre: "Dragon Pulse", tipo: "Dragon", categoria: "especial", potencia: 90, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 42 },

    metal_claw:     { codigo: "metal_claw", nombre: "Metal Claw", tipo: "Steel", categoria: "fisico", potencia: 50, precision_pct: 95, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    steel_wing:     { codigo: "steel_wing", nombre: "Steel Wing", tipo: "Steel", categoria: "fisico", potencia: 70, precision_pct: 90, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    iron_head:      { codigo: "iron_head", nombre: "Iron Head", tipo: "Steel", categoria: "fisico", potencia: 80, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    flash_cannon:   { codigo: "flash_cannon", nombre: "Flash Cannon", tipo: "Steel", categoria: "especial", potencia: 80, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 42 },

    fairy_wind:     { codigo: "fairy_wind", nombre: "Fairy Wind", tipo: "Fairy", categoria: "especial", potencia: 40, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 },
    draining_kiss:  { codigo: "draining_kiss", nombre: "Draining Kiss", tipo: "Fairy", categoria: "especial", potencia: 50, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 12 },
    dazzling_gleam: { codigo: "dazzling_gleam", nombre: "Dazzling Gleam", tipo: "Fairy", categoria: "especial", potencia: 80, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 24 },
    moonblast:      { codigo: "moonblast", nombre: "Moonblast", tipo: "Fairy", categoria: "especial", potencia: 95, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 42 },

    battle_strike:  { codigo: "battle_strike", nombre: "Battle Strike", tipo: "Normal", categoria: "fisico", potencia: 45, precision_pct: 100, cooldown_turnos: 0, prioridad: 0, nivel_requerido: 1 }
};

const ARENA_TYPE_MOVESET_CODES = {
    normal: ["tackle", "headbutt", "quick_attack", "swift"],
    fuego: ["ember", "flame_wheel", "flamethrower", "fire_blast"],
    agua: ["water_gun", "bubble_beam", "aqua_tail", "hydro_pump"],
    planta: ["vine_whip", "razor_leaf", "giga_drain", "solar_beam"],
    electrico: ["thunder_shock", "spark", "thunderbolt", "thunder"],
    hielo: ["powder_snow", "ice_shard", "ice_beam", "blizzard"],
    lucha: ["karate_chop", "brick_break", "cross_chop", "close_combat"],
    veneno: ["poison_sting", "acid", "sludge_bomb", "gunk_shot"],
    tierra: ["mud_slap", "bulldoze", "dig", "earthquake"],
    volador: ["gust", "wing_attack", "air_slash", "drill_peck"],
    psiquico: ["confusion", "psybeam", "psychic", "future_sight"],
    bicho: ["bug_bite", "signal_beam", "x_scissor", "megahorn"],
    roca: ["rock_throw", "rock_slide", "power_gem", "stone_edge"],
    fantasma: ["lick", "shadow_punch", "shadow_ball", "phantom_force"],
    dragon: ["twister", "dragon_breath", "dragon_claw", "dragon_pulse"],
    acero: ["metal_claw", "steel_wing", "iron_head", "flash_cannon"],
    hada: ["fairy_wind", "draining_kiss", "dazzling_gleam", "moonblast"]
};

const ARENA_MOVE_CATEGORY_LABELS = {
    fisico: "Physical",
    especial: "Special",
    estado: "Status"
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

    window.addEventListener("beforeunload", () => {
        detenerHeartbeatActividadArena();
    });
});

/* =========================================================
   INIT / CONFIG
========================================================= */
async function inicializarArenaBattle() {
    arenaRecompensaProcesada = false;
    arenaRecompensaEnProceso = false;
    arenaUltimaRecompensaAplicada = null;
    arenaBattleSessionToken = null;
    arenaBattleSessionExpiraEn = null;
    arenaBattleSessionTtlSegundos = 0;
    arenaDificultadActual = sessionStorage.getItem(BATTLE_ARENA_DIFFICULTY_KEY) || "normal";

    sincronizarUsuarioArena();
    configurarEventosArena();

    try {
        await cargarEquipoJugadorArena();
        await iniciarSesionBatallaArena();
        generarEquipoRivalFase1();
        renderArenaCompleta();
        agregarLogArena(tSafeArena("arena_log_start"), tSafeArena("arena_system"));
        ocultarMensajeArena();
        habilitarAccionesArena();
        actualizarBotonAutoTurnoArena();
        iniciarHeartbeatActividadArena();
        registrarActividadArena("view", `dificultad:${obtenerCodigoDificultadArena()}`).catch(() => {});
    } catch (error) {
        console.error("Error iniciando arena:", error);
        mostrarMensajeArena(error?.message || tSafeArena("arena_init_error"), "error");
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
    const btnCerrarMoves = document.getElementById("btnArenaCerrarMoves");
    const btnVolverBattle = document.getElementById("btnArenaVolverBattle");
    const btnReintentar = document.getElementById("btnArenaReintentar");

    if (btnAtacar) btnAtacar.addEventListener("click", togglePanelMovimientosArena);
    if (btnCambiar) btnCambiar.addEventListener("click", abrirModalCambioArena);
    if (btnAuto) btnAuto.addEventListener("click", ejecutarAutoTurnoArena);
    if (btnSalir) btnSalir.addEventListener("click", () => window.location.href = "battle.html");

    if (btnCerrarCambio) {
        btnCerrarCambio.addEventListener("click", () => {
            document.getElementById("arenaChangeModal")?.classList.add("oculto");
        });
    }

    if (btnCerrarMoves) {
        btnCerrarMoves.addEventListener("click", cerrarPanelMovimientosArena);
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
        equipoGuardado = await cargarEquipoGuardadoBackendArena();
    }

    if (!Array.isArray(equipoGuardado) || equipoGuardado.length !== 6) {
        throw new Error(tSafeArena("arena_need_full_team"));
    }

    arenaPlayerTeam = equipoGuardado
        .slice(0, 6)
        .map((pokemon, index) => normalizarPokemonArena(pokemon, "player", index));

    await cargarMovimientosEquipoJugadorArena();
    guardarEquipoArenaEnStorages();
}

function obtenerPoolRivalesArena() {

    const dificultad = obtenerCodigoDificultadArena();

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

    if (dificultad === "master") return poolMaestro;
    if (dificultad === "expert") return poolExperto;
    if (dificultad === "challenge") return poolDesafio;
    return poolNormal;
}

function generarEquipoRivalFase1() {
    const basePool = obtenerPoolRivalesArena();
    const promedioNivel = calcularPromedioNivelArena(arenaPlayerTeam) || 5;
    const bonusNivel = obtenerBonusNivelRivalArena();
    const nivelBaseRival = Math.max(1, promedioNivel + bonusNivel);
    const rivales = [];

    for (let i = 0; i < 6; i++) {
        const elegido = { ...basePool[Math.floor(Math.random() * basePool.length)] };
        const nivel = nivelBaseRival;
        const nivelFactor = Math.max(0, nivel - 1);

        const hpFinal = Number(elegido.hp || 1) + (nivelFactor * 4);
        const ataqueFinal = Number(elegido.ataque || 1) + (nivelFactor * 2);
        const defensaFinal = Number(elegido.defensa || 1) + (nivelFactor * 2);
        const velocidadFinal = Number(elegido.velocidad || 1) + nivelFactor;
        const ataqueEspecialFinal = Number(elegido.ataque_especial ?? elegido.ataque ?? 1) + (nivelFactor * 2);
        const defensaEspecialFinal = Number(elegido.defensa_especial ?? elegido.defensa ?? 1) + (nivelFactor * 2);

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
            ataque_especial: ataqueEspecialFinal,
            defensa_especial: defensaEspecialFinal,
            movimientos_equipados: generarMovimientosRivalArena(elegido, nivel),
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
        ataque_especial: Number(pokemon.ataque_especial ?? pokemon.ataque ?? 1),
        defensa_especial: Number(pokemon.defensa_especial ?? pokemon.defensa ?? 1),
        experiencia: Number(pokemon.experiencia ?? 0),
        es_shiny: !!pokemon.es_shiny,
        posicion: Number(pokemon.posicion ?? slotIndex + 1),
        es_lider: Boolean(pokemon.es_lider ?? Number(pokemon.posicion ?? slotIndex + 1) === 1),
        movimientos_equipados: normalizarListaMovimientosArena(pokemon.movimientos_equipados || pokemon.equipados || [], true),
        movimientos_desbloqueados: normalizarListaMovimientosArena(pokemon.movimientos_desbloqueados || pokemon.movimientos || [], false),
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
    const codigo = obtenerCodigoDificultadArena();

    if (codigo === "master") {
        return {
            codigo: "master",
            nombre: obtenerNombreDificultadArena("master"),
            exp: 6000,
            pokedolares: 15000
        };
    }

    if (codigo === "expert") {
        return {
            codigo: "expert",
            nombre: obtenerNombreDificultadArena("expert"),
            exp: 4500,
            pokedolares: 10000
        };
    }

    if (codigo === "challenge") {
        return {
            codigo: "challenge",
            nombre: obtenerNombreDificultadArena("challenge"),
            exp: 3500,
            pokedolares: 5000
        };
    }

    return {
        codigo: "normal",
        nombre: obtenerNombreDificultadArena("normal"),
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
    renderPanelMovimientosArena();
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

            <div class="arena-stats-grid arena-stats-grid-extended">
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
                    <span>SP ATK</span>
                    <strong>${pokemon.ataque_especial}</strong>
                </div>
                <div class="arena-stat-card">
                    <span>SP DEF</span>
                    <strong>${pokemon.defensa_especial}</strong>
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

function renderResumenMovimientosActivoArena(pokemon) {
    const movimientos = obtenerMovimientosEquipadosArena(pokemon, true).slice(0, 4);
    if (!movimientos.length) return "";

    return `
        <div class="arena-active-moves-inline">
            ${movimientos.map(movimiento => {
                const categoria = obtenerEtiquetaCategoriaMovimientoArena(movimiento.categoria);
                const cooldownRestante = Number(movimiento.cooldown_restante || 0);
                return `
                    <div class="arena-active-move-chip ${cooldownRestante > 0 ? "is-cooling" : ""}">
                        <strong>${escapeHtmlArena(movimiento.nombre)}</strong>
                        <span>${escapeHtmlArena(traducirTipoPokemonArena(movimiento.tipo || "Normal"))} · ${escapeHtmlArena(categoria)}</span>
                    </div>
                `;
            }).join("")}
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
    const tipoClase = obtenerClaseTipoArena(pokemon.tipo);
    const expActual = calcularExpActualArena(pokemon);
    const expObjetivo = calcularExpObjetivoArena(pokemon.nivel);
    const expPercent = calcularExpPercentArena(pokemon);
    const hpPercent = calcularHpPercentArena(pokemon);
    const hpClass = obtenerClaseHpArena(hpPercent);

    return `
        <article class="arena-mini-card ${tipoClase} ${isActive ? (isEnemy ? "enemy-active" : "active") : ""} ${pokemon.defeated ? "fainted" : ""}">
            <div class="arena-mini-card-top">
                <div class="arena-mini-sprite-wrap">
                    <img src="${imagen}" alt="${escapeHtmlArena(pokemon.nombre)}">
                </div>
                ${isActive ? `<span class="arena-mini-focus-badge ${isEnemy ? "enemy" : "player"}">${isEnemy ? "Rival" : "Active"}</span>` : ""}
                ${pokemon.defeated ? `<span class="arena-mini-focus-badge is-ko">KO</span>` : ""}
            </div>

            <h4>${escapeHtmlArena(pokemon.nombre)}</h4>
            <div class="arena-mini-type-pill ${tipoClase}">${escapeHtmlArena(tipoTraducido)}</div>

            <div class="arena-mini-hp-block">
                <div class="arena-mini-hp-top">
                    <span>HP ${pokemon.hp_actual}</span>
                    <strong>${pokemon.hp_max}</strong>
                </div>
                <div class="arena-mini-hp-bar">
                    <div class="arena-mini-hp-fill ${hpClass}" style="width:${hpPercent}%"></div>
                </div>
            </div>

            <div class="arena-mini-meta">
                <span class="atk">ATK ${pokemon.ataque}</span>
                <span class="def">DEF ${pokemon.defensa}</span>
                <span class="spd">SPD ${pokemon.velocidad}</span>
            </div>

            ${!isEnemy ? `
                <div class="arena-mini-exp-wrap">
                    <div class="arena-mini-exp-bar">
                        <div class="arena-mini-exp-fill" style="width:${expPercent}%"></div>
                    </div>
                    <small class="arena-mini-exp-text">${tSafeArena("arena_exp")} ${expActual}/${expObjetivo}</small>
                </div>
            ` : ""}
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

function togglePanelMovimientosArena() {
    if (arenaCombatEnded || arenaTurnoEnProceso) return;

    if (arenaMovesPanelAbierto) {
        cerrarPanelMovimientosArena();
    } else {
        abrirPanelMovimientosArena();
    }
}

function abrirPanelMovimientosArena() {
    if (arenaCombatEnded || arenaTurnoEnProceso) return;
    arenaMovesPanelAbierto = true;
    arenaMovimientoJugadorPendiente = null;
    renderPanelMovimientosArena();
}

function cerrarPanelMovimientosArena() {
    arenaMovesPanelAbierto = false;
    arenaMovimientoJugadorPendiente = null;
    renderPanelMovimientosArena();
}

function renderPanelMovimientosArena() {
    const panel = document.getElementById("arenaMovesPanel");
    const grid = document.getElementById("arenaMovesGrid");
    const subtitle = document.getElementById("arenaMovesPanelSubtitle");

    if (!panel || !grid) return;

    const playerPokemon = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);

    if (!arenaMovesPanelAbierto || !playerPokemon || arenaCombatEnded) {
        panel.classList.add("oculto");
        grid.innerHTML = "";
        if (subtitle) {
            subtitle.textContent = "Choose one of the 4 equipped moves of your active Pokémon.";
        }
        return;
    }

    const movimientos = obtenerMovimientosEquipadosArena(playerPokemon, true);
    panel.classList.remove("oculto");

    if (subtitle) {
        subtitle.textContent = `${playerPokemon.nombre} · Lv ${playerPokemon.nivel} · Choose your next move`;
    }

    if (!movimientos.length) {
        grid.innerHTML = `
            <div class="arena-moves-empty">
                This Pokémon has no equipped moves yet.
            </div>
        `;
        return;
    }

    grid.innerHTML = movimientos.map(movimiento => renderMoveCardArena(movimiento, true)).join("");

    grid.querySelectorAll("[data-arena-move-slot]").forEach(btn => {
        btn.addEventListener("click", async () => {
            const slot = Number(btn.dataset.arenaMoveSlot);
            if (Number.isNaN(slot)) return;

            const pokemonActivo = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);
            const movimiento = obtenerMovimientoPorSlotArena(pokemonActivo, slot, true);
            if (!movimiento) {
                return;
            }

            arenaMovimientoJugadorPendiente = movimiento;
            btn.classList.add("is-selected");
            await esperarArena(60);
            await ejecutarTurnoAtaqueArena(false, movimiento);
        });
    });
}

function renderMoveCardArena(movimiento, esJugador = true) {
    const tipoClase = obtenerClaseTipoArena(movimiento.tipo || "Normal");
    const categoria = obtenerEtiquetaCategoriaMovimientoArena(movimiento.categoria);
    const potencia = movimiento.potencia ?? "—";
    const precisionNumero = Math.max(1, Number(movimiento.precision_pct || 100));
    const precision = `${precisionNumero}%`;
    const prioridad = Number(movimiento.prioridad || 0);
    const tipoTraducido = traducirTipoPokemonArena(movimiento.tipo || "Normal");

    return `
        <button
            type="button"
            class="arena-move-card ${tipoClase}"
            data-arena-move-slot="${movimiento.slot || 0}"
        >
            <div class="arena-move-card-top">
                <span class="arena-move-slot">Slot ${movimiento.slot || "?"}</span>
                <span class="arena-move-status is-ready">Ready</span>
            </div>

            <div class="arena-move-title-row">
                <strong class="arena-move-name">${escapeHtmlArena(movimiento.nombre || "Move")}</strong>
                <span class="arena-move-type ${tipoClase}">${escapeHtmlArena(tipoTraducido)}</span>
            </div>

            <div class="arena-move-pill-row">
                <span class="arena-move-pill is-category">${escapeHtmlArena(categoria)}</span>
                <span class="arena-move-pill is-precision">ACC ${precision}</span>
            </div>

            <div class="arena-move-stats-grid">
                <div class="arena-move-stat-card">
                    <span>Power</span>
                    <strong>${potencia}</strong>
                </div>
                <div class="arena-move-stat-card">
                    <span>Accuracy</span>
                    <strong>${precision}</strong>
                </div>
                <div class="arena-move-stat-card">
                    <span>Priority</span>
                    <strong>${prioridad}</strong>
                </div>
            </div>

            <div class="arena-move-footer">
                <span>${esJugador ? "Tap to attack" : "Battle move"}</span>
                <span>${categoria}</span>
            </div>
        </button>
    `;
}

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
    const limpio = String(valor || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const mapa = {
        normal: "normal",
        fire: "fuego",
        fuego: "fuego",
        water: "agua",
        agua: "agua",
        grass: "planta",
        planta: "planta",
        electric: "electrico",
        electrico: "electrico",
        ice: "hielo",
        hielo: "hielo",
        fighting: "lucha",
        lucha: "lucha",
        poison: "veneno",
        veneno: "veneno",
        ground: "tierra",
        tierra: "tierra",
        flying: "volador",
        volador: "volador",
        psychic: "psiquico",
        psiquico: "psiquico",
        bug: "bicho",
        bicho: "bicho",
        rock: "roca",
        roca: "roca",
        ghost: "fantasma",
        fantasma: "fantasma",
        dragon: "dragon",
        steel: "acero",
        acero: "acero",
        fairy: "hada",
        hada: "hada"
    };

    return mapa[limpio] || limpio;
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

async function ejecutarTurnoAtaqueArena(desdeAuto = false, movimientoSeleccionado = null) {
    if (arenaCombatEnded || arenaTurnoEnProceso) return;

    const atacantePlayer = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);
    const atacanteEnemy = obtenerPokemonActivoArena(arenaEnemyTeam, arenaEnemyIndex);

    if (!atacantePlayer || !atacanteEnemy) {
        await verificarFinCombateArena();
        return;
    }

    const movimientoJugador = movimientoSeleccionado || seleccionarMejorMovimientoArena(atacantePlayer, atacanteEnemy);
    const movimientoRival = seleccionarMejorMovimientoArena(atacanteEnemy, atacantePlayer);

    if (!movimientoJugador) {
        mostrarMensajeArena("Your active Pokémon has no available move right now.", "warning");
        return;
    }

    arenaTurnoEnProceso = true;
    cerrarPanelMovimientosArena();

    if (!desdeAuto) {
        deshabilitarAccionesArena(false);
    }

    try {
        const prioridadPlayer = Number(movimientoJugador?.prioridad || 0);
        const prioridadEnemy = Number(movimientoRival?.prioridad || 0);

        const playerPrimero =
            prioridadPlayer === prioridadEnemy
                ? Number(atacantePlayer.velocidad || 0) >= Number(atacanteEnemy.velocidad || 0)
                : prioridadPlayer > prioridadEnemy;

        if (playerPrimero) {
            await resolverAtaqueArena(atacantePlayer, atacanteEnemy, movimientoJugador, true);

            if (!(await verificarFinCombateArena())) {
                const nuevoEnemy = obtenerPokemonActivoArena(arenaEnemyTeam, arenaEnemyIndex);
                const nuevoPlayer = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);

                if (nuevoEnemy && nuevoPlayer) {
                    const movimientoRivalActual = seleccionarMejorMovimientoArena(nuevoEnemy, nuevoPlayer);
                    await resolverAtaqueArena(nuevoEnemy, nuevoPlayer, movimientoRivalActual, false);
                }
            }
        } else {
            await resolverAtaqueArena(atacanteEnemy, atacantePlayer, movimientoRival, false);

            if (!(await verificarFinCombateArena())) {
                const nuevoEnemy = obtenerPokemonActivoArena(arenaEnemyTeam, arenaEnemyIndex);
                const nuevoPlayer = obtenerPokemonActivoArena(arenaPlayerTeam, arenaPlayerIndex);

                if (nuevoEnemy && nuevoPlayer) {
                    const movimientoJugadorActual = movimientoSeleccionado && String(nuevoPlayer.id) === String(atacantePlayer.id)
                        ? obtenerMovimientoPorSlotArena(nuevoPlayer, movimientoSeleccionado.slot, true) || seleccionarMejorMovimientoArena(nuevoPlayer, nuevoEnemy)
                        : seleccionarMejorMovimientoArena(nuevoPlayer, nuevoEnemy);

                    await resolverAtaqueArena(nuevoPlayer, nuevoEnemy, movimientoJugadorActual, true);
                }
            }
        }

        reducirCooldownsArena(arenaPlayerTeam);
        reducirCooldownsArena(arenaEnemyTeam);

        arenaTurno += 1;
        renderArenaCompleta();
        await verificarFinCombateArena();
    } finally {
        arenaTurnoEnProceso = false;
        arenaMovimientoJugadorPendiente = null;

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


async function resolverAtaqueArena(atacante, defensor, movimiento, esAtaqueJugador = false) {
    if (!atacante || !defensor || atacante.defeated || defensor.defeated) return;

    const movimientoUsado = movimiento || crearMovimientoFallbackArena(atacante, 1);
    const nombreMovimiento = movimientoUsado?.nombre || "Move";

    animarAtaqueArena(esAtaqueJugador);
    await esperarArena(220);

    aplicarCooldownMovimientoArena(atacante, movimientoUsado);

    const precision = Math.max(1, Math.min(100, Number(movimientoUsado.precision_pct || 100)));
    const acierta = Math.random() * 100 < precision;

    if (!acierta) {
        agregarLogArena(
            `${atacante.nombre} used ${nombreMovimiento}, but it missed.`,
            esAtaqueJugador ? tSafeArena("battle_your_team") : tSafeArena("battle_rival")
        );
        renderArenaCompleta();
        await esperarArena(320);
        return;
    }

    const resultadoDanio = calcularDanioArena(atacante, defensor, movimientoUsado);
    defensor.hp_actual = Math.max(0, Number(defensor.hp_actual) - resultadoDanio.danio);

    animarGolpeArena(!esAtaqueJugador);
    mostrarDanioFlotanteArena(!esAtaqueJugador, resultadoDanio.danio, resultadoDanio.multiplicador);

    agregarLogArena(
        `${atacante.nombre} used ${nombreMovimiento} and dealt ${resultadoDanio.danio} damage to ${defensor.nombre}.`,
        esAtaqueJugador ? tSafeArena("battle_your_team") : tSafeArena("battle_rival")
    );

    if (resultadoDanio.stab > 1) {
        agregarLogArena("Same-type bonus activated.", tSafeArena("arena_system"));
    }

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

function calcularDanioArena(atacante, defensor, movimiento) {
    const movimientoUsado = movimiento || crearMovimientoFallbackArena(atacante, 1);
    const esEspecial = String(movimientoUsado?.categoria || "").toLowerCase() === "especial";
    const statAtaque = Math.max(1, Number(esEspecial ? (atacante.ataque_especial ?? atacante.ataque ?? 1) : (atacante.ataque ?? 1)));
    const statDefensa = Math.max(1, Number(esEspecial ? (defensor.defensa_especial ?? defensor.defensa ?? 1) : (defensor.defensa ?? 1)));
    const potencia = Math.max(1, Number(movimientoUsado?.potencia || 40));

    const multiplicador = calcularMultiplicadorMovimientoContraDefensorArena(movimientoUsado?.tipo || atacante.tipo, defensor);
    const stab = tieneStabArena(atacante, movimientoUsado) ? 1.2 : 1;
    const nivelFactor = 0.9 + Math.min(1.15, Number(atacante.nivel || 1) / 100);
    const variacion = 0.92 + (Math.random() * 0.08);

    const base = (potencia * statAtaque / statDefensa) * nivelFactor;
    const danio = Math.max(1, Math.round((base / 8) * stab * multiplicador * variacion));

    return {
        base,
        potencia,
        multiplicador,
        stab,
        danio,
        textoEfectividad: describirMultiplicadorArena(multiplicador)
    };
}

function seleccionarMejorMovimientoArena(atacante, defensor) {
    const disponibles = obtenerMovimientosEquipadosArena(atacante, true);

    if (!disponibles.length) {
        return crearMovimientoFallbackArena(atacante, 1);
    }

    let mejor = disponibles[0];
    let mejorPuntaje = -Infinity;

    for (const movimiento of disponibles) {
        const potencia = Number(movimiento.potencia || 40);
        const precision = Math.max(1, Number(movimiento.precision_pct || 100)) / 100;
        const mult = calcularMultiplicadorMovimientoContraDefensorArena(movimiento.tipo, defensor);
        const stab = tieneStabArena(atacante, movimiento) ? 1.2 : 1;
        const prioridad = Number(movimiento.prioridad || 0) * 8;
        const puntaje = (potencia * mult * stab * precision) + prioridad;

        if (puntaje > mejorPuntaje) {
            mejor = movimiento;
            mejorPuntaje = puntaje;
        }
    }

    return mejor;
}

function obtenerMovimientosEquipadosArena(pokemon, incluirFallback = false) {
    const lista = normalizarListaMovimientosArena(pokemon?.movimientos_equipados || [], true)
        .sort((a, b) => Number(a.slot || 999) - Number(b.slot || 999));

    if (lista.length) {
        return lista;
    }

    return incluirFallback ? [crearMovimientoFallbackArena(pokemon, 1)] : [];
}

function obtenerMovimientoPorSlotArena(pokemon, slot, incluirFallback = false) {
    const lista = obtenerMovimientosEquipadosArena(pokemon, incluirFallback);
    const encontrado = lista.find(mov => Number(mov.slot || 0) === Number(slot || 0));
    return encontrado || null;
}

function normalizarListaMovimientosArena(movimientos = [], equipados = false) {
    if (!Array.isArray(movimientos)) return [];
    return movimientos
        .map((movimiento, index) => normalizarMovimientoArena(movimiento, equipados ? (index + 1) : 0))
        .filter(Boolean);
}

function normalizarMovimientoArena(movimiento, slotFallback = 0) {
    if (!movimiento || typeof movimiento !== "object") return null;

    const potenciaRaw = movimiento.potencia;
    return {
        usuario_pokemon_movimiento_id: movimiento.usuario_pokemon_movimiento_id ? Number(movimiento.usuario_pokemon_movimiento_id) : null,
        movimiento_id: movimiento.movimiento_id ? Number(movimiento.movimiento_id) : null,
        codigo: movimiento.codigo || movimiento.code || `move-${slotFallback}`,
        nombre: movimiento.nombre || movimiento.name || "Move",
        tipo: movimiento.tipo || movimiento.type || "Normal",
        categoria: normalizarCategoriaMovimientoArena(movimiento.categoria || movimiento.category || "fisico"),
        potencia: potenciaRaw === null || typeof potenciaRaw === "undefined" ? null : Number(potenciaRaw),
        precision_pct: Number(movimiento.precision_pct ?? movimiento.precision ?? 100),
        cooldown_turnos: 0,
        cooldown_restante: 0,
        prioridad: Number(movimiento.prioridad ?? movimiento.priority ?? 0),
        objetivo: movimiento.objetivo || movimiento.target || "rival",
        slot: Number(movimiento.slot ?? slotFallback ?? 0)
    };
}

function normalizarCategoriaMovimientoArena(categoria = "fisico") {
    const valor = String(categoria || "fisico").toLowerCase().trim();
    if (valor === "special") return "especial";
    if (valor === "status") return "estado";
    if (valor === "physical") return "fisico";
    return valor || "fisico";
}

function obtenerEtiquetaCategoriaMovimientoArena(categoria = "fisico") {
    return ARENA_MOVE_CATEGORY_LABELS[normalizarCategoriaMovimientoArena(categoria)] || "Physical";
}

async function cargarMovimientosEquipoJugadorArena() {
    await Promise.all(arenaPlayerTeam.map(async (pokemon) => {
        const usuarioPokemonId = Number(pokemon.id || 0);
        if (!usuarioPokemonId) {
            pokemon.movimientos_equipados = [crearMovimientoFallbackArena(pokemon, 1)];
            pokemon.movimientos_desbloqueados = [...pokemon.movimientos_equipados];
            return;
        }

        try {
            const data = await obtenerMovimientosPokemonUsuarioArena(usuarioPokemonId);
            const equipados = normalizarListaMovimientosArena(data?.equipados || [], true)
                .sort((a, b) => Number(a.slot || 999) - Number(b.slot || 999));
            const movimientos = normalizarListaMovimientosArena(data?.movimientos || [], false);

            pokemon.movimientos_equipados = equipados.length
                ? equipados
                : [crearMovimientoFallbackArena(pokemon, 1)];
            pokemon.movimientos_desbloqueados = movimientos.length
                ? movimientos
                : [...pokemon.movimientos_equipados];
        } catch (error) {
            console.warn(`No se pudieron cargar movimientos para el Pokémon ${usuarioPokemonId}:`, error);
            pokemon.movimientos_equipados = [crearMovimientoFallbackArena(pokemon, 1)];
            pokemon.movimientos_desbloqueados = [...pokemon.movimientos_equipados];
        }
    }));
}

async function obtenerMovimientosPokemonUsuarioArena(usuarioPokemonId) {
    if (typeof obtenerMovimientosPokemonUsuario === "function") {
        return await obtenerMovimientosPokemonUsuario(usuarioPokemonId);
    }
    return await fetchAuthArena(`${API_BASE}/usuario/pokemon/${encodeURIComponent(usuarioPokemonId)}/movimientos`);
}

function generarMovimientosRivalArena(pokemonBase, nivel = 1) {
    const tipos = obtenerTiposPokemonArena(pokemonBase?.tipo || "");
    const codigos = [];

    for (const tipo of tipos) {
        const porTipo = ARENA_TYPE_MOVESET_CODES[tipo] || [];
        codigos.push(...porTipo);
    }

    codigos.push(...(ARENA_TYPE_MOVESET_CODES.normal || []));

    const unicos = [...new Set(codigos)];
    const desbloqueados = unicos
        .map(codigo => ({ ...(ARENA_MOVE_LIBRARY[codigo] || {}) }))
        .filter(mov => mov && mov.codigo && Number(mov.nivel_requerido || 1) <= Number(nivel || 1))
        .sort((a, b) => {
            const nivelA = Number(a.nivel_requerido || 1);
            const nivelB = Number(b.nivel_requerido || 1);
            if (nivelA !== nivelB) return nivelA - nivelB;
            return Number(a.potencia || 0) - Number(b.potencia || 0);
        });

    const seleccionados = desbloqueados.slice(-4);
    if (!seleccionados.length) {
        seleccionados.push({ ...ARENA_MOVE_LIBRARY.tackle });
    }

    return seleccionados.map((movimiento, index) => normalizarMovimientoArena({
        ...movimiento,
        slot: index + 1,
        cooldown_restante: 0
    }, index + 1));
}

function crearMovimientoFallbackArena(pokemon, slot = 1) {
    return normalizarMovimientoArena({
        ...ARENA_MOVE_LIBRARY.battle_strike,
        slot,
        tipo: "Normal"
    }, slot);
}

function aplicarCooldownMovimientoArena(pokemon, movimiento) {
    return;
}

function reducirCooldownsArena(team = []) {
    return;
}

function tieneStabArena(atacante, movimiento) {
    const tipoMovimiento = normalizarTipoCombate(movimiento?.tipo || "");
    const tiposPokemon = obtenerTiposPokemonArena(atacante?.tipo || "");
    return tiposPokemon.includes(tipoMovimiento);
}

function calcularMultiplicadorMovimientoContraDefensorArena(tipoMovimiento, defensor) {
    const tipoAtk = normalizarTipoCombate(tipoMovimiento);
    const tiposDefensor = obtenerTiposPokemonArena(defensor?.tipo || "");

    if (!tipoAtk || !tiposDefensor.length) return 1;

    let resultadoFinal = 1;

    for (const tipoDef of tiposDefensor) {
        resultadoFinal *= obtenerMultiplicadorTipoArena(tipoAtk, tipoDef);
    }

    if (resultadoFinal >= 2) return 2;
    if (resultadoFinal <= 0.5) return 0.5;
    return 1;
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
            renderArenaCompleta();
            mostrarResultadoArena(true, recompensaResultado);
        } else {
            registrarActividadArena("battle_end", "derrota").catch(() => {});
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
    const btnCerrarMoves = document.getElementById("btnArenaCerrarMoves");
    if (btnCerrarMoves) btnCerrarMoves.disabled = true;

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
    const btnCerrarMoves = document.getElementById("btnArenaCerrarMoves");
    if (btnCerrarMoves) btnCerrarMoves.disabled = false;

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
    cerrarPanelMovimientosArena();

    const modal = document.getElementById("arenaChangeModal");
    const optionsBox = document.getElementById("arenaChangeOptions");
    if (!modal || !optionsBox) return;

    optionsBox.innerHTML = arenaPlayerTeam.map((pokemon, index) => {
        const defeated = pokemon.defeated || Number(pokemon.hp_actual) <= 0;
        const current = index === arenaPlayerIndex;
        const disabled = defeated || current;
        const hpPercent = calcularHpPercentArena(pokemon);
        const hpClass = obtenerClaseHpArena(hpPercent);
        const tipoClase = obtenerClaseTipoArena(pokemon.tipo);
        const tipoTraducido = traducirTipoPokemonArena(pokemon.tipo);
        const imagen = obtenerImagenPokemonArena(pokemon);

        return `
            <button
                type="button"
                class="arena-change-option ${disabled ? "disabled" : ""} ${current ? "is-current" : ""} ${tipoClase}"
                data-change-index="${index}"
                ${disabled ? "disabled" : ""}
            >
                <div class="arena-change-top">
                    <div class="arena-change-sprite-wrap">
                        <img src="${imagen}" alt="${escapeHtmlArena(pokemon.nombre)}">
                    </div>

                    <div class="arena-change-main">
                        <div class="arena-change-name-row">
                            <strong>${escapeHtmlArena(pokemon.nombre)}</strong>
                            <span class="arena-change-status-chip ${current ? "is-current" : defeated ? "is-ko" : "is-ready"}">
                                ${current ? "Current" : defeated ? "KO" : "Ready"}
                            </span>
                        </div>

                        <div class="arena-change-type-pill ${tipoClase}">${escapeHtmlArena(tipoTraducido)}</div>

                        <div class="arena-change-hp-row">
                            <span>HP ${pokemon.hp_actual}/${pokemon.hp_max}</span>
                            <strong>${hpPercent}%</strong>
                        </div>

                        <div class="arena-change-hp-bar">
                            <div class="arena-change-hp-fill ${hpClass}" style="width:${hpPercent}%"></div>
                        </div>
                    </div>
                </div>

                <div class="arena-change-stats-row">
                    <span>Lv ${pokemon.nivel}</span>
                    <span>ATK ${pokemon.ataque}</span>
                    <span>DEF ${pokemon.defensa}</span>
                    <span>SPD ${pokemon.velocidad}</span>
                </div>
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

function construirResumenRecompensaArena(recompensaBase = null, data = null) {
    const recompensa = recompensaBase || obtenerRecompensasPorDificultadArena();
    const codigo = data?.recompensa_codigo || recompensa?.codigo || obtenerCodigoDificultadArena();

    return {
        codigo,
        nombre: obtenerNombreDificultadArena(codigo),
        exp: Number(data?.exp_ganada ?? recompensa?.exp ?? 0),
        pokedolares: Number(data?.pokedolares_ganados ?? recompensa?.pokedolares ?? 0),
        data: data || null
    };
}

async function procesarRecompensasVictoriaArena() {
    if (arenaUltimaRecompensaAplicada) {
        return arenaUltimaRecompensaAplicada;
    }

    if (arenaRecompensaEnProceso) {
        return null;
    }

    if (arenaRecompensaProcesada) {
        return arenaUltimaRecompensaAplicada;
    }

    arenaRecompensaEnProceso = true;

    try {
        const recompensaBase = obtenerRecompensasPorDificultadArena();
        const data = await otorgarRecompensasVictoriaArena();

        const recompensaFinal = construirResumenRecompensaArena(recompensaBase, data);

        agregarLogArena(
            tfArena("arena_rewards_log", {
                difficulty: recompensaFinal.nombre,
                coins: recompensaFinal.pokedolares,
                exp: recompensaFinal.exp
            }),
            tSafeArena("arena_system")
        );

        arenaRecompensaProcesada = true;
        arenaUltimaRecompensaAplicada = recompensaFinal;
        registrarActividadArena("battle_end", `victoria:${recompensaFinal.codigo}`).catch(() => {});

        return recompensaFinal;
    } catch (error) {
        console.warn("No se pudieron aplicar las recompensas de victoria:", error);
        agregarLogArena(error?.message || tSafeArena("arena_rewards_error"), tSafeArena("arena_system"));
        return null;
    } finally {
        arenaRecompensaEnProceso = false;
    }
}


/* =========================================================
   RESULTADO / LOG
========================================================= */
function mostrarResultadoArena(victoria = true, recompensa = null, soloRefresco = false) {
    cerrarPanelMovimientosArena();
    const modal = document.getElementById("arenaResultModal");
    const icon = document.getElementById("arenaResultIcon");
    const title = document.getElementById("arenaResultTitle");
    const text = document.getElementById("arenaResultText");

    if (!modal || !icon || !title || !text) return;

    arenaUltimoResultado = { victoria, recompensa };

    if (victoria) {
        const recompensaFinal = recompensa || construirResumenRecompensaArena();

        icon.textContent = "🏆";
        icon.style.background = "#dcfce7";
        icon.style.color = "#15803d";
        title.textContent = tSafeArena("arena_victory");
        text.textContent = tfArena("arena_result_victory_text", {
            difficulty: recompensaFinal?.nombre || tSafeArena("battle_difficulty_normal"),
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

async function fetchAuthArena(url, options = {}) {
    if (typeof fetchAuth === "function") {
        return await fetchAuth(url, options);
    }

    const token = typeof getAccessToken === "function" ? getAccessToken() : "";
    if (!token) {
        throw new Error("No se pudo identificar al usuario actual.");
    }

    return await fetchJsonArena(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    });
}

function inferirCodigoDificultadArenaDesdeBonus(bonus = 0) {
    const valor = Number(bonus || 0);

    if (valor >= 6) return "master";
    if (valor >= 4) return "expert";
    if (valor >= 2) return "challenge";
    return "normal";
}

function obtenerCodigoDificultadArena() {
    if (arenaDificultadActual) {
        return String(arenaDificultadActual).trim().toLowerCase();
    }

    const guardada = sessionStorage.getItem(BATTLE_ARENA_DIFFICULTY_KEY);
    if (guardada) {
        return String(guardada).trim().toLowerCase();
    }

    return inferirCodigoDificultadArenaDesdeBonus(obtenerBonusNivelRivalArena());
}

function obtenerNombreDificultadArena(codigo = "normal") {
    const valor = String(codigo || "normal").trim().toLowerCase();

    if (valor === "master") return tSafeArena("battle_difficulty_master");
    if (valor === "expert") return tSafeArena("battle_difficulty_expert");
    if (valor === "challenge") return tSafeArena("battle_difficulty_challenge");
    return tSafeArena("battle_difficulty_normal");
}

function guardarEquipoArenaEnStorages() {
    try {
        localStorage.setItem(BATTLE_TEAM_STORAGE_KEY, JSON.stringify(arenaPlayerTeam));
        sessionStorage.setItem(BATTLE_ARENA_PLAYER_TEAM_KEY, JSON.stringify(arenaPlayerTeam));
    } catch (error) {
        console.warn("No se pudo guardar el equipo local de arena:", error);
    }
}

async function cargarEquipoGuardadoBackendArena() {
    const data = await fetchAuthArena(`${API_BASE}/usuario/me/equipo`);
    const equipo = Array.isArray(data?.equipo) ? data.equipo : [];

    return equipo
        .slice()
        .sort((a, b) => Number(a.posicion || 999) - Number(b.posicion || 999));
}

function sincronizarSesionBackendArena(data = {}) {
    arenaBattleSessionToken = data?.battle_session_token || null;
    arenaBattleSessionTtlSegundos = Number(data?.ttl_segundos || 0);
    arenaBattleSessionExpiraEn = data?.expira_en || null;
    arenaDificultadActual = String(data?.dificultad_codigo || obtenerCodigoDificultadArena() || "normal").toLowerCase();

    if (typeof data?.bonus_nivel_rival !== "undefined") {
        sessionStorage.setItem(BATTLE_ENEMY_LEVEL_BONUS_KEY, String(Number(data.bonus_nivel_rival || 0)));
    }

    sessionStorage.setItem(BATTLE_ARENA_DIFFICULTY_KEY, arenaDificultadActual);

    if (arenaBattleSessionToken) {
        sessionStorage.setItem(BATTLE_ARENA_SESSION_TOKEN_KEY, arenaBattleSessionToken);
    } else {
        sessionStorage.removeItem(BATTLE_ARENA_SESSION_TOKEN_KEY);
    }

    if (arenaBattleSessionExpiraEn) {
        sessionStorage.setItem(BATTLE_ARENA_SESSION_EXPIRES_KEY, arenaBattleSessionExpiraEn);
    } else {
        sessionStorage.removeItem(BATTLE_ARENA_SESSION_EXPIRES_KEY);
    }
}

async function iniciarSesionBatallaArena() {
    const usuarioPokemonIds = [...new Set(
        arenaPlayerTeam
            .map(p => Number(p.id))
            .filter(id => !Number.isNaN(id) && id > 0)
    )].slice(0, 6);

    if (usuarioPokemonIds.length !== 6) {
        throw new Error(tSafeArena("arena_need_full_team"));
    }

    const dificultad = inferirCodigoDificultadArenaDesdeBonus(obtenerBonusNivelRivalArena());

    const data = await fetchAuthArena(`${API_BASE}/battle/iniciar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            dificultad,
            usuario_pokemon_ids: usuarioPokemonIds,
            guardar_equipo: true
        })
    });

    if (!data?.ok || !data?.battle_session_token) {
        throw new Error(data?.mensaje || "No se pudo iniciar la sesión de batalla.");
    }

    sincronizarSesionBackendArena(data);
    return data;
}

function obtenerSesionActividadArena() {
    let sesion = sessionStorage.getItem(BATTLE_ARENA_ACTIVITY_SESSION_KEY);
    if (sesion) return sesion;

    sesion = `battle-arena-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(BATTLE_ARENA_ACTIVITY_SESSION_KEY, sesion);
    return sesion;
}

async function registrarActividadArena(accion = "heartbeat", detalle = "") {
    if (typeof API_BASE === "undefined") return null;

    try {
        return await fetchAuthArena(`${API_BASE}/usuario/actividad`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pagina: "battle-arena",
                accion,
                detalle: detalle || null,
                sesion_token: obtenerSesionActividadArena(),
                online: true
            })
        });
    } catch (error) {
        return null;
    }
}

function iniciarHeartbeatActividadArena() {
    detenerHeartbeatActividadArena();
    arenaActividadHeartbeat = setInterval(() => {
        registrarActividadArena("heartbeat").catch(() => {});
    }, ARENA_ACTIVITY_HEARTBEAT_MS);
}

function detenerHeartbeatActividadArena() {
    if (arenaActividadHeartbeat) {
        clearInterval(arenaActividadHeartbeat);
        arenaActividadHeartbeat = null;
    }
}

function refrescarEquipoArenaDesdeRespuesta(data) {
    if (!Array.isArray(data?.pokemon_actualizados)) return;

    for (const actualizado of data.pokemon_actualizados) {
        const pokeLocal = arenaPlayerTeam.find(
            p => Number(p.id) === Number(actualizado.usuario_pokemon_id)
        );
        if (!pokeLocal) continue;

        pokeLocal.nivel = Number(actualizado.nivel ?? pokeLocal.nivel);
        pokeLocal.experiencia = Number(actualizado.experiencia ?? pokeLocal.experiencia);
        pokeLocal.hp_max = Number(actualizado.hp_max ?? pokeLocal.hp_max);
        pokeLocal.hp_actual = Number(actualizado.hp_max ?? pokeLocal.hp_max);
        pokeLocal.ataque = Number(actualizado.ataque ?? pokeLocal.ataque);
        pokeLocal.defensa = Number(actualizado.defensa ?? pokeLocal.defensa);
        pokeLocal.velocidad = Number(actualizado.velocidad ?? pokeLocal.velocidad);
        pokeLocal.ataque_especial = Number(actualizado.ataque_especial ?? pokeLocal.ataque_especial ?? pokeLocal.ataque);
        pokeLocal.defensa_especial = Number(actualizado.defensa_especial ?? pokeLocal.defensa_especial ?? pokeLocal.defensa);
        pokeLocal.defeated = false;
    }

    guardarEquipoArenaEnStorages();
}


function escapeHtmlArena(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function otorgarRecompensasVictoriaArena() {
    if (!arenaBattleSessionToken) {
        arenaBattleSessionToken = sessionStorage.getItem(BATTLE_ARENA_SESSION_TOKEN_KEY) || null;
    }

    if (!arenaBattleSessionToken) {
        throw new Error("La sesión de batalla ya no está disponible.");
    }

    const data = await fetchAuthArena(`${API_BASE}/battle/recompensa-victoria`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            battle_session_token: arenaBattleSessionToken
        })
    });

    if (!data?.ok) {
        throw new Error(data?.mensaje || "No se pudieron aplicar las recompensas.");
    }

    if (typeof data.pokedolares_actuales !== "undefined") {
        localStorage.setItem("usuario_pokedolares", String(data.pokedolares_actuales));
    }

    refrescarEquipoArenaDesdeRespuesta(data);
    await cargarMovimientosEquipoJugadorArena();
    renderArenaCompleta();

    return data;
}