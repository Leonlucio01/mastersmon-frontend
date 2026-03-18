const LANG_STORAGE_KEY = "mastersmon_lang";

const I18N = {
    en: {
        menu_pokedex: "Pokedex",
        menu_battle: "Battle",
        menu_maps: "Maps",
        menu_my_pokemon: "My Pokemon",
        menu_pokemart: "PokeMart",
        menu_logout: "Logout",

        pokedex_title: "POKEDEX",
        pokedex_subtitle: "Explore, search, and filter your favorite Pokémon",
        pokedex_search_placeholder: "🔎 Search Pokémon...",
        pokedex_all_types: "All types",

        maps_title: "MAPS",
        maps_subtitle: "Choose an area, enter the map, and move to find wild Pokémon",
        maps_move_up: "Move up",
        maps_move_left: "Move left",
        maps_move_right: "Move right",
        maps_move_down: "Move down",
        maps_zone_pokemon: "Pokémon living here",

        maps_prev_map: "Previous map",
        maps_next_map: "Next map",
        maps_shiny_title: "A Shiny Pokémon appeared!",
        maps_shiny_text: "You found a very rare version.",
        maps_continue: "Continue",
        maps_result_title: "Result",
        maps_result_message: "Message",

        maps_loading: "Loading...",
        maps_preparing_zone: "Preparing exploration area...",
        maps_level_short: "Level",
        maps_view: "View",
        maps_zones_load_error: "Could not load areas",
        maps_check_backend: "Make sure your backend is running.",
        maps_retry: "Retry",
        maps_no_zones: "No areas available",
        maps_add_zones_db: "Add areas to the database.",
        maps_default_zone_desc: "Pokémon exploration area.",
        maps_explore_hint: "Use the arrows to explore and trigger encounters",
        maps_wild_found: "Wild Pokémon found!",
        maps_capture_status: "Capture status",
        maps_type: "Type",
        maps_level: "Level",
        maps_hp: "HP",
        maps_login_to_explore: "Log in to explore",
        maps_login_explore_text: "You must log in with Google to enter the map, move around, and catch Pokémon.",
        maps_area_ready: "Area ready to explore",
        maps_area: "Area",
        maps_status: "Status",
        maps_free: "Free",
        maps_encounter: "Encounter",
        maps_select_ball: "Select a Poké Ball",
        maps_generate_encounter_hint: "Use the arrows to generate a wild encounter.",
        maps_login_balls_text: "Log in to use Poké Balls and catch Pokémon.",
        maps_no_balls: "You do not have any Poké Balls available.",
        maps_capture_rate_hidden: "Log in to see the capture rate",
        maps_capture_rate: "Estimated rate",
        maps_catch: "Catch",
        maps_run: "Run",
        maps_no_active_encounter: "There is no active encounter.",
        maps_choose_ball: "Select a Poké Ball.",
        maps_login_required: "You must log in.",
        maps_capture_success_default: "Pokémon caught successfully.",
        maps_capture_escape_default: "The Pokémon escaped.",
        maps_capture_probability: "Rate",
        maps_capture_used_probability: "Used rate",
        maps_capture_error: "Error trying to catch the Pokémon.",
        maps_no_pokemon_zone: "No Pokémon",
        maps_exploring_direction: "Exploring",
        maps_dir_up: "up",
        maps_dir_down: "down",
        maps_dir_left: "to the left",
        maps_dir_right: "to the right",
        maps_dir_zone: "the area",
        maps_capture_success_title: "Successful<br>catch!",
        maps_capture_fail_title: "Could not<br>catch",
        maps_wild_pokemon_default: "Wild Pokémon",
        maps_encounter_generate_error: "Could not generate the encounter.",
        maps_invalid_pokemon: "The backend did not return a valid Pokémon.",
        maps_center: "Center",
        maps_map_fallback: "Map",

        battle_badge: "Tactical mode",
        battle_subtitle: "Prepare your team of 6 Pokémon for turn-based RPG battles and experience progression",
        battle_arena_badge: "PvE Battle · Phase 1",
        battle_arena_subtitle: "Face a random rival squad using your main team of 6 Pokémon",
        battle_your_team: "Your team",
        battle_rival: "Rival",

        pokemon_capture_status: "Capture status",
        pokemon_attack: "Attack",
        pokemon_defense: "Defense",
        pokemon_hp: "HP",

        pokedex_shiny_off: "✨ Shiny",
        pokedex_shiny_on: "🌟 Shiny On",
        pokedex_error_load: "Could not load the Pokédex.",
        pokedex_retry: "Retry",

        type_all: "All types",
        type_normal: "Normal",
        type_fire: "Fire",
        type_water: "Water",
        type_grass: "Grass",
        type_electric: "Electric",
        type_ice: "Ice",
        type_fighting: "Fighting",
        type_poison: "Poison",
        type_ground: "Ground",
        type_flying: "Flying",
        type_psychic: "Psychic",
        type_bug: "Bug",
        type_rock: "Rock",
        type_ghost: "Ghost",
        type_dragon: "Dragon",
        type_steel: "Steel",
        type_fairy: "Fairy"
    },

    es: {
        menu_pokedex: "Pokedex",
        menu_battle: "Battle",
        menu_maps: "Maps",
        menu_my_pokemon: "My Pokemon",
        menu_pokemart: "PokeMart",
        menu_logout: "Salir",

        pokedex_title: "POKEDEX",
        pokedex_subtitle: "Explora, busca y filtra tus Pokémon favoritos",
        pokedex_search_placeholder: "🔎 Buscar Pokémon...",
        pokedex_all_types: "Todos los tipos",

        maps_title: "MAPS",
        maps_subtitle: "Selecciona una zona, entra al mapa y muévete para encontrar Pokémon salvajes",
        maps_move_up: "Mover arriba",
        maps_move_left: "Mover izquierda",
        maps_move_right: "Mover derecha",
        maps_move_down: "Mover abajo",
        maps_zone_pokemon: "Pokémon que habitan aquí",

        maps_prev_map: "Mapa anterior",
        maps_next_map: "Mapa siguiente",
        maps_shiny_title: "¡Apareció un Pokémon Shiny!",
        maps_shiny_text: "Has encontrado una versión muy rara.",
        maps_continue: "Continuar",
        maps_result_title: "Resultado",
        maps_result_message: "Mensaje",

        maps_loading: "Cargando...",
        maps_preparing_zone: "Preparando zona de exploración...",
        maps_level_short: "Nivel",
        maps_view: "Ver",
        maps_zones_load_error: "No se pudieron cargar las zonas",
        maps_check_backend: "Verifica que tu backend esté corriendo.",
        maps_retry: "Reintentar",
        maps_no_zones: "No hay zonas disponibles",
        maps_add_zones_db: "Agrega zonas en la base de datos.",
        maps_default_zone_desc: "Zona de exploración Pokémon.",
        maps_explore_hint: "Usa las flechas para explorar y generar encuentros",
        maps_wild_found: "¡Pokémon salvaje encontrado!",
        maps_capture_status: "Estado captura",
        maps_type: "Tipo",
        maps_level: "Nivel",
        maps_hp: "HP",
        maps_login_to_explore: "Inicia sesión para explorar",
        maps_login_explore_text: "Debes iniciar sesión con Google para entrar al mapa, moverte y capturar Pokémon.",
        maps_area_ready: "Zona lista para explorar",
        maps_area: "Zona",
        maps_status: "Estado",
        maps_free: "Libre",
        maps_encounter: "Encuentro",
        maps_select_ball: "Selecciona la Poké Ball",
        maps_generate_encounter_hint: "Usa las flechas para generar un encuentro salvaje.",
        maps_login_balls_text: "Inicia sesión para usar Poké Balls y capturar Pokémon.",
        maps_no_balls: "No tienes Poké Balls disponibles.",
        maps_capture_rate_hidden: "Inicia sesión para ver la probabilidad de captura",
        maps_capture_rate: "Probabilidad estimada",
        maps_catch: "Capturar",
        maps_run: "Huir",
        maps_no_active_encounter: "No hay ningún encuentro activo.",
        maps_choose_ball: "Selecciona una Poké Ball.",
        maps_login_required: "Debes iniciar sesión.",
        maps_capture_success_default: "Pokémon capturado con éxito.",
        maps_capture_escape_default: "El Pokémon escapó.",
        maps_capture_probability: "Probabilidad",
        maps_capture_used_probability: "Probabilidad usada",
        maps_capture_error: "Error al intentar capturar el Pokémon.",
        maps_no_pokemon_zone: "Sin Pokémon",
        maps_exploring_direction: "Explorando",
        maps_dir_up: "arriba",
        maps_dir_down: "abajo",
        maps_dir_left: "a la izquierda",
        maps_dir_right: "a la derecha",
        maps_dir_zone: "la zona",
        maps_capture_success_title: "¡Captura<br>exitosa!",
        maps_capture_fail_title: "No se pudo<br>capturar",
        maps_wild_pokemon_default: "Pokémon salvaje",
        maps_encounter_generate_error: "No se pudo generar el encuentro.",
        maps_invalid_pokemon: "El backend no devolvió un Pokémon válido.",
        maps_center: "Centro",
        maps_map_fallback: "Mapa",

        battle_badge: "Modo táctico",
        battle_subtitle: "Prepara tu equipo de 6 Pokémon para combates RPG por turnos y progresión por experiencia",
        battle_arena_badge: "Combate PvE · Fase 1",
        battle_arena_subtitle: "Enfrenta una escuadra rival aleatoria usando tu equipo principal de 6 Pokémon",
        battle_your_team: "Tu equipo",
        battle_rival: "Rival",

        pokemon_capture_status: "Estado captura",
        pokemon_attack: "Ataque",
        pokemon_defense: "Defensa",
        pokemon_hp: "HP",

        pokedex_shiny_off: "✨ Shiny",
        pokedex_shiny_on: "🌟 Shiny Activo",
        pokedex_error_load: "No se pudo cargar la Pokédex.",
        pokedex_retry: "Reintentar",

        type_all: "Todos los tipos",
        type_normal: "Normal",
        type_fire: "Fuego",
        type_water: "Agua",
        type_grass: "Planta",
        type_electric: "Eléctrico",
        type_ice: "Hielo",
        type_fighting: "Lucha",
        type_poison: "Veneno",
        type_ground: "Tierra",
        type_flying: "Volador",
        type_psychic: "Psíquico",
        type_bug: "Bicho",
        type_rock: "Roca",
        type_ghost: "Fantasma",
        type_dragon: "Dragón",
        type_steel: "Acero",
        type_fairy: "Hada"

    }
};

function getCurrentLang() {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return saved && I18N[saved] ? saved : "en";
}

function setCurrentLang(lang) {
    const finalLang = I18N[lang] ? lang : "en";
    localStorage.setItem(LANG_STORAGE_KEY, finalLang);
    applyTranslations();
    document.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: finalLang } }));
}

function t(key) {
    const lang = getCurrentLang();
    return I18N?.[lang]?.[key] ?? I18N?.en?.[key] ?? key;
}

function applyTranslations(root = document) {
    if (!root) return;

    root.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        el.textContent = t(key);
    });

    root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        el.setAttribute("placeholder", t(key));
    });

    root.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.dataset.i18nTitle;
        el.setAttribute("title", t(key));
    });

    root.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
        const key = el.dataset.i18nAriaLabel;
        el.setAttribute("aria-label", t(key));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    applyTranslations();
});