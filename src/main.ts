import './styles.css';
import { createGame } from './game/GameApp';
import type { ViewKey } from './types/models';
import { bindLogoutButton, renderView, tryRestoreSession } from './ui/renderers';

const views: Array<{ key: ViewKey; icon: string; title: string; subtitle: string; scene: string }> = [
  { key: 'home', icon: '🏠', title: 'Home', subtitle: 'Login y hub', scene: 'HomeScene' },
  { key: 'pokemon', icon: '🧬', title: 'My Pokémon', subtitle: 'Caja y sprites', scene: 'PokemonScene' },
  { key: 'team', icon: '👥', title: 'Team', subtitle: 'Equipo 1–6', scene: 'TeamScene' },
  { key: 'arena', icon: '⚔️', title: 'Arena', subtitle: 'Sesiones rápidas', scene: 'ArenaScene' },
  { key: 'onboarding', icon: '✨', title: 'Onboarding', subtitle: 'Primeras metas', scene: 'OnboardingScene' },
  { key: 'maps', icon: '🗺️', title: 'Maps', subtitle: 'Encuentros online', scene: 'MapsScene' },
  { key: 'gyms', icon: '🏛️', title: 'Gyms', subtitle: 'Regiones y medallas', scene: 'GymsScene' },
  { key: 'bossIdle', icon: '👹', title: 'Boss / Idle', subtitle: 'Evento y auto-farm', scene: 'BossIdleScene' },
  { key: 'shop', icon: '🛒', title: 'Shop', subtitle: 'Items y premium', scene: 'ShopScene' },
  { key: 'ranking', icon: '🏆', title: 'Ranking', subtitle: 'Top global', scene: 'RankingScene' }
];

const sidebarNav = document.getElementById('sidebar-nav') as HTMLElement;
const panelRoot = document.getElementById('panel-root') as HTMLElement;
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
  void navigate(activeView);
}

bindLogoutButton(logoutBtn, refreshShell);
renderSidebar();
await tryRestoreSession();
refreshShell();
