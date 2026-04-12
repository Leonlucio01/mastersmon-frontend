import { refs, escapeHtml, renderTopbarProfile } from "../core/ui.js";
import { state } from "../core/state.js";
import { tr } from "../core/i18n.js";

export function renderHome() {
  renderTopbarProfile();
  const home = state.home || {};
  const trainer = home.trainer || {};
  const wallets = home.wallets || [];
  const members = home.active_team?.members || [];
  const modules = ["collection","team","gyms","house","trade"];

  refs.appContent.innerHTML = `
    <section class="hero-panel">
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">Home</span>
          <h1>${escapeHtml(tr("home.title"))}</h1>
          <p>${escapeHtml(tr("home.body"))}</p>
          <div class="hero-actions">
            <button class="primary-btn" type="button" id="goAdventure">${escapeHtml(tr("home.continue"))}</button>
          </div>
        </div>
        <div class="hero-aside">
          <article class="metric-card"><span>${escapeHtml(tr("home.profile"))}</span><strong>${escapeHtml(trainer.display_name || state.user?.display_name || tr("common.trainer"))}</strong><p class="body-copy">${escapeHtml(trainer.active_region_name || "Sin región activa")}</p></article>
        </div>
      </div>
    </section>

    <section class="home-grid">
      <div class="home-stack">
        <div class="section-card">
          <div class="section-head"><div><h2>${escapeHtml(tr("home.wallets"))}</h2></div></div>
          <div class="wallet-grid">
            ${wallets.length ? wallets.map(w => `<article class="wallet-card"><span>${escapeHtml(w.name || w.code)}</span><strong>${escapeHtml(w.balance ?? 0)}</strong></article>`).join("") : `<div class="placeholder-card">No wallets</div>`}
          </div>
        </div>

        <div class="section-card">
          <div class="section-head"><div><h2>Quick links</h2></div></div>
          <div class="hero-actions">
            <button class="primary-btn" type="button" id="goCollection">Open Collection</button>
            <button class="soft-btn" type="button" id="goTeam">Open Team</button>
          </div>
        </div>

        <div class="section-card">
          <div class="section-head"><div><h2>${escapeHtml(tr("home.modules"))}</h2></div></div>
          <div class="module-grid">
            ${modules.map(m => `<article class="module-card"><strong>${m}</strong><p class="body-copy">Preparado para crecer dentro de js/modules/${m}.js</p></article>`).join("")}
          </div>
        </div>
      </div>

      <div class="home-stack">
        <div class="section-card">
          <div class="section-head"><div><h2>${escapeHtml(tr("home.team"))}</h2></div></div>
          <div class="team-list">
            ${members.length ? members.map(member => `
              <article class="team-member">
                <img src="${escapeHtml(member.asset_url || "https://placehold.co/96x96/png")}" alt="${escapeHtml(member.name || member.display_name || "Pokemon")}" onerror="onPokemonImageError(this)">
                <div><strong>${escapeHtml(member.name || member.display_name || "Pokemon")}</strong><br><small>Lv ${escapeHtml(member.level || 1)}</small></div>
                <span class="pill">${escapeHtml(member.variant || "normal")}</span>
              </article>`).join("") : `<div class="placeholder-card">Sin miembros todavía.</div>`}
          </div>
        </div>
      </div>
    </section>`;

  document.getElementById("goAdventure")?.addEventListener("click", () => { document.querySelector('[data-nav="adventure"]')?.click(); });
  document.getElementById("goCollection")?.addEventListener("click", () => { document.querySelector('[data-nav="collection"]')?.click(); });
  document.getElementById("goTeam")?.addEventListener("click", () => { document.querySelector('[data-nav="team"]')?.click(); });
}
