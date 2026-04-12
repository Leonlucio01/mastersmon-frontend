import {
  refs,
  escapeHtml,
  formatNumber,
  progressPct,
  renderTopbarProfile,
  openAppModal,
} from "../core/ui.js";
import { state } from "../core/state.js";
import { tr } from "../core/i18n.js";
import { getPokemonSprite, getAvatarImage } from "../core/assets.js";

function navigate(target) {
  document.querySelector(`[data-nav="${target}"]`)?.click();
}

function walletLabel(wallet = {}) {
  return wallet.name || wallet.display_name || wallet.code || "Wallet";
}

function teamToneLabel(code = "neutral") {
  const map = {
    red: "Red",
    blue: "Blue",
    yellow: "Yellow",
    green: "Green",
    neutral: "Neutral",
  };
  return map[String(code || "neutral").toLowerCase()] || code || "Neutral";
}

function buildMainMission({ currentZone, nextGymName, regionName, teamPower }) {
  if (currentZone && currentZone !== "-") {
    return {
      eyebrow: "Live mission",
      title: currentZone,
      subtitle: "Ruta activa",
      body: `Tu equipo ya puede seguir capturando en ${currentZone} antes de empujar ${nextGymName}.`,
      primary: { label: "Seguir en el mapa", target: "adventure" },
      secondary: { label: "Ver team", target: "team" },
    };
  }

  if (nextGymName && nextGymName !== "-") {
    return {
      eyebrow: "Next target",
      title: nextGymName,
      subtitle: "Gym objetivo",
      body: `Activa ${regionName}, captura más especies y sube tu poder antes de llegar al gym.`,
      primary: { label: "Abrir Adventure", target: "adventure" },
      secondary: { label: "Preparar team", target: "team" },
    };
  }

  return {
    eyebrow: "Starter route",
    title: regionName,
    subtitle: "Región activa",
    body: `Entra al mapa y activa tu primera zona. Tu poder actual es ${formatNumber(teamPower)}.`,
    primary: { label: "Empezar aventura", target: "adventure" },
    secondary: { label: "Abrir dex", target: "collection" },
  };
}

function buildLiveFeed({ regionName, currentZone, nextGymName, rewards, pendingTrade, ownedSpecies }) {
  return [
    `${formatNumber(ownedSpecies)} Pokémon registrados`,
    currentZone && currentZone !== "-" ? `Zona activa: ${currentZone}` : `Listo para explorar ${regionName}`,
    nextGymName && nextGymName !== "-" ? `Meta actual: ${nextGymName}` : "Sin gym fijado todavía",
    rewards > 0 ? `${formatNumber(rewards)} rewards listas` : "Sin rewards pendientes",
    pendingTrade > 0 ? `${formatNumber(pendingTrade)} trade(s) abiertas` : "Trade sin urgencias",
  ];
}

function buildAlertCards({ rewards, pendingTrade, currentZone, nextGymName, membersCount }) {
  const alerts = [];

  if (!currentZone || currentZone === "-") {
    alerts.push({
      tone: "info",
      title: "Carga tu primera zona",
      text: "Sin mapa activo no hay encuentros ni capturas nuevas.",
      action: "Abrir Adventure",
      target: "adventure",
    });
  }

  if (membersCount < 3) {
    alerts.push({
      tone: "warning",
      title: "Tu party está corta",
      text: "Conviene llenar más slots antes del siguiente empujón.",
      action: "Editar team",
      target: "team",
    });
  }

  if (rewards > 0) {
    alerts.push({
      tone: "reward",
      title: `${formatNumber(rewards)} rewards listas`,
      text: "Hay progreso detenido esperando tu claim.",
      action: "Ver Home",
      target: "home",
    });
  }

  if (pendingTrade > 0) {
    alerts.push({
      tone: "social",
      title: `${formatNumber(pendingTrade)} ofertas abiertas`,
      text: "Tu mercado sigue vivo y puede darte una mejora útil.",
      action: "Abrir Trade",
      target: "trade",
    });
  }

  if (nextGymName && nextGymName !== "-") {
    alerts.push({
      tone: "goal",
      title: `Siguiente gym: ${nextGymName}`,
      text: "Tu ruta principal ya tiene un destino visible.",
      action: "Ver Gyms",
      target: "gyms",
    });
  }

  return alerts.slice(0, 4);
}

function openQuickModal(card) {
  openAppModal({
    eyebrow: "Hub action",
    title: card.title,
    body: `<p>${escapeHtml(card.text)}</p>`,
    actions: [
      { label: card.action, kind: "primary", onClick: () => navigate(card.target) },
      { label: "Cerrar", kind: "soft" },
    ],
  });
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
  const alerts = state.homeAlerts || home.alerts || {};

  const displayName = trainer.display_name || profile.display_name || profile.username || tr("common.trainer");
  const avatarCode = profile.avatar_code || trainer.avatar_code || state.selectedAvatarCode || "steven";
  const avatarSrc = getAvatarImage(avatarCode);
  const regionName = trainer.active_region?.name || trainer.active_region_name || profile.region_name || "Kanto";
  const currentZone = adventure.current_zone?.name || "-";
  const nextGymName = gyms.next_gym?.name || progress.next_gym?.name || "-";
  const trainerLevel = trainer.trainer_level || 1;
  const trainerExp = trainer.trainer_exp || 0;
  const nextLevelExp = trainer.next_level_exp || 1000;
  const expPct = progressPct(trainerExp, nextLevelExp);
  const teamPower = summaryTeam.power_score || 0;
  const ownedSpecies = collection.total_owned || milestones.collection_owned || 0;
  const shinyOwned = collection.shiny_owned || 0;
  const completion = collection.completion_pct ?? progress.current_region_completion_pct ?? 0;
  const completedGyms = progress.completed_gyms || 0;
  const totalGyms = gyms.total_gyms || 0;
  const pendingTrade = alerts.pending_trade_count || 0;
  const rewards = alerts.unclaimed_rewards_count || 0;
  const mission = buildMainMission({ currentZone, nextGymName, regionName, teamPower });
  const liveFeed = buildLiveFeed({ regionName, currentZone, nextGymName, rewards, pendingTrade, ownedSpecies });
  const quickAlerts = buildAlertCards({
    rewards,
    pendingTrade,
    currentZone,
    nextGymName,
    membersCount: members.length,
  });
  const featuredParty = members.slice(0, 3);
  const reserveParty = members.slice(3, 6);

  refs.appContent.innerHTML = `
    <section class="home-live-strip section-card">
      <span class="eyebrow">Live feed</span>
      <div class="home-live-track">
        ${liveFeed.map((item) => `<span class="home-live-item">${escapeHtml(item)}</span>`).join("")}
      </div>
    </section>

    <section class="home-hub-shell section-card">
      <div class="home-hub-layout">
        <aside class="home-pilot-panel">
          <div class="home-pilot-top">
            <div class="home-avatar-frame">
              <img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(displayName)}" onerror="onAvatarImageError(this)">
            </div>
            <div class="home-pilot-copy">
              <span class="eyebrow">Trainer hub</span>
              <h1>${escapeHtml(displayName)}</h1>
              <div class="home-pilot-tags">
                <span class="pill">${escapeHtml(teamToneLabel(trainer.team || profile.trainer_team || "neutral"))}</span>
                <span class="pill">${escapeHtml(regionName)}</span>
                <span class="pill">Lv ${escapeHtml(formatNumber(trainerLevel))}</span>
              </div>
            </div>
          </div>

          <div class="home-profile-stats">
            <article>
              <span>Power</span>
              <strong>${escapeHtml(formatNumber(teamPower))}</strong>
            </article>
            <article>
              <span>Dex</span>
              <strong>${escapeHtml(formatNumber(ownedSpecies))}</strong>
            </article>
            <article>
              <span>Badges</span>
              <strong>${escapeHtml(formatNumber(completedGyms))}/${escapeHtml(formatNumber(totalGyms))}</strong>
            </article>
          </div>

          <div class="home-level-panel">
            <div class="home-level-copy">
              <span>Trainer XP</span>
              <strong>${escapeHtml(formatNumber(trainerExp))} / ${escapeHtml(formatNumber(nextLevelExp))}</strong>
            </div>
            <div class="home-exp-bar"><div class="home-exp-fill" style="width:${expPct}%"></div></div>
          </div>

          <div class="home-wallet-strip">
            ${wallets.slice(0, 3).map((wallet) => `
              <article class="home-wallet-pill">
                <span>${escapeHtml(walletLabel(wallet))}</span>
                <strong>${escapeHtml(formatNumber(wallet.balance || 0))}</strong>
              </article>`).join("")}
          </div>
        </aside>

        <section class="home-command-stage">
          <div class="home-mission-card">
            <div class="home-mission-copy">
              <span class="eyebrow">${escapeHtml(mission.eyebrow)}</span>
              <small>${escapeHtml(mission.subtitle)}</small>
              <h2>${escapeHtml(mission.title)}</h2>
              <p>${escapeHtml(mission.body)}</p>
            </div>
            <div class="hero-actions">
              <button class="primary-btn" type="button" data-go-target="${escapeHtml(mission.primary.target)}">${escapeHtml(mission.primary.label)}</button>
              <button class="soft-btn" type="button" data-go-target="${escapeHtml(mission.secondary.target)}">${escapeHtml(mission.secondary.label)}</button>
            </div>
          </div>

          <div class="home-party-stage">
            <div class="section-head home-mini-head">
              <div>
                <h2>Active party</h2>
                <p>Tus Pokémon principales deberían verse aquí primero.</p>
              </div>
              <button class="soft-btn" type="button" data-go-target="team">Abrir team</button>
            </div>
            <div class="home-party-grid">
              ${featuredParty.length ? featuredParty.map((member, index) => `
                <article class="home-party-card ${index === 0 ? "is-featured" : ""}">
                  <span class="home-slot-id">#${index + 1}</span>
                  <img src="${escapeHtml(getPokemonSprite(member))}" alt="${escapeHtml(member.display_name || member.name || "Pokemon")}" onerror="onPokemonImageError(this)">
                  <strong>${escapeHtml(member.display_name || member.name || "Pokemon")}</strong>
                  <small>Lv ${escapeHtml(formatNumber(member.level || 1))}</small>
                  <div class="home-party-bars">
                    <span class="home-stat-line"><i style="width:${escapeHtml(String(progressPct(member.current_hp || member.hp || 0, member.max_hp || member.hp || 1)))}%"></i></span>
                    <span class="home-stat-line home-stat-line-xp"><i style="width:${escapeHtml(String(progressPct(member.exp || 0, member.next_level_exp || 100)))}%"></i></span>
                  </div>
                </article>`).join("") : `
                <div class="placeholder-card home-party-empty">
                  <strong>Tu party todavía no está montada.</strong>
                  <p>Captura especies y arma tus primeros slots activos.</p>
                </div>`}
            </div>
            <div class="home-reserve-row">
              ${reserveParty.length ? reserveParty.map((member, index) => `
                <article class="home-reserve-card">
                  <img src="${escapeHtml(getPokemonSprite(member))}" alt="${escapeHtml(member.display_name || member.name || "Pokemon")}" onerror="onPokemonImageError(this)">
                  <div>
                    <strong>#${featuredParty.length + index + 1} ${escapeHtml(member.display_name || member.name || "Pokemon")}</strong>
                    <small>Lv ${escapeHtml(formatNumber(member.level || 1))}</small>
                  </div>
                </article>`).join("") : `<span class="home-reserve-empty">Completa más slots para que la party tenga profundidad.</span>`}
            </div>
          </div>
        </section>
      </div>
    </section>

    <section class="home-grid-shell">
      <section class="section-card home-quick-grid">
        <div class="section-head home-mini-head">
          <div>
            <h2>Quick actions</h2>
            <p>Menos lectura. Más decisiones rápidas.</p>
          </div>
        </div>
        <div class="home-quick-actions">
          <button class="home-action-tile is-primary" type="button" data-go-target="adventure">
            <span>Map</span>
            <strong>Continue adventure</strong>
          </button>
          <button class="home-action-tile" type="button" data-go-target="collection">
            <span>Dex</span>
            <strong>Open collection</strong>
          </button>
          <button class="home-action-tile" type="button" data-go-target="shop">
            <span>Mart</span>
            <strong>Buy items</strong>
          </button>
          <button class="home-action-tile" type="button" data-go-target="gyms">
            <span>Gym</span>
            <strong>View route</strong>
          </button>
        </div>
      </section>

      <section class="section-card home-alert-shell">
        <div class="section-head home-mini-head">
          <div>
            <h2>Now</h2>
            <p>Lo urgente y útil, sin llenar toda la pantalla de texto.</p>
          </div>
        </div>
        <div class="home-now-grid">
          ${quickAlerts.map((card, index) => `
            <article class="home-now-card tone-${escapeHtml(card.tone)}">
              <strong>${escapeHtml(card.title)}</strong>
              <p>${escapeHtml(card.text)}</p>
              <button class="soft-btn" type="button" data-home-alert="${index}">${escapeHtml(card.action)}</button>
            </article>`).join("")}
        </div>
      </section>

      <aside class="section-card home-side-metrics">
        <div class="section-head home-mini-head">
          <div>
            <h2>Progress</h2>
            <p>Estado general del entrenador.</p>
          </div>
        </div>
        <div class="home-metric-stack">
          <article class="home-metric-box">
            <span>Completion</span>
            <strong>${escapeHtml(formatNumber(completion))}%</strong>
          </article>
          <article class="home-metric-box">
            <span>Shiny</span>
            <strong>${escapeHtml(formatNumber(shinyOwned))}</strong>
          </article>
          <article class="home-metric-box">
            <span>Region</span>
            <strong>${escapeHtml(regionName)}</strong>
          </article>
          <article class="home-metric-box">
            <span>House</span>
            <strong>${houseLabel(milestones)}</strong>
          </article>
        </div>
      </aside>
    </section>`;

  refs.appContent.querySelectorAll("[data-go-target]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.getAttribute("data-go-target") || "home"));
  });

  refs.appContent.querySelectorAll("[data-home-alert]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = quickAlerts[Number(button.getAttribute("data-home-alert"))];
      if (card) openQuickModal(card);
    });
  });
}

function houseLabel(milestones = {}) {
  const capacity = milestones.next_house_upgrade?.storage_capacity;
  if (!capacity) return "Base";
  return `${formatNumber(capacity)} slots`;
}
