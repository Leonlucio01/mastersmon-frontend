import Phaser from 'phaser';
import { sessionStore } from '../../store/session';
import { playerStore } from '../../store/player';
import { getMyPokemon, getMyTeam, getOnboarding, getTrainerSetup } from '../../services/player';
import { getGymCatalog, getGymProgress } from '../../services/gyms';
import { getAvatarAsset, getBadgeAsset, getScenarioBackdrop } from '../../utils/gameAssets';
import { getPokemonCardImage } from '../../utils/pokeSprites';

interface HomeVisualState {
  playerName: string;
  avatarAsset: string | null;
  regionLabel: string;
  badgeLabel: string;
  badgeAsset: string | null;
  backdropAsset: string | null;
  starterName: string;
  teamColor: string;
  onboardingPercent: number;
  teamCount: number;
  pokedolares: number;
  nextTarget: string;
  teamSprites: string[];
  regionSummary: Array<{ label: string; earned: number; total: number }>;
}

const REGION_LABELS: Record<string, string> = {
  kanto: 'Kanto',
  johto: 'Johto',
  hoenn: 'Hoenn',
  zona_especial: 'Zona especial'
};

const REGION_BACKDROP_FALLBACKS: Record<string, string> = {
  kanto: 'bosque_verde',
  johto: 'torre_campana',
  hoenn: 'laguna_coral',
  zona_especial: 'jardin_lunar'
};

export class HomeSceneV2 extends Phaser.Scene {
  private viewState: HomeVisualState | null = null;

  constructor() {
    super('HomeSceneV2');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#09111f');
    this.renderShell();
    void this.loadHomeState();
  }

  private async loadHomeState(): Promise<void> {
    try {
      const [trainerSetupRaw, onboardingRaw, gymProgressRaw, gymCatalogRaw, myTeamRaw, myPokemonRaw] = await Promise.all([
        getTrainerSetup().catch(() => null),
        getOnboarding().catch(() => null),
        getGymProgress().catch(() => null),
        getGymCatalog().catch(() => null),
        getMyTeam().catch(() => null),
        getMyPokemon().catch(() => null)
      ]);

      if (trainerSetupRaw) playerStore.trainerSetup = trainerSetupRaw;
      if (onboardingRaw) playerStore.onboarding = onboardingRaw;
      if (myTeamRaw?.equipo) playerStore.team = myTeamRaw.equipo;
      if (Array.isArray(myPokemonRaw)) playerStore.pokemon = myPokemonRaw;

      const user = sessionStore.getUser();
      const nextGym = ((gymProgressRaw as Record<string, unknown> | null)?.siguiente_gym as Record<string, unknown> | null) || null;
      const orderedTeam = [...playerStore.team].sort((a, b) => a.posicion - b.posicion);
      const spritePool = orderedTeam.length ? orderedTeam : playerStore.pokemon.slice(0, 6);
      const regionCode = String(nextGym?.region_codigo || 'kanto').toLowerCase();
      const badgeLabel = String(nextGym?.medalla_nombre || 'Progress Badge');
      const badgeKey = this.normalizeAssetToken(badgeLabel).replace(/_badge$/i, '');
      const avatarAsset = getAvatarAsset(user?.avatar_id || trainerSetupRaw?.avatar_id || null, user?.foto || null);

      const gyms = ((gymCatalogRaw as { gyms?: Array<Record<string, unknown>> } | null)?.gyms || []) as Array<Record<string, unknown>>;
      const regionSummary = [
        { code: 'kanto', label: 'Kanto' },
        { code: 'johto', label: 'Johto' },
        { code: 'hoenn', label: 'Hoenn' },
        { code: 'zona_especial', label: 'Especial' }
      ].map((region) => {
        const rows = gyms.filter((gym) => String(gym.region_codigo || '').toLowerCase() === region.code);
        return {
          label: region.label,
          earned: rows.filter((gym) => Boolean(gym.completado)).length,
          total: rows.length || 8
        };
      });

      this.viewState = {
        playerName: String(user?.nombre || 'Entrenador'),
        avatarAsset,
        regionLabel: REGION_LABELS[regionCode] || this.toTitleCase(regionCode.replace(/_/g, ' ')),
        badgeLabel,
        badgeAsset: getBadgeAsset(regionCode, badgeKey, nextGym?.badge_asset_path as string | undefined),
        backdropAsset: getScenarioBackdrop(regionCode, REGION_BACKDROP_FALLBACKS[regionCode] || 'bosque_verde'),
        starterName: String(trainerSetupRaw?.starter_code || 'starter'),
        teamColor: String(trainerSetupRaw?.team_color || 'blue'),
        onboardingPercent: Number(onboardingRaw?.progreso?.porcentaje || 0),
        teamCount: orderedTeam.length,
        pokedolares: Number(user?.pokedolares || 0),
        nextTarget: String(nextGym?.lider_nombre || 'Fortalece tu equipo'),
        regionSummary,
        teamSprites: spritePool
          .slice(0, 6)
          .map((row) => getPokemonCardImage(row.pokemon_id, row.es_shiny, row.imagen))
          .filter(Boolean)
      };

      await this.loadVisualAssets();
      this.renderShell();
    } catch {
      this.renderShell();
    }
  }

  private async loadVisualAssets(): Promise<void> {
    const state = this.viewState;
    if (!state) return;

    const queue: Array<{ key: string; url: string | null }> = [
      { key: 'home-v2-backdrop', url: state.backdropAsset },
      { key: 'home-v2-avatar', url: state.avatarAsset },
      { key: 'home-v2-badge', url: state.badgeAsset }
    ];

    state.teamSprites.forEach((url, index) => {
      queue.push({ key: `home-v2-team-${index}`, url });
    });

    let shouldStart = false;
    for (const entry of queue) {
      if (!entry.url || this.textures.exists(entry.key)) continue;
      this.load.image(entry.key, entry.url);
      shouldStart = true;
    }

    if (!shouldStart) return;

    await new Promise<void>((resolve) => {
      this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      this.load.start();
    });
  }

  private renderShell(): void {
    this.tweens.killAll();
    this.children.removeAll(true);

    const { width, height } = this.scale;
    const state = this.viewState;
    const accent = this.resolveAccentColor(state?.teamColor);

    this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x08111d, 1);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b1630, 0x102340, 0x07101d, 0x07101d, 1);
    bg.fillRect(0, 0, width, height);

    if (state?.backdropAsset && this.textures.exists('home-v2-backdrop')) {
      const backdrop = this.add.image(width * 0.5, height * 0.5, 'home-v2-backdrop');
      backdrop.setDisplaySize(width, height);
      backdrop.setAlpha(0.18);
    }

    this.add.circle(width * 0.18, height * 0.26, 160, accent, 0.14).setBlendMode(Phaser.BlendModes.SCREEN);
    this.add.circle(width * 0.84, height * 0.82, 220, 0x7a5cff, 0.08).setBlendMode(Phaser.BlendModes.SCREEN);

    const margin = 34;
    const shellWidth = width - margin * 2;
    const shellHeight = height - 72;
    const shellX = margin;
    const shellY = 28;
    const leftWidth = Math.max(308, Math.floor(shellWidth * 0.38));
    const rightX = shellX + leftWidth + 42;
    const rightWidth = shellWidth - leftWidth - 74;

    const shell = this.add.rectangle(shellX, shellY, shellWidth, shellHeight, 0x0d1b31, 0.66).setOrigin(0, 0);
    shell.setStrokeStyle(1, 0x86a7d0, 0.18);

    const leftPanel = this.add.rectangle(shellX + 24, shellY + 24, leftWidth - 12, shellHeight - 48, 0x08111d, 0.6).setOrigin(0, 0);
    leftPanel.setStrokeStyle(1, 0x86a7d0, 0.14);

    if (state?.avatarAsset && this.textures.exists('home-v2-avatar')) {
      const avatarRing = this.add.circle(shellX + leftWidth * 0.48, shellY + 118, 54, 0x102340, 0.96);
      avatarRing.setStrokeStyle(2, accent, 0.42);
      const avatar = this.add.image(shellX + leftWidth * 0.48, shellY + 118, 'home-v2-avatar');
      avatar.setDisplaySize(86, 86);
    }

    this.add.text(shellX + 48, shellY + 194, state?.playerName || 'Entrenador', {
      fontSize: '30px',
      color: '#eff7ff',
      fontStyle: '700'
    });

    this.add.text(shellX + 48, shellY + 230, state ? `${state.teamCount}/6 team · ${this.formatNumber(state.pokedolares)} $` : 'Carga tu perfil', {
      fontSize: '15px',
      color: '#b5cbe5'
    });

    this.add.text(shellX + 48, shellY + 270, 'Slots activos', {
      fontSize: '14px',
      color: '#8fb9ff',
      fontStyle: '600'
    });

    for (let index = 0; index < 6; index += 1) {
      const slotX = shellX + 44 + (index % 2) * 112;
      const slotY = shellY + 310 + Math.floor(index / 2) * 106;
      const slot = this.add.rectangle(slotX, slotY, 92, 88, 0x0b1528, 0.74).setOrigin(0, 0);
      slot.setStrokeStyle(1, index === 0 ? accent : 0x86a7d0, index === 0 ? 0.34 : 0.16);

      this.add.text(slotX + 12, slotY + 10, `0${index + 1}`, {
        fontSize: '12px',
        color: '#9db4d1'
      });

      if (state?.teamSprites[index] && this.textures.exists(`home-v2-team-${index}`)) {
        const poke = this.add.image(slotX + 46, slotY + 40, `home-v2-team-${index}`);
        poke.setDisplaySize(64, 64);
      } else {
        this.add.text(slotX + 46, slotY + 42, '+', {
          fontSize: '28px',
          color: '#9db4d1',
          fontStyle: '700'
        }).setOrigin(0.5);
      }

      this.add.text(slotX + 46, slotY + 70, state?.teamSprites[index] ? 'Activo' : 'Libre', {
        fontSize: '11px',
        color: '#9db4d1'
      }).setOrigin(0.5);
    }

    const rightPanel = this.add.rectangle(rightX - 18, shellY + 28, rightWidth, shellHeight - 56, 0x0a1424, 0.22).setOrigin(0, 0);
    rightPanel.setStrokeStyle(1, 0x86a7d0, 0.08);

    this.add.text(rightX, shellY + 38, 'Hub del entrenador', {
      fontSize: '15px',
      color: '#b7d4ff',
      fontStyle: '600'
    });

    this.add.text(rightX, shellY + 72, state?.regionLabel.toUpperCase() || 'HOME', {
      fontSize: '12px',
      color: '#d9e7ff',
      backgroundColor: '#1b3152',
      padding: { x: 12, y: 6 }
    });

    if (state?.badgeAsset && this.textures.exists('home-v2-badge')) {
      const badgeFrame = this.add.circle(shellX + shellWidth - 72, shellY + 76, 34, 0x12243d, 0.94);
      badgeFrame.setStrokeStyle(2, accent, 0.46);
      const badge = this.add.image(shellX + shellWidth - 72, shellY + 76, 'home-v2-badge');
      badge.setDisplaySize(48, 48);
    }

    this.add.text(rightX, shellY + 134, state?.playerName || 'MastersMon', {
      fontSize: '44px',
      color: '#ecf4ff',
      fontStyle: '700'
    });

    this.add.text(rightX, shellY + 190, state ? 'Tu avatar, economia y tus seis Pokemon ahora dominan la entrada al juego.' : 'Carga tu progreso y continua tu aventura.', {
      fontSize: '18px',
      color: '#d6e4f7',
      wordWrap: { width: rightWidth - 36 },
      lineSpacing: 6
    });

    const commandLabels = ['DEX', 'MAP', 'PVP', 'GYM'];
    commandLabels.forEach((label, index) => {
      const chipX = rightX + index * 86;
      const chip = this.add.rectangle(chipX, shellY + 252, 72, 40, 0x13263a, 0.96).setOrigin(0, 0);
      chip.setStrokeStyle(1, accent, index === 0 ? 0.34 : 0.14);
      this.add.text(chipX + 36, shellY + 272, label, {
        fontSize: '13px',
        color: '#e4f4ff',
        fontStyle: '700'
      }).setOrigin(0.5);
      this.tweens.add({
        targets: chip,
        y: chip.y - 3,
        duration: 900 + index * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    const summary = this.add.rectangle(rightX, shellY + 308, rightWidth - 36, 96, 0x0b1628, 0.58).setOrigin(0, 0);
    summary.setStrokeStyle(1, 0x86a7d0, 0.14);

    this.add.text(rightX + 18, shellY + 328, 'Resumen jugable', {
      fontSize: '13px',
      color: '#8fb9ff',
      fontStyle: '600'
    });

    this.add.text(rightX + 18, shellY + 352, state ? `${state.teamCount}/6 slots · ${state.onboardingPercent}% onboarding` : 'Explora y fortalece tu equipo', {
      fontSize: '20px',
      color: '#ecf4ff',
      fontStyle: '700'
    });

    this.add.text(rightX + 18, shellY + 380, state ? `Siguiente foco: ${state.nextTarget} · Starter: ${state.starterName}` : 'Tu progreso aparece aqui al iniciar sesion.', {
      fontSize: '13px',
      color: '#a9bdd8',
      wordWrap: { width: rightWidth - 170 }
    });

    state?.regionSummary.forEach((region, index) => {
      const cardX = rightX + index * 116;
      const cardY = shellY + 426;
      const regionCard = this.add.rectangle(cardX, cardY, 102, 62, 0x102030, 0.86).setOrigin(0, 0);
      regionCard.setStrokeStyle(1, accent, 0.12);
      this.add.text(cardX + 10, cardY + 12, region.label, {
        fontSize: '11px',
        color: '#cfe1f4'
      });
      this.add.text(cardX + 10, cardY + 32, `${region.earned}/${region.total}`, {
        fontSize: '18px',
        color: region.earned > 0 ? '#e8f7ee' : '#8ea2b7',
        fontStyle: '700'
      });
      this.add.text(cardX + 58, cardY + 34, 'badges', {
        fontSize: '10px',
        color: '#8ea2b7'
      });
    });

    if (state?.avatarAsset && this.textures.exists('home-v2-avatar')) {
      const avatarCard = this.add.rectangle(rightX + rightWidth - 128, shellY + 320, 96, 72, 0x0b1528, 0.74).setOrigin(0, 0);
      avatarCard.setStrokeStyle(1, 0x86a7d0, 0.14);
      const avatar = this.add.image(rightX + rightWidth - 80, shellY + 354, 'home-v2-avatar');
      avatar.setDisplaySize(42, 42);
      this.add.text(rightX + rightWidth - 126, shellY + 392, 'Avatar', {
        fontSize: '11px',
        color: '#9db4d1'
      });
    }

    const chips = state
      ? [
          `${state.teamCount}/6 team`,
          `${state.onboardingPercent}% onboarding`,
          state.badgeLabel,
          `starter: ${state.starterName}`
        ]
      : ['Home', 'Login', 'Progress'];

    let chipX = rightX;
    let chipY = shellY + shellHeight - 104;
    chips.forEach((value) => {
      const chip = this.add.text(chipX, chipY, value, {
        fontSize: '12px',
        color: '#c7d8ee',
        backgroundColor: '#203651',
        padding: { x: 11, y: 6 }
      }).setAlpha(0.95);
      chipX += chip.width + 10;
      if (chipX > shellX + shellWidth - 180) {
        chipX = rightX;
        chipY += 34;
      }
    });

    if (state) {
      this.add.text(rightX, shellY + shellHeight - 54, `${state.playerName} · ${this.formatNumber(state.pokedolares)} Pokedolares`, {
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
    return String(value || '')
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
