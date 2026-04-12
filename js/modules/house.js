import { fetchAuth } from "../core/api.js";
import { refs, escapeHtml, renderTopbarProfile, statusCard } from "../core/ui.js";
import { state } from "../core/state.js";

async function ensureHouseLoaded(force = false) {
  if (!force && state.houseSummary && state.houseStorage && state.houseUpgrades) return;
  const [summaryResponse, storageResponse, upgradesResponse] = await Promise.all([
    fetchAuth("/v2/house/summary"),
    fetchAuth("/v2/house/storage"),
    fetchAuth("/v2/house/upgrades"),
  ]);
  state.houseSummary = summaryResponse.data || null;
  state.houseStorage = storageResponse.data || null;
  state.houseUpgrades = upgradesResponse.data || null;
}

function statCard(label, value, note = "") {
  return `<article class="house-stat-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(note)}</p></article>`;
}

function featuredCard(item) {
  return `
    <article class="house-pokemon-card">
      <div class="house-pokemon-art"><img src="${escapeHtml(item.asset_url || "https://placehold.co/96x96/png")}" alt="${escapeHtml(item.display_name || item.name || "Pokemon")}" onerror="onPokemonImageError(this)"></div>
      <div class="house-pokemon-copy">
        <strong>${escapeHtml(item.display_name || item.name || "Pokemon")}</strong>
        <p>Lv ${escapeHtml(item.level || item.min_level || 1)}${item.max_level ? ` - ${escapeHtml(item.max_level)}` : ""}</p>
        <div class="pill-row">
          ${item.is_featured ? `<span class="pill tag-accent">Featured</span>` : ""}
          ${item.variant_code ? `<span class="pill">${escapeHtml(item.variant_code)}</span>` : ""}
        </div>
      </div>
    </article>`;
}

function storageRow(item) {
  return `
    <article class="house-storage-row">
      <div class="house-storage-art"><img src="${escapeHtml(item.asset_url || "https://placehold.co/96x96/png")}" alt="${escapeHtml(item.display_name || "Pokemon")}" onerror="onPokemonImageError(this)"></div>
      <div class="house-storage-copy">
        <strong>${escapeHtml(item.display_name || "Pokemon")}</strong>
        <p>Slot ${escapeHtml(item.slot_index ?? "-")} · Lv ${escapeHtml(item.level || 1)}</p>
      </div>
      <div class="pill-row">
        ${item.is_featured ? `<span class="pill tag-accent">Featured</span>` : ""}
        ${item.is_favorite ? `<span class="pill">Favorite</span>` : ""}
      </div>
    </article>`;
}

function upgradeCard(item) {
  const bonus = item.encounter_bonus_json && typeof item.encounter_bonus_json === "object"
    ? Object.entries(item.encounter_bonus_json).map(([k, v]) => `${k}: ${v}`).join(" · ")
    : "No bonus JSON";
  return `
    <article class="house-upgrade-card ${item.is_current ? "is-current" : item.is_next_or_higher ? "is-next" : ""}">
      <div class="house-upgrade-top">
        <div>
          <strong>${escapeHtml(item.name || item.code || "Upgrade")}</strong>
          <p>Storage ${escapeHtml(item.storage_capacity || 0)} · Habitat slots ${escapeHtml(item.habitat_slots || 0)}</p>
        </div>
        <span class="pill ${item.is_current ? "tag-accent" : ""}">${escapeHtml(item.is_current ? "Current" : item.is_next_or_higher ? "Next" : "Tier")}</span>
      </div>
      <p class="house-upgrade-copy">${escapeHtml(bonus)}</p>
      <div class="house-upgrade-footer">
        <span>Req lv ${escapeHtml(item.level_required || 1)}</span>
        <span>${escapeHtml(item.price_amount || 0)} ${escapeHtml(item.price_currency_name || item.price_currency_code || "coins")}</span>
      </div>
    </article>`;
}

export async function renderHouse(force = false) {
  renderTopbarProfile();
  if (force) refs.appContent.innerHTML = statusCard("Loading house...");
  try {
    await ensureHouseLoaded(force);
    const summary = state.houseSummary || {};
    const house = summary.house || {};
    const storage = summary.storage || {};
    const nextUpgrade = summary.next_upgrade || null;
    const featured = Array.isArray(summary.featured_pokemon) ? summary.featured_pokemon : [];
    const preview = Array.isArray(summary.encounter_preview) ? summary.encounter_preview : [];
    const storageItems = Array.isArray(state.houseStorage?.items) ? state.houseStorage.items : [];
    const upgrades = Array.isArray(state.houseUpgrades?.items) ? state.houseUpgrades.items : [];

    refs.appContent.innerHTML = `
      <section class="hero-panel house-shell">
        <div class="hero-grid house-hero-grid">
          <div class="hero-copy">
            <span class="eyebrow">House</span>
            <h1>Trainer house and storage</h1>
            <p>Your house now lives as its own module in the V2 hub, with storage, featured Pokemon and upgrade progression.</p>
          </div>
          <div class="hero-aside house-hero-aside">
            ${statCard("House", house.house_name || "Player House", house.current_upgrade_name || "Starter home")}
            ${statCard("Storage", `${storage.stored_count || 0}/${storage.capacity || 0}`, `${storage.free_slots || 0} free slots`)}
            ${statCard("Usage", `${storage.usage_pct || 0}%`, `${storage.featured_count || 0} featured`)}
            ${statCard("Next upgrade", nextUpgrade?.name || "-", nextUpgrade ? `${nextUpgrade.storage_capacity} capacity` : "No next tier")}
          </div>
        </div>
      </section>

      <section class="house-layout">
        <section class="section-card">
          <div class="section-head"><div><h2>Featured storage</h2><p class="body-copy">Pokemon currently highlighted inside your house.</p></div><span class="pill">${escapeHtml(featured.length)}</span></div>
          <div class="house-featured-grid">${featured.length ? featured.map(featuredCard).join("") : `<div class="empty-panel">No featured Pokemon yet.</div>`}</div>
        </section>

        <section class="section-card">
          <div class="section-head"><div><h2>Encounter preview</h2><p class="body-copy">Species currently associated with the active habitat.</p></div><span class="pill">${escapeHtml(preview.length)}</span></div>
          <div class="house-featured-grid">${preview.length ? preview.map(featuredCard).join("") : `<div class="empty-panel">No encounter preview returned.</div>`}</div>
        </section>
      </section>

      <section class="house-layout house-layout-bottom">
        <section class="section-card">
          <div class="section-head"><div><h2>Stored Pokemon</h2><p class="body-copy">Current storage inventory for your house.</p></div><span class="pill">${escapeHtml(storageItems.length)}</span></div>
          <div class="house-storage-list">${storageItems.length ? storageItems.map(storageRow).join("") : `<div class="empty-panel">No Pokemon stored yet.</div>`}</div>
        </section>

        <section class="section-card">
          <div class="section-head"><div><h2>Upgrade route</h2><p class="body-copy">Available upgrade tiers currently returned by the API.</p></div><span class="pill">${escapeHtml(upgrades.length)}</span></div>
          <div class="house-upgrade-list">${upgrades.length ? upgrades.map(upgradeCard).join("") : `<div class="empty-panel">No upgrades available.</div>`}</div>
        </section>
      </section>`;
  } catch (error) {
    refs.appContent.innerHTML = statusCard(error.message || "No se pudo cargar House.", "error");
  }
}
