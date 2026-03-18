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
        maps_explore_hint: "Use the arrows to explore and trigger encounters",

        battle_badge: "Tactical mode",
        battle_subtitle: "Prepare your team of 6 Pokémon for turn-based RPG battles and experience progression",

        battle_arena_badge: "PvE Battle · Phase 1",
        battle_arena_subtitle: "Face a random rival squad using your main team of 6 Pokémon",
        battle_your_team: "Your team",
        battle_rival: "Rival",

        pokemon_capture_status: "Capture status",
        pokemon_attack: "Attack",
        pokemon_defense: "Defense",
        pokemon_hp: "HP"
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
        maps_explore_hint: "Usa las flechas para explorar y generar encuentros",

        battle_badge: "Modo táctico",
        battle_subtitle: "Prepara tu equipo de 6 Pokémon para combates RPG por turnos y progresión por experiencia",

        battle_arena_badge: "Combate PvE · Fase 1",
        battle_arena_subtitle: "Enfrenta una escuadra rival aleatoria usando tu equipo principal de 6 Pokémon",
        battle_your_team: "Tu equipo",
        battle_rival: "Rival",

        pokemon_capture_status: "Estado captura",
        pokemon_attack: "Ataque",
        pokemon_defense: "Defensa",
        pokemon_hp: "HP"
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
    return I18N[lang]?.[key] || I18N.en?.[key] || key;
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