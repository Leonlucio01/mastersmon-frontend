import { LOCALE_STORAGE_KEY } from "./config.js";
import { state } from "./state.js";

const TRANSLATIONS = {
  en: {
    nav: { home: "Home", adventure: "Adventure", collection: "Collection", team: "Team", gyms: "Gyms", refresh: "Refresh", logout: "Logout" },
    login: { eyebrow: "Mastersmon V2", title: "Your trainer journey starts here.", body: "This modular base already separates core, auth, onboarding, home and adventure.", status: "Loading Google sign-in...", cta: "Continue with Google" },
    onboarding: { title: "Let us prepare your trainer.", complete: "Complete onboarding", reload: "Reload options", starter: "Choose your starter", count: "Showing {visible} of {total} starters." },
    home: { title: "Trainer hub", body: "This screen already consumes V2 APIs with a modular structure.", continue: "Continue adventure", profile: "Active profile", wallets: "Wallets", modules: "Backend modules already available", team: "Active team" },
    adventure: { eyebrow: "Adventure", title: "Explore the world as the real core of the game.", body: "This module is now separated from the shell and ready to grow without filling the project with more HTML files.", detail: "View detail", active: "Active", available: "Available", refresh: "Refresh regions", back: "Back to home", loaded: "Adventure module separated in js/modules/adventure.js and css/adventure.css." },
    collection: { title: "My Collection", body: "Collection is now its own module, connected to summary, list and detail from V2." },
    team: { title: "Active Team", body: "Team now lives as its own module with selection and save flow from the collection." },
    gyms: { title: "Gyms", body: "Gyms now live as their own module with campaign route, summary and detail from V2." },
    common: { trainer: "Trainer", loading: "Loading...", error: "Something went wrong." }
  },
  es: {
    nav: { home: "Home", adventure: "Adventure", collection: "Collection", team: "Team", gyms: "Gyms", refresh: "Refresh", logout: "Salir" },
    login: { eyebrow: "Mastersmon V2", title: "Tu viaje de entrenador empieza aquí.", body: "Esta base modular ya separa core, auth, onboarding, home y adventure.", status: "Cargando acceso con Google...", cta: "Continuar con Google" },
    onboarding: { title: "Vamos a preparar a tu entrenador.", complete: "Completar onboarding", reload: "Recargar opciones", starter: "Elige tu starter", count: "Mostrando {visible} de {total} starters." },
    home: { title: "Trainer hub", body: "Esta pantalla ya consume APIs V2 con estructura modular.", continue: "Continuar aventura", profile: "Perfil activo", wallets: "Wallets", modules: "Módulos backend ya disponibles", team: "Equipo activo" },
    adventure: { eyebrow: "Adventure", title: "Explora el mundo como eje real del juego.", body: "Este módulo ahora está separado del shell y listo para crecer sin volver a llenar el proyecto de más HTML.", detail: "Ver detalle", active: "Activa", available: "Disponible", refresh: "Actualizar regiones", back: "Volver al home", loaded: "Adventure ya vive aparte en js/modules/adventure.js y css/adventure.css." },
    collection: { title: "Mi colección", body: "Collection ahora ya es su propio módulo, conectado al summary, lista y detalle de V2." },
    team: { title: "Equipo activo", body: "Team ahora vive como módulo propio, con selección y guardado conectados a la colección." },
    gyms: { title: "Gyms", body: "Gyms ahora viven como módulo propio, con ruta de campaña, resumen y detalle conectados a V2." },
    common: { trainer: "Entrenador", loading: "Cargando...", error: "Algo salió mal." }
  }
};

export function loadLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) || "es";
    state.locale = saved === "en" ? "en" : "es";
  } catch {
    state.locale = "es";
  }
}

export function saveLocale(locale) {
  state.locale = locale === "en" ? "en" : "es";
  try { localStorage.setItem(LOCALE_STORAGE_KEY, state.locale); } catch {}
}

export function tr(path, vars = {}) {
  const tables = TRANSLATIONS[state.locale] || TRANSLATIONS.es;
  let value = path.split(".").reduce((acc, key) => acc?.[key], tables);
  if (typeof value !== "string") value = path;
  return value.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}
