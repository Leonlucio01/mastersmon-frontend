import type { PlayerPokemon, TeamSlot, ViewKey } from '../types/models';
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
      await renderHome(refs);
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
        <h3>Bienvenido a MastersMon Web</h3>
        <p>Este starter arranca desde <strong>Home</strong> y deja el login integrado ahí mismo, como pediste. El botón usa Google Identity Services y luego llama a tu backend para obtener el JWT.</p>
        <div id="google-login-slot" class="section-card"></div>
        <div class="section-grid">
          <div class="metric-card"><span>Motor</span><strong>Phaser 3</strong></div>
          <div class="metric-card"><span>Build</span><strong>Vite + TS</strong></div>
          <div class="metric-card"><span>Sprites</span><strong>PokeAPI</strong></div>
          <div class="metric-card"><span>Estilo</span><strong>UI por iconos</strong></div>
        </div>
      </section>
      <section class="section-card">
        <h4>Ruta de arranque</h4>
        <div class="stack">
          <span class="badge">🏠 Home</span>
          <span class="badge">🧬 My Pokémon</span>
          <span class="badge">👥 Team</span>
          <span class="badge">⚔️ Arena</span>
          <span class="badge">✨ Onboarding</span>
          <span class="badge">🗺️ Maps</span>
          <span class="badge">🏛️ Gyms</span>
          <span class="badge">👹 Boss / Idle</span>
          <span class="badge">🛒 Shop</span>
          <span class="badge">🏆 Ranking</span>
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

  const [me, trainerSetup, items, pokemon, team, onboarding] = await Promise.all([
    getMe(),
    getTrainerSetup(),
    getMyItems(),
    getMyPokemon(),
    getMyTeam(),
    getOnboarding()
  ]);

  sessionStore.setUser(me);
  playerStore.trainerSetup = trainerSetup;
  playerStore.items = items;
  playerStore.pokemon = pokemon;
  playerStore.team = team.equipo;
  playerStore.onboarding = onboarding;

  root.innerHTML = `
    <section class="section-card">
      <h3>Resumen rápido</h3>
      <div class="section-grid">
        <div class="metric-card"><span>Entrenador</span><strong>${escapeHtml(me.nombre)}</strong></div>
        <div class="metric-card"><span>Pokédolares</span><strong>${formatNumber(me.pokedolares || 0)}</strong></div>
        <div class="metric-card"><span>Pokémon</span><strong>${pokemon.length}</strong></div>
        <div class="metric-card"><span>Equipo</span><strong>${team.equipo.length}/6</strong></div>
        <div class="metric-card"><span>Items</span><strong>${items.length}</strong></div>
        <div class="metric-card"><span>Onboarding</span><strong>${onboarding.progreso.porcentaje}%</strong></div>
      </div>
    </section>

    <section class="section-card">
      <h3>Trainer setup</h3>
      <div class="list-item">
        <strong>Avatar:</strong> ${escapeHtml(trainerSetup.avatar_id || 'steven')}<br />
        <strong>Team color:</strong> ${escapeHtml(trainerSetup.team_color || 'sin definir')}<br />
        <strong>Starter sugerido:</strong> ${escapeHtml(trainerSetup.starter_code || 'sin definir')}<br />
        <strong>Completado:</strong> ${trainerSetup.setup_completed ? 'sí' : 'no'}
      </div>
    </section>

    <section class="section-card">
      <h3>Navegación recomendada</h3>
      <div class="section-grid">
        ${homeShortcut('🧬', 'My Pokémon', 'Revisar colección y stats', 'pokemon')}
        ${homeShortcut('👥', 'Team', 'Armar el equipo principal', 'team')}
        ${homeShortcut('⚔️', 'Arena', 'Probar flow de combate', 'arena')}
        ${homeShortcut('🗺️', 'Maps', 'Encuentros y captura', 'maps')}
        ${homeShortcut('🏛️', 'Gyms', 'Ver progreso y próximos retos', 'gyms')}
        ${homeShortcut('👹', 'Boss / Idle', 'Evento diario y farmeo', 'bossIdle')}
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
