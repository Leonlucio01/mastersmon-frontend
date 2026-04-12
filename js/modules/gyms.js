import { fetchAuth } from "../core/api.js";
import { refs, escapeHtml, renderTopbarProfile, statusCard } from "../core/ui.js";
import { state } from "../core/state.js";

function typeLabel(code = "") {
  const value = String(code || "").trim();
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

async function ensureGymsLoaded(force = false) {
  if (!force && state.gymsSummary && state.gymsItems.length) return;
  const [summaryResponse, listResponse] = await Promise.all([
    fetchAuth("/v2/gyms/summary"),
    fetchAuth("/v2/gyms"),
  ]);
  state.gymsSummary = summaryResponse.data || null;
  state.gymsItems = Array.isArray(listResponse.data?.items) ? listResponse.data.items : [];
  if (!state.selectedGymCode && state.gymsSummary?.next_gym?.code) {
    state.selectedGymCode = state.gymsSummary.next_gym.code;
  }
  if (!state.selectedGymCode && state.gymsItems.length) {
    state.selectedGymCode = state.gymsItems[0].code;
  }
}

async function ensureGymDetail(gymCode) {
  if (!gymCode) {
    state.gymDetail = null;
    return;
  }
  if (state.gymDetail?.gym?.code === gymCode) return;
  const response = await fetchAuth(`/v2/gyms/${gymCode}`);
  state.gymDetail = response.data || null;
}

function summaryCard(label, value, note = "") {
  return `<article class="gyms-summary-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(note)}</p></article>`;
}

function gymCard(item) {
  const progress = item.progress || {};
  const region = item.region || {};
  const unlocked = Boolean(progress.unlocked);
  const completed = Boolean(progress.completed);
  const selected = state.selectedGymCode === item.code;
  return `
    <article class="gym-card ${selected ? "is-selected" : ""} ${completed ? "is-completed" : ""} ${unlocked ? "" : "is-locked"}" data-gym-code="${escapeHtml(item.code)}">
      <div class="gym-card-top">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <p>${escapeHtml(item.city_name || region.name || "Unknown city")}</p>
        </div>
        <span class="gym-state-pill ${completed ? "is-completed" : unlocked ? "is-unlocked" : "is-locked"}">${escapeHtml(completed ? "Completed" : unlocked ? "Unlocked" : "Locked")}</span>
      </div>
      <div class="pill-row">
        <span class="pill">${escapeHtml(region.name || "Region")}</span>
        <span class="pill">${escapeHtml(typeLabel(item.primary_type_code))}</span>
        <span class="pill">Lv ${escapeHtml(item.recommended_level || 1)}</span>
      </div>
      <p class="gym-card-copy">${escapeHtml(item.description || "Gym ready for modular progression.")}</p>
      <div class="gym-card-footer">
        <span>${escapeHtml(item.badge_name || "Badge")}</span>
        <span>${escapeHtml(progress.victories || 0)} victories</span>
      </div>
    </article>`;
}

function renderDetailPanel() {
  const detail = state.gymDetail;
  if (!detail?.gym) return `<div class="empty-panel">Select a gym to view its roster and rewards.</div>`;
  const gym = detail.gym;
  const progress = gym.progress || {};
  const region = gym.region || {};
  const roster = Array.isArray(detail.roster) ? detail.roster : [];
  return `
    <section class="gym-detail-card">
      <div class="gym-detail-head">
        <div>
          <span class="eyebrow">Gym dossier</span>
          <h2>${escapeHtml(gym.name)}</h2>
          <p class="body-copy">${escapeHtml(gym.description || "Gym detail loaded from V2 API.")}</p>
        </div>
        <div class="gym-detail-badge-wrap">
          <span class="pill tag-accent">${escapeHtml(region.name || "Region")}</span>
          <span class="pill">${escapeHtml(gym.badge_name || "Badge")}</span>
        </div>
      </div>

      <div class="gym-detail-stats">
        <article class="gym-detail-stat"><span>Recommended</span><strong>Lv ${escapeHtml(gym.recommended_level || 1)}</strong></article>
        <article class="gym-detail-stat"><span>Reward</span><strong>${escapeHtml(gym.reward_soft_currency || 0)} coins</strong></article>
        <article class="gym-detail-stat"><span>Reward EXP</span><strong>${escapeHtml(gym.reward_exp || 0)}</strong></article>
        <article class="gym-detail-stat"><span>Progress</span><strong>${escapeHtml(progress.completed ? "Complete" : progress.unlocked ? "Ready" : "Locked")}</strong></article>
      </div>

      <div class="gym-progress-line">
        <span>Attempts: ${escapeHtml(progress.attempts || 0)}</span>
        <span>Victories: ${escapeHtml(progress.victories || 0)}</span>
        <span>Best turns: ${escapeHtml(progress.best_turns || "-")}</span>
      </div>

      <div class="section-head" style="margin-top:18px"><div><h2>Enemy roster</h2><p class="body-copy">Current lineup registered for this gym.</p></div></div>
      <div class="gym-roster-grid">
        ${roster.length ? roster.map(member => `
          <article class="gym-roster-card">
            <div class="gym-roster-art"><img src="${escapeHtml(member.asset_url || "https://placehold.co/96x96/png")}" alt="${escapeHtml(member.species_name)}" onerror="onPokemonImageError(this)"></div>
            <div class="gym-roster-copy">
              <strong>${escapeHtml(member.species_name)}</strong>
              <p>Slot ${escapeHtml(member.slot_order || 1)} · Lv ${escapeHtml(member.level || 1)}</p>
              <div class="pill-row">
                <span class="pill">${member.is_signature ? "Signature" : "Standard"}</span>
                ${member.is_shiny ? `<span class="pill tag-accent">Shiny</span>` : ""}
              </div>
            </div>
          </article>`).join("") : `<div class="empty-panel">No enemy roster was returned for this gym.</div>`}
      </div>
    </section>`;
}

function bindGymsEvents() {
  document.querySelectorAll("[data-gym-code]").forEach((card) => {
    card.addEventListener("click", async () => {
      const code = card.getAttribute("data-gym-code");
      state.selectedGymCode = code;
      state.gymDetail = null;
      await renderGyms(false);
    });
  });
  document.getElementById("refreshGymsBtn")?.addEventListener("click", async () => {
    state.gymsSummary = null;
    state.gymsItems = [];
    state.gymDetail = null;
    await renderGyms(true);
  });
}

export async function renderGyms(force = false) {
  renderTopbarProfile();
  if (force) refs.appContent.innerHTML = statusCard("Loading gyms...");
  try {
    await ensureGymsLoaded(force);
    await ensureGymDetail(state.selectedGymCode);
    const summary = state.gymsSummary || {};
    const gyms = Array.isArray(state.gymsItems) ? state.gymsItems : [];
    const nextGym = summary.next_gym || null;
    refs.appContent.innerHTML = `
      <section class="hero-panel gyms-shell">
        <div class="hero-grid gyms-hero-grid">
          <div class="hero-copy">
            <span class="eyebrow">Gyms</span>
            <h1>Regional badge route</h1>
            <p>Gyms now live as their own module inside the V2 hub, using summary, list and detail from the backend.</p>
            <div class="hero-actions">
              <button class="soft-btn" type="button" id="refreshGymsBtn">Refresh gyms</button>
              <button class="primary-btn" type="button" data-nav-jump="team">Review team</button>
            </div>
          </div>
          <div class="hero-aside gyms-summary-grid">
            ${summaryCard("Completion", `${escapeHtml(summary.completion_pct || 0)}%`, "Global badge progress")}
            ${summaryCard("Completed", escapeHtml(summary.completed_gyms || 0), "Gyms cleared")}
            ${summaryCard("Unlocked", escapeHtml(summary.unlocked_gyms || 0), "Gyms available now")}
            ${summaryCard("Next gym", escapeHtml(nextGym?.name || "-"), nextGym ? `${nextGym.region_name || "Region"} · Lv ${nextGym.recommended_level || 1}` : "No next gym returned")}
          </div>
        </div>
      </section>

      <section class="gyms-layout">
        <section class="section-card">
          <div class="section-head"><div><h2>Campaign route</h2><p class="body-copy">Choose a gym to inspect its roster and progression status.</p></div><span class="pill">${escapeHtml(gyms.length)}</span></div>
          <div class="gyms-grid">${gyms.length ? gyms.map(gymCard).join("") : `<div class="empty-panel">No gyms available yet.</div>`}</div>
        </section>
        ${renderDetailPanel()}
      </section>`;
    document.querySelector('[data-nav-jump="team"]')?.addEventListener('click', () => document.querySelector('[data-nav="team"]')?.click());
    bindGymsEvents();
  } catch (error) {
    refs.appContent.innerHTML = statusCard(error.message || "No se pudo cargar Gyms.", "error");
  }
}
