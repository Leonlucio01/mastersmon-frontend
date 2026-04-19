import type { OnboardingData, PlayerPokemon, TeamSlot, ViewKey } from '../types/models';
import { sessionStore } from '../store/session';
import { playerStore } from '../store/player';
import { renderGoogleButton, fetchAuthMe, logout } from '../services/auth';
import { getMe, getMyItems, getMyPokemon, getMyTeam, getOnboarding, getPokemonMoves, getTrainerSetup, markOnboardingWelcome, saveMyTeam } from '../services/player';
import { startArena, claimArenaVictory } from '../services/battle';
import { generateEncounter, getPresence, getZones, tryCapture, updatePresence } from '../services/maps';
import { getGymCatalog, getGymProgress, startGym, claimGymReward } from '../services/gyms';
import { getBossRanking, getBossState, getIdleState, startBoss, startIdle, claimBossReward, claimIdle } from '../services/bossIdle';
import { buyItem, getItemShop } from '../services/shop';
import { getPaymentsCatalog } from '../services/payments';
import { getRankingSummary } from '../services/ranking';
import { getPokemonCardImage } from '../utils/pokeSprites';
import { getAvatarAsset, getBadgeAsset, getItemAsset, getScenarioBackdrop, getTrainerAsset } from '../utils/gameAssets';
import { showToast, escapeHtml } from './toast';

interface ShellRefs {
  panelRoot: HTMLElement;
  playerMiniCard: HTMLElement;
  viewTitle: HTMLElement;
  viewSubtitle: HTMLElement;
  onNavigate: (view: ViewKey) => void;
  refreshShell: () => void;
}

const sceneMeta: Record<ViewKey, { title: string; subtitle: string }> = {
  home: { title: 'Home', subtitle: 'Tu hub principal y acceso rápido al juego' },
  pokemon: { title: 'My Pokémon', subtitle: 'Caja, stats, rareza, shiny y movimientos' },
  team: { title: 'Team', subtitle: 'Arma tu equipo principal de 1 a 6 Pokémon' },
  arena: { title: 'Arena', subtitle: 'Sesiones rápidas de combate y recompensa' },
  onboarding: { title: 'Onboarding', subtitle: 'Tu progreso de primeras misiones y recompensas' },
  maps: { title: 'Maps', subtitle: 'Zonas, presencia online, encuentros y captura' },
  gyms: { title: 'Gyms', subtitle: 'Progreso por región, roster rival y medallas' },
  bossIdle: { title: 'Boss / Idle', subtitle: 'Evento diario y auto-farm con hora Lima' },
  shop: { title: 'Shop', subtitle: 'Tienda por pokedólares y vista premium' },
  ranking: { title: 'Ranking', subtitle: 'Entrenadores, Pokémon top y daño al boss' }
};

export async function renderView(view: ViewKey, refs: ShellRefs): Promise<void> {
  const meta = sceneMeta[view];
  refs.viewTitle.textContent = meta.title;
  refs.viewSubtitle.textContent = meta.subtitle;
  await refreshPlayerMini(refs.playerMiniCard);

  switch (view) {
    case 'home':
      await renderHomeV2(refs);
      return;
    case 'pokemon':
      await renderPokemon(refs);
      return;
    case 'team':
      await renderTeam(refs);
      return;
    case 'arena':
      await renderArena(refs);
      return;
    case 'onboarding':
      await renderOnboarding(refs);
      return;
    case 'maps':
      await renderMaps(refs);
      return;
    case 'gyms':
      await renderGyms(refs);
      return;
    case 'bossIdle':
      await renderBossIdle(refs);
      return;
    case 'shop':
      await renderShop(refs);
      return;
    case 'ranking':
      await renderRanking(refs);
      return;
  }
}

export async function refreshPlayerMini(target: HTMLElement): Promise<void> {
  const user = sessionStore.getUser();
  if (!user) {
    target.innerHTML = '<div class="player-mini"><div class="avatar-dot">?</div><div><strong>Invitado</strong><small>Inicia sesión para continuar</small></div></div>';
    return;
  }
  target.innerHTML = `
    <div class="player-mini">
      ${user.foto ? `<img src="${escapeHtml(user.foto)}" alt="${escapeHtml(user.nombre)}" />` : `<div class="avatar-dot">${escapeHtml((user.nombre || 'M').charAt(0).toUpperCase())}</div>`}
      <div>
        <strong>${escapeHtml(user.nombre)}</strong>
        <small>${formatNumber(user.pokedolares || 0)} Pokédolares</small>
      </div>
    </div>`;
}

async function renderHome(refs: ShellRefs): Promise<void> {
  const root = refs.panelRoot;

  if (!sessionStore.isAuthenticated()) {
    root.innerHTML = `
      <section class="section-card">
        <h3>Comienza tu aventura</h3>
        <p>Accede con tu cuenta para cargar tu equipo, tu caja y el progreso de tu partida.</p>
        <div id="google-login-slot" class="section-card"></div>
      </section>
      <section class="section-card">
        <h3>Modos destacados</h3>
        <div class="home-shortcuts-grid compact-shortcuts">
          ${renderHomeShortcutVisual('maps', 'Mapas', 'Explorar y capturar', null, '🗺️')}
          ${renderHomeShortcutVisual('arena', 'Arena', 'Combate rápido', null, '⚔️')}
          ${renderHomeShortcutVisual('gyms', 'Gyms', 'Retos regionales', null, '🏛️')}
          ${renderHomeShortcutVisual('bossIdle', 'Boss / Idle', 'Evento y farmeo', null, '👹')}
        </div>
      </section>
    `;

    const slot = document.getElementById('google-login-slot');
    if (slot) {
      renderGoogleButton(
        slot,
        async (result) => {
          showToast('Sesión iniciada', result.mensaje);
          await refs.refreshShell();
          refs.onNavigate('home');
        },
        (message) => showToast('Login', message)
      );
    }
    return;
  }

  const [me, trainerSetup, items, pokemon, team, onboarding, gymProgressRaw, bossStateRaw, idleStateRaw] = await Promise.all([
    getMe(),
    getTrainerSetup(),
    getMyItems(),
    getMyPokemon(),
    getMyTeam(),
    getOnboarding(),
    getGymProgress(),
    getBossState(),
    getIdleState()
  ]);

  sessionStore.setUser(me);
  playerStore.trainerSetup = trainerSetup;
  playerStore.items = items;
  playerStore.pokemon = pokemon;
  playerStore.team = team.equipo;
  playerStore.onboarding = onboarding;

  const gymProgress = gymProgressRaw as Record<string, unknown>;
  const bossState = bossStateRaw as Record<string, unknown>;
  const idleState = idleStateRaw as Record<string, unknown>;
  const homeState = resolveHomeState(onboarding, team.equipo, gymProgress, bossState, idleState);
  const nextGym = (gymProgress.siguiente_gym as Record<string, unknown> | null) || null;
  const idleSession = (idleState.sesion as Record<string, unknown> | null) || null;

  const regionCode = String(nextGym?.region_codigo || 'kanto').toLowerCase();
  const leaderName = String(nextGym?.lider_nombre || 'Siguiente gym');
  const badgeLabel = String(nextGym?.medalla_nombre || 'Badge');
  const badgeKey = normalizeAssetToken(badgeLabel).replace(/_badge$/i, '');

  const avatarAsset = getAvatarAsset(me.avatar_id || trainerSetup.avatar_id || null, me.foto || null);
  const trainerAsset = nextGym ? getTrainerAsset(regionCode, leaderName, nextGym?.trainer_asset_path as string | undefined) : null;
  const badgeAsset = nextGym ? getBadgeAsset(regionCode, badgeKey, nextGym?.badge_asset_path as string | undefined) : null;
  const mapAsset = getScenarioBackdrop(regionCode, resolveScenarioHint(leaderName, regionCode));
  const leadTeam = team.equipo[0] || null;
  const firstPokemon = pokemon[0] || null;
  const idleAsset = getItemAsset('booster_battle_exp_x2_24h') || getItemAsset('0004_poke-ball');

  root.innerHTML = `
    <section class="section-card">
      <h3>${escapeHtml(homeState.title)}</h3>
      <p>${escapeHtml(homeState.subtitle)}</p>
      <div class="row" style="margin-top: 1rem; gap: 0.75rem; flex-wrap: wrap;">
        <button data-go-view="${homeState.primaryView}">${escapeHtml(homeState.primaryLabel)}</button>
        ${homeState.secondaryView && homeState.secondaryLabel ? `<button class="secondary-button" data-go-view="${homeState.secondaryView}">${escapeHtml(homeState.secondaryLabel)}</button>` : ''}
      </div>
      <div class="stack home-badges" style="margin-top: 0.9rem;">
        ${homeState.badges.map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join('')}
      </div>
    </section>

    <section class="section-card">
      <h3>Resumen rápido</h3>
      <div class="home-summary-grid">
        ${renderHomeSummaryCard('Entrenador', me.nombre, trainerSetup.setup_completed ? 'Configurado' : 'Pendiente', avatarAsset, '👤')}
        ${renderHomeSummaryCard('Pokédolares', formatNumber(me.pokedolares || 0), 'Economía', null, '₽')}
        ${renderHomeSummaryCard('Pokémon', String(pokemon.length), 'Caja activa', firstPokemon ? getPokemonCardImage(firstPokemon.pokemon_id, firstPokemon.es_shiny, firstPokemon.imagen) : null, '🧬')}
        ${renderHomeSummaryCard('Equipo', `${team.equipo.length}/6`, 'Listo para combate', leadTeam ? getPokemonCardImage(leadTeam.pokemon_id, leadTeam.es_shiny, leadTeam.imagen) : null, '👥')}
        ${renderHomeSummaryCard('Onboarding', `${onboarding.progreso.porcentaje}%`, `${onboarding.progreso.completadas}/${onboarding.progreso.total} misiones`, null, '✨')}
      </div>
    </section>

    <section class="section-card">
      <h3>Estado actual</h3>
      <div class="home-state-grid">
        ${renderHomeStateTile('Gym', nextGym ? leaderName : 'Completados', nextGym ? badgeLabel : 'Todos listos', badgeAsset, '🏛️')}
        ${renderHomeStateTile('Boss', bossState.activo ? 'Activo' : 'En espera', bossState.activo ? `Termina en ${formatSecondsCompact(Number(bossState.segundos_para_fin || 0))}` : `Inicia en ${formatSecondsCompact(Number(bossState.segundos_para_inicio || 0))}`, null, '👹')}
        ${renderHomeStateTile('Idle', Boolean(idleState.activa) ? 'En curso' : 'Disponible', Boolean(idleState.activa) ? `${Number(idleSession?.progreso_pct || 0)}% · ${formatSecondsCompact(Number(idleSession?.segundos_restantes || 0))}` : 'Listo para iniciar', idleAsset, '⏱️')}
        ${renderHomeStateTile('Región', nextGym ? String(nextGym.region_codigo || regionCode).toUpperCase() : 'Libre', nextGym ? 'Ruta actual' : 'Elige tu objetivo', mapAsset, '🗺️')}
      </div>
    </section>

    <section class="section-card">
      <h3>Accesos rápidos</h3>
      <div class="home-shortcuts-grid compact-shortcuts">
        ${renderHomeShortcutVisual('pokemon', 'My Pokémon', 'Caja y evolución', firstPokemon ? getPokemonCardImage(firstPokemon.pokemon_id, firstPokemon.es_shiny, firstPokemon.imagen) : null, '🧬')}
        ${renderHomeShortcutVisual('team', 'Team', 'Armar equipo', leadTeam ? getPokemonCardImage(leadTeam.pokemon_id, leadTeam.es_shiny, leadTeam.imagen) : null, '👥')}
        ${renderHomeShortcutVisual('arena', 'Arena', 'Combate rápido', trainerAsset, '⚔️')}
        ${renderHomeShortcutVisual('maps', 'Maps', 'Explorar y capturar', mapAsset, '🗺️')}
        ${renderHomeShortcutVisual('gyms', 'Gyms', 'Progreso regional', badgeAsset, '🏛️')}
        ${renderHomeShortcutVisual('bossIdle', 'Boss / Idle', 'Evento y farmeo', idleAsset, '👹')}
      </div>
    </section>
  `;

  root.querySelectorAll('[data-go-view]').forEach((button) => {
    button.addEventListener('click', () => {
      refs.onNavigate((button as HTMLElement).dataset.goView as ViewKey);
    });
  });
}

async function renderHomeV2(refs: ShellRefs): Promise<void> {
  const root = refs.panelRoot;

  if (!sessionStore.isAuthenticated()) {
    root.innerHTML = `
      <section class="section-card">
        <h3>Comienza tu aventura</h3>
        <p>Accede con tu cuenta para cargar tu equipo, tu caja y el progreso de tu partida.</p>
        <div id="google-login-slot-v2" class="section-card"></div>
      </section>
      <section class="section-card">
        <h3>Comandos base</h3>
        <div class="home-shortcuts-grid compact-shortcuts">
          ${renderHomeShortcutVisual('maps', 'Mapas', 'Explorar y capturar', null, 'MAP')}
          ${renderHomeShortcutVisual('pokemon', 'My Pokemon', 'Caja y evolucion', null, 'DEX')}
          ${renderHomeShortcutVisual('arena', 'Arena', 'Combate rapido', null, 'PVP')}
          ${renderHomeShortcutVisual('gyms', 'Gyms', 'Retos regionales', null, 'GYM')}
        </div>
      </section>
    `;

    const slot = document.getElementById('google-login-slot-v2');
    if (slot) {
      renderGoogleButton(
        slot,
        async (result) => {
          showToast('Sesion iniciada', result.mensaje);
          await refs.refreshShell();
          refs.onNavigate('home');
        },
        (message) => showToast('Login', message)
      );
    }
    return;
  }

  const [me, trainerSetup, items, pokemon, team, onboarding, gymProgressRaw, bossStateRaw, idleStateRaw] = await Promise.all([
    getMe(),
    getTrainerSetup(),
    getMyItems(),
    getMyPokemon(),
    getMyTeam(),
    getOnboarding(),
    getGymProgress(),
    getBossState(),
    getIdleState()
  ]);

  sessionStore.setUser(me);
  playerStore.trainerSetup = trainerSetup;
  playerStore.items = items;
  playerStore.pokemon = pokemon;
  playerStore.team = team.equipo;
  playerStore.onboarding = onboarding;

  const gymProgress = gymProgressRaw as Record<string, unknown>;
  const bossState = bossStateRaw as Record<string, unknown>;
  const idleState = idleStateRaw as Record<string, unknown>;
  const orderedTeam = [...team.equipo].sort((a, b) => a.posicion - b.posicion);
  const homeState = resolveHomeState(onboarding, orderedTeam, gymProgress, bossState, idleState);
  const nextGym = (gymProgress.siguiente_gym as Record<string, unknown> | null) || null;
  const idleSession = (idleState.sesion as Record<string, unknown> | null) || null;

  const regionCode = String(nextGym?.region_codigo || 'kanto').toLowerCase();
  const leaderName = String(nextGym?.lider_nombre || 'Siguiente gym');
  const badgeLabel = String(nextGym?.medalla_nombre || 'Badge');
  const badgeKey = normalizeAssetToken(badgeLabel).replace(/_badge$/i, '');

  const avatarAsset = getAvatarAsset(me.avatar_id || trainerSetup.avatar_id || null, me.foto || null);
  const trainerAsset = nextGym ? getTrainerAsset(regionCode, leaderName, nextGym?.trainer_asset_path as string | undefined) : null;
  const badgeAsset = nextGym ? getBadgeAsset(regionCode, badgeKey, nextGym?.badge_asset_path as string | undefined) : null;
  const mapAsset = getScenarioBackdrop(regionCode, resolveScenarioHint(leaderName, regionCode));
  const leadTeam = orderedTeam[0] || null;
  const firstPokemon = pokemon[0] || null;
  const idleAsset = getItemAsset('booster_battle_exp_x2_24h') || getItemAsset('0004_poke-ball');
  const itemShowcase = items.slice(0, 3);
  const averageLevel = orderedTeam.length
    ? Math.round(orderedTeam.reduce((sum, slot) => sum + Number(slot.nivel || 0), 0) / orderedTeam.length)
    : 0;
  const teamPower = orderedTeam.reduce((sum, slot) => sum + Number(slot.ataque || 0) + Number(slot.ataque_especial || 0), 0);
  const activeRegion = nextGym ? String(nextGym.region_codigo || regionCode).toUpperCase() : 'FREE';

  const commandButtons = [
    {
      view: homeState.primaryView,
      label: homeState.primaryLabel,
      icon: homeState.primaryView === 'maps' ? 'MAP' : homeState.primaryView === 'team' ? 'TM' : homeState.primaryView === 'bossIdle' ? 'BOS' : homeState.primaryView === 'gyms' ? 'GYM' : 'GO',
      accent: 'is-primary'
    },
    homeState.secondaryView && homeState.secondaryLabel
      ? {
          view: homeState.secondaryView,
          label: homeState.secondaryLabel,
          icon: homeState.secondaryView === 'pokemon' ? 'DEX' : homeState.secondaryView === 'team' ? 'TM' : homeState.secondaryView === 'arena' ? 'PVP' : 'GO',
          accent: ''
        }
      : null,
    { view: 'pokemon' as ViewKey, label: 'My Pokemon', icon: 'DEX', accent: '' },
    { view: 'maps' as ViewKey, label: 'Maps', icon: 'MAP', accent: '' },
    { view: 'arena' as ViewKey, label: 'Arena', icon: 'PVP', accent: '' },
    { view: 'gyms' as ViewKey, label: 'Gyms', icon: 'GYM', accent: '' }
  ].filter(Boolean) as Array<{ view: ViewKey; label: string; icon: string; accent: string }>;

  root.innerHTML = `
    <section class="home-command-shell">
      <div class="home-hero-v2">
        <div class="home-identity-card">
          <div class="home-identity-head">
            ${avatarAsset ? `<img class="home-avatar-xl" src="${escapeHtml(avatarAsset)}" alt="${escapeHtml(me.nombre)}" />` : `<div class="home-avatar-xl home-avatar-xl--fallback">${escapeHtml((me.nombre || 'M').charAt(0).toUpperCase())}</div>`}
            <div>
              <p class="home-kicker">Tu centro de mando</p>
              <h3>${escapeHtml(me.nombre)}</h3>
              <div class="home-chip-row">
                <span class="badge">${escapeHtml(activeRegion)}</span>
                <span class="badge">${orderedTeam.length}/6 team</span>
                <span class="badge">${formatNumber(me.pokedolares || 0)} $</span>
                <span class="badge">${onboarding.progreso.porcentaje}% onboarding</span>
              </div>
            </div>
          </div>
          <p class="home-identity-copy">${escapeHtml(homeState.subtitle)}</p>
          <div class="home-command-actions">
            ${commandButtons.map((button) => renderHomeCommandButton(button.view, button.label, button.icon, button.accent)).join('')}
          </div>
        </div>

        <div class="home-focus-card">
          <p class="home-kicker">Foco actual</p>
          <h4>${escapeHtml(homeState.title)}</h4>
          <p>${escapeHtml(nextGym ? `${leaderName} sigue como siguiente objetivo, pero ahora el Home prioriza tu cuenta, equipo y ritmo de juego.` : homeState.subtitle)}</p>
          <div class="home-focus-art">
            ${trainerAsset ? `<img src="${escapeHtml(trainerAsset)}" alt="${escapeHtml(leaderName)}" />` : mapAsset ? `<img src="${escapeHtml(mapAsset)}" alt="${escapeHtml(activeRegion)}" />` : '<span class="home-focus-fallback">MM</span>'}
          </div>
          <div class="home-stat-stack">
            ${renderHomePanelMetric('Lv promedio', averageLevel ? `Lv ${averageLevel}` : 'Sin team', averageLevel ? 'base de combate' : 'arma tu equipo')}
            ${renderHomePanelMetric('Potencia', teamPower ? formatNumber(teamPower) : '0', 'ataque visible')}
            ${renderHomePanelMetric('Caja', formatNumber(pokemon.length), 'pokemon listos')}
          </div>
        </div>
      </div>

      <div class="home-team-strip">
        ${Array.from({ length: 6 }, (_, index) => renderHomeTeamSlot(orderedTeam[index] || null, index + 1)).join('')}
      </div>

      <div class="home-dashboard-grid">
        <section class="home-panel-card">
          <p class="home-kicker">Objetivo activo</p>
          <div class="home-objective-card">
            <div>
              <h4>${escapeHtml(homeState.title)}</h4>
              <p>${escapeHtml(homeState.subtitle)}</p>
            </div>
            <div class="home-chip-row">
              ${homeState.badges.map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join('')}
            </div>
          </div>
        </section>

        <section class="home-panel-card">
          <p class="home-kicker">Estado del mundo</p>
          <div class="home-state-grid home-state-grid--v2">
            ${renderHomeStateTile('Gym', nextGym ? leaderName : 'Libre', nextGym ? badgeLabel : 'Sin bloqueo', badgeAsset, 'GYM')}
            ${renderHomeStateTile('Boss', bossState.activo ? 'Activo' : 'En espera', bossState.activo ? `Cierra en ${formatSecondsCompact(Number(bossState.segundos_para_fin || 0))}` : `Abre en ${formatSecondsCompact(Number(bossState.segundos_para_inicio || 0))}`, null, 'BOS')}
            ${renderHomeStateTile('Idle', Boolean(idleState.activa) ? 'En curso' : 'Disponible', Boolean(idleState.activa) ? `${Number(idleSession?.progreso_pct || 0)}%` : 'Listo para iniciar', idleAsset, 'IDL')}
            ${renderHomeStateTile('Mapa', activeRegion, nextGym ? 'Ruta siguiente' : 'Exploracion libre', mapAsset, 'MAP')}
          </div>
        </section>

        <section class="home-panel-card">
          <p class="home-kicker">Inventario rapido</p>
          <div class="home-item-strip">
            ${itemShowcase.length
              ? itemShowcase
                  .map((item) => {
                    const asset = getItemAsset(item.item_codigo || null);
                    return `
                      <article class="home-item-chip">
                        <div class="home-item-chip__media">
                          ${asset ? `<img src="${escapeHtml(asset)}" alt="${escapeHtml(item.nombre)}" />` : `<span>${escapeHtml(String(item.nombre || 'IT').slice(0, 2).toUpperCase())}</span>`}
                        </div>
                        <div>
                          <strong>${escapeHtml(item.nombre)}</strong>
                          <small>x${formatNumber(item.cantidad || 0)}</small>
                        </div>
                      </article>
                    `;
                  })
                  .join('')
              : '<div class="empty-state">Todavia no hay items cargados en el inventario.</div>'}
          </div>
        </section>

        <section class="home-panel-card">
          <p class="home-kicker">Atajos del jugador</p>
          <div class="home-shortcuts-grid compact-shortcuts">
            ${renderHomeShortcutVisual('pokemon', 'My Pokemon', 'Caja, stats y evolucion', firstPokemon ? getPokemonCardImage(firstPokemon.pokemon_id, firstPokemon.es_shiny, firstPokemon.imagen) : null, 'DEX')}
            ${renderHomeShortcutVisual('team', 'Team', 'Tus 6 slots activos', leadTeam ? getPokemonCardImage(leadTeam.pokemon_id, leadTeam.es_shiny, leadTeam.imagen) : null, 'TM')}
            ${renderHomeShortcutVisual('arena', 'Arena', 'Combate rapido', trainerAsset, 'PVP')}
            ${renderHomeShortcutVisual('maps', 'Maps', 'Explorar y capturar', mapAsset, 'MAP')}
            ${renderHomeShortcutVisual('bossIdle', 'Boss / Idle', 'Evento y farmeo', idleAsset, 'BOS')}
            ${renderHomeShortcutVisual('shop', 'Shop', 'Items y premium', itemShowcase[0] ? getItemAsset(itemShowcase[0].item_codigo || null) : null, 'SHP')}
          </div>
        </section>
      </div>
    </section>
  `;

  root.querySelectorAll('[data-go-view]').forEach((button) => {
    button.addEventListener('click', () => {
      refs.onNavigate((button as HTMLElement).dataset.goView as ViewKey);
    });
  });
}

async function renderPokemon(refs: ShellRefs): Promise<void> {
  ensureAuthenticated(refs.panelRoot, refs.onNavigate);
  const pokemon = await getMyPokemon();
  playerStore.pokemon = pokemon;

  refs.panelRoot.innerHTML = `
    <section class="section-card">
      <h3>Colección</h3>
      <p>Tus Pokémon se renderizan con sprite remoto normal o shiny mientras decides si luego los llevas al repo local.</p>
      <div class="pokemon-grid">
        ${pokemon.length ? pokemon.map(renderPokemonCard).join('') : '<div class="empty-state">Aún no tienes Pokémon.</div>'}
      </div>
    </section>
  `;

  refs.panelRoot.querySelectorAll('[data-moves-for]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number((button as HTMLElement).dataset.movesFor || 0);
      if (!id) return;
      try {
        const result = await getPokemonMoves(id);
        showJsonModal(`Movimientos del Pokémon #${id}`, result, refs.panelRoot);
      } catch (error) {
        showToast('Movimientos', error instanceof Error ? error.message : 'No se pudieron cargar');
      }
    });
  });
}

async function renderTeam(refs: ShellRefs): Promise<void> {
  ensureAuthenticated(refs.panelRoot, refs.onNavigate);
  const [teamResult, pokemon] = await Promise.all([getMyTeam(), getMyPokemon()]);
  playerStore.team = teamResult.equipo;
  playerStore.pokemon = pokemon;

  refs.panelRoot.innerHTML = `
    <section class="section-card">
      <h3>Equipo actual</h3>
      <div class="pokemon-grid">
        ${teamResult.equipo.length ? teamResult.equipo.map(renderTeamCard).join('') : '<div class="empty-state">No tienes equipo guardado todavía.</div>'}
      </div>
    </section>
    <section class="section-card">
      <h3>Guardar nuevo equipo</h3>
      <p>Selecciona hasta 6 Pokémon y guarda el equipo directamente contra <code>/usuario/me/equipo</code>.</p>
      <div class="pokemon-grid">
        ${pokemon.map((row) => `
          <label class="pokemon-card">
            <input type="checkbox" value="${row.id}" class="team-pick" ${teamResult.equipo.some((slot) => slot.id === row.id) ? 'checked' : ''} />
            <img src="${getPokemonCardImage(row.pokemon_id, row.es_shiny, row.imagen)}" alt="${escapeHtml(row.nombre)}" />
            <strong>${escapeHtml(row.nombre)}</strong>
            <div class="row">
              <span class="badge">Lv ${row.nivel}</span>
              ${row.es_shiny ? '<span class="badge shiny">✨ Shiny</span>' : ''}
            </div>
          </label>`).join('')}
      </div>
      <div class="row" style="margin-top: 1rem;">
        <button id="save-team-btn">Guardar equipo seleccionado</button>
        <button id="quick-team-btn" class="secondary-button">Usar los primeros 6</button>
      </div>
    </section>
  `;

  document.getElementById('save-team-btn')?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll<HTMLInputElement>('.team-pick:checked')).map((node) => Number(node.value)).slice(0, 6);
    await saveTeamIds(ids, refs);
  });

  document.getElementById('quick-team-btn')?.addEventListener('click', async () => {
    const ids = pokemon.slice(0, 6).map((row) => row.id);
    await saveTeamIds(ids, refs);
  });
}

async function saveTeamIds(ids: number[], refs: ShellRefs): Promise<void> {
  try {
    const result = await saveMyTeam(ids);
    showToast('Equipo', result.ok ? 'Equipo guardado correctamente' : 'No se pudo guardar');
    await renderTeam(refs);
  } catch (error) {
    showToast('Equipo', error instanceof Error ? error.message : 'No se pudo guardar el equipo');
  }
}

async function renderArena(refs: ShellRefs): Promise<void> {
  ensureAuthenticated(refs.panelRoot, refs.onNavigate);
  const team = (await getMyTeam()).equipo;
  playerStore.team = team;

  refs.panelRoot.innerHTML = `
    <section class="section-card">
      <h3>Preparación</h3>
      <div class="section-grid">
        <div class="metric-card"><span>Equipo listo</span><strong>${team.length}/6</strong></div>
        <div class="metric-card"><span>Modo sugerido</span><strong>${team.length >= 6 ? 'master' : 'normal'}</strong></div>
      </div>
      <div class="row" style="margin-top: 1rem;">
        <button data-difficulty="normal">Normal</button>
        <button data-difficulty="challenge" class="secondary-button">Challenge</button>
        <button data-difficulty="expert" class="secondary-button">Expert</button>
        <button data-difficulty="master" class="warning-button">Master</button>
      </div>
    </section>
    <section class="section-card" id="arena-result-slot">
      <h3>Sesión de batalla</h3>
      <div class="empty-state">Inicia una batalla para ver el token y la recompensa estimada.</div>
    </section>
  `;

  refs.panelRoot.querySelectorAll<HTMLButtonElement>('[data-difficulty]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!team.length) {
        showToast('Arena', 'Necesitas equipo guardado antes de iniciar batalla.');
        return;
      }
      const difficulty = button.dataset.difficulty as 'normal' | 'challenge' | 'expert' | 'master';
      try {
        const result = await startArena(difficulty, team.map((row) => row.id));
        const slot = document.getElementById('arena-result-slot');
        if (!slot) return;
        slot.innerHTML = `
          <h3>Sesión activa</h3>
          <div class="list-item">
            <div class="row"><span class="badge">${escapeHtml(result.dificultad_codigo)}</span><span class="badge">TTL ${result.ttl_segundos}s</span></div>
            <p><strong>EXP:</strong> ${formatNumber(result.exp_ganada)} · <strong>Pokédolares:</strong> ${formatNumber(result.pokedolares_ganados)}</p>
            <div class="code-box">battle_session_token = ${escapeHtml(result.battle_session_token)}</div>
            <div class="row" style="margin-top: 0.8rem;">
              <button id="claim-battle-btn">Reclamar victoria</button>
              <small class="badge warning">Espera ~9 segundos antes de reclamar para respetar el backend.</small>
            </div>
          </div>
        `;
        document.getElementById('claim-battle-btn')?.addEventListener('click', async () => {
          try {
            const claim = await claimArenaVictory(result.battle_session_token, team.map((row) => row.id));
            showJsonModal('Resultado arena', claim, refs.panelRoot);
          } catch (error) {
            showToast('Arena', error instanceof Error ? error.message : 'No se pudo reclamar');
          }
        });
      } catch (error) {
        showToast('Arena', error instanceof Error ? error.message : 'No se pudo iniciar la batalla');
      }
    });
  });
}

async function renderOnboarding(refs: ShellRefs): Promise<void> {
  ensureAuthenticated(refs.panelRoot, refs.onNavigate);
  const onboarding = await getOnboarding();
  playerStore.onboarding = onboarding;

  refs.panelRoot.innerHTML = `
    <section class="section-card">
      <h3>Estado del onboarding</h3>
      <div class="section-grid">
        <div class="metric-card"><span>Completadas</span><strong>${onboarding.progreso.completadas}/${onboarding.progreso.total}</strong></div>
        <div class="metric-card"><span>Porcentaje</span><strong>${onboarding.progreso.porcentaje}%</strong></div>
        <div class="metric-card"><span>Capturas</span><strong>${onboarding.progreso.capturas}</strong></div>
        <div class="metric-card"><span>Equipo</span><strong>${onboarding.progreso.equipo}</strong></div>
      </div>
    </section>
    <section class="section-card">
      <h3>Misiones</h3>
      <div class="list">
        ${onboarding.misiones.map((mission) => `
          <div class="list-item">
            <strong>${escapeHtml(mission.codigo)}</strong>
            <p>Actual: ${mission.actual}/${mission.objetivo}</p>
            <div class="row">
              <span class="badge ${mission.completada ? 'success' : ''}">${mission.completada ? 'Completada' : 'Pendiente'}</span>
              <span class="badge ${mission.recompensa_reclamada ? 'warning' : ''}">${mission.recompensa_reclamada ? 'Recompensa aplicada' : 'Sin reclamar'}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="row" style="margin-top: 1rem;">
        <button id="mark-welcome-btn">Marcar bienvenida vista</button>
      </div>
    </section>
  `;

  document.getElementById('mark-welcome-btn')?.addEventListener('click', async () => {
    try {
      await markOnboardingWelcome(true);
      showToast('Onboarding', 'La bienvenida fue marcada como vista.');
      await renderOnboarding(refs);
    } catch (error) {
      showToast('Onboarding', error instanceof Error ? error.message : 'No se pudo actualizar');
    }
  });
}

async function renderMaps(refs: ShellRefs): Promise<void> {
  ensureAuthenticated(refs.panelRoot, refs.onNavigate);
  const [zones, items] = await Promise.all([getZones(), getMyItems()]);
  playerStore.items = items;
  const balls = items.filter((item) => (item.item_codigo || '').includes('ball'));

  refs.panelRoot.innerHTML = `
    <section class="section-card">
      <h3>Zonas</h3>
      <div class="zone-grid">
        ${zones.map((zone) => `
          <div class="zone-card">
            ${zone.card_imagen ? `<img src="${escapeHtml(zone.card_imagen)}" alt="${escapeHtml(zone.nombre)}" />` : ''}
            <strong>${escapeHtml(zone.nombre)}</strong>
            <p>${escapeHtml(zone.descripcion || 'Explora la zona, reporta presencia y genera encuentros.')}</p>
            <div class="row">
              <span class="badge">${zone.species_count || 0} species</span>
              <button class="secondary-button" data-presence-zone="${zone.id}">Presencia</button>
              <button data-encounter-zone="${zone.id}">Encuentro</button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
    <section class="section-card" id="maps-output-slot">
      <h3>Encuentro / presencia</h3>
      <div class="empty-state">Elige una zona para revisar presencia o generar encuentro.</div>
    </section>
    <section class="section-card">
      <h3>Poké Balls disponibles</h3>
      <div class="stack">
        ${balls.length ? balls.map((item) => `<span class="badge">${escapeHtml(item.nombre)} x${item.cantidad}</span>`).join('') : '<span class="badge">Sin balls en inventario</span>'}
      </div>
    </section>
  `;

  refs.panelRoot.querySelectorAll<HTMLElement>('[data-presence-zone]').forEach((button) => {
    button.addEventListener('click', async () => {
      const zoneId = Number(button.dataset.presenceZone || 0);
      if (!zoneId) return;
      try {
        await updatePresence(zoneId, 'entry');
        const presence = await getPresence(zoneId);
        showJsonModal(`Presencia zona ${zoneId}`, presence, refs.panelRoot);
      } catch (error) {
        showToast('Maps', error instanceof Error ? error.message : 'No se pudo actualizar presencia');
      }
    });
  });

  refs.panelRoot.querySelectorAll<HTMLElement>('[data-encounter-zone]').forEach((button) => {
    button.addEventListener('click', async () => {
      const zoneId = Number(button.dataset.encounterZone || 0);
      if (!zoneId) return;
      try {
        const encounter = await generateEncounter(zoneId) as Record<string, unknown>;
        const slot = document.getElementById('maps-output-slot');
        if (!slot) return;
        if (!encounter.encuentro_token) {
          slot.innerHTML = '<h3>Encuentro / presencia</h3><div class="empty-state">No se generó encuentro esta vez. Vuelve a intentarlo.</div>';
          return;
        }
        const firstBall = balls[0];
        slot.innerHTML = `
          <h3>Encuentro activo</h3>
          <div class="pokemon-card">
            <img src="${getPokemonCardImage(Number(encounter.pokemon_id || 0), Boolean(encounter.es_shiny), String(encounter.imagen || ''))}" alt="${escapeHtml(String(encounter.nombre || 'Pokémon'))}" />
            <strong>${escapeHtml(String(encounter.nombre || 'Pokémon'))}</strong>
            <div class="row">
              <span class="badge">Lv ${encounter.nivel}</span>
              ${encounter.es_shiny ? '<span class="badge shiny">✨ Shiny</span>' : ''}
            </div>
            <div class="code-box">encuentro_token = ${escapeHtml(String(encounter.encuentro_token))}</div>
            <div class="row" style="margin-top: 0.8rem;">
              <button id="capture-btn" ${firstBall ? '' : 'disabled'}>${firstBall ? `Capturar con ${escapeHtml(firstBall.nombre)}` : 'Sin Poké Balls'}</button>
            </div>
          </div>
        `;
        document.getElementById('capture-btn')?.addEventListener('click', async () => {
          if (!firstBall) return;
          try {
            const capture = await tryCapture({
              pokemon_id: Number(encounter.pokemon_id || 0),
              nivel: Number(encounter.nivel || 1),
              es_shiny: Boolean(encounter.es_shiny),
              hp_actual: Number(encounter.hp || encounter.hp_max || 100),
              hp_maximo: Number(encounter.hp_max || encounter.hp || 100),
              item_id: Number(firstBall.item_id),
              encuentro_token: String(encounter.encuentro_token)
            });
            showJsonModal('Resultado de captura', capture, refs.panelRoot);
          } catch (error) {
            showToast('Captura', error instanceof Error ? error.message : 'No se pudo capturar');
          }
        });
      } catch (error) {
        showToast('Maps', error instanceof Error ? error.message : 'No se pudo generar encuentro');
      }
    });
  });
}

async function renderGyms(refs: ShellRefs): Promise<void> {
  ensureAuthenticated(refs.panelRoot, refs.onNavigate);
  const [catalog, progress, team] = await Promise.all([getGymCatalog(), getGymProgress(), getMyTeam()]);
  playerStore.team = team.equipo;
  const gyms = (catalog as { gyms?: Array<Record<string, unknown>> }).gyms || [];
  const progressData = progress as Record<string, unknown>;

  refs.panelRoot.innerHTML = `
    <section class="section-card">
      <h3>Progreso general</h3>
      <div class="section-grid">
        <div class="metric-card"><span>Total Gyms</span><strong>${progressData.total_gyms ?? 0}</strong></div>
        <div class="metric-card"><span>Completados</span><strong>${progressData.completados ?? 0}</strong></div>
        <div class="metric-card"><span>Desbloqueados</span><strong>${progressData.desbloqueados ?? 0}</strong></div>
        <div class="metric-card"><span>Porcentaje</span><strong>${progressData.porcentaje ?? 0}%</strong></div>
      </div>
    </section>
    <section class="section-card">
      <h3>Catálogo de Gyms</h3>
      <div class="gym-grid">
        ${gyms.map((gym) => `
          <div class="gym-card">
            <strong>${escapeHtml(String(gym.lider_nombre || gym.codigo || 'Gym'))}</strong>
            <p>${escapeHtml(String(gym.region_nombre || gym.region_codigo || 'región'))} · ${escapeHtml(String(gym.medalla_nombre || 'medalla'))}</p>
            <div class="row">
              <span class="badge ${gym.desbloqueado ? 'success' : ''}">${gym.desbloqueado ? 'Desbloqueado' : 'Bloqueado'}</span>
              <span class="badge ${gym.completado ? 'warning' : ''}">${gym.completado ? 'Completado' : 'Pendiente'}</span>
            </div>
            <div class="row" style="margin-top: 0.8rem;">
              <button data-start-gym="${escapeHtml(String(gym.codigo || ''))}" ${gym.desbloqueado ? '' : 'disabled'}>Iniciar</button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
    <section class="section-card" id="gym-output-slot">
      <h3>Sesión de Gym</h3>
      <div class="empty-state">Inicia un gym para recibir el token, snapshot y resultado.</div>
    </section>
  `;

  refs.panelRoot.querySelectorAll<HTMLElement>('[data-start-gym]').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.dataset.startGym || '';
      if (!code) return;
      try {
        const result = await startGym(code, playerStore.team.map((row) => row.id));
        const slot = document.getElementById('gym-output-slot');
        if (!slot) return;
        const token = String((result as Record<string, unknown>).gym_session_token || '');
        slot.innerHTML = `
          <h3>Sesión de Gym</h3>
          <div class="list-item">
            <div class="code-box">gym_session_token = ${escapeHtml(token)}</div>
            <div class="row" style="margin-top: 0.8rem;">
              <button id="claim-gym-win-btn">Reclamar victoria</button>
            </div>
          </div>
        `;
        document.getElementById('claim-gym-win-btn')?.addEventListener('click', async () => {
          try {
            const reward = await claimGymReward(token, true, 12);
            showJsonModal('Resultado Gym', reward, refs.panelRoot);
          } catch (error) {
            showToast('Gym', error instanceof Error ? error.message : 'No se pudo reclamar');
          }
        });
      } catch (error) {
        showToast('Gym', error instanceof Error ? error.message : 'No se pudo iniciar');
      }
    });
  });
}

async function renderBossIdle(refs: ShellRefs): Promise<void> {
  ensureAuthenticated(refs.panelRoot, refs.onNavigate);
  const [bossState, idleState, team, bossRanking] = await Promise.all([
    getBossState(),
    getIdleState(),
    getMyTeam(),
    getBossRanking(10)
  ]);
  playerStore.team = team.equipo;
  const boss = bossState as Record<string, unknown>;
  const idle = idleState as Record<string, unknown>;
  const rankingRows = (bossRanking as { ranking?: Array<Record<string, unknown>> }).ranking || [];

  refs.panelRoot.innerHTML = `
    <section class="section-card">
      <h3>Boss diario</h3>
      <div class="section-grid">
        <div class="metric-card"><span>Estado</span><strong>${escapeHtml(String(boss.estado || 'desconocido'))}</strong></div>
        <div class="metric-card"><span>Timezone</span><strong>${escapeHtml(String(boss.server_timezone || 'America/Lima'))}</strong></div>
        <div class="metric-card"><span>Fecha evento</span><strong>${escapeHtml(String(boss.fecha_evento || '-'))}</strong></div>
      </div>
      <div class="row" style="margin-top: 1rem;">
        <button id="start-boss-btn">Iniciar Boss</button>
      </div>
    </section>
    <section class="section-card">
      <h3>Idle</h3>
      <div class="list-item">
        <p><strong>Activa:</strong> ${idle.activa ? 'sí' : 'no'}</p>
        <p><strong>Hora server:</strong> ${escapeHtml(String(idle.hora_server || '-'))}</p>
        <div class="row">
          <button id="start-idle-btn">Idle 1h</button>
          <button id="claim-idle-btn" class="secondary-button">Reclamar idle</button>
        </div>
      </div>
    </section>
    <section class="section-card">
      <h3>Top daño Boss</h3>
      <div class="list">
        ${rankingRows.map((row) => `
          <div class="list-item">
            <strong>#${row.puesto} ${escapeHtml(String(row.nombre || 'Entrenador'))}</strong>
            <p>Damage: ${formatNumber(Number(row.damage_total || 0))}</p>
          </div>`).join('') || '<div class="empty-state">Aún no hay ranking.</div>'}
      </div>
    </section>
    <section class="section-card" id="boss-idle-output-slot">
      <h3>Resultado</h3>
      <div class="empty-state">Usa Boss o Idle para probar el flujo online.</div>
    </section>
  `;

  document.getElementById('start-boss-btn')?.addEventListener('click', async () => {
    try {
      const result = await startBoss(playerStore.team.map((row) => row.id));
      const token = String((result as Record<string, unknown>).boss_session_token || '');
      const slot = document.getElementById('boss-idle-output-slot');
      if (!slot) return;
      slot.innerHTML = `
        <h3>Resultado</h3>
        <div class="list-item">
          <div class="code-box">boss_session_token = ${escapeHtml(token)}</div>
          <div class="row" style="margin-top: 0.8rem;"><button id="claim-boss-btn">Reclamar boss</button></div>
        </div>
      `;
      document.getElementById('claim-boss-btn')?.addEventListener('click', async () => {
        try {
          const reward = await claimBossReward(token, 1000, false, 14);
          showJsonModal('Resultado Boss', reward, refs.panelRoot);
        } catch (error) {
          showToast('Boss', error instanceof Error ? error.message : 'No se pudo reclamar');
        }
      });
    } catch (error) {
      showToast('Boss', error instanceof Error ? error.message : 'No se pudo iniciar');
    }
  });

  document.getElementById('start-idle-btn')?.addEventListener('click', async () => {
    try {
      const result = await startIdle('ruta', 3600, playerStore.team.map((row) => row.id));
      showJsonModal('Idle iniciado', result, refs.panelRoot);
    } catch (error) {
      showToast('Idle', error instanceof Error ? error.message : 'No se pudo iniciar');
    }
  });

  document.getElementById('claim-idle-btn')?.addEventListener('click', async () => {
    try {
      const result = await claimIdle();
      showJsonModal('Idle reclamado', result, refs.panelRoot);
    } catch (error) {
      showToast('Idle', error instanceof Error ? error.message : 'No se pudo reclamar');
    }
  });
}

async function renderShop(refs: ShellRefs): Promise<void> {
  ensureAuthenticated(refs.panelRoot, refs.onNavigate);
  const [items, payments] = await Promise.all([getItemShop(), getPaymentsCatalog()]);
  const itemRows = items as Array<Record<string, unknown>>;
  const paymentCatalog = payments as { productos?: Array<Record<string, unknown>>; beneficios_activos?: Array<Record<string, unknown>> };

  refs.panelRoot.innerHTML = `
    <section class="section-card">
      <h3>Tienda por Pokédolares</h3>
      <div class="shop-grid">
        ${itemRows.map((item) => `
          <div class="shop-card">
            <strong>${escapeHtml(String(item.nombre || 'Item'))}</strong>
            <p>${escapeHtml(String(item.descripcion || ''))}</p>
            <div class="row">
              <span class="badge">${formatNumber(Number(item.precio || 0))} $</span>
              <button data-buy-item="${item.id}">Comprar 1</button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
    <section class="section-card">
      <h3>Catálogo premium</h3>
      <div class="shop-grid">
        ${(paymentCatalog.productos || []).map((product) => `
          <div class="shop-card">
            <strong>${escapeHtml(String(product.nombre || product.codigo || 'Producto'))}</strong>
            <p>${escapeHtml(String(product.tipo || 'premium'))}</p>
            <div class="row">
              <span class="badge warning">USD ${product.precio_usd}</span>
            </div>
          </div>
        `).join('') || '<div class="empty-state">No hay productos premium activos.</div>'}
      </div>
    </section>
  `;

  refs.panelRoot.querySelectorAll<HTMLElement>('[data-buy-item]').forEach((button) => {
    button.addEventListener('click', async () => {
      const itemId = Number(button.dataset.buyItem || 0);
      if (!itemId) return;
      try {
        const result = await buyItem(itemId, 1);
        showJsonModal('Compra completada', result, refs.panelRoot);
      } catch (error) {
        showToast('Tienda', error instanceof Error ? error.message : 'No se pudo comprar');
      }
    });
  });
}

async function renderRanking(refs: ShellRefs): Promise<void> {
  const [summary, bossRanking] = await Promise.all([getRankingSummary(10), sessionStore.isAuthenticated() ? getBossRanking(10) : Promise.resolve({ ranking: [] })]);
  const data = summary as Record<string, unknown>;
  const bossRows = (bossRanking as { ranking?: Array<Record<string, unknown>> }).ranking || [];
  const trainers = (data.entrenadores as Array<Record<string, unknown>> | undefined) || [];
  const topPokemon = (data.pokemon_experiencia as Array<Record<string, unknown>> | undefined) || [];

  refs.panelRoot.innerHTML = `
    <section class="section-card">
      <h3>Entrenadores top</h3>
      <div class="ranking-grid">
        ${trainers.map((row) => `
          <div class="ranking-card">
            <strong>#${row.puesto} ${escapeHtml(String(row.nombre || 'Entrenador'))}</strong>
            <p>Exp total: ${formatNumber(Number(row.experiencia_total_sum || 0))}</p>
            <p>Victorias: ${formatNumber(Number(row.victorias_total_sum || 0))}</p>
          </div>
        `).join('') || '<div class="empty-state">No hay datos de ranking.</div>'}
      </div>
    </section>
    <section class="section-card">
      <h3>Pokémon top por experiencia</h3>
      <div class="ranking-grid">
        ${topPokemon.map((row) => `
          <div class="ranking-card">
            <strong>#${row.puesto} ${escapeHtml(String(row.pokemon_nombre || 'Pokémon'))}</strong>
            <p>Entrenador: ${escapeHtml(String(row.entrenador_nombre || '-'))}</p>
            <p>Exp total: ${formatNumber(Number(row.experiencia_total || 0))}</p>
          </div>
        `).join('') || '<div class="empty-state">No hay datos.</div>'}
      </div>
    </section>
    <section class="section-card">
      <h3>Boss ranking</h3>
      <div class="ranking-grid">
        ${bossRows.map((row) => `
          <div class="ranking-card">
            <strong>#${row.puesto} ${escapeHtml(String(row.nombre || 'Entrenador'))}</strong>
            <p>Damage: ${formatNumber(Number(row.damage_total || 0))}</p>
            <p>Turnos: ${formatNumber(Number(row.turnos || 0))}</p>
          </div>
        `).join('') || '<div class="empty-state">Inicia sesión para ver o poblar el ranking del boss.</div>'}
      </div>
    </section>
  `;
}

function ensureAuthenticated(root: HTMLElement, onNavigate: (view: ViewKey) => void): void {
  if (sessionStore.isAuthenticated()) return;
  root.innerHTML = `
    <section class="section-card">
      <h3>Necesitas iniciar sesión</h3>
      <p>Esta vista consume endpoints protegidos del backend. Vuelve a <strong>Home</strong> y autentícate con Google.</p>
      <div class="row"><button id="go-home-login-btn">Ir a Home</button></div>
    </section>`;
  document.getElementById('go-home-login-btn')?.addEventListener('click', () => onNavigate('home'));
  throw new Error('auth-guard');
}

function renderPokemonCard(row: PlayerPokemon): string {
  return `
    <article class="pokemon-card">
      <img src="${getPokemonCardImage(row.pokemon_id, row.es_shiny, row.imagen)}" alt="${escapeHtml(row.nombre)}" />
      <strong>${escapeHtml(row.nombre)}</strong>
      <div class="row">
        <span class="badge">Lv ${row.nivel}</span>
        ${row.es_shiny ? '<span class="badge shiny">✨ Shiny</span>' : ''}
      </div>
      <p>Tipo: ${escapeHtml(row.tipo || 'desconocido')}</p>
      <div class="row">
        <button class="secondary-button" data-moves-for="${row.id}">Movimientos</button>
      </div>
    </article>`;
}

function renderTeamCard(row: TeamSlot): string {
  return `
    <article class="pokemon-card">
      <img src="${getPokemonCardImage(row.pokemon_id, row.es_shiny, row.imagen)}" alt="${escapeHtml(row.nombre)}" />
      <strong>${row.posicion}. ${escapeHtml(row.nombre)}</strong>
      <div class="row">
        <span class="badge ${row.es_lider ? 'success' : ''}">${row.es_lider ? 'Líder' : `Slot ${row.posicion}`}</span>
        ${row.es_shiny ? '<span class="badge shiny">✨ Shiny</span>' : ''}
      </div>
      <p>Lv ${row.nivel} · HP ${row.hp_actual}/${row.hp_max}</p>
    </article>`;
}

function renderThumbVisual(imageUrl: string | null, fallback: string, thumbClass: string, fallbackClass: string): string {
  if (imageUrl) {
    return `<div class="${thumbClass}"><img src="${escapeHtml(imageUrl)}" alt="thumb" /></div>`;
  }
  return `<div class="${thumbClass} ${thumbClass}--empty"><span class="${fallbackClass}">${escapeHtml(fallback)}</span></div>`;
}

function renderHomeSummaryCard(label: string, value: string, detail: string, imageUrl: string | null, fallback: string): string {
  return `
    <article class="home-summary-card">
      ${renderThumbVisual(imageUrl, fallback, 'home-summary-card__thumb', 'home-thumb-fallback')}
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(detail)}</small>
      </div>
    </article>`;
}

function renderHomeStateTile(label: string, value: string, detail: string, imageUrl: string | null, fallback: string): string {
  return `
    <article class="home-state-tile">
      ${renderThumbVisual(imageUrl, fallback, 'home-state-tile__thumb', 'home-thumb-fallback')}
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(detail)}</small>
      </div>
    </article>`;
}

function renderHomeShortcutVisual(view: ViewKey, title: string, subtitle: string, imageUrl: string | null, fallback: string): string {
  return `
    <button class="home-shortcut-card" data-go-view="${view}">
      <span class="home-shortcut-card__media ${imageUrl ? '' : 'home-shortcut-card__placeholder'}">
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />` : `<span class="home-thumb-fallback">${escapeHtml(fallback)}</span>`}
      </span>
      <span class="home-shortcut-card__copy">
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(subtitle)}</small>
      </span>
    </button>`;
}

function renderHomeCommandButton(view: ViewKey, label: string, icon: string, accent = ''): string {
  return `
    <button class="home-command-button ${accent}" data-go-view="${view}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">
      <span>${escapeHtml(icon)}</span>
    </button>`;
}

function renderHomeTeamSlot(slot: TeamSlot | null, position: number): string {
  if (!slot) {
    return `
      <article class="home-team-slot home-team-slot--empty">
        <span class="home-team-slot__index">0${position}</span>
        <div class="home-team-slot__empty">+</div>
        <strong>Libre</strong>
        <small>Agrega un Pokemon</small>
      </article>`;
  }

  return `
    <article class="home-team-slot ${slot.es_lider ? 'home-team-slot--leader' : ''}">
      <span class="home-team-slot__index">0${position}</span>
      <div class="home-team-slot__sprite">
        <img src="${escapeHtml(getPokemonCardImage(slot.pokemon_id, slot.es_shiny, slot.imagen))}" alt="${escapeHtml(slot.nombre)}" />
      </div>
      <strong>${escapeHtml(slot.nombre)}</strong>
      <small>Lv ${slot.nivel}${slot.es_shiny ? ' · shiny' : ''}</small>
    </article>`;
}

function renderHomePanelMetric(label: string, value: string, detail: string): string {
  return `
    <div class="home-panel-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>`;
}

function normalizeAssetToken(value: string): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function resolveScenarioHint(leaderName: string, regionCode: string): string {
  const leader = normalizeAssetToken(leaderName);
  const leaderMap: Record<string, string> = {
    misty: 'lago_azul',
    brock: 'caverna_roca',
    erika: 'bosque_verde',
    koga: 'pantano_toxico',
    sabrina: 'jardin_lunar',
    blaine: 'caverna_fuego',
    giovanni: 'desierto_dorado',
    falkner: 'torre_campana',
    bugsy: 'bosque_ancestral',
    whitney: 'lago_remolino',
    morty: 'torre_fantasma',
    jasmine: 'ruinas_profundas',
    pryce: 'cumbre_nevada',
    clair: 'santuario_dragon',
    roxanne: 'caverna_roca',
    brawly: 'laguna_coral',
    wattson: 'pico_trueno',
    flannery: 'caverna_fuego',
    norman: 'bosque_tropical',
    winona: 'pilar_del_cielo',
    tateliza: 'jardin_lunar',
    juan: 'laguna_coral'
  };
  const regionFallbacks: Record<string, string> = {
    kanto: 'bosque_verde',
    johto: 'torre_campana',
    hoenn: 'laguna_coral',
    zona_especial: 'jardin_lunar'
  };
  return leaderMap[leader] || regionFallbacks[String(regionCode || '').toLowerCase()] || 'bosque_verde';
}

function resolveHomeState(
  onboarding: OnboardingData,
  team: TeamSlot[],
  gymProgress: Record<string, unknown>,
  bossState: Record<string, unknown>,
  idleState: Record<string, unknown>
): {
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryView: ViewKey;
  secondaryLabel?: string;
  secondaryView?: ViewKey;
  badges: string[];
} {
  const badges = [
    `${team.length}/6 equipo`,
    `${onboarding.progreso.porcentaje}% onboarding`
  ];

  const nextGym = (gymProgress.siguiente_gym as Record<string, unknown> | null) || null;
  const idleSession = (idleState.sesion as Record<string, unknown> | null) || null;

  if (onboarding.progreso.porcentaje < 100) {
    return {
      title: 'Primeros pasos',
      subtitle: 'Completa captura, equipo y tu primera batalla para desbloquear mejor ritmo de progreso.',
      primaryLabel: 'Ver misiones',
      primaryView: 'onboarding',
      secondaryLabel: team.length < 6 ? 'Ajustar team' : 'Ir a Maps',
      secondaryView: team.length < 6 ? 'team' : 'maps',
      badges: [...badges, `${onboarding.progreso.completadas}/${onboarding.progreso.total} misiones`]
    };
  }

  if (Boolean(idleState.activa) && idleSession) {
    const progress = Number(idleSession.progreso_pct || 0);
    const remaining = formatSecondsCompact(Number(idleSession.segundos_restantes || 0));
    const reclaimable = String(idleSession.estado || '') === 'reclamable';
    return {
      title: reclaimable ? 'Reclama tu farmeo' : 'Idle en curso',
      subtitle: reclaimable ? 'Tu sesión terminó. Entra para reclamar experiencia, pokédolares e ítems.' : `Tu sesión sigue activa. Restan ${remaining}.`,
      primaryLabel: 'Abrir Boss / Idle',
      primaryView: 'bossIdle',
      secondaryLabel: 'Ver Team',
      secondaryView: 'team',
      badges: [...badges, `${progress}% idle`, reclaimable ? 'listo para reclamar' : `restan ${remaining}`]
    };
  }

  if (Boolean(bossState.activo)) {
    const remaining = formatSecondsCompact(Number(bossState.segundos_para_fin || 0));
    return {
      title: 'Boss del mundo activo',
      subtitle: `El evento del día ya está abierto. Te quedan ${remaining} para participar.`,
      primaryLabel: 'Entrar al Boss',
      primaryView: 'bossIdle',
      secondaryLabel: 'Revisar Team',
      secondaryView: 'team',
      badges: [...badges, 'evento activo', `cierra en ${remaining}`]
    };
  }

  if (nextGym) {
    return {
      title: 'Siguiente reto',
      subtitle: `${String(nextGym.lider_nombre || 'Gym líder')} te espera por la medalla ${String(nextGym.medalla_nombre || 'siguiente')}.`,
      primaryLabel: 'Ver Gyms',
      primaryView: 'gyms',
      secondaryLabel: team.length < 6 ? 'Completar Team' : 'Entrar a Arena',
      secondaryView: team.length < 6 ? 'team' : 'arena',
      badges: [...badges, String(nextGym.region_codigo || 'gym'), String(nextGym.codigo || 'siguiente')]
    };
  }

  if (team.length < 6) {
    return {
      title: 'Completa tu equipo',
      subtitle: 'Necesitas un team sólido para Arena, Boss e Idle. Ajusta tus mejores seis Pokémon.',
      primaryLabel: 'Ir a Team',
      primaryView: 'team',
      secondaryLabel: 'Ver colección',
      secondaryView: 'pokemon',
      badges: [...badges, `${team.length}/6 slots ocupados`]
    };
  }

  return {
    title: 'Tu equipo está listo',
    subtitle: 'Continúa con Arena, explora Maps o sigue avanzando por los Gyms.',
    primaryLabel: 'Ir a Arena',
    primaryView: 'arena',
    secondaryLabel: 'Explorar Maps',
    secondaryView: 'maps',
    badges: [...badges, 'listo para combate']
  };
}

function renderStatusMetric(label: string, value: string, detail: string): string {
  return `
    <div class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>`;
}

function formatSecondsCompact(totalSeconds: number): string {
  const safe = Math.max(0, Number(totalSeconds || 0));
  if (!safe) return 'ahora';
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${safe}s`;
}


function homeShortcut(icon: string, title: string, subtitle: string, view: ViewKey): string {
  return `
    <button class="nav-item" data-go-view="${view}" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(134,167,208,0.18);">
      <span class="nav-icon">${icon}</span>
      <span class="nav-meta"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(subtitle)}</small></span>
    </button>`;
}

function showJsonModal(title: string, data: unknown, root: HTMLElement): void {
  const section = document.createElement('section');
  section.className = 'section-card';
  section.innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    <div class="code-box">${escapeHtml(JSON.stringify(data, null, 2))}</div>
  `;
  root.prepend(section);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-PE').format(value || 0);
}

export function bindLogoutButton(button: HTMLButtonElement, refreshShell: () => void): void {
  button.addEventListener('click', () => {
    logout();
    playerStore.reset();
    showToast('Sesión', 'Se cerró la sesión local del frontend.');
    refreshShell();
  });
}

export async function tryRestoreSession(): Promise<void> {
  if (!sessionStore.isAuthenticated()) return;
  try {
    const user = await fetchAuthMe();
    sessionStore.setUser(user);
  } catch {
    sessionStore.clear();
  }
}
