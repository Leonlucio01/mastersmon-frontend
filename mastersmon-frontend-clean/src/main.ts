import './styles.css';
import { createGame } from './game/GameApp';
import type { ViewKey } from './types/models';
import { bindLogoutButton, renderView, tryRestoreSession } from './ui/renderers';

const views: Array<{ key: ViewKey; icon: string; title: string; subtitle: string; scene: string }> = [
  { key: 'home', icon: 'hub', title: 'Home', subtitle: 'Estado, progreso y accesos', scene: 'HomeSceneV2' },
  { key: 'pokemon', icon: 'dex', title: 'My Pokemon', subtitle: 'Caja, movimientos y evolucion', scene: 'PokemonScene' },
  { key: 'team', icon: 'tm', title: 'Team', subtitle: 'Slots 1-6 y core de combate', scene: 'TeamScene' },
  { key: 'arena', icon: 'pvp', title: 'Arena', subtitle: 'Sesiones rapidas y recompensas', scene: 'ArenaScene' },
  { key: 'onboarding', icon: 'new', title: 'Onboarding', subtitle: 'Primeras metas y rewards', scene: 'OnboardingScene' },
  { key: 'maps', icon: 'map', title: 'Maps', subtitle: 'Explorar, presencia y captura', scene: 'MapsScene' },
  { key: 'gyms', icon: 'gym', title: 'Gyms', subtitle: 'Ruta regional y medallas', scene: 'GymsScene' },
  { key: 'bossIdle', icon: 'raid', title: 'Boss / Idle', subtitle: 'Evento global y auto farm', scene: 'BossIdleScene' },
  { key: 'shop', icon: 'shop', title: 'Shop', subtitle: 'Items, premium e historial', scene: 'ShopScene' },
  { key: 'ranking', icon: 'top', title: 'Ranking', subtitle: 'Top global de jugadores', scene: 'RankingScene' }
];

const sidebarNav = document.getElementById('sidebar-nav') as HTMLElement;
const panelRoot = document.getElementById('panel-root') as HTMLElement;
const contentGrid = document.getElementById('content-grid') as HTMLElement;
const playerMiniCard = document.getElementById('player-mini-card') as HTMLElement;
const viewTitle = document.getElementById('view-title') as HTMLElement;
const viewSubtitle = document.getElementById('view-subtitle') as HTMLElement;
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;

const game = createGame('game-root');
let activeView: ViewKey = 'home';

function renderSidebar(): void {
  sidebarNav.innerHTML = views.map((item) => `
    <button class="nav-item ${item.key === activeView ? 'active' : ''}" data-view="${item.key}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-meta">
        <strong>${item.title}</strong>
        <small>${item.subtitle}</small>
      </span>
    </button>
  `).join('');

  sidebarNav.querySelectorAll<HTMLElement>('[data-view]').forEach((node) => {
    node.addEventListener('click', () => {
      navigate(node.dataset.view as ViewKey);
    });
  });
}

async function navigate(view: ViewKey): Promise<void> {
  activeView = view;
  renderSidebar();
  const hasSession = Boolean(localStorage.getItem('mastersmon_token'));
  contentGrid.classList.toggle('content-grid--panel-only', ['home', 'pokemon', 'team', 'maps', 'gyms'].includes(view) || (view === 'home' && !hasSession));
  contentGrid.classList.remove('content-grid--home-stack');

  const next = views.find((item) => item.key === view);
  if (next) {
    game.scene.start(next.scene);
  }

  try {
    await renderView(view, {
      panelRoot,
      playerMiniCard,
      viewTitle,
      viewSubtitle,
      onNavigate: navigate,
      refreshShell
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'auth-guard') {
      return;
    }
    console.error(error);
  }
}

function refreshShell(): void {
  const hasSession = localStorage.getItem('mastersmon_token');
  logoutBtn.classList.toggle('hidden', !hasSession);
  playerMiniCard.classList.toggle('hidden', !hasSession);
  void navigate(activeView);
}

bindLogoutButton(logoutBtn, refreshShell);
renderSidebar();
await tryRestoreSession();
refreshShell();
