import { refs, escapeHtml, formatNumber, progressPct, renderTopbarProfile } from "../core/ui.js";
import { state } from "../core/state.js";
import { tr } from "../core/i18n.js";
import { getPokemonSprite, getAvatarImage } from "../core/assets.js";

function walletLabel(wallet = {}) {
  return wallet.name || wallet.display_name || wallet.code || "Wallet";
}

function buildAlerts(homeAlerts = {}, tradeSummary = {}) {
  const alerts = [];
  if ((homeAlerts.pending_trade_count || 0) > 0) {
    alerts.push(`${formatNumber(homeAlerts.pending_trade_count)} trade(s) abiertos`);
  }
  if ((homeAlerts.unclaimed_rewards_count || 0) > 0) {
    alerts.push(`${formatNumber(homeAlerts.unclaimed_rewards_count)} recompensa(s) por reclamar`);
  }
  if (homeAlerts.idle_ready) {
    alerts.push("Idle listo para reclamar");
  }
  if ((tradeSummary.open_offers || 0) > 0) {
    alerts.push(`${formatNumber(tradeSummary.open_offers)} oferta(s) visibles en trade`);
  }
  return alerts;
}

function navigate(target) {
  document.querySelector(`[data-nav="${target}"]`)?.click();
}

export function renderHome() {
  renderTopbarProfile();

  const profile = state.profile || state.user || {};
  const home = state.home || {};
  const trainer = home.trainer || {};
  const progress = home.progress || {};
  const adventure = home.adventure || {};
  const milestones = home.milestones || {};
  const summaryTeam = home.team_summary || {};
  const activeTeam = state.teamActive || {};
  const members = Array.isArray(activeTeam.members) && activeTeam.members.length
    ? activeTeam.members
    : Array.isArray(summaryTeam.members) ? summaryTeam.members : [];
  const collection = state.collectionSummary || {};
  const gyms = state.gymsSummary || {};
  const wallets = Array.isArray(profile.wallets) ? profile.wallets : [];
  const alerts = buildAlerts(state.homeAlerts || home.alerts || {}, state.tradeSummary || {});

  const displayName = trainer.display_name || profile.display_name || profile.username || state.user?.display_name || tr("common.trainer");
  const avatarSrc = profile.photo_url || trainer.avatar_url || getAvatarImage(profile.avatar_code || trainer.avatar_code || state.selectedAvatarCode || "steven");
  const regionName = trainer.active_region?.name || trainer.active_region_name || profile.region_name || "Kanto";
  const currentZone = adventure.current_zone?.name || "—";
  const nextGymName = gyms.next_gym?.name || progress.next_gym?.name || "—";
  const completion = collection.completion_pct ?? progress.current_region_completion_pct ?? 0;
  const trainerLevel = trainer.trainer_level || 1;
  const trainerExp = trainer.trainer_exp || 0;
  const nextLevelExp = trainer.next_level_exp || 1000;
  const expPct = progressPct(trainerExp, nextLevelExp);
  const teamPower = activeTeam.member_count ? summaryTeam.power_score || 0 : summaryTeam.power_score || 0;

  refs.appContent.innerHTML = `
    <section class="home-hero-panel section-card">
      <div class="home-hero-grid">
        <div class="home-hero-copy">
          <span class="eyebrow">${escapeHtml(tr("home.profile"))}</span>
          <h1>${escapeHtml(displayName)}</h1>
          <p>${escapeHtml(tr("home.body"))}</p>
          <div class="home-hero-meta-row">
            <span class="home-kpi-chip">${escapeHtml(tr("home.region"))}: <strong>${escapeHtml(regionName)}</strong></span>
            <span class="home-kpi-chip">${escapeHtml(tr("home.currentZone"))}: <strong>${escapeHtml(currentZone)}</strong></span>
            <span class="home-kpi-chip">${escapeHtml(tr("home.nextGym"))}: <strong>${escapeHtml(nextGymName)}</strong></span>
          </div>
          <div class="hero-actions home-hero-actions">
            <button class="primary-btn" type="button" id="goAdventure">${escapeHtml(tr("home.continue"))}</button>
            <button class="soft-btn" type="button" id="goCollection">${escapeHtml(tr("home.openCollection"))}</button>
          </div>
        </div>
        <aside class="home-hero-side">
          <div class="home-profile-card">
            <div class="home-profile-head">
              <img class="home-avatar" src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(displayName)}" onerror="onAvatarImageError(this)">
              <div>
                <span>${escapeHtml(tr("home.trainerLevel"))}</span>
                <strong>${escapeHtml(formatNumber(trainerLevel))}</strong>
                <small>${escapeHtml(tr("home.upcomingGoal"))}: ${escapeHtml(nextGymName)}</small>
              </div>
            </div>
            <div class="home-exp-block">
              <div class="home-exp-top">
                <span>EXP</span>
                <strong>${escapeHtml(formatNumber(trainerExp))} / ${escapeHtml(formatNumber(nextLevelExp))}</strong>
              </div>
              <div class="home-exp-bar"><div class="home-exp-fill" style="width:${expPct}%"></div></div>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section class="home-grid">
      <div class="home-stack">
        <div class="section-card">
          <div class="section-head"><div><h2>${escapeHtml(tr("home.wallets"))}</h2></div></div>
          <div class="wallet-grid">
            ${wallets.length ? wallets.map((w) => `
              <article class="wallet-card">
                <span>${escapeHtml(walletLabel(w))}</span>
                <strong>${escapeHtml(formatNumber(w.balance || 0))}</strong>
              </article>`).join("") : `<div class="placeholder-card">${escapeHtml(tr("home.walletsEmpty"))}</div>`}
          </div>
        </div>

        <div class="section-card">
          <div class="section-head"><div><h2>${escapeHtml(tr("home.journey"))}</h2></div></div>
          <div class="summary-grid">
            <article class="summary-card"><span>${escapeHtml(tr("home.captured"))}</span><strong>${escapeHtml(formatNumber(collection.total_owned || milestones.collection_owned || 0))}</strong></article>
            <article class="summary-card"><span>${escapeHtml(tr("home.shiny"))}</span><strong>${escapeHtml(formatNumber(collection.shiny_owned || 0))}</strong></article>
            <article class="summary-card"><span>${escapeHtml(tr("home.completion"))}</span><strong>${escapeHtml(formatNumber(completion))}%</strong></article>
            <article class="summary-card"><span>${escapeHtml(tr("home.nextGym"))}</span><strong>${escapeHtml(nextGymName)}</strong></article>
            <article class="summary-card"><span>${escapeHtml(tr("home.currentZone"))}</span><strong>${escapeHtml(currentZone)}</strong></article>
            <article class="summary-card"><span>${escapeHtml(tr("home.teamPower"))}</span><strong>${escapeHtml(formatNumber(teamPower))}</strong></article>
          </div>
        </div>

        <div class="section-card">
          <div class="section-head"><div><h2>${escapeHtml(tr("home.quick"))}</h2></div></div>
          <div class="hero-actions home-quick-actions">
            <button class="soft-btn" type="button" id="goTeam">${escapeHtml(tr("home.openTeam"))}</button>
            <button class="soft-btn" type="button" id="goGyms">${escapeHtml(tr("home.openGyms"))}</button>
            <button class="soft-btn" type="button" id="goShop">${escapeHtml(tr("home.openShop"))}</button>
            <button class="soft-btn" type="button" id="goTrade">Trade</button>
          </div>
        </div>
      </div>

      <div class="home-stack">
        <div class="section-card">
          <div class="section-head"><div><h2>${escapeHtml(tr("home.team"))}</h2></div></div>
          <div class="team-list">
            ${members.length ? members.map((member) => `
              <article class="team-member">
                <img src="${escapeHtml(getPokemonSprite(member))}" alt="${escapeHtml(member.display_name || member.name || "Pokemon")}" onerror="onPokemonImageError(this)">
                <div>
                  <strong>${escapeHtml(member.display_name || member.name || "Pokemon")}</strong>
                  <small>${escapeHtml(tr("common.levelShort"))} ${escapeHtml(formatNumber(member.level || 1))}</small>
                </div>
                <span class="pill">${escapeHtml(member.variant || (member.is_shiny ? "shiny" : "normal"))}</span>
              </article>`).join("") : `<div class="placeholder-card">${escapeHtml(tr("home.noTeam"))}</div>`}
          </div>
        </div>

        <div class="section-card">
          <div class="section-head"><div><h2>${escapeHtml(tr("home.alerts"))}</h2></div></div>
          <div class="home-alerts-list">
            ${alerts.length ? alerts.map((item) => `<article class="home-alert-card"><strong>${escapeHtml(item)}</strong></article>`).join("") : `<div class="placeholder-card">${escapeHtml(tr("home.noAlerts"))}</div>`}
          </div>
        </div>
      </div>
    </section>`;

  document.getElementById("goAdventure")?.addEventListener("click", () => navigate("adventure"));
  document.getElementById("goCollection")?.addEventListener("click", () => navigate("collection"));
  document.getElementById("goTeam")?.addEventListener("click", () => navigate("team"));
  document.getElementById("goGyms")?.addEventListener("click", () => navigate("gyms"));
  document.getElementById("goShop")?.addEventListener("click", () => navigate("shop"));
  document.getElementById("goTrade")?.addEventListener("click", () => navigate("trade"));
}
