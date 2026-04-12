import { fetchAuth } from "../core/api.js";
import { refs, escapeHtml, renderTopbarProfile, statusCard } from "../core/ui.js";
import { state } from "../core/state.js";
import { tr } from "../core/i18n.js";
import { getMapImage, getPokemonSprite } from "../core/assets.js";

const adventureViewState = {
  selectedRegionCode: "",
  regionDetail: null,
  selectedZoneCode: "",
  zoneDetail: null,
  activeEncounter: null,
  flash: "",
  flashKind: "info",
  busy: false,
};

function activeRegionFromList(regions) {
  return regions.find((region) => region.is_active_region) || regions[0] || null;
}

function selectedZoneFromRegion() {
  const zones = adventureViewState.regionDetail?.zones || [];
  return zones.find((zone) => zone.code === adventureViewState.selectedZoneCode) || zones[0] || null;
}

function flashCard() {
  if (!adventureViewState.flash) return "";
  return `<div class="adventure-flash ${adventureViewState.flashKind === "error" ? "is-error" : "is-success"}">${escapeHtml(adventureViewState.flash)}</div>`;
}

function renderEncounterPanel() {
  const zoneDetail = adventureViewState.zoneDetail;
  const activeEncounter = adventureViewState.activeEncounter;

  if (activeEncounter) {
    const balls = activeEncounter.capture?.available_balls || [];
    return `
      <section class="section-card encounter-panel">
        <div class="section-head">
          <div>
            <span class="eyebrow">Wild encounter</span>
            <h2>${escapeHtml(activeEncounter.name)}</h2>
            <p class="body-copy">Nivel ${escapeHtml(activeEncounter.level)} · ${escapeHtml(activeEncounter.is_shiny ? "Shiny" : "Normal")}</p>
          </div>
        </div>
        <div class="encounter-hero">
          <div class="encounter-art">
            <img src="${escapeHtml(getPokemonSprite(activeEncounter))}" alt="${escapeHtml(activeEncounter.name)}" onerror="onPokemonImageError(this)">
          </div>
          <div class="encounter-copy">
            <div class="encounter-stats">
              ${Object.entries(activeEncounter.stats || {}).map(([key, value]) => `<span class="pill">${escapeHtml(key)} ${escapeHtml(value)}</span>`).join("")}
            </div>
            <p class="body-copy">Usa una ball para intentar capturarlo y enviarlo a tu coleccion.</p>
          </div>
        </div>
        <div class="capture-grid">
          ${balls.length ? balls.map((ball) => `
            <button class="capture-ball-card" type="button" data-capture-ball="${escapeHtml(ball.item_code)}" ${adventureViewState.busy ? "disabled" : ""}>
              <strong>${escapeHtml(ball.item_code)}</strong>
              <span>x${escapeHtml(ball.quantity)}</span>
              <small>${escapeHtml(ball.capture_rate_pct)}% catch</small>
            </button>
          `).join("") : `<div class="empty-panel">No tienes balls disponibles para capturar.</div>`}
        </div>
      </section>`;
  }

  if (!zoneDetail?.zone) {
    return `<section class="section-card encounter-panel"><div class="empty-panel">Selecciona una zona para abrir el mapa y empezar la exploracion.</div></section>`;
  }

  const preview = zoneDetail.encounter_preview || {};
  const zone = zoneDetail.zone;
  const playerState = zoneDetail.player_state || {};

  return `
    <section class="section-card encounter-panel">
      <div class="section-head">
        <div>
          <span class="eyebrow">Adventure hub</span>
          <h2>${escapeHtml(zone.name)}</h2>
          <p class="body-copy">Mapa base de exploracion, encuentros y captura para esta zona.</p>
        </div>
      </div>
      <div class="map-stage">
        <img class="map-stage-image" src="${escapeHtml(getMapImage(zone.map_asset_path || zone.card_asset_path))}" alt="${escapeHtml(zone.name)}" onerror="onPokemonImageError(this)">
        <div class="map-stage-overlay">
          <span class="pill tag-accent">${escapeHtml(zone.biome || "-")}</span>
          <span class="pill">Lv ${escapeHtml(zone.level_min || 1)}-${escapeHtml(zone.level_max || 1)}</span>
          <span class="pill">Power ${escapeHtml(playerState.recommended_team_power || 0)}</span>
        </div>
      </div>
      <div class="encounter-preview-row">
        ${(preview.featured || []).map((pokemon) => `
          <article class="encounter-preview-card">
            <img src="${escapeHtml(getPokemonSprite(pokemon))}" alt="${escapeHtml(pokemon.name)}" onerror="onPokemonImageError(this)">
            <strong>${escapeHtml(pokemon.name)}</strong>
            <span>${escapeHtml(pokemon.can_be_shiny ? "Shiny chance" : "Wild")}</span>
          </article>
        `).join("") || `<div class="empty-panel">No hay preview de especies para esta zona.</div>`}
      </div>
      <div class="hero-actions">
        <button class="primary-btn" type="button" id="startEncounterBtn" ${adventureViewState.busy ? "disabled" : ""}>Buscar encuentro</button>
        <button class="soft-btn" type="button" id="refreshZoneBtn">Recargar zona</button>
      </div>
    </section>`;
}

function renderRegionDetail() {
  const detail = adventureViewState.regionDetail;
  if (!detail?.region) {
    return `<section class="section-card"><div class="empty-panel">Selecciona una region para abrir el hub de aventura.</div></section>`;
  }

  const region = detail.region;
  const zones = detail.zones || [];
  const nextGym = detail.next_gym || null;
  const selectedZone = selectedZoneFromRegion();

  return `
    <section class="section-card adventure-region-shell">
      ${flashCard()}
      <div class="adventure-region-head">
        <div>
          <span class="eyebrow">Region selected</span>
          <h2>${escapeHtml(region.name || adventureViewState.selectedRegionCode)}</h2>
          <p>${escapeHtml(region.description || "Explora zonas, busca encuentros y empuja tu progreso hacia el siguiente gym.")}</p>
        </div>
        <div class="adventure-region-pills">
          <span class="pill tag-accent">${escapeHtml(region.code || "-")}</span>
          <span class="pill">${escapeHtml(region.completion_pct || 0)}% progress</span>
        </div>
      </div>

      <div class="region-overview-grid region-overview-grid-featured">
        <article class="region-overview-card region-overview-card-featured">
          <span>Siguiente meta</span>
          <strong>${escapeHtml(nextGym?.name || selectedZone?.name || "Explorar region")}</strong>
          <p class="body-copy">${escapeHtml(nextGym ? `Gym objetivo Lv ${nextGym.recommended_level || 1}` : "Elige una zona y empieza a buscar nuevos Pokemon.")}</p>
        </article>
        <article class="region-overview-card"><span>Zonas</span><strong>${escapeHtml(zones.length)}</strong><p class="body-copy">Tramos disponibles en esta region.</p></article>
        <article class="region-overview-card"><span>Gyms</span><strong>${escapeHtml(region.completed_gyms || 0)}/${escapeHtml(region.total_gyms || 0)}</strong><p class="body-copy">Ruta de insignias.</p></article>
        <article class="region-overview-card"><span>Zone active</span><strong>${escapeHtml(selectedZone?.name || "-")}</strong><p class="body-copy">Zona cargada en el hub.</p></article>
      </div>

      <div class="adventure-play-layout">
        <div class="zone-list zone-list-adventure">
          ${zones.map((zone) => `
            <article class="zone-card zone-card-adventure ${zone.code === adventureViewState.selectedZoneCode ? "is-selected" : ""}">
              <div class="zone-card-head">
                <div>
                  <strong>${escapeHtml(zone.name)}</strong>
                  <div class="pill-row">
                    <span class="pill">${escapeHtml(zone.biome || "-")}</span>
                    <span class="pill">Lv ${escapeHtml(zone.level_min || 1)}-${escapeHtml(zone.level_max || 1)}</span>
                  </div>
                </div>
                <button class="soft-btn" type="button" data-zone-code="${escapeHtml(zone.code)}">${zone.code === adventureViewState.selectedZoneCode ? "Loaded" : "Open zone"}</button>
              </div>
              <p>${escapeHtml(zone.code === selectedZone?.code ? "Zona cargada en el panel de mapa y encuentros." : "Cargala para ver mapa, preview y comenzar encuentros.")}</p>
              <div class="featured-species">
                ${(zone.featured_species || []).map((pokemon) => `
                  <span class="pill tag-accent featured-species-pill">
                    <img src="${escapeHtml(getPokemonSprite(pokemon))}" alt="${escapeHtml(pokemon.name || "Pokemon")}" onerror="onPokemonImageError(this)">
                    <span>${escapeHtml(pokemon.name)}</span>
                  </span>
                `).join("") || `<span class="pill">Sin destacadas</span>`}
              </div>
            </article>`).join("")}
        </div>

        ${renderEncounterPanel()}
      </div>
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
    });
  });

  document.getElementById("startEncounterBtn")?.addEventListener("click", async () => {
    await createEncounter();
  });

  document.getElementById("refreshZoneBtn")?.addEventListener("click", async () => {
    if (!adventureViewState.selectedZoneCode) return;
    await loadZoneDetail(adventureViewState.selectedZoneCode);
  });

  document.querySelectorAll("[data-capture-ball]").forEach((button) => {
    button.addEventListener("click", async () => {
      await captureEncounter(button.getAttribute("data-capture-ball"));
    });
  });
}

export function renderAdventure() {
  renderTopbarProfile();
  const regions = state.regions || [];
  const autoRegion = activeRegionFromList(regions);
  if (!adventureViewState.selectedRegionCode && autoRegion?.code) {
    adventureViewState.selectedRegionCode = autoRegion.code;
  }

  refs.appContent.innerHTML = `
    <section class="hero-panel">
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">${escapeHtml(tr("adventure.eyebrow"))}</span>
          <h1>Explora, encuentra y captura.</h1>
          <p>Adventure ya no deberia sentirse como un listado. Ahora es el hub de juego para abrir regiones, cargar zonas y lanzar encuentros reales.</p>
          <div class="hero-actions">
            <button class="primary-btn" type="button" id="backHomeBtn">${escapeHtml(tr("adventure.back"))}</button>
            <button class="soft-btn" type="button" id="refreshAdventureBtn">${escapeHtml(tr("adventure.refresh"))}</button>
          </div>
        </div>
        <div class="hero-aside adventure-hero-metrics">
          <article class="metric-card"><span>Regions</span><strong>${regions.length}</strong><p class="body-copy">Modulos regionales cargados.</p></article>
          <article class="metric-card"><span>Zone</span><strong>${escapeHtml(adventureViewState.zoneDetail?.zone?.name || "-")}</strong><p class="body-copy">Zona activa en el hub.</p></article>
        </div>
      </div>
    </section>

    <section class="adventure-shell">
      <section class="section-card">
        <div class="section-head"><div><h2>Regions</h2><p>${escapeHtml(tr("adventure.loaded"))}</p></div></div>
        <div class="regions-grid">
          ${regions.map((region) => `
            <article class="region-card ${region.code === adventureViewState.selectedRegionCode ? "is-selected" : ""}">
              <img class="region-banner" src="${escapeHtml(getMapImage(region.card_asset_path))}" alt="${escapeHtml(region.name)}" onerror="onPokemonImageError(this)">
              <div>
                <strong>${escapeHtml(region.name)}</strong>
                <div class="pill-row">
                  <span class="pill">Gen ${escapeHtml(region.generation_id || "-")}</span>
                  <span class="pill ${region.is_active_region ? "tag-accent" : ""}">${escapeHtml(region.is_active_region ? tr("adventure.active") : tr("adventure.available"))}</span>
                </div>
              </div>
              <p>${escapeHtml(region.zone_count || 0)} zones - ${escapeHtml(region.completed_gyms || 0)}/${escapeHtml(region.total_gyms || 0)} gyms</p>
              <div class="stack-actions"><button class="soft-btn" type="button" data-region-code="${escapeHtml(region.code)}">${region.code === adventureViewState.selectedRegionCode ? "Loaded" : escapeHtml(tr("adventure.detail"))}</button></div>
            </article>`).join("")}
        </div>
      </section>

      ${renderRegionDetail()}
    </section>`;

  bindAdventureEvents();
  if (adventureViewState.selectedRegionCode && !adventureViewState.regionDetail && !adventureViewState.busy) {
    loadRegionDetail(adventureViewState.selectedRegionCode);
  }
}

async function loadRegionDetail(regionCode) {
  if (!regionCode) return;
  adventureViewState.busy = true;
  adventureViewState.flash = "";
  adventureViewState.selectedRegionCode = regionCode;
  renderAdventure();

  try {
    const response = await fetchAuth(`/v2/adventure/regions/${regionCode}`);
    const data = response.data || {};
    adventureViewState.regionDetail = data;
    adventureViewState.selectedZoneCode = data.zones?.find((zone) => zone.is_current)?.code || data.zones?.[0]?.code || "";
    adventureViewState.activeEncounter = null;
    if (adventureViewState.selectedZoneCode) {
      await loadZoneDetail(adventureViewState.selectedZoneCode, false);
      return;
    }
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
  } catch (error) {
    adventureViewState.flash = error.message || "No se pudo cargar la zona.";
    adventureViewState.flashKind = "error";
  }

  if (rerender) renderAdventure();
}

async function createEncounter() {
  if (!adventureViewState.selectedZoneCode) return;
  adventureViewState.busy = true;
  adventureViewState.flash = "";
  renderAdventure();

  try {
    const response = await fetchAuth(`/v2/adventure/zones/${adventureViewState.selectedZoneCode}/encounters`, {
      method: "POST",
      body: JSON.stringify({ mode: "walk" }),
    });
    adventureViewState.activeEncounter = response.data?.encounter || null;
    adventureViewState.flash = "Encontraste un Pokemon salvaje. Elige una ball para capturarlo.";
    adventureViewState.flashKind = "success";
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
  renderAdventure();

  try {
    const response = await fetchAuth(`/v2/adventure/encounters/${adventureViewState.activeEncounter.id}/capture`, {
      method: "POST",
      body: JSON.stringify({ ball_item_code: ballItemCode }),
    });
    const data = response.data || {};
    adventureViewState.activeEncounter = null;
    adventureViewState.flash = data.message || (data.captured ? "Pokemon capturado." : "El Pokemon escapo.");
    adventureViewState.flashKind = data.captured ? "success" : "error";
  } catch (error) {
    adventureViewState.flash = error.message || "No se pudo completar la captura.";
    adventureViewState.flashKind = "error";
  } finally {
    adventureViewState.busy = false;
    renderAdventure();
  }
}
