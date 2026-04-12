const API_BASE = "https://mastersmon-api.onrender.com";
const ACCESS_TOKEN_STORAGE_KEY = "access_token";
const LOCALE_STORAGE_KEY = "mastersmon_locale";

const T = {
  es: {
    refresh: "Refresh",
    logout: "Salir",
    loginFailed: "No se pudo iniciar sesión con Google.",
    loadingHome: "Cargando Home...",
    loadingAdventure: "Cargando Adventure...",
    noSession: "Necesitas iniciar sesión para entrar al juego.",
    noCurrentZone: "Todavía no hay zona actual cargada.",
    noTeam: "Todavía no hay miembros en el equipo activo.",
    noPendingGym: "Sin gym pendiente",
    activeRegion: "Región activa",
    unlockedZones: "Zonas desbloqueadas",
    collection: "Colección",
    continueAdventure: "Continuar aventura",
    teamSnapshot: "Team Snapshot",
    recommendedLevel: "Nivel recomendado",
    availableRegions: "Regiones disponibles",
    regionDetail: "Ver detalle",
    featuredSpecies: "especies destacadas",
    backendError: "No se pudo cargar el backend.",
    loginStatus: "Conectando con Mastersmon...",
    trainerHub: "Trainer Hub",
    adventureTitle: "Adventure",
    homeLead: "Tu panel principal ya consume la API real del backend.",
    adventureLead: "Tu pantalla Adventure ya consume regiones y detalle real.",
    powerScore: "Poder estimado",
    completedGyms: "Gyms completados",
    nextHouseUpgrade: "Próximo upgrade house",
    noUpgrade: "Sin upgrade pendiente",
    refreshHub: "Actualizar hub",
    backHome: "Volver al hub",
    team: "Team",
    level: "Nivel",
    zones: "zonas",
    gyms: "gyms",
    openRegion: "Abrir región",
    active: "Activa",
    available: "Disponible"
  },
  en: {
    refresh: "Refresh",
    logout: "Logout",
    loginFailed: "Google sign-in failed.",
    loadingHome: "Loading Home...",
    loadingAdventure: "Loading Adventure...",
    noSession: "You need to sign in to enter the game.",
    noCurrentZone: "There is no current zone loaded yet.",
    noTeam: "There are no members in the active team yet.",
    noPendingGym: "No pending gym",
    activeRegion: "Active region",
    unlockedZones: "Unlocked zones",
    collection: "Collection",
    continueAdventure: "Continue adventure",
    teamSnapshot: "Team Snapshot",
    recommendedLevel: "Recommended level",
    availableRegions: "Available regions",
    regionDetail: "View detail",
    featuredSpecies: "featured species",
    backendError: "Backend could not be loaded.",
    loginStatus: "Connecting to Mastersmon...",
    trainerHub: "Trainer Hub",
    adventureTitle: "Adventure",
    homeLead: "Your main panel already consumes the real backend API.",
    adventureLead: "Your Adventure screen already consumes real regions and detail.",
    powerScore: "Power score",
    completedGyms: "Completed gyms",
    nextHouseUpgrade: "Next house upgrade",
    noUpgrade: "No pending upgrade",
    refreshHub: "Refresh hub",
    backHome: "Back to hub",
    team: "Team",
    level: "Level",
    zones: "zones",
    gyms: "gyms",
    openRegion: "Open region",
    active: "Active",
    available: "Available"
  }
};

const state = {
  locale: getSavedLocale(),
  token: "",
  user: null,
  home: null,
  regions: [],
  currentView: "home",
};

const content = document.getElementById("content");
const authMount = document.getElementById("authMount");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");
const languageSwitch = document.getElementById("languageSwitch");

function tr(key) {
  const table = T[state.locale] || T.es;
  return table[key] || key;
}

function getSavedLocale() {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY) || "es";
  } catch {
    return "es";
  }
}

function saveLocale(locale) {
  state.locale = locale === "en" ? "en" : "es";
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, state.locale);
  } catch {}
}

function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    || localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    || "";
}

function getLocalUser() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

function saveSession(data) {
  const token = data?.token || data?.access_token || "";
  const user = data?.user || data?.usuario || null;

  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  if (user) {
    localStorage.setItem("usuario", JSON.stringify(user));
    localStorage.setItem("usuario_id", String(user.id || ""));
    if (user.avatar_code || user.avatar_id) {
      localStorage.setItem("usuario_avatar_id", user.avatar_code || user.avatar_id);
    }
  }

  state.token = getAccessToken();
  state.user = getLocalUser();
  renderChrome();
}

function clearSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem("usuario");
  localStorage.removeItem("usuario_id");
  localStorage.removeItem("usuario_avatar_id");

  state.token = "";
  state.user = null;
  state.home = null;
  state.regions = [];
  renderChrome();
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  let payload = null;

  try {
    payload = await response.json();
  } catch (_) {
    payload = null;
  }

  if (!response.ok) {
    const msg = payload?.error?.message || payload?.detail?.message || payload?.detail || `HTTP ${response.status}`;
    const error = new Error(msg);
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function fetchAuth(path, options = {}) {
  const token = state.token || getAccessToken();
  if (!token) {
    const error = new Error("NO_TOKEN");
    error.status = 401;
    throw error;
  }

  return await fetchJson(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTeamLabel(teamCode) {
  const code = String(teamCode || "").toLowerCase();
  if (state.locale === "en") {
    if (code === "red") return "Team Red";
    if (code === "blue") return "Team Blue";
    if (code === "green") return "Team Green";
    return "Neutral";
  }
  if (code === "red") return "Equipo Rojo";
  if (code === "blue") return "Equipo Azul";
  if (code === "green") return "Equipo Verde";
  return "Neutral";
}

function resolveAvatarUrl(user) {
  const code = user?.avatar_code || user?.avatar_id || localStorage.getItem("usuario_avatar_id") || "";
  if (code) return `img/avatars/${code}.png`;
  return "";
}

function resolvePokemonAsset(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.startsWith("/")) return value.slice(1);
  return value;
}

function setLoginStatus(message, type = "status") {
  const mount = document.getElementById("loginStatus");
  if (!mount) return;
  mount.innerHTML = `<div class="${type === "error" ? "error-banner" : "status-banner"}">${escapeHtml(message)}</div>`;
}

function renderChrome() {
  refreshBtn.textContent = tr("refresh");
  logoutBtn.textContent = tr("logout");
  logoutBtn.classList.toggle("hidden", !state.token);
  languageSwitch.value = state.locale;

  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === state.currentView);
  });
}

function renderNeedsAuth() {
  authMount.classList.remove("hidden");
  content.innerHTML = `
    <section class="screen">
      <span class="eyebrow">${escapeHtml(tr("trainerHub"))}</span>
      <h1>Mastersmon</h1>
      <p>${escapeHtml(tr("noSession"))}</p>
    </section>
  `;
}

function renderLoading(text) {
  content.innerHTML = `<section class="screen"><div class="loading-card">${escapeHtml(text)}</div></section>`;
}

function renderHome() {
  authMount.classList.add("hidden");

  const data = state.home?.data ? state.home.data : state.home || {};
  const trainer = data.trainer || {};
  const progress = data.progress || {};
  const adventure = data.adventure || {};
  const currentZone = adventure.current_zone || null;
  const teamSummary = data.team_summary || {};
  const milestones = data.milestones || {};
  const nextUpgrade = milestones.next_house_upgrade || null;
  const nextGym = progress.next_gym || null;
  const members = Array.isArray(teamSummary.members) ? teamSummary.members : [];

  content.innerHTML = `
    <section class="screen">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">${escapeHtml(tr("trainerHub"))}</span>
          <h1>${escapeHtml(trainer.display_name || state.user?.display_name || state.user?.nombre || "Trainer")}</h1>
          <p>${escapeHtml(tr("homeLead"))}</p>

          <div class="hero-actions">
            <button id="goAdventureBtn" class="primary-btn" type="button">${escapeHtml(tr("continueAdventure"))}</button>
            <button id="refreshHomeBtn" class="soft-btn" type="button">${escapeHtml(tr("refreshHub"))}</button>
          </div>
        </div>

        <div class="hero-side">
          <div class="profile-chip">
            ${resolveAvatarUrl(trainer || state.user) ? `<img src="${escapeHtml(resolveAvatarUrl(trainer || state.user))}" alt="avatar" class="profile-avatar">` : ""}
            <div>
              <strong>${escapeHtml(getTeamLabel(trainer.team))}</strong>
              <small>${escapeHtml(trainer.active_region?.name || "—")}</small>
            </div>
          </div>
        </div>
      </section>

      <section class="stats-grid">
        <article class="card stat-card">
          <span>${escapeHtml(tr("activeRegion"))}</span>
          <strong>${escapeHtml(trainer.active_region?.name || "—")}</strong>
        </article>
        <article class="card stat-card">
          <span>${escapeHtml(tr("unlockedZones"))}</span>
          <strong>${escapeHtml(progress.unlocked_zones || 0)}</strong>
        </article>
        <article class="card stat-card">
          <span>${escapeHtml(tr("collection"))}</span>
          <strong>${escapeHtml(milestones.collection_owned || 0)}</strong>
        </article>
        <article class="card stat-card">
          <span>${escapeHtml(tr("completedGyms"))}</span>
          <strong>${escapeHtml(progress.completed_gyms || 0)}</strong>
        </article>
      </section>

      <section class="home-grid">
        <article class="card">
          <h3>${escapeHtml(tr("continueAdventure"))}</h3>
          <p>${currentZone ? `${escapeHtml(currentZone.name)} · Lv ${escapeHtml(currentZone.recommended_level_min ?? currentZone.level_min ?? "—")}-${escapeHtml(currentZone.recommended_level_max ?? currentZone.level_max ?? "—")}` : escapeHtml(tr("noCurrentZone"))}</p>
          <div class="pill-row">
            <span class="pill">${escapeHtml(nextGym?.name || tr("noPendingGym"))}</span>
            <span class="pill pill-accent">${escapeHtml(tr("recommendedLevel"))}: ${escapeHtml(nextGym?.recommended_level || "—")}</span>
          </div>
        </article>

        <article class="card">
          <h3>${escapeHtml(tr("nextHouseUpgrade"))}</h3>
          <p>${escapeHtml(nextUpgrade?.code || tr("noUpgrade"))}</p>
          <div class="pill-row">
            <span class="pill">${escapeHtml(nextUpgrade?.storage_capacity || "—")}</span>
          </div>
        </article>
      </section>

      <section class="card">
        <h3>${escapeHtml(tr("teamSnapshot"))}</h3>
        <p class="subtle">${escapeHtml(tr("powerScore"))}: ${escapeHtml(teamSummary.power_score || 0)}</p>
        <div class="team-grid">
          ${members.length ? members.map((member) => `
            <article class="member-card">
              <div class="member-row">
                <img src="${escapeHtml(resolvePokemonAsset(member.asset_url))}" alt="${escapeHtml(member.name)}" class="member-sprite" onerror="this.style.visibility='hidden'">
                <div>
                  <strong>${escapeHtml(member.name)}</strong>
                  <div class="pill-row">
                    <span class="pill">${escapeHtml(tr("level"))} ${escapeHtml(member.level)}</span>
                    <span class="pill">${escapeHtml(member.variant || "normal")}</span>
                  </div>
                </div>
              </div>
            </article>
          `).join("") : `<div class="panel-note">${escapeHtml(tr("noTeam"))}</div>`}
        </div>
      </section>
    </section>
  `;

  document.getElementById("goAdventureBtn")?.addEventListener("click", async () => {
    state.currentView = "adventure";
    renderChrome();
    if (!state.regions.length) await loadAdventure();
    else renderAdventure();
  });

  document.getElementById("refreshHomeBtn")?.addEventListener("click", async () => {
    await loadHome();
  });
}

function renderAdventure() {
  authMount.classList.add("hidden");

  const regions = Array.isArray(state.regions?.data) ? state.regions.data : (Array.isArray(state.regions) ? state.regions : []);

  content.innerHTML = `
    <section class="screen">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">${escapeHtml(tr("adventureTitle"))}</span>
          <h1>${escapeHtml(tr("adventureTitle"))}</h1>
          <p>${escapeHtml(tr("adventureLead"))}</p>

          <div class="hero-actions">
            <button id="backHomeBtn" class="primary-btn" type="button">${escapeHtml(tr("backHome"))}</button>
            <button id="refreshAdventureBtn" class="soft-btn" type="button">${escapeHtml(tr("refresh"))}</button>
          </div>
        </div>
      </section>

      <section class="card">
        <h3>${escapeHtml(tr("availableRegions"))}</h3>
        <div class="regions-grid">
          ${regions.map((region) => `
            <article class="region-card">
              <img src="${escapeHtml(resolvePokemonAsset(region.card_asset_path))}" alt="${escapeHtml(region.name)}" class="region-banner" onerror="this.style.visibility='hidden'">
              <strong>${escapeHtml(region.name)}</strong>
              <p>${escapeHtml(region.zone_count || 0)} ${escapeHtml(tr("zones"))} · ${escapeHtml(region.completed_gyms || 0)}/${escapeHtml(region.total_gyms || 0)} ${escapeHtml(tr("gyms"))}</p>
              <div class="pill-row">
                <span class="pill">${escapeHtml("Gen " + (region.generation_id || "—"))}</span>
                <span class="pill ${region.is_active_region ? "pill-accent" : ""}">${escapeHtml(region.is_active_region ? tr("active") : tr("available"))}</span>
              </div>
              <button class="soft-btn region-detail-btn" type="button" data-region-code="${escapeHtml(region.code)}">${escapeHtml(tr("openRegion"))}</button>
            </article>
          `).join("")}
        </div>
      </section>

      <section id="regionDetailMount"></section>
    </section>
  `;

  document.getElementById("backHomeBtn")?.addEventListener("click", async () => {
    state.currentView = "home";
    renderChrome();
    if (!state.home) await loadHome();
    else renderHome();
  });

  document.getElementById("refreshAdventureBtn")?.addEventListener("click", async () => {
    await loadAdventure();
  });

  document.querySelectorAll(".region-detail-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await loadRegionDetail(btn.dataset.regionCode);
    });
  });
}

async function loadRegionDetail(regionCode) {
  const mount = document.getElementById("regionDetailMount");
  if (!mount) return;

  mount.innerHTML = `<section class="card"><div class="loading-card">${escapeHtml(tr("loadingAdventure"))}</div></section>`;

  try {
    const response = await fetchAuth(`/v2/adventure/regions/${regionCode}`);
    const data = response.data || {};
    const region = data.region || {};
    const zones = Array.isArray(data.zones) ? data.zones : [];

    mount.innerHTML = `
      <section class="card">
        <h3>${escapeHtml(region.name || regionCode)}</h3>
        <p class="subtle">${escapeHtml(region.description || "")}</p>

        <div class="zone-grid">
          ${zones.map((zone) => `
            <article class="zone-card">
              <strong>${escapeHtml(zone.name)}</strong>
              <p>${escapeHtml(zone.biome || "—")} · Lv ${escapeHtml(zone.level_min || "—")}-${escapeHtml(zone.level_max || "—")}</p>
              <div class="pill-row">
                <span class="pill">${escapeHtml((zone.encounter_species_count || 0) + " " + tr("featuredSpecies"))}</span>
                <span class="pill ${zone.is_unlocked ? "pill-accent" : ""}">${escapeHtml(zone.is_unlocked ? tr("available") : "Locked")}</span>
              </div>
              <div class="pill-row">
                ${(Array.isArray(zone.featured_species) ? zone.featured_species : []).map((p) => `<span class="pill">${escapeHtml(p.name)}</span>`).join("")}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  } catch (error) {
    mount.innerHTML = `<section class="card"><div class="error-banner">${escapeHtml(error.message || tr("backendError"))}</div></section>`;
  }
}

async function loadHome() {
  renderLoading(tr("loadingHome"));
  try {
    state.home = await fetchAuth("/v2/home/summary");
    renderHome();
  } catch (error) {
    if (error.status === 401) {
      clearSession();
      renderNeedsAuth();
      return;
    }
    content.innerHTML = `<section class="screen"><div class="error-banner">${escapeHtml(error.message || tr("backendError"))}</div></section>`;
  }
}

async function loadAdventure() {
  renderLoading(tr("loadingAdventure"));
  try {
    state.regions = await fetchAuth("/v2/adventure/regions");
    renderAdventure();
  } catch (error) {
    if (error.status === 401) {
      clearSession();
      renderNeedsAuth();
      return;
    }
    content.innerHTML = `<section class="screen"><div class="error-banner">${escapeHtml(error.message || tr("backendError"))}</div></section>`;
  }
}

window.handleCredentialResponse = async function(response) {
  try {
    setLoginStatus(tr("loginStatus"));
    const payload = await fetchJson("/v2/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential })
    });

    saveSession(payload.data || payload);
    authMount.classList.add("hidden");

    if (state.currentView === "adventure") await loadAdventure();
    else await loadHome();
  } catch (error) {
    console.error("Login Google error:", error);
    clearSession();
    setLoginStatus(error.message || tr("loginFailed"), "error");
  }
};

async function bootstrapSession() {
  state.token = getAccessToken();
  state.user = getLocalUser();
  renderChrome();

  if (!state.token) {
    renderNeedsAuth();
    return;
  }

  try {
    const me = await fetchAuth("/v2/auth/me");
    const user = me.data?.user || me.user || state.user;
    if (user) {
      localStorage.setItem("usuario", JSON.stringify(user));
      state.user = user;
    }

    if (state.currentView === "adventure") await loadAdventure();
    else await loadHome();
  } catch (error) {
    console.error("Error validating session:", error);
    clearSession();
    renderNeedsAuth();
  }
}

document.querySelectorAll("[data-nav]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    state.currentView = btn.dataset.nav;
    renderChrome();

    if (!state.token) {
      renderNeedsAuth();
      return;
    }

    if (state.currentView === "adventure") await loadAdventure();
    else await loadHome();
  });
});

refreshBtn?.addEventListener("click", async () => {
  if (!state.token) {
    renderNeedsAuth();
    return;
  }
  if (state.currentView === "adventure") await loadAdventure();
  else await loadHome();
});

logoutBtn?.addEventListener("click", () => {
  clearSession();
  renderNeedsAuth();
});

languageSwitch?.addEventListener("change", async (event) => {
  saveLocale(event.target.value);
  renderChrome();

  if (!state.token) {
    renderNeedsAuth();
    return;
  }
  if (state.currentView === "adventure") renderAdventure();
  else renderHome();
});

document.addEventListener("DOMContentLoaded", bootstrapSession);\n