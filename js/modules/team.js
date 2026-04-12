import { fetchAuth } from "../core/api.js";
import { refs, escapeHtml, statusCard } from "../core/ui.js";
import { state } from "../core/state.js";
import { tr } from "../core/i18n.js";
import { getPokemonSprite } from "../core/assets.js";

async function ensureTeamLoaded(force = false) {
  if (!force && state.teamActive && state.collectionItems.length) return;
  const [teamResponse, collectionResponse] = await Promise.all([
    fetchAuth("/v2/team/active"),
    fetchAuth("/v2/collection/pokemon?limit=120"),
  ]);
  state.teamActive = teamResponse.data || { members: [], warnings: [] };
  state.teamSelection = (state.teamActive.members || []).map(member => member.user_pokemon_id);
  state.collectionItems = collectionResponse.data?.items || [];
}

function selectedMembers() {
  return state.collectionItems.filter(item => state.teamSelection.includes(item.user_pokemon_id));
}

function renderTeamMember(member, slotIndex) {
  return `
    <article class="team-member-card">
      <div class="team-member-art"><img src="${escapeHtml(getPokemonSprite(member))}" alt="${escapeHtml(member.display_name)}" onerror="onPokemonImageError(this)"></div>
      <div class="team-member-copy"><strong>Slot ${slotIndex + 1} · ${escapeHtml(member.display_name)}</strong><p>Lv ${escapeHtml(member.level)} · ${escapeHtml(member.variant || member.variant_name || "normal")}</p><div class="team-member-meta">${member.is_shiny ? `<span class="team-pill is-active">Shiny</span>` : ""}${member.is_favorite ? `<span class="team-pill">Favorite</span>` : ""}</div></div>
      <div class="team-member-actions"><button class="ghost-btn" type="button" data-remove-team="${member.user_pokemon_id}">Remove</button></div>
    </article>`;
}

function renderRosterItem(item) {
  return `
    <article class="roster-card">
      <div class="roster-card-art"><img src="${escapeHtml(getPokemonSprite(item))}" alt="${escapeHtml(item.display_name)}" onerror="onPokemonImageError(this)"></div>
      <div class="roster-card-copy"><strong>${escapeHtml(item.display_name)}</strong><p>Lv ${escapeHtml(item.level)} · ${escapeHtml(item.variant_name || item.variant || "Normal")}</p><div class="roster-card-meta">${item.is_team_locked ? `<span class="team-pill is-active">Active</span>` : ""}${item.is_shiny ? `<span class="team-pill">Shiny</span>` : ""}</div></div>
      <div class="roster-card-actions">${state.teamSelection.includes(item.user_pokemon_id) ? `<button class="soft-btn" type="button" data-remove-team="${item.user_pokemon_id}">Selected</button>` : `<button class="primary-btn" type="button" data-add-team="${item.user_pokemon_id}">Add</button>`}</div>
    </article>`;
}

async function saveTeam() {
  const saveButton = document.getElementById("saveTeamBtn");
  const statusMount = document.getElementById("teamSaveStatus");
  if (!state.teamSelection.length) {
    statusMount.innerHTML = statusCard("Select at least one Pokémon.", "error");
    return;
  }
  saveButton.disabled = true;
  statusMount.innerHTML = statusCard("Saving active team...");
  try {
    const response = await fetchAuth("/v2/team/active", {
      method: "POST",
      body: JSON.stringify({ user_pokemon_ids: state.teamSelection, team_name: "Active Team" }),
    });
    state.teamActive = response.data || state.teamActive;
    statusMount.innerHTML = statusCard("Team saved successfully.");
    await renderTeam(true);
  } catch (error) {
    statusMount.innerHTML = statusCard(error.message || "Could not save team.", "error");
  } finally {
    saveButton.disabled = false;
  }
}

function bindTeamEvents() {
  document.querySelectorAll("[data-add-team]").forEach(btn => btn.addEventListener("click", () => {
    const id = Number(btn.getAttribute("data-add-team"));
    if (!state.teamSelection.includes(id) && state.teamSelection.length < 6) state.teamSelection.push(id);
    renderTeam(false);
  }));
  document.querySelectorAll("[data-remove-team]").forEach(btn => btn.addEventListener("click", () => {
    const id = Number(btn.getAttribute("data-remove-team"));
    state.teamSelection = state.teamSelection.filter(value => Number(value) !== id);
    renderTeam(false);
  }));
  document.getElementById("saveTeamBtn")?.addEventListener("click", saveTeam);
  document.getElementById("teamSyncBtn")?.addEventListener("click", async () => { await renderTeam(true); });
}

export async function renderTeam(force = false) {
  if (force) refs.appContent.innerHTML = statusCard(tr("common.loading"));
  try {
    await ensureTeamLoaded(force);
    const members = selectedMembers();
    const warnings = Array.isArray(state.teamActive?.warnings) ? state.teamActive.warnings : [];
    refs.appContent.innerHTML = `
      <section class="hero-panel team-screen-shell">
        <div class="section-head"><div><span class="eyebrow">Team</span><h2>${escapeHtml(tr("team.title"))}</h2><p class="body-copy">${escapeHtml(tr("team.body"))}</p></div><div class="stack-actions"><button class="soft-btn" id="teamSyncBtn" type="button">Sync</button><button class="primary-btn" id="saveTeamBtn" type="button">Save active team</button></div></div>
        <div id="teamSaveStatus"></div>
        <div class="team-screen-layout">
          <div class="team-panel">
            <div class="team-builder-stats">
              <article class="team-builder-stat"><span>Selected</span><strong>${members.length}/6</strong></article>
              <article class="team-builder-stat"><span>Warnings</span><strong>${warnings.length}</strong></article>
              <article class="team-builder-stat"><span>Preset</span><strong>${escapeHtml(state.teamActive?.team?.name || "Active Team")}</strong></article>
            </div>
            <div class="section-head" style="margin-top:16px"><div><h2>Current lineup</h2></div></div>
            <div class="team-list">${members.length ? members.map((member, index) => renderTeamMember(member, index)).join("") : `<div class="empty-panel">No Pokémon selected yet.</div>`}</div>
          </div>
          <aside class="team-side-panel">
            <div class="section-head"><div><h2>Available roster</h2><p class="body-copy">Choose up to 6 Pokémon from your collection.</p></div></div>
            ${warnings.length ? `<div class="team-warning-list">${warnings.map(w => `<div class="team-warning-item">${escapeHtml(w)}</div>`).join("")}</div>` : ""}
            <div class="roster-list">${state.collectionItems.length ? state.collectionItems.map(renderRosterItem).join("") : `<div class="empty-panel">No collection data available.</div>`}</div>
          </aside>
        </div>
      </section>`;
    bindTeamEvents();
  } catch (error) {
    refs.appContent.innerHTML = statusCard(error.message || "No se pudo cargar Team.", "error");
  }
}
