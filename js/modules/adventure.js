import { fetchAuth } from "../core/api.js";
import { refs, escapeHtml, renderTopbarProfile, openAppModal } from "../core/ui.js";
import { state } from "../core/state.js";
import { tr } from "../core/i18n.js";
import { getAvatarImage, getItemImage, getMapImage, getPokemonSprite } from "../core/assets.js";

const adventureViewState = {
  selectedRegionCode: "",
  regionDetail: null,
  selectedZoneCode: "",
  zoneDetail: null,
  activeEncounter: null,
  flash: "",
  flashKind: "info",
  busy: false,
  captureAction: "",
  playerX: 28,
  playerY: 74,
  stepCount: 0,
  encounterHistory: [],
};

const STEP = 8;
const MAP_BOUNDS = { minX: 10, maxX: 90, minY: 12, maxY: 88 };
const GRASS_ZONE = { minX: 62, maxX: 88, minY: 56, maxY: 86 };
let keyboardBound = false;

function currentRegion() {
  return adventureViewState.regionDetail?.region || null;
}

function selectedZoneFromRegion() {
  const zones = adventureViewState.regionDetail?.zones || [];
  return zones.find((zone) => zone.code === adventureViewState.selectedZoneCode) || zones[0] || null;
}

function activeAvatar() {
  return getAvatarImage(state.profile?.avatar_code || state.user?.avatar_code || state.selectedAvatarCode || "steven");
}

function invalidateCapturedData() {
  state.collectionSummary = null;
  state.collectionItems = [];
  state.collectionDetail = null;
  state.home = null;
  state.homeAlerts = null;
  state.shopSummary = null;
}

function isInGrass() {
  if (!adventureViewState.zoneDetail?.zone) return false;
  const { playerX, playerY } = adventureViewState;
  return playerX >= GRASS_ZONE.minX && playerX <= GRASS_ZONE.maxX && playerY >= GRASS_ZONE.minY && playerY <= GRASS_ZONE.maxY;
}

function scrollAdventureIntoView() {
  document.getElementById("adventurePlayStage")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function flashCard() {
  if (!adventureViewState.flash) return "";
  return `<div class="adventure-flash ${adventureViewState.flashKind === "error" ? "is-error" : adventureViewState.flashKind === "success" ? "is-success" : ""}">${escapeHtml(adventureViewState.flash)}</div>`;
}

function regionStatusText() {
  if (adventureViewState.activeEncounter) return "Encounter live";
  if (adventureViewState.selectedZoneCode) return "Exploring";
  if (adventureViewState.selectedRegionCode) return "Region ready";
  return "Select region";
}

function addHistoryEntry(text) {
  if (!text) return;
  adventureViewState.encounterHistory = [text, ...adventureViewState.encounterHistory].slice(0, 4);
}

function routeMissionCopy() {
  const zone = selectedZoneFromRegion();
  const region = currentRegion();
  if (!region) {
    return {
      title: "Elige una region para empezar la campana",
      body: "Adventure V2 ya no deberia sentirse como una lista. Primero eliges region, luego abres zona, caminas y el encuentro aparece dentro del mapa.",
    };
  }
  if (!zone) {
    return {
      title: `Prepara tu entrada a ${region.name}`,
      body: "Todavia no hay una zona activa cargada. Abre una ruta y lleva el avatar hacia la hierba para activar encuentros automaticos.",
    };
  }
  if (adventureViewState.activeEncounter) {
    return {
      title: `${adventureViewState.activeEncounter.name} aparecio en ${zone.name}`,
      body: "Tu siguiente paso es elegir una ball, intentar la captura y convertir este encuentro en progreso real para la coleccion.",
    };
  }
  return {
    title: `Continua la ruta de ${zone.name}`,
    body: "Camina por el mapa, entra a la hierba alta y deja que el encuentro aparezca sin depender de un boton separado.",
  };
}

function zoneDifficultyLabel(zone) {
  if (!zone) return "-";
  const maxLevel = Number(zone.level_max || 0);
  if (maxLevel <= 10) return "Inicio";
  if (maxLevel <= 25) return "Ruta media";
  if (maxLevel <= 50) return "Avance";
  return "Alto riesgo";
}

function renderRegionSelector(regions) {
  return `
    <section class="section-card adventure-region-selector">
      <div class="section-head">
        <div>
          <h2>Campanas regionales</h2>
          <p>Elige la region que quieres empujar. La campana, el mapa y las capturas deben sentirse conectados desde aqui.</p>
        </div>
      </div>
      <div class="regions-grid adventure-regions-grid">
        ${regions.map((region) => `
          <article class="region-card adventure-region-card ${region.code === adventureViewState.selectedRegionCode ? "is-selected" : ""}">
            <img class="region-banner" src="${escapeHtml(getMapImage(region.card_asset_path))}" alt="${escapeHtml(region.name)}" onerror="onPokemonImageError(this)">
            <div class="adventure-region-copy">
              <strong>${escapeHtml(region.name)}</strong>
              <div class="pill-row">
                <span class="pill">Gen ${escapeHtml(region.generation_id || "-")}</span>
                <span class="pill ${region.is_active_region ? "tag-accent" : ""}">${escapeHtml(region.is_active_region ? tr("adventure.active") : tr("adventure.available"))}</span>
              </div>
            </div>
            <div class="adventure-region-stats">
              <span>${escapeHtml(region.zone_count || 0)} zonas</span>
              <span>${escapeHtml(region.completed_gyms || 0)}/${escapeHtml(region.total_gyms || 0)} gyms</span>
              <span>${escapeHtml(region.completion_pct || 0)}% progress</span>
            </div>
            <button class="soft-btn" type="button" data-region-code="${escapeHtml(region.code)}">${region.code === adventureViewState.selectedRegionCode ? "Loaded" : "Entrar al mapa"}</button>
          </article>`).join("")}
      </div>
    </section>`;
}

function renderRouteRail(zones = []) {
  return `
    <section class="section-card adventure-route-rail">
      <div class="section-head">
        <div>
          <h2>Rutas disponibles</h2>
          <p>La campana se empuja ruta por ruta. Cada zona te lleva a capturas nuevas, mejor equipo y el siguiente gym.</p>
        </div>
      </div>
      <div class="zone-list adventure-zone-grid">
        ${zones.map((zone) => `
          <article class="zone-card zone-card-adventure ${zone.code === adventureViewState.selectedZoneCode ? "is-selected" : ""}">
            <div class="zone-card-head">
              <div>
                <strong>${escapeHtml(zone.name)}</strong>
                <div class="pill-row">
                  <span class="pill">${escapeHtml(zone.biome || "-")}</span>
                  <span class="pill">Lv ${escapeHtml(zone.level_min || 1)}-${escapeHtml(zone.level_max || 1)}</span>
                  <span class="pill">${escapeHtml(zoneDifficultyLabel(zone))}</span>
                </div>
              </div>
              <button class="soft-btn" type="button" data-zone-code="${escapeHtml(zone.code)}">${zone.code === adventureViewState.selectedZoneCode ? "Loaded" : "Open zone"}</button>
            </div>
            <p>${escapeHtml(zone.code === adventureViewState.selectedZoneCode ? "Zona activa dentro del mapa jugable." : "Cargala para abrir el mapa, ver especies y caminar por la ruta.")}</p>
            <div class="featured-species">
              ${(zone.featured_species || []).map((pokemon) => `
                <span class="pill tag-accent featured-species-pill">
                  <img src="${escapeHtml(getPokemonSprite(pokemon))}" alt="${escapeHtml(pokemon.name || "Pokemon")}" onerror="onPokemonImageError(this)">
                  <span>${escapeHtml(pokemon.name)}</span>
                </span>`).join("") || `<span class="pill">Sin destacadas</span>`}
            </div>
          </article>`).join("")}
      </div>
    </section>`;
}

function renderMapStage() {
  const zone = adventureViewState.zoneDetail?.zone || null;
  const mission = routeMissionCopy();

  return `
    <section class="section-card adventure-map-shell">
      <div class="section-head adventure-map-head">
        <div>
          <span class="eyebrow">Active route</span>
          <h2>${escapeHtml(zone?.name || "Mapa de aventura")}</h2>
          <p class="body-copy">${escapeHtml(mission.body)}</p>
        </div>
        <div class="pill-row">
          <span class="pill ${isInGrass() ? "tag-accent" : ""}">${escapeHtml(isInGrass() ? "Hierba alta" : "Ruta segura")}</span>
          <span class="pill">Paso ${escapeHtml(adventureViewState.stepCount)}</span>
          <span class="pill">X ${escapeHtml(adventureViewState.playerX)}</span>
          <span class="pill">Y ${escapeHtml(adventureViewState.playerY)}</span>
        </div>
      </div>

      <div class="adventure-map-stage">
        ${zone ? `<img class="adventure-map-image" src="${escapeHtml(getMapImage(zone.map_asset_path || zone.card_asset_path))}" alt="${escapeHtml(zone.name)}" onerror="onPokemonImageError(this)">` : `<div class="empty-panel">Selecciona una region y luego una zona para cargar el mapa.</div>`}
        <div class="adventure-map-mask"></div>
        <div class="grass-hotspot" aria-hidden="true"></div>
        <div class="zone-path-overlay" aria-hidden="true"></div>
        ${zone ? `
          <div class="player-token" style="left:${adventureViewState.playerX}%; top:${adventureViewState.playerY}%;">
            <img src="${escapeHtml(activeAvatar())}" alt="Trainer" onerror="onAvatarImageError(this)">
          </div>` : ""}
        <div class="map-hud">
          <span class="pill">Zona ${escapeHtml(zone?.biome || "-")}</span>
          <span class="pill">Lv ${escapeHtml(zone?.level_min || 1)}-${escapeHtml(zone?.level_max || 1)}</span>
          <span class="pill">Power ${escapeHtml(adventureViewState.zoneDetail?.player_state?.recommended_team_power || 0)}</span>
        </div>
      </div>

      <div class="adventure-map-footer">
        <article class="adventure-mission-card">
          <span class="eyebrow">Mission</span>
          <strong>${escapeHtml(mission.title)}</strong>
          <p>${escapeHtml(mission.body)}</p>
        </article>
        <div class="map-control-row">
          <div class="movement-pad">
            <button class="move-btn move-up" type="button" data-move="up" aria-label="Mover arriba">Up</button>
            <button class="move-btn move-left" type="button" data-move="left" aria-label="Mover izquierda">Left</button>
            <button class="move-btn move-right" type="button" data-move="right" aria-label="Mover derecha">Right</button>
            <button class="move-btn move-down" type="button" data-move="down" aria-label="Mover abajo">Down</button>
          </div>
          <div class="map-actions">
            <article class="map-action-card">
              <strong>Encuentro automatico</strong>
              <p>Mueve el avatar hasta la hierba. Si la ruta esta activa, el Pokemon aparece mientras caminas.</p>
            </article>
            <button class="soft-btn" type="button" id="refreshZoneBtn" ${adventureViewState.selectedZoneCode ? "" : "disabled"}>Recargar zona</button>
          </div>
        </div>
      </div>
    </section>`;
}

function renderEncounterPanel() {
  const zoneDetail = adventureViewState.zoneDetail;
  const activeEncounter = adventureViewState.activeEncounter;

  if (activeEncounter) {
    const balls = activeEncounter.capture?.available_balls || [];
    return `
      <section class="section-card encounter-panel encounter-panel-live">
        <div class="section-head">
          <div>
            <span class="eyebrow">Encounter live</span>
            <h2>${escapeHtml(activeEncounter.name)}</h2>
            <p class="body-copy">Nivel ${escapeHtml(activeEncounter.level)} - ${escapeHtml(activeEncounter.is_shiny ? "Shiny" : "Normal")}</p>
          </div>
        </div>
        <div class="encounter-hero">
          <div class="encounter-art">
            ${adventureViewState.busy && adventureViewState.captureAction ? `
              <div class="encounter-capture-overlay">
                <img class="encounter-ball-image" src="${escapeHtml(getItemImage({ item_code: adventureViewState.captureAction }))}" alt="${escapeHtml(adventureViewState.captureAction)}">
                <span>Lanzando ${escapeHtml(adventureViewState.captureAction)}</span>
              </div>` : ""}
            <img src="${escapeHtml(getPokemonSprite(activeEncounter))}" alt="${escapeHtml(activeEncounter.name)}" onerror="onPokemonImageError(this)">
          </div>
          <div class="encounter-copy">
            <div class="encounter-stats">
              ${Object.entries(activeEncounter.stats || {}).map(([key, value]) => `<span class="pill">${escapeHtml(key)} ${escapeHtml(value)}</span>`).join("")}
            </div>
            <p class="body-copy">El encuentro ya esta en pantalla. El siguiente paso es lanzar una ball y convertirlo en una captura real para tu coleccion.</p>
          </div>
        </div>
        <div class="capture-grid">
          ${balls.length ? balls.map((ball) => `
            <button class="capture-ball-card" type="button" data-capture-ball="${escapeHtml(ball.item_code)}" ${adventureViewState.busy ? "disabled" : ""}>
              <img src="${escapeHtml(getItemImage({ item_code: ball.item_code }))}" alt="${escapeHtml(ball.item_code)}">
              <strong>${escapeHtml(ball.item_code)}</strong>
              <span>x${escapeHtml(ball.quantity)}</span>
              <small>${escapeHtml(ball.capture_rate_pct)}% catch</small>
            </button>`).join("") : `
            <div class="empty-panel">
              <strong>No tienes balls disponibles para capturar.</strong>
              <p>Abre la tienda, compra Poke Balls con gold y vuelve a la ruta para continuar el loop.</p>
              <button class="soft-btn" type="button" id="openShopFromAdventureBtn">Ir al Shop</button>
            </div>`}
        </div>
      </section>`;
  }

  if (!zoneDetail?.zone) {
    return `
      <section class="section-card encounter-panel">
        <div class="empty-panel">
          <strong>Aun no has abierto una ruta.</strong>
          <p>Selecciona la region, elige una zona y el mapa se convertira en el centro del flujo de captura.</p>
        </div>
      </section>`;
  }

  const preview = zoneDetail.encounter_preview || {};
  return `
    <section class="section-card encounter-panel">
      <div class="section-head">
        <div>
          <span class="eyebrow">Wild deck</span>
          <h2>Lo que puede aparecer</h2>
          <p class="body-copy">Estas especies son tu vista previa de la ruta activa.</p>
        </div>
      </div>
      <div class="encounter-preview-row">
        ${(preview.featured || []).map((pokemon) => `
          <article class="encounter-preview-card">
            <img src="${escapeHtml(getPokemonSprite(pokemon))}" alt="${escapeHtml(pokemon.name)}" onerror="onPokemonImageError(this)">
            <strong>${escapeHtml(pokemon.name)}</strong>
            <span>${escapeHtml(pokemon.can_be_shiny ? "Shiny chance" : "Wild")}</span>
          </article>`).join("") || `<div class="empty-panel">No hay preview de especies para esta zona.</div>`}
      </div>
      <article class="adventure-help-panel">
        <strong>Como funciona la captura</strong>
        <p>Camina hasta la hierba alta y deja que el encuentro aparezca mientras avanzas. Cuando salga el Pokemon, usa una ball desde este panel.</p>
      </article>
    </section>`;
}

function renderRouteUtility() {
  const history = adventureViewState.encounterHistory;
  const region = currentRegion();
  const zone = selectedZoneFromRegion();
  const zoneDetail = adventureViewState.zoneDetail;
  const featured = zoneDetail?.encounter_preview?.featured || [];

  return `
    <section class="section-card adventure-utility-shell">
      <div class="section-head">
        <div>
          <h2>Soporte de ruta</h2>
          <p>Este bloque une historia reciente, especies de la zona y accesos para no perder el ritmo mientras juegas.</p>
        </div>
      </div>
      <div class="adventure-utility-grid">
        <article class="adventure-utility-card">
          <span class="eyebrow">Historia reciente</span>
          <strong>${escapeHtml(zone?.name || region?.name || "Ruta")}</strong>
          <div class="adventure-history-list">
            ${(history.length ? history : ["Todavia no hay eventos recientes."]).map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}
          </div>
        </article>
        <article class="adventure-utility-card">
          <span class="eyebrow">Especies clave</span>
          <strong>${escapeHtml(featured.length ? `${featured.length} destacadas` : "Sin preview")}</strong>
          <div class="featured-species">
            ${featured.map((pokemon) => `
              <span class="pill tag-accent featured-species-pill">
                <img src="${escapeHtml(getPokemonSprite(pokemon))}" alt="${escapeHtml(pokemon.name || "Pokemon")}" onerror="onPokemonImageError(this)">
                <span>${escapeHtml(pokemon.name)}</span>
              </span>`).join("") || `<span class="pill">Carga una zona</span>`}
          </div>
        </article>
        <article class="adventure-utility-card">
          <span class="eyebrow">Accesos rapidos</span>
          <strong>Sigue el loop</strong>
          <div class="hero-actions">
            <button class="soft-btn" type="button" data-adv-go="team">Open Team</button>
            <button class="soft-btn" type="button" data-adv-go="collection">Open Collection</button>
            <button class="soft-btn" type="button" data-adv-go="shop">Open Shop</button>
          </div>
        </article>
      </div>
    </section>`;
}

function renderRegionShell() {
  const detail = adventureViewState.regionDetail;
  if (!detail?.region) {
    return `
      <section class="section-card adventure-empty-shell">
        <div class="adventure-empty-state">
          <span class="eyebrow">Adventure hub</span>
          <h2>Selecciona una region para desplegar la campana</h2>
          <p>La V2 debe llevarte primero a una campana regional, luego a una ruta y finalmente al encuentro. Aqui no deberia aparecer un mapa vacio sin contexto.</p>
        </div>
      </section>`;
  }

  const region = detail.region;
  const zones = detail.zones || [];
  const nextGym = detail.next_gym || null;
  const selectedZone = selectedZoneFromRegion();

  return `
    <section class="adventure-region-shell" id="adventurePlayStage">
      ${flashCard()}
      <section class="section-card adventure-campaign-header">
        <div class="adventure-region-head">
          <div>
            <span class="eyebrow">Campaign live</span>
            <h2>${escapeHtml(region.name)}</h2>
            <p>${escapeHtml(region.description || "Explora zonas, activa encuentros y avanza hacia el siguiente gym de la region.")}</p>
          </div>
          <div class="adventure-region-pills">
            <span class="pill tag-accent">${escapeHtml(region.code || "-")}</span>
            <span class="pill">${escapeHtml(region.completion_pct || 0)}% progress</span>
          </div>
        </div>

        <div class="region-overview-grid">
          <article class="region-overview-card region-overview-card-featured">
            <span>Siguiente meta</span>
            <strong>${escapeHtml(nextGym?.name || selectedZone?.name || "Explorar region")}</strong>
            <p>${escapeHtml(nextGym ? `Gym objetivo Lv ${nextGym.recommended_level || 1}` : "Elige una zona y comienza a capturar para activar el loop principal.")}</p>
          </article>
          <article class="region-overview-card">
            <span>Rutas</span>
            <strong>${escapeHtml(zones.length)}</strong>
            <p>Tramos disponibles dentro de la campana actual.</p>
          </article>
          <article class="region-overview-card">
            <span>Gyms</span>
            <strong>${escapeHtml(region.completed_gyms || 0)}/${escapeHtml(region.total_gyms || 0)}</strong>
            <p>Escalera de insignias regional.</p>
          </article>
          <article class="region-overview-card">
            <span>Ruta activa</span>
            <strong>${escapeHtml(selectedZone?.name || "-")}</strong>
            <p>Zona jugable cargada en el mapa.</p>
          </article>
        </div>
      </section>

      ${renderRouteRail(zones)}

      <section class="adventure-main-grid">
        <div class="adventure-left-column">
          ${renderMapStage()}
          ${renderRouteUtility()}
        </div>
        <div class="adventure-right-column">
          ${renderEncounterPanel()}
        </div>
      </section>
    </section>`;
}

function bindAdventureEvents() {
  document.getElementById("backHomeBtn")?.addEventListener("click", () => document.querySelector('[data-nav="home"]')?.click());
  document.getElementById("refreshAdventureBtn")?.addEventListener("click", async () => {
    const response = await fetchAuth("/v2/adventure/regions");
    state.regions = response.data || [];
    renderAdventure();
  });

  document.querySelectorAll("[data-region-code]").forEach((button) => {
    button.addEventListener("click", async () => {
      await loadRegionDetail(button.getAttribute("data-region-code"));
    });
  });

  document.querySelectorAll("[data-zone-code]").forEach((button) => {
    button.addEventListener("click", async () => {
      await loadZoneDetail(button.getAttribute("data-zone-code"));
      setTimeout(scrollAdventureIntoView, 80);
    });
  });

  document.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", async () => {
      const direction = button.getAttribute("data-move");
      if (direction === "up") await movePlayer(0, -STEP);
      if (direction === "down") await movePlayer(0, STEP);
      if (direction === "left") await movePlayer(-STEP, 0);
      if (direction === "right") await movePlayer(STEP, 0);
    });
  });

  if (!keyboardBound) {
    window.addEventListener("keydown", (event) => {
      if (!adventureViewState.selectedZoneCode) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
      if (event.key === "ArrowUp") {
        event.preventDefault();
        movePlayer(0, -STEP);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        movePlayer(0, STEP);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        movePlayer(-STEP, 0);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        movePlayer(STEP, 0);
      }
    });
    keyboardBound = true;
  }

  document.getElementById("refreshZoneBtn")?.addEventListener("click", async () => {
    if (!adventureViewState.selectedZoneCode) return;
    await loadZoneDetail(adventureViewState.selectedZoneCode);
  });

  document.getElementById("openShopFromAdventureBtn")?.addEventListener("click", () => {
    document.querySelector('[data-nav="shop"]')?.click();
  });

  document.querySelectorAll("[data-capture-ball]").forEach((button) => {
    button.addEventListener("click", async () => {
      await captureEncounter(button.getAttribute("data-capture-ball"));
    });
  });

  document.querySelectorAll("[data-adv-go]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(`[data-nav="${button.getAttribute("data-adv-go")}"]`)?.click();
    });
  });
}

export function renderAdventure() {
  renderTopbarProfile();
  const regions = state.regions || [];

  refs.appContent.innerHTML = `
    <section class="hero-panel adventure-v2-hero">
      <div class="hero-grid adventure-v2-hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">${escapeHtml(tr("adventure.eyebrow"))}</span>
          <h1>Adventure V2 se juega en el mapa.</h1>
          <p>La idea ya no es abrir una pagina de mapas. La idea es elegir campana regional, cargar una ruta, caminar con el avatar y encontrar Pokemon dentro del mismo flujo.</p>
          <div class="hero-actions">
            <button class="primary-btn" type="button" id="backHomeBtn">${escapeHtml(tr("adventure.back"))}</button>
            <button class="soft-btn" type="button" id="refreshAdventureBtn">${escapeHtml(tr("adventure.refresh"))}</button>
          </div>
        </div>
        <div class="hero-aside adventure-hero-metrics">
          <article class="metric-card">
            <span>Regions</span>
            <strong>${regions.length}</strong>
            <p class="body-copy">Campanas regionales listas para jugar.</p>
          </article>
          <article class="metric-card">
            <span>Status</span>
            <strong>${escapeHtml(regionStatusText())}</strong>
            <p class="body-copy">${escapeHtml(adventureViewState.activeEncounter ? "Hay un encuentro salvaje en pantalla esperando captura." : adventureViewState.selectedZoneCode ? "La ruta esta activa y lista para caminar." : "Primero elige una region para desplegar el hub.")}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="adventure-shell">
      ${renderRegionSelector(regions)}
      ${renderRegionShell()}
    </section>`;

  bindAdventureEvents();
}

async function loadRegionDetail(regionCode) {
  if (!regionCode) return;
  adventureViewState.busy = true;
  adventureViewState.flash = "";
  adventureViewState.selectedRegionCode = regionCode;
  adventureViewState.regionDetail = null;
  adventureViewState.zoneDetail = null;
  adventureViewState.activeEncounter = null;
  adventureViewState.captureAction = "";
  adventureViewState.encounterHistory = [];
  renderAdventure();

  try {
    const response = await fetchAuth(`/v2/adventure/regions/${regionCode}`);
    const data = response.data || {};
    adventureViewState.regionDetail = data;
    adventureViewState.selectedZoneCode = data.zones?.find((zone) => zone.is_current)?.code || data.zones?.[0]?.code || "";
    adventureViewState.playerX = 28;
    adventureViewState.playerY = 74;
    adventureViewState.stepCount = 0;
    if (adventureViewState.selectedZoneCode) {
      await loadZoneDetail(adventureViewState.selectedZoneCode, false);
    }
    setTimeout(scrollAdventureIntoView, 140);
  } catch (error) {
    adventureViewState.flash = error.message || "No se pudo cargar la region.";
    adventureViewState.flashKind = "error";
  } finally {
    adventureViewState.busy = false;
    renderAdventure();
  }
}

async function loadZoneDetail(zoneCode, rerender = true) {
  if (!zoneCode) return;
  try {
    const response = await fetchAuth(`/v2/adventure/zones/${zoneCode}`);
    adventureViewState.selectedZoneCode = zoneCode;
    adventureViewState.zoneDetail = response.data || null;
    adventureViewState.activeEncounter = null;
    adventureViewState.captureAction = "";
    adventureViewState.playerX = 28;
    adventureViewState.playerY = 74;
    adventureViewState.stepCount = 0;
    adventureViewState.flash = "Zona cargada. Camina hacia la hierba alta para activar encuentros dentro del mapa.";
    adventureViewState.flashKind = "info";
    addHistoryEntry(`Ruta cargada: ${response.data?.zone?.name || zoneCode}`);
  } catch (error) {
    adventureViewState.flash = error.message || "No se pudo cargar la zona.";
    adventureViewState.flashKind = "error";
  }

  if (rerender) renderAdventure();
}

async function createEncounter(options = {}) {
  const triggeredByWalk = Boolean(options.triggeredByWalk);
  if (!adventureViewState.selectedZoneCode || !isInGrass() || adventureViewState.activeEncounter || adventureViewState.busy) {
    return;
  }

  adventureViewState.busy = true;
  if (!triggeredByWalk) renderAdventure();

  try {
    const response = await fetchAuth(`/v2/adventure/zones/${adventureViewState.selectedZoneCode}/encounters`, {
      method: "POST",
      body: JSON.stringify({ mode: "walk" }),
    });
    adventureViewState.activeEncounter = response.data?.encounter || null;
    adventureViewState.captureAction = "";
    adventureViewState.flash = "Un Pokemon salvaje aparecio mientras caminabas por la hierba.";
    adventureViewState.flashKind = "success";
    addHistoryEntry(`Encuentro: ${response.data?.encounter?.name || "Pokemon salvaje"}`);
  } catch (error) {
    adventureViewState.flash = error.message || "No se pudo crear el encuentro.";
    adventureViewState.flashKind = "error";
  } finally {
    adventureViewState.busy = false;
    renderAdventure();
  }
}

async function captureEncounter(ballItemCode) {
  if (!adventureViewState.activeEncounter?.id || !ballItemCode) return;
  adventureViewState.busy = true;
  adventureViewState.captureAction = ballItemCode;
  renderAdventure();

  try {
    const response = await fetchAuth(`/v2/adventure/encounters/${adventureViewState.activeEncounter.id}/capture`, {
      method: "POST",
      body: JSON.stringify({ ball_item_code: ballItemCode }),
    });
    const data = response.data || {};
    const encounterName = adventureViewState.activeEncounter?.name || "Pokemon";
    adventureViewState.activeEncounter = null;
    adventureViewState.captureAction = "";
    adventureViewState.flash = data.message || (data.captured ? "Pokemon capturado." : "El Pokemon escapo.");
    adventureViewState.flashKind = data.captured ? "success" : "error";
    addHistoryEntry(data.captured ? `Captura exitosa: ${encounterName}` : `Escapo: ${encounterName}`);
    if (data.captured) invalidateCapturedData();

    openAppModal({
      eyebrow: data.captured ? "Capture success" : "Capture failed",
      title: data.captured ? `${encounterName} se unio a tu coleccion` : `${encounterName} escapo`,
      body: data.captured
        ? `<p>La captura salio bien y el Pokemon ya deberia formar parte de tu progreso.</p><p>Ahora puedes revisar Collection, preparar Team o seguir caminando para buscar el siguiente encuentro.</p>`
        : `<p>El intento no salio bien, pero la ruta sigue viva.</p><p>Repon balls si hace falta y continua caminando para encontrar otro Pokemon salvaje.</p>`,
      actions: [
        { label: data.captured ? "Ver Collection" : "Volver a la ruta", kind: "primary", onClick: () => document.querySelector(`[data-nav="${data.captured ? "collection" : "adventure"}"]`)?.click() },
        { label: data.captured ? "Seguir explorando" : "Abrir Shop", kind: "soft", onClick: () => document.querySelector(`[data-nav="${data.captured ? "adventure" : "shop"}"]`)?.click() },
      ],
    });
  } catch (error) {
    adventureViewState.flash = error.message || "No se pudo completar la captura.";
    adventureViewState.flashKind = "error";
    adventureViewState.captureAction = "";
  } finally {
    adventureViewState.busy = false;
    renderAdventure();
  }
}

async function movePlayer(dx, dy) {
  if (!adventureViewState.zoneDetail?.zone || adventureViewState.busy) return;
  adventureViewState.playerX = Math.max(MAP_BOUNDS.minX, Math.min(MAP_BOUNDS.maxX, adventureViewState.playerX + dx));
  adventureViewState.playerY = Math.max(MAP_BOUNDS.minY, Math.min(MAP_BOUNDS.maxY, adventureViewState.playerY + dy));
  adventureViewState.stepCount += 1;

  if (adventureViewState.activeEncounter) {
    renderAdventure();
    return;
  }

  if (isInGrass()) {
    adventureViewState.flash = "Pisaste la hierba alta. El siguiente encuentro puede dispararse mientras avanzas.";
    adventureViewState.flashKind = "success";
  } else {
    adventureViewState.flash = "Sigue caminando hacia la hierba alta para provocar encuentros salvajes.";
    adventureViewState.flashKind = "info";
  }
  renderAdventure();

  if (isInGrass() && Math.random() <= 0.42) {
    await createEncounter({ triggeredByWalk: true });
  }
}
