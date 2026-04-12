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

function walletLabel(wallet = {}) {
  return wallet.name || wallet.display_name || wallet.code || "Wallet";
}

function navigate(target) {
  document.querySelector(`[data-nav="${target}"]`)?.click();
}

function buildContinueAction({ regionName, currentZone, nextGymName, nextActionLabel, teamPower }) {
  if (!currentZone || currentZone === "-") {
    return {
      eyebrow: "Nueva ruta",
      title: `Entra a ${regionName}`,
      body: "Tu aventura está lista para arrancar. Abre la región activa y carga tu primera zona para empezar a capturar.",
      cta: tr("home.continue"),
      target: "adventure",
    };
  }

  return {
    eyebrow: "Siguiente paso",
    title: `${nextActionLabel || tr("home.continue")} en ${currentZone}`,
    body: `Tu región activa es ${regionName}. Tu siguiente meta visible es ${nextGymName} y tu equipo ya suma ${formatNumber(teamPower)} de poder.`,
    cta: tr("home.continue"),
    target: "adventure",
  };
}

function buildAlertCards({
  alerts = {},
  tradeSummary = {},
  members = [],
  nextGymName,
  currentZone,
  regionName,
}) {
  const items = [];

  if ((alerts.unclaimed_rewards_count || 0) > 0) {
    items.push({
      tone: "reward",
      eyebrow: "Recompensas",
      title: `${formatNumber(alerts.unclaimed_rewards_count)} recompensa(s) listas`,
      summary: "Tienes progreso esperando ser reclamado antes de volver a salir.",
      actionLabel: "Ver detalles",
      modalBody: `
        <p>Tienes recompensas pendientes por reclamar. La idea en V2 es que este bloque te empuje a cobrar rápido y volver a jugar.</p>
        <p>Mientras cerramos el flujo completo de claim, esta alerta ya te marca que hay valor detenido.</p>`,
      target: "home",
    });
  }

  if (alerts.idle_ready) {
    items.push({
      tone: "reward",
      eyebrow: "Idle",
      title: "Tu recompensa idle está lista",
      summary: "Hay progreso pasivo esperando para volver a meterlo al loop principal.",
      actionLabel: "Entendido",
      modalBody: `
        <p>El idle debería alimentar tu progreso sin sacarte del flujo principal.</p>
        <p>Esta alerta existe para que el jugador sienta que siempre hay algo útil que revisar al volver al hub.</p>`,
      target: "home",
    });
  }

  if ((alerts.pending_trade_count || 0) > 0) {
    items.push({
      tone: "social",
      eyebrow: "Trade",
      title: `${formatNumber(alerts.pending_trade_count)} oferta(s) tuyas siguen abiertas`,
      summary: "Puedes revisar si te conviene mantenerlas, editarlas o volver a publicar.",
      actionLabel: "Abrir trade",
      modalBody: `
        <p>Tienes ofertas abiertas en trade. Conviene revisarlas para no dejar movimientos viejos compitiendo con tu progreso actual.</p>
        <p>Desde aquí deberías poder volver al mercado en un toque.</p>`,
      target: "trade",
    });
  }

  if ((tradeSummary.market_open_offers || 0) > 0) {
    items.push({
      tone: "social",
      eyebrow: "Mercado",
      title: `${formatNumber(tradeSummary.market_open_offers)} oferta(s) visibles`,
      summary: "Hay movimiento en el mercado y podrías encontrar un intercambio útil.",
      actionLabel: "Explorar mercado",
      modalBody: `
        <p>El mercado tiene ofertas activas. Este tipo de alerta le da vida al hub y evita que Trade quede escondido.</p>
        <p>Úsalo cuando quieras buscar mejoras, variantes o completar colección.</p>`,
      target: "trade",
    });
  }

  if (members.length < 3) {
    items.push({
      tone: "warning",
      eyebrow: "Equipo",
      title: "Tu equipo todavía está corto",
      summary: "Conviene completar más slots antes de empujar gyms o zonas nuevas.",
      actionLabel: "Editar equipo",
      modalBody: `
        <p>Tu equipo activo todavía no tiene suficiente profundidad para sostener bien la progresión.</p>
        <p>Captura más Pokémon y arma una base más sólida antes de subir la dificultad.</p>`,
      target: "team",
    });
  }

  if (!currentZone || currentZone === "-") {
    items.push({
      tone: "info",
      eyebrow: "Aventura",
      title: `Todavía no has cargado una zona en ${regionName}`,
      summary: "Entra a Adventure y abre una ruta para activar el loop de captura.",
      actionLabel: "Ir a Adventure",
      modalBody: `
        <p>Tu siguiente paso real es abrir el mapa y cargar una zona de aventura.</p>
        <p>Desde ahí el jugador debe caminar, disparar encuentros y volver al hub con progreso nuevo.</p>`,
      target: "adventure",
    });
  } else if (nextGymName && nextGymName !== "-") {
    items.push({
      tone: "goal",
      eyebrow: "Meta",
      title: `Tu siguiente gym es ${nextGymName}`,
      summary: `La ruta actual te está preparando para llegar mejor armado a ${nextGymName}.`,
      actionLabel: "Ver gyms",
      modalBody: `
        <p>Tu siguiente gym objetivo es <strong>${escapeHtml(nextGymName)}</strong>.</p>
        <p>La mejor lectura para el jugador es: seguir capturando, reforzar equipo y luego mirar la escalera de insignias.</p>`,
      target: "gyms",
    });
  }

  if (!items.length) {
    items.push({
      tone: "calm",
      eyebrow: "Estado",
      title: "Todo está en calma",
      summary: "No hay urgencias bloqueando tu progreso. El mejor siguiente paso es continuar la aventura.",
      actionLabel: tr("home.continue"),
      modalBody: `
        <p>No tienes alertas críticas activas.</p>
        <p>La mejor acción ahora es volver al mapa, buscar encuentros y empujar tu progreso regional.</p>`,
      target: "adventure",
    });
  }

  return items;
}

function openHubModal(card) {
  openAppModal({
    eyebrow: card.eyebrow,
    title: card.title,
    body: card.modalBody,
    actions: [
      {
        label: card.actionLabel || "Continuar",
        kind: "primary",
        onClick: () => navigate(card.target || "home"),
      },
      {
        label: "Cerrar",
        kind: "soft",
      },
    ],
  });
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
  const homeAlerts = state.homeAlerts || home.alerts || {};
  const tradeSummary = state.tradeSummary || {};

  const displayName = trainer.display_name || profile.display_name || profile.username || state.user?.display_name || tr("common.trainer");
  const avatarSrc = profile.photo_url || trainer.avatar_url || getAvatarImage(profile.avatar_code || trainer.avatar_code || state.selectedAvatarCode || "steven");
  const regionName = trainer.active_region?.name || trainer.active_region_name || profile.region_name || "Kanto";
  const currentZone = adventure.current_zone?.name || "-";
  const nextGymName = gyms.next_gym?.name || progress.next_gym?.name || "-";
  const completion = collection.completion_pct ?? progress.current_region_completion_pct ?? 0;
  const trainerLevel = trainer.trainer_level || 1;
  const trainerExp = trainer.trainer_exp || 0;
  const nextLevelExp = trainer.next_level_exp || 1000;
  const expPct = progressPct(trainerExp, nextLevelExp);
  const teamPower = summaryTeam.power_score || 0;
  const unlockedZones = progress.unlocked_zones || 0;
  const completedGyms = progress.completed_gyms || 0;
  const shinyOwned = collection.shiny_owned || 0;
  const ownedSpecies = collection.total_owned || milestones.collection_owned || 0;
  const houseNext = milestones.next_house_upgrade?.storage_capacity || null;
  const nextActionLabel = adventure.next_action?.label || tr("home.continue");
  const continueAction = buildContinueAction({ regionName, currentZone, nextGymName, nextActionLabel, teamPower });
  const alertCards = buildAlertCards({
    alerts: homeAlerts,
    tradeSummary,
    members,
    nextGymName,
    currentZone,
    regionName,
  });
  const favoriteMember = members[0] || null;
  const socialCards = [
    {
      eyebrow: "Ranking",
      value: state.rankingSummary?.trainer_ranking?.position ? `#${state.rankingSummary.trainer_ranking.position}` : "Sin rango",
      text: "Tu posición de prestigio se irá reforzando con colección, progreso y equipo.",
      cta: "Abrir ranking",
      target: "ranking",
    },
    {
      eyebrow: "Trade",
      value: formatNumber(homeAlerts.pending_trade_count || 0),
      text: "Ofertas tuyas todavía abiertas en el mercado actual.",
      cta: "Abrir trade",
      target: "trade",
    },
    {
      eyebrow: "Rareza",
      value: shinyOwned ? `${formatNumber(shinyOwned)} shiny` : (favoriteMember?.display_name || favoriteMember?.name || "Sin destacado"),
      text: shinyOwned
        ? "Tu colección ya tiene variantes raras listas para presumir."
        : "Todavía puedes conseguir una captura destacada para dar identidad al perfil.",
      cta: shinyOwned ? "Ver colección" : tr("home.continue"),
      target: shinyOwned ? "collection" : "adventure",
    },
  ];

  refs.appContent.innerHTML = `
    <section class="home-hub-hero section-card">
      <div class="home-hub-grid">
        <div class="home-identity-card">
          <span class="eyebrow">Trainer Hub</span>
          <div class="home-identity-head">
            <img class="home-avatar home-avatar-lg" src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(displayName)}" onerror="onAvatarImageError(this)">
            <div class="home-identity-copy">
              <h1>${escapeHtml(displayName)}</h1>
              <p>Tu centro de mando ya debería decirte qué sigue, qué está listo y a dónde volver para seguir progresando.</p>
              <div class="home-identity-pills">
                <span class="home-kpi-chip"><strong>${escapeHtml(teamToneLabel(trainer.team || profile.trainer_team || "neutral"))}</strong> team</span>
                <span class="home-kpi-chip">${escapeHtml(tr("home.region"))}: <strong>${escapeHtml(regionName)}</strong></span>
                <span class="home-kpi-chip">${escapeHtml(tr("home.nextGym"))}: <strong>${escapeHtml(nextGymName)}</strong></span>
              </div>
            </div>
          </div>
          <div class="home-command-stats">
            <article class="home-command-stat">
              <span>Nivel</span>
              <strong>${escapeHtml(formatNumber(trainerLevel))}</strong>
              <small>Estado base del entrenador.</small>
            </article>
            <article class="home-command-stat">
              <span>Capturados</span>
              <strong>${escapeHtml(formatNumber(ownedSpecies))}</strong>
              <small>Especies ya registradas en tu colección.</small>
            </article>
            <article class="home-command-stat">
              <span>Insignias</span>
              <strong>${escapeHtml(formatNumber(completedGyms))}</strong>
              <small>Gyms superados en tu progreso actual.</small>
            </article>
            <article class="home-command-stat">
              <span>Trade</span>
              <strong>${escapeHtml(formatNumber(homeAlerts.pending_trade_count || 0))}</strong>
              <small>Movimientos sociales todavía activos.</small>
            </article>
          </div>
          <div class="home-exp-shell">
            <div class="home-exp-top">
              <span>EXP de entrenador</span>
              <strong>${escapeHtml(formatNumber(trainerExp))} / ${escapeHtml(formatNumber(nextLevelExp))}</strong>
            </div>
            <div class="home-exp-bar"><div class="home-exp-fill" style="width:${expPct}%"></div></div>
          </div>
        </div>

        <aside class="home-continue-card">
          <span class="eyebrow">${escapeHtml(continueAction.eyebrow)}</span>
          <h2>${escapeHtml(continueAction.title)}</h2>
          <p>${escapeHtml(continueAction.body)}</p>
          <div class="home-continue-route">
            <article>
              <span>${escapeHtml(tr("home.region"))}</span>
              <strong>${escapeHtml(regionName)}</strong>
            </article>
            <article>
              <span>${escapeHtml(tr("home.currentZone"))}</span>
              <strong>${escapeHtml(currentZone)}</strong>
            </article>
            <article>
              <span>Ruta activa</span>
              <strong>${escapeHtml(formatNumber(unlockedZones))} zonas</strong>
            </article>
            <article>
              <span>${escapeHtml(tr("home.teamPower"))}</span>
              <strong>${escapeHtml(formatNumber(teamPower))}</strong>
            </article>
          </div>
          <div class="hero-actions home-hero-actions">
            <button class="primary-btn" type="button" id="goAdventure">${escapeHtml(continueAction.cta)}</button>
            <button class="soft-btn" type="button" id="viewGoal">${escapeHtml(tr("home.nextGym"))}</button>
          </div>
        </aside>
      </div>
    </section>

    <section class="home-command-board">
      <div class="home-main-stack">
        <section class="section-card home-team-snapshot">
          <div class="section-head">
            <div>
              <h2>${escapeHtml(tr("home.team"))}</h2>
              <p>Tu equipo activo debe sentirse presente y listo para editar o reforzar según tu progreso.</p>
            </div>
            <button class="soft-btn" type="button" id="goTeam">${escapeHtml(tr("home.openTeam"))}</button>
          </div>
          <div class="home-team-grid">
            ${members.length ? members.map((member) => `
              <article class="home-team-slot">
                <div class="home-team-sprite">
                  <img src="${escapeHtml(getPokemonSprite(member))}" alt="${escapeHtml(member.display_name || member.name || "Pokemon")}" onerror="onPokemonImageError(this)">
                </div>
                <strong>${escapeHtml(member.display_name || member.name || "Pokemon")}</strong>
                <small>${escapeHtml(tr("common.levelShort"))} ${escapeHtml(formatNumber(member.level || 1))}</small>
                <span class="pill">${escapeHtml(member.variant || (member.is_shiny ? "shiny" : "normal"))}</span>
              </article>`).join("") : `
              <div class="placeholder-card home-empty-state">
                <strong>${escapeHtml(tr("home.noTeam"))}</strong>
                <p>Captura más Pokémon y arma una base sólida para que el hub se sienta realmente vivo.</p>
              </div>`}
          </div>
        </section>

        <section class="section-card home-progress-panel">
          <div class="section-head">
            <div>
              <h2>${escapeHtml(tr("home.journey"))}</h2>
              <p>Este rail debe decirle al jugador qué tan cerca está de su siguiente hito importante.</p>
            </div>
          </div>
          <div class="home-progress-rail">
            <article class="home-progress-card is-goal">
              <span>${escapeHtml(tr("home.nextGym"))}</span>
              <strong>${escapeHtml(nextGymName)}</strong>
              <small>Tu siguiente escalón de campaña visible.</small>
            </article>
            <article class="home-progress-card">
              <span>${escapeHtml(tr("home.completion"))}</span>
              <strong>${escapeHtml(formatNumber(completion))}%</strong>
              <small>Progreso general de colección y descubrimiento.</small>
            </article>
            <article class="home-progress-card">
              <span>Casa</span>
              <strong>${houseNext ? `${escapeHtml(formatNumber(houseNext))} slots` : "Base"}</strong>
              <small>${houseNext ? "Siguiente milestone de storage detectado." : "Aún no hay mejora siguiente expuesta."}</small>
            </article>
            <article class="home-progress-card">
              <span>Ruta regional</span>
              <strong>${escapeHtml(formatNumber(completedGyms))}/${escapeHtml(formatNumber(gyms.total_gyms || 0))}</strong>
              <small>Insignias limpias dentro de la región activa.</small>
            </article>
          </div>
        </section>

        <section class="section-card home-alerts-panel">
          <div class="section-head">
            <div>
              <h2>${escapeHtml(tr("home.alerts"))}</h2>
              <p>Alertas prácticas, con intención clara y modals amigables para no dejar al jugador perdido.</p>
            </div>
          </div>
          <div class="home-alerts-grid">
            ${alertCards.map((card, index) => `
              <article class="home-alert-card home-alert-${escapeHtml(card.tone)}">
                <span class="eyebrow">${escapeHtml(card.eyebrow)}</span>
                <strong>${escapeHtml(card.title)}</strong>
                <p>${escapeHtml(card.summary)}</p>
                <button class="soft-btn home-inline-action" type="button" data-home-alert="${index}">${escapeHtml(card.actionLabel)}</button>
              </article>`).join("")}
          </div>
        </section>
      </div>

      <aside class="home-side-stack">
        <section class="section-card home-wallets-panel">
          <div class="section-head">
            <div>
              <h2>${escapeHtml(tr("home.wallets"))}</h2>
              <p>Tus monedas deben ser visibles y fáciles de leer para apoyar el loop principal.</p>
            </div>
            <button class="soft-btn" type="button" id="goShop">${escapeHtml(tr("home.openShop"))}</button>
          </div>
          <div class="wallet-grid">
            ${wallets.length ? wallets.map((wallet) => `
              <article class="wallet-card">
                <span>${escapeHtml(walletLabel(wallet))}</span>
                <strong>${escapeHtml(formatNumber(wallet.balance || 0))}</strong>
                <small>${escapeHtml((wallet.code || "").toUpperCase() || "Balance")}</small>
              </article>`).join("") : `<div class="placeholder-card">${escapeHtml(tr("home.walletsEmpty"))}</div>`}
          </div>
        </section>

        <section class="section-card home-goals-panel">
          <div class="section-head">
            <div>
              <h2>Objetivos actuales</h2>
              <p>Un buen hub no solo resume, también te orienta hacia la próxima acción valiosa.</p>
            </div>
          </div>
          <div class="home-goals-list">
            <article class="home-goal-card">
              <span class="eyebrow">Continue</span>
              <strong>${escapeHtml(continueAction.title)}</strong>
              <p>${escapeHtml(continueAction.body)}</p>
              <button class="primary-btn" type="button" data-go-target="adventure">${escapeHtml(tr("home.continue"))}</button>
            </article>
            <article class="home-goal-card">
              <span class="eyebrow">Team</span>
              <strong>Refuerza tu base antes del gym</strong>
              <p>Si tu equipo todavía está corto o disparejo, este es el mejor momento para ajustarlo.</p>
              <button class="soft-btn" type="button" data-go-target="team">${escapeHtml(tr("home.openTeam"))}</button>
            </article>
            <article class="home-goal-card">
              <span class="eyebrow">Ruta</span>
              <strong>${escapeHtml(nextGymName)}</strong>
              <p>Tu siguiente meta visible dentro de la campaña regional.</p>
              <button class="soft-btn" type="button" data-go-target="gyms">${escapeHtml(tr("home.openGyms"))}</button>
            </article>
          </div>
        </section>

        <section class="section-card home-social-panel">
          <div class="section-head">
            <div>
              <h2>Prestige & social</h2>
              <p>El perfil también necesita estatus, rareza y señales de actividad fuera del mapa.</p>
            </div>
          </div>
          <div class="home-social-list">
            ${socialCards.map((card) => `
              <article class="home-social-card">
                <span>${escapeHtml(card.eyebrow)}</span>
                <strong>${escapeHtml(card.value)}</strong>
                <p>${escapeHtml(card.text)}</p>
                <button class="soft-btn" type="button" data-go-target="${escapeHtml(card.target)}">${escapeHtml(card.cta)}</button>
              </article>`).join("")}
          </div>
        </section>
      </aside>
    </section>`;

  document.getElementById("goAdventure")?.addEventListener("click", () => navigate("adventure"));
  document.getElementById("goTeam")?.addEventListener("click", () => navigate("team"));
  document.getElementById("goShop")?.addEventListener("click", () => navigate("shop"));
  document.getElementById("viewGoal")?.addEventListener("click", () => openAppModal({
    eyebrow: "Campaign",
    title: `Tu siguiente gym es ${nextGymName}`,
    body: `
      <p>La lectura ideal del Home V2 es simple: sabes quién eres, dónde vas y qué debes hacer ahora.</p>
      <p>Tu siguiente meta visible es <strong>${escapeHtml(nextGymName)}</strong>. Sigue capturando en <strong>${escapeHtml(currentZone)}</strong> y ajusta tu equipo antes de subir la dificultad.</p>`,
    actions: [
      { label: tr("home.openGyms"), kind: "primary", onClick: () => navigate("gyms") },
      { label: tr("home.continue"), kind: "soft", onClick: () => navigate("adventure") },
    ],
  }));

  refs.appContent.querySelectorAll("[data-home-alert]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = alertCards[Number(button.getAttribute("data-home-alert"))];
      if (card) openHubModal(card);
    });
  });

  refs.appContent.querySelectorAll("[data-go-target]").forEach((button) => {
    button.addEventListener("click", () => {
      navigate(button.getAttribute("data-go-target") || "home");
    });
  });
}
