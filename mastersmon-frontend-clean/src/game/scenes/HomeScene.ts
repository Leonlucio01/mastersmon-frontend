import Phaser from 'phaser';
import { sessionStore } from '../../store/session';
import { playerStore } from '../../store/player';
import { getTrainerSetup, getOnboarding } from '../../services/player';
import { getGymProgress } from '../../services/gyms';
import { getAvatarAsset, getBadgeAsset, getScenarioBackdrop, getTrainerAsset } from '../../utils/gameAssets';
import { getPokemonCardImage } from '../../utils/pokeSprites';

interface HeroState {
  regionCode: string;
  regionLabel: string;
  leaderName: string;
  badgeName: string;
  badgeLabel: string;
  trainerAsset: string | null;
  badgeAsset: string | null;
  backdropAsset: string | null;
  avatarAsset: string | null;
  starterAsset: string | null;
  starterName: string;
  teamColor: string;
  onboardingPercent: number;
  teamCount: number;
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
  tate_liza: 'jardin_lunar',
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
      const [gymProgressRaw, trainerSetupRaw, onboardingRaw] = await Promise.all([
        getGymProgress().catch(() => null),
        getTrainerSetup().catch(() => null),
        getOnboarding().catch(() => null)
      ]);

      if (trainerSetupRaw) playerStore.trainerSetup = trainerSetupRaw;
      if (onboardingRaw) playerStore.onboarding = onboardingRaw;

      const nextGym = ((gymProgressRaw as Record<string, unknown> | null)?.siguiente_gym as Record<string, unknown> | null) || null;
      const trainerSetup = trainerSetupRaw || playerStore.trainerSetup;
      const onboarding = onboardingRaw || playerStore.onboarding;
      const user = sessionStore.getUser();

      const regionCode = String(nextGym?.region_codigo || 'kanto').toLowerCase();
      const leaderName = String(nextGym?.lider_nombre || 'Misty');
      const badgeName = String(nextGym?.medalla_nombre || 'Cascade Badge');
      const badgeCode = String(nextGym?.codigo || '').split('-').pop() || badgeName;
      const trainerAsset = getTrainerAsset(regionCode, leaderName, nextGym?.trainer_asset_path as string | undefined);
      const badgeAsset = getBadgeAsset(regionCode, badgeCode, nextGym?.badge_asset_path as string | undefined);
      const backdropHint = LEADER_BACKDROP_HINTS[this.normalizeName(leaderName)] || REGION_BACKDROP_FALLBACKS[regionCode]?.[0] || 'bosque_verde';
      const backdropAsset = getScenarioBackdrop(regionCode, backdropHint);
      const starterName = String(trainerSetup?.starter_code || 'charmander');
      const avatarAsset = getAvatarAsset(user?.avatar_id || trainerSetup?.avatar_id || null, user?.avatar_url || null);
      const starterAsset = getPokemonCardImage(starterName, false);

      this.heroState = {
        regionCode,
        regionLabel: REGION_LABELS[regionCode] || this.toTitleCase(regionCode.replace(/_/g, ' ')),
        leaderName,
        badgeName: badgeCode,
        badgeLabel: badgeName,
        trainerAsset,
        badgeAsset,
        backdropAsset,
        avatarAsset,
        starterAsset,
        starterName,
        teamColor: String(trainerSetup?.team_color || 'blue'),
        onboardingPercent: Number(onboarding?.progreso?.porcentaje || 0),
        teamCount: playerStore.team.length
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
      { key: 'home-avatar', url: state.avatarAsset },
      { key: 'home-starter', url: state.starterAsset }
    ];

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
      backdrop.setAlpha(0.18);
    }

    this.add.circle(width * 0.18, height * 0.3, 165, this.resolveAccentColor(state?.teamColor), 0.12).setBlendMode(Phaser.BlendModes.SCREEN);
    this.add.circle(width * 0.82, height * 0.76, 225, 0x7a5cff, 0.08).setBlendMode(Phaser.BlendModes.SCREEN);

    const hero = this.add.container(42, 38);
    const heroWidth = width - 84;
    const heroHeight = height - 112;

    const heroPanel = this.add.rectangle(0, 0, heroWidth, heroHeight, 0x0f1e35, 0.74).setOrigin(0, 0);
    heroPanel.setStrokeStyle(1, 0x86a7d0, 0.18);
    hero.add(heroPanel);

    const mediaWidth = Math.min(430, heroWidth * 0.48);
    const mediaHeight = heroHeight - 86;
    const mediaPanel = this.add.rectangle(26, 24, mediaWidth, mediaHeight, 0x0b1528, 0.58).setOrigin(0, 0);
    mediaPanel.setStrokeStyle(1, 0x86a7d0, 0.16);
    hero.add(mediaPanel);

    const trainerPanel = this.add.rectangle(42, 42, mediaWidth * 0.56, mediaHeight - 36, 0x09111f, 0.82).setOrigin(0, 0);
    trainerPanel.setStrokeStyle(1, 0x86a7d0, 0.18);
    hero.add(trainerPanel);

    const badgePanel = this.add.rectangle(42 + mediaWidth * 0.60, 42, mediaWidth * 0.30, 88, 0x09111f, 0.82).setOrigin(0, 0);
    badgePanel.setStrokeStyle(1, 0x86a7d0, 0.18);
    hero.add(badgePanel);

    const starterPanel = this.add.rectangle(42 + mediaWidth * 0.60, 146, mediaWidth * 0.30, 88, 0x09111f, 0.82).setOrigin(0, 0);
    starterPanel.setStrokeStyle(1, 0x86a7d0, 0.18);
    hero.add(starterPanel);

    if (state?.trainerAsset && this.textures.exists('home-trainer')) {
      const trainer = this.add.image(42 + mediaWidth * 0.28, 42 + (mediaHeight - 36) * 0.55, 'home-trainer');
      trainer.setDisplaySize(mediaWidth * 0.28, mediaHeight * 0.48);
      trainer.setOrigin(0.5, 0.5);
      hero.add(trainer);
    }

    if (state?.badgeAsset && this.textures.exists('home-badge')) {
      const badge = this.add.image(42 + mediaWidth * 0.75, 86, 'home-badge');
      badge.setDisplaySize(66, 66);
      badge.setOrigin(0.5, 0.5);
      hero.add(badge);
    }

    if (state?.starterAsset && this.textures.exists('home-starter')) {
      const starter = this.add.image(42 + mediaWidth * 0.75, 190, 'home-starter');
      starter.setDisplaySize(78, 78);
      starter.setOrigin(0.5, 0.5);
      hero.add(starter);
    }

    const contentX = mediaWidth + 58;
    const titleText = state ? 'Siguiente objetivo' : 'Centro de mando';
    const subtitleText = state
      ? `${state.leaderName} te espera por la medalla ${state.badgeLabel}.`
      : 'Carga tu progreso, revisa tu equipo y prepara tu siguiente reto.';

    hero.add(this.add.text(contentX, 34, titleText, {
      fontSize: '18px',
      color: '#b7d4ff',
      fontStyle: '600'
    }));

    hero.add(this.add.text(contentX, 62, state?.regionLabel.toUpperCase() || 'HOME', {
      fontSize: '12px',
      color: '#8bb7ff',
      backgroundColor: '#1a2c49',
      padding: { x: 10, y: 5 }
    }).setAlpha(0.95));

    hero.add(this.add.text(contentX, 110, state ? state.leaderName : 'MastersMon', {
      fontSize: '38px',
      color: '#ecf4ff',
      fontStyle: '700'
    }));

    hero.add(this.add.text(contentX, 160, subtitleText, {
      fontSize: '17px',
      color: '#d4e2f6',
      wordWrap: { width: Math.max(240, heroWidth - contentX - 34) },
      lineSpacing: 6
    }));

    const chipTexts = state
      ? [
          `${state.teamCount || 0}/6 equipo`,
          `${state.onboardingPercent}% onboarding`,
          state.regionLabel,
          state.badgeLabel
        ]
      : ['Home', 'Login', 'Progress', 'Gyms'];

    let chipX = contentX;
    chipTexts.forEach((value) => {
      const chip = this.add.text(chipX, heroHeight - 118, value, {
        fontSize: '12px',
        color: '#c0d2ee',
        backgroundColor: '#223650',
        padding: { x: 10, y: 6 }
      }).setAlpha(0.95);
      hero.add(chip);
      chipX += chip.width + 10;
    });

    if (state?.avatarAsset && this.textures.exists('home-avatar')) {
      const avatarFrame = this.add.circle(heroWidth - 82, 64, 34, 0x152741, 0.98);
      avatarFrame.setStrokeStyle(2, this.resolveAccentColor(state.teamColor), 0.42);
      hero.add(avatarFrame);

      const avatar = this.add.image(heroWidth - 82, 64, 'home-avatar');
      avatar.setDisplaySize(54, 54);
      hero.add(avatar);
    }

    const user = sessionStore.getUser();
    if (user) {
      hero.add(this.add.text(heroWidth - 136, 122, user.nombre, {
        fontSize: '15px',
        color: '#ecf4ff',
        fontStyle: '700',
        align: 'right'
      }).setOrigin(1, 0));
      hero.add(this.add.text(heroWidth - 136, 144, `${this.formatNumber(user.pokedolares || 0)} Pokédolares`, {
        fontSize: '12px',
        color: '#9db4d1',
        align: 'right'
      }).setOrigin(1, 0));
    }

    const footer = this.add.rectangle(heroWidth * 0.5, heroHeight - 46, heroWidth - 40, 64, 0xffffff, 0.035).setOrigin(0.5, 0.5);
    footer.setStrokeStyle(1, 0x86a7d0, 0.14);
    hero.add(footer);

    const footerText = state
      ? `${state.regionLabel} · ${state.badgeLabel} · ${state.starterName}`
      : 'Home · progreso · equipo';
    hero.add(this.add.text(30, heroHeight - 56, footerText, {
      fontSize: '13px',
      color: '#bcd0ea'
    }));

    this.add.text(36, 30, 'Home', {
      fontSize: '34px',
      color: '#ecf4ff',
      fontStyle: '700'
    });

    this.add.text(36, 74, 'Centro de mando del entrenador', {
      fontSize: '15px',
      color: '#9db4d1'
    });

    this.add.existing(hero);
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

  private normalizeName(value: string): string {
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
