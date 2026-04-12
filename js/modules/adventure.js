import { fetchAuth } from "../core/api.js";
import { refs, escapeHtml, renderTopbarProfile, statusCard } from "../core/ui.js";
import { state } from "../core/state.js";
import { tr } from "../core/i18n.js";
import { getMapImage, getPokemonSprite } from "../core/assets.js";

export function renderAdventure() {
  renderTopbarProfile();
  const regions = state.regions || [];
  refs.appContent.innerHTML = `
    <section class="hero-panel">
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">${escapeHtml(tr("adventure.eyebrow"))}</span>
          <h1>${escapeHtml(tr("adventure.title"))}</h1>
          <p>${escapeHtml(tr("adventure.body"))}</p>
          <div class="hero-actions">
            <button class="primary-btn" type="button" id="backHomeBtn">${escapeHtml(tr("adventure.back"))}</button>
            <button class="soft-btn" type="button" id="refreshAdventureBtn">${escapeHtml(tr("adventure.refresh"))}</button>
          </div>
        </div>
        <div class="hero-aside">
          <article class="metric-card"><span>Modular</span><strong>${regions.length}</strong><p class="body-copy">${escapeHtml(tr("adventure.loaded"))}</p></article>
        </div>
      </div>
    </section>

    <section class="adventure-shell">
      <section class="section-card">
        <div class="section-head"><div><h2>Regions</h2><p>${escapeHtml(tr("adventure.loaded"))}</p></div></div>
        <div class="regions-grid">
          ${regions.map(region => `
            <article class="region-card">
              <img class="region-banner" src="${escapeHtml(getMapImage(region.card_asset_path))}" alt="${escapeHtml(region.name)}" onerror="onPokemonImageError(this)">
              <div>
                <strong>${escapeHtml(region.name)}</strong>
                <div class="pill-row">
                  <span class="pill">Gen ${escapeHtml(region.generation_id || "-")}</span>
                  <span class="pill ${region.is_active_region ? "tag-accent" : ""}">${escapeHtml(region.is_active_region ? tr("adventure.active") : tr("adventure.available"))}</span>
                </div>
              </div>
              <p>${escapeHtml(region.zone_count || 0)} zones · ${escapeHtml(region.completed_gyms || 0)}/${escapeHtml(region.total_gyms || 0)} gyms</p>
              <div class="stack-actions"><button class="soft-btn" type="button" data-region-code="${escapeHtml(region.code)}">${escapeHtml(tr("adventure.detail"))}</button></div>
            </article>`).join("")}
        </div>
      </section>

      <section id="regionDetailMount"></section>
    </section>`;

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
}

async function loadRegionDetail(regionCode) {
  const mount = document.getElementById("regionDetailMount");
  if (!mount) return;
  mount.innerHTML = `<section class="section-card skeleton" style="height: 260px"></section>`;
  try {
    const response = await fetchAuth(`/v2/adventure/regions/${regionCode}`);
    const data = response.data || {};
    const region = data.region || {};
    const zones = data.zones || [];
    mount.innerHTML = `
      <section class="section-card">
        <div class="section-head"><div><h2>${escapeHtml(region.name || regionCode)}</h2><p>${escapeHtml(region.description || "Detalle regional cargado desde la API V2.")}</p></div></div>
        <div class="adventure-layout">
          <div class="zone-list">
            ${zones.map(zone => `
              <article class="zone-card">
                <strong>${escapeHtml(zone.name)}</strong>
                <div class="pill-row"><span class="pill">${escapeHtml(zone.biome || zone.tipo_ambiente || "-")}</span><span class="pill">Lv ${escapeHtml(zone.level_min || 1)}-${escapeHtml(zone.level_max || 1)}</span></div>
                <p>${escapeHtml(zone.description || "Zona lista para exploración modular.")}</p>
                <div class="featured-species">${(zone.featured_species || []).map(p => `<span class="pill tag-accent featured-species-pill"><img src="${escapeHtml(getPokemonSprite(p))}" alt="${escapeHtml(p.name || 'Pokemon')}" onerror="onPokemonImageError(this)"><span>${escapeHtml(p.name)}</span></span>`).join("") || `<span class="pill">Sin destacadas</span>`}</div>
              </article>`).join("")}
          </div>
          <div class="region-overview-grid">
            <article class="region-overview-card"><strong>${escapeHtml(region.name || "-")}</strong><p class="body-copy">Región activa modular.</p></article>
            <article class="region-overview-card"><strong>${escapeHtml(zones.length)}</strong><p class="body-copy">Zonas cargadas</p></article>
            <article class="region-overview-card"><strong>${escapeHtml(region.generation_id || "-")}</strong><p class="body-copy">Generación</p></article>
            <article class="region-overview-card"><strong>${escapeHtml(region.code || "-")}</strong><p class="body-copy">Código interno</p></article>
          </div>
        </div>
      </section>`;
  } catch (error) {
    mount.innerHTML = statusCard(error.message || "No se pudo cargar la región.", "error");
  }
}
