import type { OnboardingData, PlayerPokemon, PokemonEvolutionOption, PokemonEvolutionState, PokemonMoveRow, PokemonMovesResponse, TeamSlot, ViewKey } from '../types/models';
import { sessionStore } from '../store/session';
import { playerStore } from '../store/player';
import { renderGoogleButton, fetchAuthMe, logout } from '../services/auth';
import { equipPokemonMove, evolvePokemonByItem, evolvePokemonByLevel, getMe, getMyItems, getMyPokemon, getMyTeam, getOnboarding, getPokemonEvolutionState, getPokemonMoves, getTrainerSetup, markOnboardingWelcome, releaseMyPokemon, saveMyTeam } from '../services/player';
import { startArena, claimArenaVictory } from '../services/battle';
import { generateEncounter, getPresence, getZones, tryCapture, updatePresence } from '../services/maps';
import { getGymCatalog, getGymProgress, startGym, claimGymReward } from '../services/gyms';
import { getBossRanking, getBossState, getIdleState, startBoss, startIdle, claimBossReward, claimIdle } from '../services/bossIdle';
import { buyItem, getItemShop } from '../services/shop';
import { getPaymentsCatalog } from '../services/payments';
import { getRankingSummary } from '../services/ranking';
import { getPokemonCardImage } from '../utils/pokeSprites';
import { getAvatarAsset, getBadgeAsset, getItemAsset, getMapAsset, getMapCardAsset, getScenarioBackdrop, getTrainerAsset } from '../utils/gameAssets';
import { showToast, escapeHtml } from './toast';

interface ShellRefs {
  panelRoot: HTMLElement;
  playerMiniCard: HTMLElement;
  viewTitle: HTMLElement;
  viewSubtitle: HTMLElement;
  onNavigate: (view: ViewKey) => void;
  refreshShell: () => void;
}

const HOME_LOGIN_BANNER = new URL('../../img/Banner.png', import.meta.url).href;
const MAP_MOVE_CENTER = new URL('../../img/maps/move/center.png', import.meta.url).href;
const MAP_MOVE_NORTH = new URL('../../img/maps/move/north_able.png', import.meta.url).href;
const MAP_MOVE_SOUTH = new URL('../../img/maps/move/south_able.png', import.meta.url).href;
const MAP_MOVE_EAST = new URL('../../img/maps/move/east_able.png', import.meta.url).href;
const MAP_MOVE_WEST = new URL('../../img/maps/move/west_able.png', import.meta.url).href;

const WORLD_ICON_MAP: Record<string, string> = {
  Gym: 'GYM',
  Boss: 'BOS',
  Idle: 'IDL',
  Mapa: 'MAP'
};

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
      await renderHomeV3(refs);
      return;
    case 'pokemon':
      await renderPokemonV2(refs);
      return;
    case 'team':
      await renderTeamV2(refs);
      return;
    case 'arena':
      await renderArena(refs);
      return;
    case 'onboarding':
      await renderOnboarding(refs);
      return;
    case 'maps':
      await renderMapsV2(refs);
      return;
    case 'gyms':
      await renderGymsV2(refs);
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

  const [me, trainerSetup, pokemon, team, onboarding, gymProgressRaw, bossStateRaw, idleStateRaw] = await Promise.all([
    getMe(),
    getTrainerSetup(),
    getMyPokemon(),
    getMyTeam(),
    getOnboarding(),
    getGymProgress(),
    getBossState(),
    getIdleState()
  ]);

  sessionStore.setUser(me);
  playerStore.trainerSetup = trainerSetup;
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

  const [gymCatalogRaw] = await Promise.all([getGymCatalog()]);
  const gymProgress = gymProgressRaw as Record<string, unknown>;
  const bossState = bossStateRaw as Record<string, unknown>;
  const idleState = idleStateRaw as Record<string, unknown>;
  const gymCatalog = ((gymCatalogRaw as { gyms?: Array<Record<string, unknown>> }).gyms || []) as Array<Record<string, unknown>>;
  const orderedTeam = [...team.equipo].sort((a, b) => a.posicion - b.posicion);
  const homeState = resolveHomeState(onboarding, orderedTeam, gymProgress, bossState, idleState);
  const nextGym = (gymProgress.siguiente_gym as Record<string, unknown> | null) || null;
  const idleSession = (idleState.sesion as Record<string, unknown> | null) || null;

  const regionCode = String(nextGym?.region_codigo || 'kanto').toLowerCase();
  const leaderName = String(nextGym?.lider_nombre || 'Siguiente gym');
  const badgeLabel = String(nextGym?.medalla_nombre || 'Badge');
  const badgeKey = normalizeAssetToken(badgeLabel).replace(/_badge$/i, '');

  const avatarAsset = getAvatarAsset(me.avatar_id || trainerSetup.avatar_id || null, me.foto || null);
  const leadTeam = orderedTeam[0] || null;
  const averageLevel = orderedTeam.length
    ? Math.round(orderedTeam.reduce((sum, slot) => sum + Number(slot.nivel || 0), 0) / orderedTeam.length)
    : 0;
  const teamPower = orderedTeam.reduce((sum, slot) => sum + Number(slot.ataque || 0) + Number(slot.ataque_especial || 0), 0);
  const activeRegion = nextGym ? String(nextGym.region_codigo || regionCode).toUpperCase() : 'FREE';

  root.innerHTML = `
    <section class="home-command-shell">
      <div class="home-hero-v2">
        <div class="home-identity-card">
          <div class="home-identity-head">
            ${avatarAsset ? `<img class="home-avatar-xl" src="${escapeHtml(avatarAsset)}" alt="${escapeHtml(me.nombre)}" />` : `<div class="home-avatar-xl home-avatar-xl--fallback">${escapeHtml((me.nombre || 'M').charAt(0).toUpperCase())}</div>`}
            <div>
              <p class="home-kicker">Perfil del entrenador</p>
              <h3>${escapeHtml(me.nombre)}</h3>
              <div class="home-chip-row">
                <span class="badge">${escapeHtml(activeRegion)}</span>
                <span class="badge">${orderedTeam.length}/6 team</span>
                <span class="badge">${formatNumber(me.pokedolares || 0)} $</span>
                <span class="badge">${onboarding.progreso.porcentaje}% onboarding</span>
              </div>
            </div>
          </div>
          <p class="home-identity-copy">Cuenta, equipo activo y avance regional en una sola lectura. El foco principal aqui es tu roster y tu progreso.</p>
        </div>

        <div class="home-focus-card">
          <p class="home-kicker">Resumen del roster</p>
          <h4>${escapeHtml(homeState.title)}</h4>
          <p>${escapeHtml(`Starter ${trainerSetup.starter_code || 'starter'} · ${orderedTeam.length}/6 listos · ${pokemon.length} en caja.`)}</p>
          <div class="home-focus-art">
            ${leadTeam ? `<img src="${escapeHtml(getPokemonCardImage(leadTeam.pokemon_id, leadTeam.es_shiny, leadTeam.imagen))}" alt="${escapeHtml(leadTeam.nombre)}" />` : avatarAsset ? `<img src="${escapeHtml(avatarAsset)}" alt="${escapeHtml(me.nombre)}" />` : '<span class="home-focus-fallback">MM</span>'}
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
        <section class="home-panel-card home-panel-card--wide">
          <p class="home-kicker">Medallas por region</p>
          <div class="home-region-grid">
            ${renderHomeRegionMedalCard(gymCatalog, 'kanto', 'Kanto')}
            ${renderHomeRegionMedalCard(gymCatalog, 'johto', 'Johto')}
            ${renderHomeRegionMedalCard(gymCatalog, 'hoenn', 'Hoenn')}
            ${renderHomeRegionMedalCard(gymCatalog, 'zona_especial', 'Especial')}
          </div>
        </section>

        <section class="home-panel-card">
          <p class="home-kicker">Estado del mundo</p>
          <div class="home-state-grid home-state-grid--v2">
            ${renderHomeStateTile('Gym', nextGym ? leaderName : 'Libre', nextGym ? badgeLabel : 'Sin bloqueo', null, 'GYM')}
            ${renderHomeStateTile('Boss', bossState.activo ? 'Activo' : 'En espera', bossState.activo ? `Cierra en ${formatSecondsCompact(Number(bossState.segundos_para_fin || 0))}` : `Abre en ${formatSecondsCompact(Number(bossState.segundos_para_inicio || 0))}`, null, 'BOS')}
            ${renderHomeStateTile('Idle', Boolean(idleState.activa) ? 'En curso' : 'Disponible', Boolean(idleState.activa) ? `${Number(idleSession?.progreso_pct || 0)}%` : 'Listo para iniciar', null, 'IDL')}
            ${renderHomeStateTile('Mapa', activeRegion, nextGym ? 'Ruta siguiente' : 'Exploracion libre', null, 'MAP')}
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

async function renderHomeV3(refs: ShellRefs): Promise<void> {
  const root = refs.panelRoot;

  if (!sessionStore.isAuthenticated()) {
    root.innerHTML = `
      <section class="login-showcase">
        <div class="login-showcase__hero">
          <div class="login-showcase__copy">
            <p class="home-kicker">MastersMon Online</p>
            <h2>Una entrada separada del home para que el juego se sienta mejor desde el primer clic.</h2>
            <p>Usamos tu banner como portada del acceso. Cuando el usuario inicia sesion, esta pantalla desaparece y el home queda reservado para la ficha del entrenador, el team y la accion.</p>
            <div class="login-showcase__chips">
              <span class="badge">captura</span>
              <span class="badge">team builder</span>
              <span class="badge">gyms</span>
              <span class="badge">maps</span>
            </div>
            <div id="google-login-slot-v3" class="login-showcase__cta"></div>
          </div>
          <div class="login-showcase__art">
            <img src="${escapeHtml(HOME_LOGIN_BANNER)}" alt="Banner MastersMon" />
          </div>
        </div>
        <div class="login-showcase__grid">
          ${renderHomeShortcutVisual('maps', 'Mapas', 'Explorar y capturar', null, 'MAP')}
          ${renderHomeShortcutVisual('pokemon', 'My Pokemon', 'Caja y evolucion', null, 'DEX')}
          ${renderHomeShortcutVisual('team', 'Team', 'Armar tus 6 slots', null, 'TM')}
          ${renderHomeShortcutVisual('gyms', 'Gyms', 'Retos regionales', null, 'GYM')}
        </div>
      </section>
    `;

    const slot = document.getElementById('google-login-slot-v3');
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

    root.querySelectorAll('[data-go-view]').forEach((button) => {
      button.addEventListener('click', () => {
        refs.onNavigate((button as HTMLElement).dataset.goView as ViewKey);
      });
    });
    return;
  }

  const [me, trainerSetup, pokemon, team, onboarding, gymProgressRaw, bossStateRaw, idleStateRaw, gymCatalogRaw] = await Promise.all([
    sessionStore.getUser() ? Promise.resolve(sessionStore.getUser()!) : getMe(),
    playerStore.trainerSetup ? Promise.resolve(playerStore.trainerSetup) : getTrainerSetup(),
    playerStore.pokemon.length ? Promise.resolve(playerStore.pokemon) : getMyPokemon(),
    playerStore.team.length ? Promise.resolve({ equipo: playerStore.team }) : getMyTeam(),
    playerStore.onboarding ? Promise.resolve(playerStore.onboarding) : getOnboarding(),
    getGymProgress(),
    getBossState(),
    getIdleState(),
    getGymCatalog()
  ]);

  sessionStore.setUser(me);
  playerStore.trainerSetup = trainerSetup;
  playerStore.pokemon = pokemon;
  playerStore.team = team.equipo;
  playerStore.onboarding = onboarding;

  const gymProgress = gymProgressRaw as Record<string, unknown>;
  const bossState = bossStateRaw as Record<string, unknown>;
  const idleState = idleStateRaw as Record<string, unknown>;
  const gymCatalog = ((gymCatalogRaw as { gyms?: Array<Record<string, unknown>> }).gyms || []) as Array<Record<string, unknown>>;
  const orderedTeam = [...team.equipo].sort((a, b) => a.posicion - b.posicion);
  const nextGym = (gymProgress.siguiente_gym as Record<string, unknown> | null) || null;
  const idleSession = (idleState.sesion as Record<string, unknown> | null) || null;
  const regionCode = String(nextGym?.region_codigo || 'kanto').toLowerCase();
  const leaderName = String(nextGym?.lider_nombre || 'Siguiente gym');
  const badgeLabel = String(nextGym?.medalla_nombre || 'Badge');
  const avatarAsset = getAvatarAsset(me.avatar_id || trainerSetup.avatar_id || null, me.foto || null);
  const averageLevel = orderedTeam.length
    ? Math.round(orderedTeam.reduce((sum, slot) => sum + Number(slot.nivel || 0), 0) / orderedTeam.length)
    : 0;
  const teamPower = orderedTeam.reduce((sum, slot) => sum + Number(slot.ataque || 0) + Number(slot.ataque_especial || 0), 0);
  const activeRegion = nextGym ? String(nextGym.region_codigo || regionCode).toUpperCase() : 'FREE';

  root.innerHTML = `
    <section class="home-dock-shell">
      <section class="home-action-grid-v3">
        ${renderHomeActionCard('team', 'TEAM', 'Editar slots', orderedTeam.length ? `${orderedTeam.length}/6 listos` : 'arma tu core', 'Ordena, cambia y guarda tu equipo principal.')}
        ${renderHomeActionCard('pokemon', 'DEX', 'Caja', `${formatNumber(pokemon.length)} pokemon`, 'Revisa stats, movimientos y evolucion desde una sola vista.')}
        ${renderHomeActionCard('maps', 'MAP', 'Explorar', nextGym ? String(nextGym.region_codigo || activeRegion) : 'zonas activas', 'Genera encuentros, reporta presencia y captura.')}
        ${renderHomeActionCard('gyms', 'GYM', 'Gyms', nextGym ? leaderName : 'sin bloqueo', 'Continua tu ruta regional y desbloquea medallas.')}
        ${renderHomeActionCard('arena', 'PVP', 'Arena', teamPower ? formatNumber(teamPower) : '0 poder', 'Usa tu team guardado para sesiones rapidas.')}
        ${renderHomeActionCard('bossIdle', 'IDL', 'Boss / Idle', Boolean(idleState.activa) ? 'idle en curso' : 'listo', 'Farm diario, progreso pasivo y boss global.')}
      </section>

      <div class="home-dashboard-grid">
        <section class="home-panel-card">
          <p class="home-kicker">Estado del mundo</p>
          <div class="home-state-grid home-state-grid--v2">
            ${renderHomeStateTile('Gym', nextGym ? leaderName : 'Libre', nextGym ? badgeLabel : 'Sin bloqueo', null, 'GYM')}
            ${renderHomeStateTile('Boss', bossState.activo ? 'Activo' : 'En espera', bossState.activo ? `Cierra en ${formatSecondsCompact(Number(bossState.segundos_para_fin || 0))}` : `Abre en ${formatSecondsCompact(Number(bossState.segundos_para_inicio || 0))}`, null, 'BOS')}
            ${renderHomeStateTile('Idle', Boolean(idleState.activa) ? 'En curso' : 'Disponible', Boolean(idleState.activa) ? `${Number(idleSession?.progreso_pct || 0)}%` : 'Listo para iniciar', null, 'IDL')}
            ${renderHomeStateTile('Mapa', activeRegion, nextGym ? 'Ruta siguiente' : 'Exploracion libre', null, 'MAP')}
          </div>
        </section>
        <section class="home-panel-card">
          <p class="home-kicker">Medallas por region</p>
          <div class="home-region-grid">
            ${renderHomeRegionMedalCard(gymCatalog, 'kanto', 'Kanto')}
            ${renderHomeRegionMedalCard(gymCatalog, 'johto', 'Johto')}
            ${renderHomeRegionMedalCard(gymCatalog, 'hoenn', 'Hoenn')}
            ${renderHomeRegionMedalCard(gymCatalog, 'zona_especial', 'Especial')}
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

async function renderPokemonV2(refs: ShellRefs): Promise<void> {
  ensureAuthenticated(refs.panelRoot, refs.onNavigate);
  const [pokemon, items] = await Promise.all([getMyPokemon(), getMyItems()]);
  playerStore.pokemon = pokemon;
  playerStore.items = items;

  const summary = {
    total: pokemon.length,
    shiny: pokemon.filter((row) => row.es_shiny).length,
    average: pokemon.length ? Math.round(pokemon.reduce((sum, row) => sum + Number(row.nivel || 0), 0) / pokemon.length) : 0,
    items: items.reduce((sum, row) => sum + Number(row.cantidad || 0), 0)
  };

  refs.panelRoot.innerHTML = `
    <section class="pokemon-shell-v2">
      <section class="section-card">
        <div class="pokemon-topbar-v2">
          <div class="pokemon-title-copy">
            <h3>My Pokemon</h3>
            <p>Tu caja ahora tiene filtros utiles, acceso rapido a movimientos, evolucion y gestion directa desde una sola vista.</p>
          </div>
          <div class="home-chip-row">
            <span class="badge">${summary.total} en caja</span>
            <span class="badge">${summary.shiny} shiny</span>
            <span class="badge">Lv ${summary.average || 0}</span>
          </div>
        </div>
      </section>

      <section class="pokemon-summary-strip">
        <article class="pokemon-summary-tile"><span>Total</span><strong>${formatNumber(summary.total)}</strong></article>
        <article class="pokemon-summary-tile"><span>Shiny</span><strong>${formatNumber(summary.shiny)}</strong></article>
        <article class="pokemon-summary-tile"><span>Lv promedio</span><strong>${summary.average ? `Lv ${summary.average}` : 'Lv 0'}</strong></article>
        <article class="pokemon-summary-tile"><span>Items</span><strong>${formatNumber(summary.items)}</strong></article>
      </section>

      <section class="section-card">
        <div class="pokemon-filter-bar">
          <div class="pokemon-filter-field">
            <label for="pokemon-search-v2">Buscar</label>
            <input id="pokemon-search-v2" class="input" type="text" placeholder="Nombre o tipo" />
          </div>
          <div class="pokemon-filter-field">
            <label for="pokemon-type-v2">Tipo</label>
            <select id="pokemon-type-v2" class="select">
              <option value="">Todos</option>
              ${Array.from(new Set(pokemon.flatMap((row) => String(row.tipo || '').split('/').map((part) => part.trim()).filter(Boolean)))).sort().map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('')}
            </select>
          </div>
          <div class="pokemon-filter-field">
            <label for="pokemon-rare-v2">Rareza</label>
            <select id="pokemon-rare-v2" class="select">
              <option value="">Todos</option>
              <option value="normal">Normal</option>
              <option value="shiny">Shiny</option>
            </select>
          </div>
          <div class="pokemon-filter-field">
            <label for="pokemon-sort-v2">Orden</label>
            <select id="pokemon-sort-v2" class="select">
              <option value="level_desc">Nivel</option>
              <option value="id_asc">ID</option>
              <option value="name_asc">Nombre</option>
              <option value="attack_desc">Ataque</option>
            </select>
          </div>
        </div>
      </section>

      <section class="pokemon-inventory-strip">
        ${items.map((item) => {
          const asset = getItemAsset(item.item_codigo || null);
          return `
            <article class="pokemon-inventory-chip">
              <div class="pokemon-inventory-chip__media">
                ${asset ? `<img src="${escapeHtml(asset)}" alt="${escapeHtml(item.nombre)}" />` : `<span class="home-thumb-fallback">${escapeHtml(String(item.nombre || 'IT').slice(0, 2).toUpperCase())}</span>`}
              </div>
              <div>
                <strong>${escapeHtml(item.nombre)}</strong>
                <small>x${formatNumber(item.cantidad || 0)}</small>
              </div>
            </article>
          `;
        }).join('') || '<div class="empty-state">No hay items visibles todavia.</div>'}
      </section>

      <section class="section-card">
        <div id="pokemon-grid-v2" class="pokemon-grid-v2"></div>
      </section>
    </section>
  `;

  const search = document.getElementById('pokemon-search-v2') as HTMLInputElement | null;
  const type = document.getElementById('pokemon-type-v2') as HTMLSelectElement | null;
  const rare = document.getElementById('pokemon-rare-v2') as HTMLSelectElement | null;
  const sort = document.getElementById('pokemon-sort-v2') as HTMLSelectElement | null;
  const grid = document.getElementById('pokemon-grid-v2') as HTMLElement | null;
  const pokemonMap = new Map(pokemon.map((row) => [row.id, row]));

  const paint = (): void => {
    if (!grid) return;
    const rows = filterPokemonCollection(pokemon, {
      search: search?.value || '',
      type: type?.value || '',
      rare: rare?.value || '',
      sort: sort?.value || 'level_desc'
    });

    grid.innerHTML = rows.length
      ? rows.map(renderPokemonCardV2).join('')
      : '<div class="empty-state">No hay resultados con esos filtros.</div>';

    grid.querySelectorAll<HTMLElement>('[data-pokemon-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const action = String(button.dataset.pokemonAction || '');
        const pokemonId = Number(button.dataset.pokemonId || 0);
        const row = pokemonMap.get(pokemonId);
        if (!row) return;

        if (action === 'moves') {
          await openPokemonMovesModal(row);
          return;
        }

        if (action === 'evolve') {
          await openPokemonEvolutionModal(row, refs);
          return;
        }

        if (action === 'release') {
          await confirmReleasePokemon(row, refs);
        }
      });
    });

    grid.querySelectorAll<HTMLElement>('[data-pokemon-inspect]').forEach((card) => {
      const openInspect = async (): Promise<void> => {
        const pokemonId = Number(card.dataset.pokemonInspect || 0);
        const row = pokemonMap.get(pokemonId);
        if (!row) return;
        await openPokemonDetailModal(row, refs);
      };

      card.addEventListener('click', async (event) => {
        if ((event.target as HTMLElement).closest('[data-pokemon-action]')) return;
        await openInspect();
      });

      card.addEventListener('keydown', async (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        await openInspect();
      });
    });
  };

  [search, type, rare, sort].forEach((node) => node?.addEventListener('input', paint));
  type?.addEventListener('change', paint);
  rare?.addEventListener('change', paint);
  sort?.addEventListener('change', paint);
  paint();
}

async function renderTeamV2(refs: ShellRefs): Promise<void> {
  ensureAuthenticated(refs.panelRoot, refs.onNavigate);
  const [teamResult, pokemon] = await Promise.all([getMyTeam(), getMyPokemon()]);
  playerStore.team = teamResult.equipo;
  playerStore.pokemon = pokemon;

  const orderedTeam = [...teamResult.equipo].sort((a, b) => a.posicion - b.posicion);
  const teamSlots = Array.from({ length: 6 }, (_, index) => orderedTeam.find((slot) => slot.posicion === index + 1) || null);
  const pokemonMap = new Map(pokemon.map((row) => [row.id, row]));
  let selectedSlot = Math.max(1, teamSlots.findIndex((slot) => !slot) + 1 || 1);

  refs.panelRoot.innerHTML = `
    <section class="team-builder-shell">
      <section class="section-card">
        <div class="pokemon-topbar-v2">
          <div class="pokemon-title-copy">
            <h3>Team Builder</h3>
            <p>Selecciona un slot y asigna tu Pokemon con un flujo mas claro. El slot 1 funciona como lider visible del equipo.</p>
          </div>
          <div class="home-chip-row">
            <span class="badge">${orderedTeam.length}/6 slots</span>
            <span class="badge">${formatNumber(pokemon.length)} en caja</span>
          </div>
        </div>
      </section>
      <section class="team-builder-layout">
        <section class="section-card">
          <div class="team-builder-board">
            <div id="team-slot-grid" class="team-slot-grid"></div>
            <div class="team-builder-actions">
              <button id="team-save-btn">Guardar team</button>
              <button id="team-autofill-btn" class="secondary-button">Auto fill</button>
              <button id="team-clear-btn" class="ghost-button">Limpiar</button>
            </div>
          </div>
        </section>
        <section class="section-card">
          <div class="pokemon-filter-bar">
            <div class="pokemon-filter-field">
              <label for="team-search">Buscar</label>
              <input id="team-search" class="input" type="text" placeholder="Nombre o tipo" />
            </div>
          </div>
          <div id="team-roster-grid" class="team-roster-grid"></div>
        </section>
      </section>
    </section>
  `;

  const slotGrid = document.getElementById('team-slot-grid') as HTMLElement | null;
  const rosterGrid = document.getElementById('team-roster-grid') as HTMLElement | null;
  const search = document.getElementById('team-search') as HTMLInputElement | null;

  const paint = (): void => {
    if (!slotGrid || !rosterGrid) return;
    slotGrid.innerHTML = teamSlots.map((slot, index) => renderTeamBuilderSlot(slot, index + 1, selectedSlot === index + 1)).join('');

    const searchValue = String(search?.value || '').trim().toLowerCase();
    const assignedIds = new Set(teamSlots.filter(Boolean).map((slot) => Number(slot?.id || 0)));
    const rows = pokemon.filter((row) => {
      const haystack = `${row.nombre} ${row.tipo || ''}`.toLowerCase();
      return !searchValue || haystack.includes(searchValue);
    });

    rosterGrid.innerHTML = rows.map((row) => renderTeamRosterCard(row, assignedIds.has(row.id), selectedSlot)).join('');

    slotGrid.querySelectorAll<HTMLElement>('[data-team-slot]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedSlot = Number(button.dataset.teamSlot || 1);
        paint();
      });
    });

    slotGrid.querySelectorAll<HTMLElement>('[data-team-remove]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const slotIndex = Number(button.dataset.teamRemove || 1) - 1;
        teamSlots[slotIndex] = null;
        paint();
      });
    });

    rosterGrid.querySelectorAll<HTMLElement>('[data-team-assign]').forEach((button) => {
      button.addEventListener('click', () => {
        const pokemonId = Number(button.dataset.teamAssign || 0);
        const row = pokemonMap.get(pokemonId);
        if (!row) return;
        const existingIndex = teamSlots.findIndex((slot) => Number(slot?.id || 0) === pokemonId);
        if (existingIndex >= 0) teamSlots[existingIndex] = null;
        teamSlots[selectedSlot - 1] = { ...row, posicion: selectedSlot, es_lider: selectedSlot === 1 };
        paint();
      });
    });

    rosterGrid.querySelectorAll<HTMLElement>('[data-team-inspect]').forEach((button) => {
      button.addEventListener('click', async () => {
        const pokemonId = Number(button.dataset.teamInspect || 0);
        const row = pokemonMap.get(pokemonId);
        if (!row) return;
        await openPokemonDetailModal(row, refs);
      });
    });
  };

  document.getElementById('team-save-btn')?.addEventListener('click', async () => {
    const ids = teamSlots.filter(Boolean).map((slot) => Number(slot?.id || 0));
    await saveTeamIds(ids, refs);
  });

  document.getElementById('team-autofill-btn')?.addEventListener('click', () => {
    pokemon.slice(0, 6).forEach((row, index) => {
      teamSlots[index] = { ...row, posicion: index + 1, es_lider: index === 0 };
    });
    selectedSlot = Math.min(6, pokemon.slice(0, 6).length || 1);
    paint();
  });

  document.getElementById('team-clear-btn')?.addEventListener('click', () => {
    for (let index = 0; index < teamSlots.length; index += 1) teamSlots[index] = null;
    selectedSlot = 1;
    paint();
  });

  search?.addEventListener('input', paint);
  paint();
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
    playerStore.team = ids
      .map((id, index) => {
        const row = playerStore.pokemon.find((pokemon) => pokemon.id === id);
        return row ? { ...row, posicion: index + 1, es_lider: index === 0 } : null;
      })
      .filter(Boolean) as TeamSlot[];
    showToast('Equipo', result.ok ? 'Equipo guardado correctamente' : 'No se pudo guardar');
    await renderTeamV2(refs);
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

async function renderMapsV2(refs: ShellRefs): Promise<void> {
  ensureAuthenticated(refs.panelRoot, refs.onNavigate);
  const [zones, items] = await Promise.all([getZones(), getMyItems()]);
  playerStore.items = items;
  const balls = items.filter((item) => (item.item_codigo || '').includes('ball'));
  let selectedZoneId = Number(zones[0]?.id || 0);
  let selectedBallId = Number(balls[0]?.item_id || 0);
  let currentEncounter: Record<string, unknown> | null = null;
  let presenceSnapshot: Record<string, unknown> | null = null;
  let avatarPos = { x: 48, y: 58 };
  const user = sessionStore.getUser();
  const avatarAsset = getAvatarAsset(user?.avatar_id || null, user?.foto || null);

  refs.panelRoot.innerHTML = `
    <section class="maps-shell">
      <section class="section-card">
        <div class="pokemon-topbar-v2">
          <div class="pokemon-title-copy">
            <h3>Maps Explorer</h3>
            <p>Selecciona una zona, registra presencia y genera encuentros desde un flujo continuo. La captura queda visible con la Pokeball que elijas.</p>
          </div>
          <div class="home-chip-row">
            <span class="badge">${formatNumber(zones.length)} zonas</span>
            <span class="badge">${formatNumber(balls.length)} balls</span>
          </div>
        </div>
      </section>
      <section class="maps-layout">
        <section class="section-card">
          <div id="maps-zone-grid" class="maps-zone-grid"></div>
        </section>
        <section class="section-card">
          <div id="maps-detail-panel"></div>
        </section>
      </section>
    </section>
  `;

  const zoneGrid = document.getElementById('maps-zone-grid') as HTMLElement | null;
  const detailPanel = document.getElementById('maps-detail-panel') as HTMLElement | null;

  const paint = (): void => {
    if (!zoneGrid || !detailPanel) return;
    const zone = zones.find((row) => Number(row.id) === selectedZoneId) || zones[0] || null;
    zoneGrid.innerHTML = zones.map((row) => renderMapZoneCard(row, Number(row.id) === selectedZoneId)).join('');

    detailPanel.innerHTML = zone
      ? renderMapDetailPanel(zone, presenceSnapshot, currentEncounter, balls, selectedBallId, avatarPos, avatarAsset)
      : '<div class="empty-state">No hay zonas disponibles.</div>';

    zoneGrid.querySelectorAll<HTMLElement>('[data-zone-pick]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedZoneId = Number(button.dataset.zonePick || 0);
        currentEncounter = null;
        presenceSnapshot = null;
        avatarPos = { x: 48, y: 58 };
        paint();
      });
    });

    detailPanel.querySelectorAll<HTMLElement>('[data-ball-pick]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedBallId = Number(button.dataset.ballPick || 0);
        paint();
      });
    });

    detailPanel.querySelector<HTMLElement>('[data-map-presence]')?.addEventListener('click', async () => {
      if (!zone) return;
      try {
        await updatePresence(zone.id, 'entry');
        presenceSnapshot = await getPresence(zone.id) as Record<string, unknown>;
        showToast('Maps', `Presencia registrada en ${zone.nombre}`);
        paint();
      } catch (error) {
        showToast('Maps', error instanceof Error ? error.message : 'No se pudo actualizar presencia');
      }
    });

    detailPanel.querySelector<HTMLElement>('[data-map-encounter]')?.addEventListener('click', async () => {
      if (!zone) return;
      try {
        currentEncounter = await generateEncounter(zone.id) as Record<string, unknown>;
        if (!currentEncounter.encuentro_token) {
          showToast('Maps', 'No se genero encuentro esta vez');
        } else if (Boolean(currentEncounter.es_shiny)) {
          showToast('Shiny encontrado', `${String(currentEncounter.nombre || 'Pokemon')} aparecio en version shiny`);
        }
        paint();
      } catch (error) {
        showToast('Maps', error instanceof Error ? error.message : 'No se pudo generar encuentro');
      }
    });

    detailPanel.querySelector<HTMLElement>('[data-map-capture]')?.addEventListener('click', async () => {
      if (!currentEncounter?.encuentro_token) return;
      const selectedBall = balls.find((item) => Number(item.item_id) === selectedBallId) || null;
      if (!selectedBall) {
        showToast('Captura', 'No tienes una Pokeball seleccionada');
        return;
      }
      try {
        const capture = await tryCapture({
          pokemon_id: Number(currentEncounter.pokemon_id || 0),
          nivel: Number(currentEncounter.nivel || 1),
          es_shiny: Boolean(currentEncounter.es_shiny),
          hp_actual: Number(currentEncounter.hp || currentEncounter.hp_max || 100),
          hp_maximo: Number(currentEncounter.hp_max || currentEncounter.hp || 100),
          item_id: Number(selectedBall.item_id),
          encuentro_token: String(currentEncounter.encuentro_token)
        });
        showJsonModal('Resultado de captura', capture, refs.panelRoot);
      } catch (error) {
        showToast('Captura', error instanceof Error ? error.message : 'No se pudo capturar');
      }
    });

    detailPanel.querySelectorAll<HTMLElement>('[data-map-move]').forEach((button) => {
      button.addEventListener('click', () => {
        const move = String(button.dataset.mapMove || '');
        const step = 9;
        if (move === 'north') avatarPos.y = Math.max(14, avatarPos.y - step);
        if (move === 'south') avatarPos.y = Math.min(82, avatarPos.y + step);
        if (move === 'west') avatarPos.x = Math.max(10, avatarPos.x - step);
        if (move === 'east') avatarPos.x = Math.min(86, avatarPos.x + step);
        if (move === 'center') avatarPos = { x: 48, y: 58 };
        paint();
      });
    });
  };

  paint();
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

async function renderGymsV2(refs: ShellRefs): Promise<void> {
  ensureAuthenticated(refs.panelRoot, refs.onNavigate);
  const [catalog, progress, team] = await Promise.all([getGymCatalog(), getGymProgress(), getMyTeam()]);
  playerStore.team = team.equipo;
  const gyms = (catalog as { gyms?: Array<Record<string, unknown>> }).gyms || [];
  const progressData = progress as Record<string, unknown>;

  refs.panelRoot.innerHTML = `
    <section class="team-builder-shell">
      <section class="section-card">
        <div class="pokemon-topbar-v2">
          <div class="pokemon-title-copy">
            <h3>Gyms</h3>
            <p>Ruta regional, medallas y acceso rapido a cada lider sin dejar un espacio muerto en la vista.</p>
          </div>
          <div class="home-chip-row">
            <span class="badge">${progressData.completados ?? 0} completos</span>
            <span class="badge">${progressData.desbloqueados ?? 0} desbloqueados</span>
            <span class="badge">${progressData.porcentaje ?? 0}%</span>
          </div>
        </div>
      </section>

      <section class="section-grid">
        <div class="metric-card"><span>Total Gyms</span><strong>${progressData.total_gyms ?? 0}</strong></div>
        <div class="metric-card"><span>Completados</span><strong>${progressData.completados ?? 0}</strong></div>
        <div class="metric-card"><span>Desbloqueados</span><strong>${progressData.desbloqueados ?? 0}</strong></div>
        <div class="metric-card"><span>Team listo</span><strong>${playerStore.team.length}/6</strong></div>
      </section>

      <section class="gym-grid gym-grid--v2">
        ${gyms.map((gym) => {
          const region = String(gym.region_codigo || gym.region_nombre || '');
          const leader = String(gym.lider_nombre || gym.codigo || 'Gym');
          const badge = String(gym.medalla_nombre || 'Medalla');
          const trainerAsset = getTrainerAsset(region, leader, gym.trainer_asset_path as string | undefined);
          const badgeAsset = getBadgeAsset(region, badge, gym.badge_asset_path as string | undefined);
          return `
            <article class="gym-card gym-card--v2">
              <div class="gym-card__media">
                ${trainerAsset ? `<img src="${escapeHtml(trainerAsset)}" alt="${escapeHtml(leader)}" />` : `<span class="home-thumb-fallback">GYM</span>`}
              </div>
              <div class="gym-card__copy">
                <strong>${escapeHtml(leader)}</strong>
                <small>${escapeHtml(String(gym.region_nombre || gym.region_codigo || 'region'))}</small>
                <div class="home-chip-row">
                  <span class="badge ${gym.desbloqueado ? 'success' : ''}">${gym.desbloqueado ? 'Desbloqueado' : 'Bloqueado'}</span>
                  <span class="badge ${gym.completado ? 'warning' : ''}">${gym.completado ? 'Completado' : 'Pendiente'}</span>
                </div>
                <div class="gym-card__badge-row">
                  ${badgeAsset ? `<img src="${escapeHtml(badgeAsset)}" alt="${escapeHtml(badge)}" />` : `<span class="badge">${escapeHtml(badge)}</span>`}
                </div>
              </div>
              <button class="pokemon-action-btn is-accent" data-start-gym-v2="${escapeHtml(String(gym.codigo || ''))}" ${gym.desbloqueado ? '' : 'disabled'}>Entrar</button>
            </article>
          `;
        }).join('')}
      </section>
    </section>
  `;

  refs.panelRoot.querySelectorAll<HTMLElement>('[data-start-gym-v2]').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.dataset.startGymV2 || '';
      if (!code) return;
      try {
        const result = await startGym(code, playerStore.team.map((row) => row.id));
        const token = String((result as Record<string, unknown>).gym_session_token || '');
        const backdrop = openOverlayModal(`
          <div class="modal-head">
            <div>
              <p class="home-kicker">Sesion de Gym</p>
              <h3>${escapeHtml(code)}</h3>
            </div>
            <button class="modal-close" data-close-overlay="1">X</button>
          </div>
          <div class="evolution-layout">
            <div class="code-box">gym_session_token = ${escapeHtml(token)}</div>
            <button class="pokemon-action-btn is-accent" data-claim-gym-v2="1">Reclamar victoria</button>
          </div>
        `);
        backdrop.querySelector<HTMLElement>('[data-claim-gym-v2]')?.addEventListener('click', async () => {
          try {
            const reward = await claimGymReward(token, true, 12);
            closeOverlayModal();
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
  const icon = WORLD_ICON_MAP[label] || fallback;
  return `
    <article class="home-state-tile">
      ${renderThumbVisual(imageUrl, icon, 'home-state-tile__thumb', 'home-thumb-fallback')}
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

function renderHomeRegionMedalCard(gyms: Array<Record<string, unknown>>, regionCode: string, regionLabel: string): string {
  const rows = gyms.filter((gym) => String(gym.region_codigo || '').toLowerCase() === regionCode);
  const completed = rows.filter((gym) => Boolean(gym.completado)).length;
  const total = rows.length || 8;
  const badges = rows.length
    ? rows.map((gym) => {
        const badgeLabel = String(gym.medalla_nombre || 'badge');
        const badgeKey = normalizeAssetToken(badgeLabel).replace(/_badge$/i, '');
        const badgeAsset = getBadgeAsset(regionCode, badgeKey, gym.badge_asset_path as string | undefined);
        const completedGym = Boolean(gym.completado);
        return `
          <span class="home-region-badge ${completedGym ? 'is-earned' : 'is-locked'}">
            ${badgeAsset ? `<img src="${escapeHtml(badgeAsset)}" alt="${escapeHtml(badgeLabel)}" />` : `<span>${escapeHtml(badgeLabel.slice(0, 2).toUpperCase())}</span>`}
          </span>
        `;
      }).join('')
    : Array.from({ length: 8 }, () => '<span class="home-region-badge is-locked"><span>--</span></span>').join('');

  return `
    <article class="home-region-card">
      <div class="home-region-card__head">
        <strong>${escapeHtml(regionLabel)}</strong>
        <span class="badge">${completed}/${total}</span>
      </div>
      <div class="home-region-badge-row">
        ${badges}
      </div>
    </article>
  `;
}

function filterPokemonCollection(
  rows: PlayerPokemon[],
  filters: { search: string; type: string; rare: string; sort: string }
): PlayerPokemon[] {
  const search = String(filters.search || '').trim().toLowerCase();
  const type = String(filters.type || '').trim().toLowerCase();
  const rare = String(filters.rare || '').trim().toLowerCase();
  const sort = String(filters.sort || 'level_desc');

  const filtered = rows.filter((row) => {
    const haystack = `${row.nombre} ${row.tipo || ''}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesType = !type || String(row.tipo || '').toLowerCase().split('/').map((part) => part.trim()).includes(type);
    const matchesRare = !rare || (rare === 'shiny' ? row.es_shiny : !row.es_shiny);
    return matchesSearch && matchesType && matchesRare;
  });

  filtered.sort((left, right) => {
    if (sort === 'id_asc') return left.pokemon_id - right.pokemon_id;
    if (sort === 'name_asc') return left.nombre.localeCompare(right.nombre);
    if (sort === 'attack_desc') return Number(right.ataque || 0) - Number(left.ataque || 0);
    return Number(right.nivel || 0) - Number(left.nivel || 0);
  });

  return filtered;
}

function renderPokemonCardV2(row: PlayerPokemon): string {
  const progress = Math.max(8, Math.min(100, Number(row.experiencia_total || row.experiencia || row.nivel || 1) % 100));
  return `
    <article class="pokemon-card-v2" data-rare="${row.es_shiny ? 'shiny' : 'normal'}" data-pokemon-inspect="${row.id}" role="button" tabindex="0" aria-label="Ver atributos de ${escapeHtml(row.nombre)}">
      <div class="pokemon-card-v2__head">
        <div>
          <strong class="pokemon-detail-title">${escapeHtml(row.nombre)}</strong>
          <small>#${row.pokemon_id} · ${escapeHtml(row.tipo || 'Tipo libre')}</small>
        </div>
        <div class="home-chip-row">
          <span class="badge">${row.es_shiny ? 'shiny' : 'normal'}</span>
          <span class="badge">Lv ${row.nivel}</span>
        </div>
      </div>
      <div class="pokemon-card-v2__art">
        <img src="${escapeHtml(getPokemonCardImage(row.pokemon_id, row.es_shiny, row.imagen))}" alt="${escapeHtml(row.nombre)}" />
      </div>
      <div class="pokemon-card-v2__body">
        <div class="pokemon-meta-grid">
          <div class="pokemon-meta-pill"><span>HP</span><strong>${formatNumber(Number(row.hp_actual || row.hp_max || 0))}</strong></div>
          <div class="pokemon-meta-pill"><span>ATK</span><strong>${formatNumber(Number(row.ataque || 0))}</strong></div>
          <div class="pokemon-meta-pill"><span>DEF</span><strong>${formatNumber(Number(row.defensa || 0))}</strong></div>
          <div class="pokemon-meta-pill"><span>SPD</span><strong>${formatNumber(Number(row.velocidad || 0))}</strong></div>
        </div>
        <div class="pokemon-meta-line">Progreso visible</div>
        <div class="pokemon-progress-bar"><span style="width:${progress}%"></span></div>
        <div class="pokemon-card-v2__hint">Click para ver atributos completos</div>
      </div>
      <div class="pokemon-card-v2__actions">
        <button class="pokemon-action-btn is-accent" data-pokemon-action="moves" data-pokemon-id="${row.id}">Movimientos</button>
        <button class="pokemon-action-btn" data-pokemon-action="evolve" data-pokemon-id="${row.id}">Evolucionar</button>
        <button class="pokemon-action-btn is-danger" data-pokemon-action="release" data-pokemon-id="${row.id}">Liberar</button>
      </div>
    </article>`;
}

function closeOverlayModal(): void {
  document.querySelector('.overlay-modal-backdrop')?.remove();
}

function openOverlayModal(content: string): HTMLDivElement {
  closeOverlayModal();
  const backdrop = document.createElement('div');
  backdrop.className = 'overlay-modal-backdrop';
  backdrop.innerHTML = `<div class="overlay-modal-card">${content}</div>`;
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop || (event.target as HTMLElement).closest('[data-close-overlay]')) {
      closeOverlayModal();
    }
  });
  document.body.appendChild(backdrop);
  return backdrop;
}

async function openPokemonMovesModal(row: PlayerPokemon): Promise<void> {
  const backdrop = openOverlayModal(`
    <div class="modal-head">
      <div>
        <p class="home-kicker">Moves</p>
        <h3>${escapeHtml(row.nombre)}</h3>
      </div>
      <button class="modal-close" data-close-overlay="1">X</button>
    </div>
    <div class="empty-state">Cargando movimientos...</div>
  `);

  const state = {
    selectedSlot: 1,
    selectedMoveId: 0,
    data: await getPokemonMoves(row.id) as PokemonMovesResponse
  };

  const render = (): void => {
    const equippedBySlot = new Map<number, PokemonMoveRow>();
    (state.data.movimientos || []).forEach((move) => {
      if (move.slot) equippedBySlot.set(Number(move.slot), move);
    });
    if (!state.selectedMoveId) {
      state.selectedMoveId = Number(equippedBySlot.get(state.selectedSlot)?.movimiento_id || 0);
    }

    const selectedMove = (state.data.movimientos || []).find((move) => Number(move.movimiento_id) === Number(state.selectedMoveId)) || null;
    const slotsHtml = Array.from({ length: 4 }, (_, index) => {
      const slot = index + 1;
      const move = equippedBySlot.get(slot) || null;
      return `
        <button class="move-slot ${slot === state.selectedSlot ? 'is-selected' : ''}" data-slot-select="${slot}">
          <div class="move-slot-top">
            <strong>Slot ${slot}</strong>
            <span class="badge">${move ? 'equipado' : 'vacio'}</span>
          </div>
          <small>${move ? escapeHtml(move.nombre) : 'Selecciona un movimiento'}</small>
        </button>
      `;
    }).join('');

    const movesHtml = (state.data.movimientos || []).map((move) => `
      <button class="move-card ${Number(move.movimiento_id) === Number(state.selectedMoveId) ? 'is-selected' : ''}" data-move-select="${move.movimiento_id}">
        <div class="move-card-top">
          <div>
            <strong>${escapeHtml(move.nombre)}</strong>
            <small>${escapeHtml(move.descripcion || 'Movimiento desbloqueado')}</small>
          </div>
          <span class="badge">${move.slot ? `slot ${move.slot}` : 'libre'}</span>
        </div>
        <div class="move-pill-row">
          <span class="move-pill">${escapeHtml(move.tipo || 'neutral')}</span>
          <span class="move-pill">${escapeHtml(move.categoria || 'status')}</span>
          <span class="move-pill">Lv ${Number(move.nivel_requerido || 1)}</span>
        </div>
        <div class="move-stat-row">
          <span class="move-stat">Power ${formatNumber(Number(move.potencia || 0))}</span>
          <span class="move-stat">Acc ${formatNumber(Number(move.precision_pct || 0))}%</span>
          <span class="move-stat">CD ${formatNumber(Number(move.cooldown_turnos || 0))}</span>
        </div>
      </button>
    `).join('');

    const actionLabel = selectedMove ? `Equipar ${selectedMove.nombre} en slot ${state.selectedSlot}` : 'Elige un movimiento';
    backdrop.querySelector('.overlay-modal-card')!.innerHTML = `
      <div class="modal-head">
        <div>
          <p class="home-kicker">Moves</p>
          <h3>${escapeHtml(row.nombre)}</h3>
          <div class="modal-chip-row">
            <span class="badge">${escapeHtml(state.data.usuario_pokemon?.tipo || row.tipo || 'tipo')}</span>
            <span class="badge">Lv ${state.data.usuario_pokemon?.nivel || row.nivel}</span>
            <span class="badge">${state.data.movimientos.length} moves</span>
          </div>
        </div>
        <button class="modal-close" data-close-overlay="1">X</button>
      </div>
      <div class="move-layout">
        <div class="move-slot-list">${slotsHtml}</div>
        <div class="move-card-list">
          ${movesHtml}
          <button class="pokemon-action-btn is-accent" data-move-equip="${selectedMove ? selectedMove.movimiento_id : ''}" ${selectedMove ? '' : 'disabled'}>${escapeHtml(actionLabel)}</button>
        </div>
      </div>
    `;

    backdrop.querySelectorAll<HTMLElement>('[data-slot-select]').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedSlot = Number(button.dataset.slotSelect || 1);
        state.selectedMoveId = Number(equippedBySlot.get(state.selectedSlot)?.movimiento_id || state.selectedMoveId || 0);
        render();
      });
    });

    backdrop.querySelectorAll<HTMLElement>('[data-move-select]').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedMoveId = Number(button.dataset.moveSelect || 0);
        render();
      });
    });

    backdrop.querySelector<HTMLElement>('[data-move-equip]')?.addEventListener('click', async () => {
      if (!state.selectedMoveId) return;
      const result = await equipPokemonMove(row.id, state.selectedMoveId, state.selectedSlot);
      state.data = {
        ...state.data,
        movimientos: result.movimientos,
        equipados: result.equipados
      };
      showToast('Moves', 'Movimiento equipado');
      render();
    });
  };

  render();
}

async function openPokemonDetailModal(row: PlayerPokemon, refs: ShellRefs): Promise<void> {
  const progress = Math.max(8, Math.min(100, Number(row.experiencia_total || row.experiencia || row.nivel || 1) % 100));
  const totalPower = Number(row.ataque || 0) + Number(row.ataque_especial || 0) + Number(row.velocidad || 0);
  const backdrop = openOverlayModal(`
    <div class="modal-head">
      <div>
        <p class="home-kicker">Atributos del Pokemon</p>
        <h3>${escapeHtml(row.nombre)}</h3>
        <div class="modal-chip-row">
          <span class="badge">#${row.pokemon_id}</span>
          <span class="badge">${escapeHtml(row.tipo || 'sin tipo')}</span>
          <span class="badge">Lv ${row.nivel}</span>
          ${row.es_shiny ? '<span class="badge shiny">shiny</span>' : ''}
        </div>
      </div>
      <button class="modal-close" data-close-overlay="1">X</button>
    </div>
    <div class="pokemon-inspect-layout">
      <article class="pokemon-inspect-hero">
        <div class="pokemon-inspect-art">
          <img src="${escapeHtml(getPokemonCardImage(row.pokemon_id, row.es_shiny, row.imagen))}" alt="${escapeHtml(row.nombre)}" />
        </div>
        <div class="pokemon-inspect-summary">
          <div class="pokemon-inspect-summary__row">
            <span>Rareza</span>
            <strong>${row.es_shiny ? 'Shiny' : `Rareza ${formatNumber(Number(row.rareza || 1))}`}</strong>
          </div>
          <div class="pokemon-inspect-summary__row">
            <span>Generacion</span>
            <strong>${formatNumber(Number(row.generacion || 1))}</strong>
          </div>
          <div class="pokemon-inspect-summary__row">
            <span>Victorias</span>
            <strong>${formatNumber(Number(row.victorias_total || 0))}</strong>
          </div>
          <div class="pokemon-inspect-summary__row">
            <span>Poder visible</span>
            <strong>${formatNumber(totalPower)}</strong>
          </div>
        </div>
      </article>

      <section class="pokemon-inspect-stats">
        <article class="pokemon-meta-pill"><span>HP</span><strong>${formatNumber(Number(row.hp_actual || row.hp_max || 0))}</strong></article>
        <article class="pokemon-meta-pill"><span>HP Max</span><strong>${formatNumber(Number(row.hp_max || 0))}</strong></article>
        <article class="pokemon-meta-pill"><span>ATK</span><strong>${formatNumber(Number(row.ataque || 0))}</strong></article>
        <article class="pokemon-meta-pill"><span>DEF</span><strong>${formatNumber(Number(row.defensa || 0))}</strong></article>
        <article class="pokemon-meta-pill"><span>SP ATK</span><strong>${formatNumber(Number(row.ataque_especial || 0))}</strong></article>
        <article class="pokemon-meta-pill"><span>SPD</span><strong>${formatNumber(Number(row.velocidad || 0))}</strong></article>
      </section>

      <section class="pokemon-inspect-progress">
        <div class="pokemon-meta-line">Experiencia</div>
        <div class="pokemon-progress-bar"><span style="width:${progress}%"></span></div>
        <div class="pokemon-inspect-progress__copy">
          <span>Total ${formatNumber(Number(row.experiencia_total || 0))}</span>
          <span>Base ${formatNumber(Number(row.experiencia || 0))}</span>
        </div>
      </section>

      <div class="pokemon-inspect-actions">
        <button class="pokemon-action-btn is-accent" data-detail-action="moves">Ver movimientos</button>
        <button class="pokemon-action-btn" data-detail-action="evolve">Intentar evolucion</button>
        <button class="pokemon-action-btn is-danger" data-detail-action="release">Liberar</button>
      </div>
    </div>
  `);

  backdrop.querySelectorAll<HTMLElement>('[data-detail-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const action = String(button.dataset.detailAction || '');
      if (action === 'moves') {
        await openPokemonMovesModal(row);
        return;
      }
      if (action === 'evolve') {
        await openPokemonEvolutionModal(row, refs);
        return;
      }
      if (action === 'release') {
        await confirmReleasePokemon(row, refs);
      }
    });
  });
}

async function openPokemonEvolutionModal(row: PlayerPokemon, refs: ShellRefs): Promise<void> {
  const user = sessionStore.getUser();
  if (!user) return;

  const state = await getPokemonEvolutionState(row.id);
  if (!state.puede_evolucionar) {
    showToast('Evolucion', state.motivo || 'Este Pokemon no puede evolucionar ahora');
    return;
  }

  const options = state.opciones || [];
  let selected = options.find((option) => option.listo) || options[0];
  if (!selected) {
    showToast('Evolucion', 'No hay evolucion disponible');
    return;
  }

  const render = (): HTMLDivElement => openOverlayModal(`
    <div class="modal-head">
      <div>
        <p class="home-kicker">Evolution</p>
        <h3>${escapeHtml(row.nombre)}</h3>
        <div class="modal-chip-row">
          <span class="badge">Lv ${row.nivel}</span>
          <span class="badge">${selected.tipo}</span>
          <span class="badge">${selected.listo ? 'listo' : 'pendiente'}</span>
        </div>
      </div>
      <button class="modal-close" data-close-overlay="1">X</button>
    </div>
    <div class="evolution-layout">
      <div class="evolution-chain">
        <article class="evolution-preview-card">
          <div class="evolution-card-art">
            <img src="${escapeHtml(getPokemonCardImage(row.pokemon_id, row.es_shiny, row.imagen))}" alt="${escapeHtml(row.nombre)}" />
          </div>
          <strong>${escapeHtml(row.nombre)}</strong>
          <small>Actual</small>
        </article>
        <div class="evolution-arrow">></div>
        <article class="evolution-preview-card">
          <div class="evolution-card-art">
            <img src="${escapeHtml(getPokemonCardImage(selected.evoluciona_a, row.es_shiny, null))}" alt="${escapeHtml(selected.evolucion_nombre)}" />
          </div>
          <strong>${escapeHtml(selected.evolucion_nombre)}</strong>
          <small>${selected.tipo === 'item' ? `Item: ${escapeHtml(selected.item_nombre || 'requerido')}` : `Nivel ${selected.nivel_requerido || '-'}`}</small>
        </article>
      </div>
      <div class="move-card-list">
        ${(options || []).map((option) => `
          <button class="move-card ${option === selected ? 'is-selected' : ''}" data-evo-option="${option.evoluciona_a}">
            <div class="move-card-top">
              <strong>${escapeHtml(option.evolucion_nombre)}</strong>
              <span class="badge">${escapeHtml(option.tipo)}</span>
            </div>
            <div class="move-pill-row">
              ${option.tipo === 'item'
                ? `<span class="move-pill">${escapeHtml(option.item_nombre || 'item')}</span><span class="move-pill">x${formatNumber(option.cantidad || 0)}</span>`
                : `<span class="move-pill">Nivel ${formatNumber(option.nivel_requerido || 0)}</span>`}
              <span class="move-pill">${option.listo ? 'listo' : 'faltante'}</span>
            </div>
          </button>
        `).join('')}
      </div>
      <button class="pokemon-action-btn is-accent" data-evo-confirm="1" ${selected.listo ? '' : 'disabled'}>${selected.tipo === 'item' ? 'Usar item y evolucionar' : 'Evolucionar ahora'}</button>
    </div>
  `);

  let backdrop = render();

  const bind = (): void => {
    backdrop.querySelectorAll<HTMLElement>('[data-evo-option]').forEach((button) => {
      button.addEventListener('click', () => {
        const target = Number(button.dataset.evoOption || 0);
        selected = options.find((option) => Number(option.evoluciona_a) === target) || selected;
        backdrop = render();
        bind();
      });
    });

    backdrop.querySelector<HTMLElement>('[data-evo-confirm]')?.addEventListener('click', async () => {
      if (!selected.listo) return;
      let result: { ok: boolean; mensaje: string };
      if (selected.tipo === 'item' && selected.item_id) {
        result = await evolvePokemonByItem(user.id, row.id, selected.item_id);
      } else {
        result = await evolvePokemonByLevel(user.id, row.id);
      }
      if (!result.ok) {
        showToast('Evolucion', result.mensaje || 'No se pudo evolucionar');
        return;
      }
      closeOverlayModal();
      showToast('Evolucion', result.mensaje || `${row.nombre} evoluciono correctamente`);
      await renderPokemonV2(refs);
    });
  };

  bind();
}

async function confirmReleasePokemon(row: PlayerPokemon, refs: ShellRefs): Promise<void> {
  const user = sessionStore.getUser();
  if (!user) return;

  const backdrop = openOverlayModal(`
    <div class="modal-head">
      <div>
        <p class="home-kicker">Release</p>
        <h3>${escapeHtml(row.nombre)}</h3>
      </div>
      <button class="modal-close" data-close-overlay="1">X</button>
    </div>
    <div class="evolution-layout">
      <p>Vas a liberar este Pokemon de tu coleccion. Esta accion impacta tu caja y no deberia hacerse por error.</p>
      <div class="modal-chip-row">
        <span class="badge">Lv ${row.nivel}</span>
        <span class="badge">${escapeHtml(row.tipo || 'sin tipo')}</span>
      </div>
      <button class="pokemon-action-btn is-danger" data-release-confirm="1">Confirmar release</button>
    </div>
  `);

  backdrop.querySelector<HTMLElement>('[data-release-confirm]')?.addEventListener('click', async () => {
    const result = await releaseMyPokemon(user.id, row.id);
    if (!result.ok) {
      showToast('Coleccion', result.mensaje || 'No se pudo liberar');
      return;
    }
    closeOverlayModal();
    showToast('Coleccion', result.mensaje || `${row.nombre} fue liberado`);
    await renderPokemonV2(refs);
  });
}

function renderHomeActionCard(view: ViewKey, icon: string, title: string, meta: string, copy: string): string {
  return `
    <button class="home-action-card-v3" data-go-view="${view}">
      <span class="home-action-card-v3__icon">${escapeHtml(icon)}</span>
      <span class="home-action-card-v3__copy">
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(meta)}</small>
        <span>${escapeHtml(copy)}</span>
      </span>
    </button>
  `;
}

function renderTeamBuilderSlot(slot: TeamSlot | null, position: number, selected: boolean): string {
  return `
    <button class="team-slot-card ${selected ? 'is-selected' : ''} ${slot ? '' : 'is-empty'}" data-team-slot="${position}">
      <span class="team-slot-card__index">0${position}</span>
      ${slot ? `
        <div class="team-slot-card__art"><img src="${escapeHtml(getPokemonCardImage(slot.pokemon_id, slot.es_shiny, slot.imagen))}" alt="${escapeHtml(slot.nombre)}" /></div>
        <strong>${escapeHtml(slot.nombre)}</strong>
        <small>Lv ${slot.nivel}${position === 1 ? ' · lider' : ''}</small>
        <span class="team-slot-card__remove" data-team-remove="${position}">x</span>
      ` : `
        <div class="team-slot-card__empty">+</div>
        <strong>Slot libre</strong>
        <small>Asignar Pokemon</small>
      `}
    </button>
  `;
}

function renderTeamRosterCard(row: PlayerPokemon, assigned: boolean, selectedSlot: number): string {
  return `
    <article class="team-roster-card ${assigned ? 'is-assigned' : ''}">
      <div class="team-roster-card__art">
        <img src="${escapeHtml(getPokemonCardImage(row.pokemon_id, row.es_shiny, row.imagen))}" alt="${escapeHtml(row.nombre)}" />
      </div>
      <div class="team-roster-card__copy">
        <strong>${escapeHtml(row.nombre)}</strong>
        <small>#${row.pokemon_id} · Lv ${row.nivel} · ${escapeHtml(row.tipo || 'tipo libre')}</small>
      </div>
      <div class="team-roster-card__actions">
        <button class="pokemon-action-btn is-accent" data-team-assign="${row.id}">${assigned ? `Mover a slot ${selectedSlot}` : `Enviar a slot ${selectedSlot}`}</button>
        <button class="pokemon-action-btn" data-team-inspect="${row.id}">Ver</button>
      </div>
    </article>
  `;
}

function renderMapZoneCard(zone: { id: number; nombre: string; descripcion?: string | null; card_imagen?: string | null; species_count?: number }, selected: boolean): string {
  const cardImage = getMapCardAsset(null, zone.nombre, zone.card_imagen || null) || String(zone.card_imagen || '');
  return `
    <button class="maps-zone-card ${selected ? 'is-selected' : ''}" data-zone-pick="${zone.id}">
      ${cardImage ? `<span class="maps-zone-card__art"><img src="${escapeHtml(cardImage)}" alt="${escapeHtml(zone.nombre)}" /></span>` : `<span class="maps-zone-card__art maps-zone-card__art--empty">MAP</span>`}
      <span class="maps-zone-card__copy">
        <strong>${escapeHtml(zone.nombre)}</strong>
        <small>${escapeHtml(zone.descripcion || 'Explora la zona, reporta presencia y genera encuentros.')}</small>
      </span>
      <span class="badge">${formatNumber(Number(zone.species_count || 0))} species</span>
    </button>
  `;
}

function renderMapDetailPanel(
  zone: { id: number; nombre: string; descripcion?: string | null; imagen?: string | null; escenario_imagen?: string | null; species_count?: number },
  presence: Record<string, unknown> | null,
  encounter: Record<string, unknown> | null,
  balls: Array<{ item_id: number; nombre: string; cantidad: number }>,
  selectedBallId: number,
  avatarPos: { x: number; y: number },
  avatarAsset: string | null
): string {
  const selectedBall = balls.find((item) => Number(item.item_id) === selectedBallId) || null;
  const mapImage = getMapAsset(null, zone.nombre, zone.escenario_imagen || zone.imagen || null) || String(zone.escenario_imagen || zone.imagen || '');
  return `
    <div class="maps-detail-shell">
      <div class="maps-detail-hero">
        ${mapImage ? `<img src="${escapeHtml(mapImage)}" alt="${escapeHtml(zone.nombre)}" />` : '<div class="maps-detail-hero__fallback">MAP</div>'}
        <div class="maps-detail-hero__avatar" style="left:${avatarPos.x}%; top:${avatarPos.y}%;">
          ${avatarAsset ? `<img src="${escapeHtml(avatarAsset)}" alt="avatar" />` : '<span>MM</span>'}
        </div>
      </div>
      <div class="maps-move-pad">
        <button class="maps-move-pad__btn maps-move-pad__btn--north" data-map-move="north"><img src="${escapeHtml(MAP_MOVE_NORTH)}" alt="Norte" /></button>
        <button class="maps-move-pad__btn maps-move-pad__btn--west" data-map-move="west"><img src="${escapeHtml(MAP_MOVE_WEST)}" alt="Oeste" /></button>
        <button class="maps-move-pad__btn maps-move-pad__btn--center" data-map-move="center"><img src="${escapeHtml(MAP_MOVE_CENTER)}" alt="Centro" /></button>
        <button class="maps-move-pad__btn maps-move-pad__btn--east" data-map-move="east"><img src="${escapeHtml(MAP_MOVE_EAST)}" alt="Este" /></button>
        <button class="maps-move-pad__btn maps-move-pad__btn--south" data-map-move="south"><img src="${escapeHtml(MAP_MOVE_SOUTH)}" alt="Sur" /></button>
      </div>
      <div class="maps-detail-copy">
        <p class="home-kicker">Zona activa</p>
        <h3>${escapeHtml(zone.nombre)}</h3>
        <p>${escapeHtml(zone.descripcion || 'Explora la zona, reporta presencia y genera encuentros.')}</p>
        <div class="home-chip-row">
          <span class="badge">${formatNumber(Number(zone.species_count || 0))} species</span>
          <span class="badge">${presence ? 'presencia lista' : 'sin presencia'}</span>
          <span class="badge">${encounter?.encuentro_token ? 'encuentro activo' : 'sin encuentro'}</span>
        </div>
      </div>

      <div class="maps-detail-actions">
        <button class="secondary-button" data-map-presence="1">Registrar presencia</button>
        <button data-map-encounter="1">Generar encuentro</button>
      </div>

      <div class="maps-ball-strip">
        ${balls.length ? balls.map((item) => `
          <button class="maps-ball-chip ${Number(item.item_id) === selectedBallId ? 'is-selected' : ''}" data-ball-pick="${item.item_id}">
            <strong>${escapeHtml(item.nombre)}</strong>
            <small>x${formatNumber(item.cantidad)}</small>
          </button>
        `).join('') : '<div class="empty-state">No tienes Pokeballs disponibles.</div>'}
      </div>

      ${presence ? `
        <div class="maps-presence-box">
          <strong>Presencia registrada</strong>
          <small>${escapeHtml(JSON.stringify(presence))}</small>
        </div>
      ` : ''}

      ${encounter?.encuentro_token ? `
        <article class="maps-encounter-card ${Boolean(encounter.es_shiny) ? 'is-shiny' : ''}">
          <div class="maps-encounter-card__art">
            <img src="${escapeHtml(getPokemonCardImage(Number(encounter.pokemon_id || 0), Boolean(encounter.es_shiny), String(encounter.imagen || '')))}" alt="${escapeHtml(String(encounter.nombre || 'Pokemon'))}" />
          </div>
          <div class="maps-encounter-card__copy">
            ${Boolean(encounter.es_shiny) ? '<span class="maps-shiny-alert">Shiny detectado</span>' : ''}
            <strong>${escapeHtml(String(encounter.nombre || 'Pokemon'))}</strong>
            <small>Lv ${formatNumber(Number(encounter.nivel || 1))}${Boolean(encounter.es_shiny) ? ' · shiny' : ''}</small>
            <div class="code-box">token: ${escapeHtml(String(encounter.encuentro_token || ''))}</div>
          </div>
          <button class="pokemon-action-btn is-accent" data-map-capture="1" ${selectedBall ? '' : 'disabled'}>${selectedBall ? `Capturar con ${escapeHtml(selectedBall.nombre)}` : 'Elige una Pokeball'}</button>
        </article>
      ` : `
        <div class="empty-state">Genera un encuentro para ver aqui al Pokemon salvaje y lanzar una Pokeball.</div>
      `}
    </div>
  `;
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
