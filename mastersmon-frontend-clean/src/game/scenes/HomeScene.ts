import Phaser from 'phaser';
import { sessionStore } from '../../store/session';
import { playerStore } from '../../store/player';
import { getMyPokemon, getMyTeam, getTrainerSetup, getOnboarding } from '../../services/player';
import { getGymProgress } from '../../services/gyms';
import { getAvatarAsset, getBadgeAsset, getScenarioBackdrop, getTrainerAsset } from '../../utils/gameAssets';
import { getPokemonCardImage } from '../../utils/pokeSprites';

interface HeroState {
  regionCode: string;
  regionLabel: string;
  leaderName: string;
  badgeKey: string;
  badgeLabel: string;
  trainerAsset: string | null;
  badgeAsset: string | null;
  backdropAsset: string | null;
  avatarAsset: string | null;
  starterName: string;
  teamColor: string;
  onboardingPercent: number;
  teamCount: number;
  playerName: string;
  pokedolares: number;
  teamSprites: string[];
}

const REGION_LABELS: Record<string, string> = {
  kanto: 'Kanto',
  johto: 'Johto',
  hoenn: 'Hoenn',
  zona_especial: 'Zona especial'
};

const REGION_BACKDROP_FALLBACKS: Record<string, string[]> = {
  kanto: ['lago_azul', 'bosque_verde', 'torre_batalla'],
  johto: ['torre_campana', 'bosque_ancestral', 'ruinas_profundas'],
  hoenn: ['laguna_coral', 'bosque_tropical', 'pilar_del_cielo'],
  zona_especial: ['jardin_lunar', 'pico_trueno', 'santuario_dragon']
};

const LEADER_BACKDROP_HINTS: Record<string, string> = {
  misty: 'lago_azul',
  brock: 'caverna_roca',
  lt_surge: 'pico_trueno',
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

export class HomeScene extends Phaser.Scene {
  private heroState: HeroState | null = null;

  constructor() {
    super('HomeScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#09111f');
    this.renderShell();
    void this.loadHeroState();
  }

  private async loadHeroState(): Promise<void> {
    try {
      const [gymProgressRaw, trainerSetupRaw, onboardingRaw, myTeamRaw, myPokemonRaw] = await Promise.all([
        getGymProgress().catch(() => null),
        getTrainerSetup().catch(() => null),
        getOnboarding().catch(() => null),
        getMyTeam().catch(() => null),
        getMyPokemon().catch(() => null)
      ]);

      if (trainerSetupRaw) playerStore.trainerSetup = trainerSetupRaw;
      if (onboardingRaw) playerStore.onboarding = onboardingRaw;
      if (myTeamRaw?.equipo) playerStore.team = myTeamRaw.equipo;
      if (Array.isArray(myPokemonRaw)) playerStore.pokemon = myPokemonRaw;

      const nextGym = ((gymProgressRaw as Record<string, unknown> | null)?.siguiente_gym as Record<string, unknown> | null) || null;
      const trainerSetup = trainerSetupRaw || playerStore.trainerSetup;
      const onboarding = onboardingRaw || playerStore.onboarding;
      const user = sessionStore.getUser();
      const orderedTeam = [...playerStore.team].sort((a, b) => a.posicion - b.posicion);
      const fallbackPokemon = Array.isArray(myPokemonRaw) ? myPokemonRaw : playerStore.pokemon;

      const regionCode = String(nextGym?.region_codigo || 'kanto').toLowerCase();
      const leaderName = String(nextGym?.lider_nombre || 'Objetivo regional');
      const badgeLabel = String(nextGym?.medalla_nombre || 'Progress Badge');
      const badgeKey = this.normalizeAssetToken(badgeLabel).replace(/_badge$/i, '');
      const trainerAsset = getTrainerAsset(regionCode, leaderName, nextGym?.trainer_asset_path as string | undefined);
      const badgeAsset = getBadgeAsset(regionCode, badgeKey, nextGym?.badge_asset_path as string | undefined);
      const backdropHint = LEADER_BACKDROP_HINTS[this.normalizeAssetToken(leaderName)] || REGION_BACKDROP_FALLBACKS[regionCode]?.[0] || 'bosque_verde';
      const backdropAsset = getScenarioBackdrop(regionCode, backdropHint);
      const starterName = String(trainerSetup?.starter_code || 'starter');
      const avatarAsset = getAvatarAsset(user?.avatar_id || trainerSetup?.avatar_id || null, user?.foto || null);
      const spritePool = orderedTeam.length ? orderedTeam : fallbackPokemon.slice(0, 6);
      const teamSprites = spritePool
        .slice(0, 6)
        .map((row) => getPokemonCardImage(row.pokemon_id, row.es_shiny, row.imagen))
        .filter(Boolean);

      this.heroState = {
        regionCode,
        regionLabel: REGION_LABELS[regionCode] || this.toTitleCase(regionCode.replace(/_/g, ' ')),
        leaderName,
        badgeKey,
        badgeLabel,
        trainerAsset,
        badgeAsset,
        backdropAsset,
        avatarAsset,
        starterName,
        teamColor: String(trainerSetup?.team_color || 'blue'),
        onboardingPercent: Number(onboarding?.progreso?.porcentaje || 0),
        teamCount: orderedTeam.length,
        playerName: String(user?.nombre || 'Entrenador'),
        pokedolares: Number(user?.pokedolares || 0),
        teamSprites
      };

      this.renderShell();
      await this.loadAndRenderAssets();
    } catch {
      this.renderShell();
    }
  }

  private async loadAndRenderAssets(): Promise<void> {
    const state = this.heroState;
    if (!state) return;

    const queue: Array<{ key: string; url: string | null }> = [
      { key: 'home-backdrop', url: state.backdropAsset },
      { key: 'home-trainer', url: state.trainerAsset },
      { key: 'home-badge', url: state.badgeAsset },
      { key: 'home-avatar', url: state.avatarAsset }
    ];

    state.teamSprites.forEach((url, index) => {
      queue.push({ key: `home-team-${index}`, url });
    });

    let shouldStart = false;
    for (const entry of queue) {
      if (!entry.url || this.textures.exists(entry.key)) continue;
      this.load.image(entry.key, entry.url);
      shouldStart = true;
    }

    if (shouldStart) {
      await new Promise<void>((resolve) => {
        this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
        this.load.start();
      });
    }

    this.renderShell();
  }

  private renderShell(): void {
    this.children.removeAll(true);

    const { width, height } = this.scale;
    const state = this.heroState;

    this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x09111f, 1);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b1630, 0x102340, 0x07101d, 0x07101d, 1);
    bg.fillRect(0, 0, width, height);

    if (state?.backdropAsset && this.textures.exists('home-backdrop')) {
      const backdrop = this.add.image(width * 0.5, height * 0.5, 'home-backdrop');
      backdrop.setDisplaySize(width, height);
      backdrop.setAlpha(0.14);
    }

    this.add.circle(width * 0.18, height * 0.32, 150, this.resolveAccentColor(state?.teamColor), 0.14).setBlendMode(Phaser.BlendModes.SCREEN);
    this.add.circle(width * 0.82, height * 0.78, 210, 0x7a5cff, 0.08).setBlendMode(Phaser.BlendModes.SCREEN);

    const margin = 34;
    const heroWidth = width - margin * 2;
    const heroHeight = height - 72;
    const heroX = margin;
    const heroY = 28;
    const leftWidth = Math.max(300, Math.floor(heroWidth * 0.42));
    const contentX = heroX + leftWidth + 44;
    const contentWidth = heroWidth - leftWidth - 78;
    const accent = this.resolveAccentColor(state?.teamColor);

    const heroBg = this.add.rectangle(heroX, heroY, heroWidth, heroHeight, 0x0d1b31, 0.68).setOrigin(0, 0);
    heroBg.setStrokeStyle(1, 0x86a7d0, 0.18);

    if (state?.backdropAsset && this.textures.exists('home-backdrop')) {
      const heroBackdrop = this.add.image(heroX + heroWidth * 0.5, heroY + heroHeight * 0.5, 'home-backdrop');
      heroBackdrop.setDisplaySize(heroWidth, heroHeight);
      heroBackdrop.setAlpha(0.26);
    }

    const overlay = this.add.graphics();
    overlay.fillStyle(0x07101d, 0.46);
    overlay.fillRect(heroX, heroY, heroWidth, heroHeight);
    overlay.fillGradientStyle(0x08111e, 0x0b1a30, 0x08111e, 0x07111d, 0.46);
    overlay.fillRect(heroX, heroY, heroWidth, heroHeight);

    const sidePanel = this.add.rectangle(heroX + 26, heroY + 26, leftWidth - 18, heroHeight - 52, 0x08111d, 0.58).setOrigin(0, 0);
    sidePanel.setStrokeStyle(1, 0x86a7d0, 0.15);

    const stageGlow = this.add.ellipse(heroX + leftWidth * 0.42, heroY + heroHeight - 106, leftWidth * 0.42, 36, accent, 0.28);
    stageGlow.setBlendMode(Phaser.BlendModes.SCREEN);

    if (state?.trainerAsset && this.textures.exists('home-trainer')) {
      const trainer = this.add.image(heroX + leftWidth * 0.48, heroY + heroHeight * 0.62, 'home-trainer');
      trainer.setDisplaySize(leftWidth * 0.34, heroHeight * 0.58);
      trainer.setOrigin(0.5, 0.5);
    }

    const infoPanel = this.add.rectangle(contentX - 18, heroY + 30, contentWidth, heroHeight - 60, 0x0a1424, 0.18).setOrigin(0, 0);
    infoPanel.setStrokeStyle(1, 0x86a7d0, 0.08);

    const kicker = this.add.text(contentX, heroY + 36, 'Objetivo activo', {
      fontSize: '15px',
      color: '#b7d4ff',
      fontStyle: '600'
    });
    kicker.setAlpha(0.96);

    const regionPill = this.add.text(contentX, heroY + 70, state?.regionLabel.toUpperCase() || 'HOME', {
      fontSize: '12px',
      color: '#d9e7ff',
      backgroundColor: '#1b3152',
      padding: { x: 12, y: 6 }
    });
    regionPill.setAlpha(0.96);

    if (state?.badgeAsset && this.textures.exists('home-badge')) {
      const badgeFrame = this.add.circle(heroX + heroWidth - 72, heroY + 74, 34, 0x12243d, 0.94);
      badgeFrame.setStrokeStyle(2, accent, 0.46);
      const badge = this.add.image(heroX + heroWidth - 72, heroY + 74, 'home-badge');
      badge.setDisplaySize(48, 48);
      this.children.bringToTop(badge);
    }

    this.add.text(contentX, heroY + 132, state ? state.leaderName : 'MastersMon', {
      fontSize: '44px',
      color: '#ecf4ff',
      fontStyle: '700'
    });

    const subtitle = state
      ? `${state.leaderName} te espera por la medalla ${state.badgeLabel}.`
      : 'Carga tu progreso y continúa tu aventura.';

    this.add.text(contentX, heroY + 188, subtitle, {
      fontSize: '20px',
      color: '#d6e4f7',
      wordWrap: { width: contentWidth - 36 },
      lineSpacing: 6
    });

    const highlight = this.add.rectangle(contentX, heroY + 270, contentWidth - 36, 96, 0x0b1628, 0.56).setOrigin(0, 0);
    highlight.setStrokeStyle(1, 0x86a7d0, 0.14);

    this.add.text(contentX + 18, heroY + 290, 'Siguiente paso', {
      fontSize: '13px',
      color: '#8fb9ff',
      fontStyle: '600'
    });

    this.add.text(contentX + 18, heroY + 314, state ? `Desafía el Gym de ${state.leaderName}` : 'Explora y fortalece tu equipo', {
      fontSize: '22px',
      color: '#ecf4ff',
      fontStyle: '700'
    });

    this.add.text(contentX + 18, heroY + 346, state
      ? `Ruta: ${state.regionLabel} · Medalla: ${state.badgeLabel}`
      : 'Tu progreso aparece aquí al iniciar sesión.', {
      fontSize: '14px',
      color: '#a9bdd8',
      wordWrap: { width: contentWidth - 170 }
    });

    if (state?.avatarAsset && this.textures.exists('home-avatar')) {
      const avatarCard = this.add.rectangle(contentX + contentWidth - 128, heroY + 282, 96, 72, 0x0b1528, 0.74).setOrigin(0, 0);
      avatarCard.setStrokeStyle(1, 0x86a7d0, 0.14);
      const avatar = this.add.image(contentX + contentWidth - 80, heroY + 318, 'home-avatar');
      avatar.setDisplaySize(46, 46);
      this.add.text(contentX + contentWidth - 126, heroY + 360, 'Tu perfil', {
        fontSize: '11px',
        color: '#9db4d1'
      });
    }

    const chipValues = state
      ? [
          `${state.teamCount || 0}/6 equipo`,
          `${state.onboardingPercent}% onboarding`,
          state.badgeLabel,
          `starter: ${state.starterName}`
        ]
      : ['Home', 'Login', 'Progress'];

    let chipX = contentX;
    let chipY = heroY + heroHeight - 104;
    chipValues.forEach((value) => {
      const chip = this.add.text(chipX, chipY, value, {
        fontSize: '12px',
        color: '#c7d8ee',
        backgroundColor: '#203651',
        padding: { x: 11, y: 6 }
      }).setAlpha(0.95);
      chipX += chip.width + 10;
      if (chipX > heroX + heroWidth - 180) {
        chipX = contentX;
        chipY += 34;
      }
    });

    const user = sessionStore.getUser();
    if (user) {
      this.add.text(contentX, heroY + heroHeight - 54, `${user.nombre} · ${this.formatNumber(user.pokedolares || 0)} Pokédolares`, {
        fontSize: '13px',
        color: '#a7bbd8'
      });
    }
  }

  private resolveAccentColor(teamColor?: string): number {
    const key = (teamColor || '').toLowerCase();
    if (key.includes('red')) return 0xff6d7e;
    if (key.includes('green')) return 0x57d18b;
    if (key.includes('yellow')) return 0xf5c15d;
    if (key.includes('purple')) return 0x8c7cff;
    return 0x5da9ff;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  private normalizeAssetToken(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private toTitleCase(value: string): string {
    return value
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
