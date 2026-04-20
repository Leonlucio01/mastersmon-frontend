import Phaser from 'phaser';
import { sessionStore } from '../../store/session';
import { playerStore } from '../../store/player';
import { getMyPokemon, getMyTeam, getOnboarding, getTrainerSetup } from '../../services/player';
import { getGymCatalog } from '../../services/gyms';
import { getAvatarAsset, getScenarioBackdrop } from '../../utils/gameAssets';
import { getPokemonCardImage } from '../../utils/pokeSprites';

interface HomeVisualState {
  playerName: string;
  avatarAsset: string | null;
  regionLabel: string;
  backdropAsset: string | null;
  starterName: string;
  teamColor: string;
  onboardingPercent: number;
  teamCount: number;
  pokedolares: number;
  teamSprites: string[];
  regionSummary: Array<{ label: string; earned: number; total: number }>;
}

const REGION_LABELS: Record<string, string> = {
  kanto: 'Kanto',
  johto: 'Johto',
  hoenn: 'Hoenn',
  zona_especial: 'Especial'
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
      const [trainerSetupRaw, onboardingRaw, gymCatalogRaw, myTeamRaw, myPokemonRaw] = await Promise.all([
        getTrainerSetup().catch(() => null),
        getOnboarding().catch(() => null),
        getGymCatalog().catch(() => null),
        getMyTeam().catch(() => null),
        getMyPokemon().catch(() => null)
      ]);

      if (trainerSetupRaw) playerStore.trainerSetup = trainerSetupRaw;
      if (onboardingRaw) playerStore.onboarding = onboardingRaw;
      if (myTeamRaw?.equipo) playerStore.team = myTeamRaw.equipo;
      if (Array.isArray(myPokemonRaw)) playerStore.pokemon = myPokemonRaw;

      const user = sessionStore.getUser();
      const orderedTeam = [...playerStore.team].sort((a, b) => a.posicion - b.posicion);
      const spritePool = orderedTeam.length ? orderedTeam : playerStore.pokemon.slice(0, 6);
      const regionCode = 'kanto';
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
        regionLabel: REGION_LABELS[regionCode],
        backdropAsset: getScenarioBackdrop(regionCode, REGION_BACKDROP_FALLBACKS[regionCode]),
        starterName: String(trainerSetupRaw?.starter_code || 'starter'),
        teamColor: String(trainerSetupRaw?.team_color || 'blue'),
        onboardingPercent: Number(onboardingRaw?.progreso?.porcentaje || 0),
        teamCount: orderedTeam.length,
        pokedolares: Number(user?.pokedolares || 0),
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
      { key: 'home-v2-avatar', url: state.avatarAsset }
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
    const leftWidth = Math.max(280, Math.floor(shellWidth * 0.36));
    const rightX = shellX + leftWidth + 38;
    const rightWidth = shellWidth - leftWidth - 66;

    const shell = this.add.rectangle(shellX, shellY, shellWidth, shellHeight, 0x0d1b31, 0.66).setOrigin(0, 0);
    shell.setStrokeStyle(1, 0x86a7d0, 0.18);

    const leftPanel = this.add.rectangle(shellX + 24, shellY + 24, leftWidth - 12, shellHeight - 48, 0x08111d, 0.6).setOrigin(0, 0);
    leftPanel.setStrokeStyle(1, 0x86a7d0, 0.14);

    if (state?.avatarAsset && this.textures.exists('home-v2-avatar')) {
      const avatarRing = this.add.circle(shellX + leftWidth * 0.48, shellY + 116, 52, 0x102340, 0.96);
      avatarRing.setStrokeStyle(2, accent, 0.42);
      const avatar = this.add.image(shellX + leftWidth * 0.48, shellY + 116, 'home-v2-avatar');
      avatar.setDisplaySize(84, 84);
    }

    this.add.text(shellX + 42, shellY + 190, state?.playerName || 'Entrenador', {
      fontSize: '28px',
      color: '#eff7ff',
      fontStyle: '700'
    });

    this.add.text(shellX + 42, shellY + 224, state ? `${state.teamCount}/6 team · ${this.formatNumber(state.pokedolares)} $` : 'Carga tu perfil', {
      fontSize: '14px',
      color: '#b5cbe5'
    });

    this.add.text(shellX + 42, shellY + 258, 'Equipo activo', {
      fontSize: '13px',
      color: '#8fb9ff',
      fontStyle: '600'
    });

    for (let index = 0; index < 6; index += 1) {
      const slotX = shellX + 40 + (index % 3) * 74;
      const slotY = shellY + 298 + Math.floor(index / 3) * 126;
      const slot = this.add.rectangle(slotX, slotY, 62, 104, 0x0b1528, 0.74).setOrigin(0, 0);
      slot.setStrokeStyle(1, index === 0 ? accent : 0x86a7d0, index === 0 ? 0.34 : 0.16);

      this.add.text(slotX + 8, slotY + 8, `0${index + 1}`, {
        fontSize: '10px',
        color: '#9db4d1'
      });

      if (state?.teamSprites[index] && this.textures.exists(`home-v2-team-${index}`)) {
        const poke = this.add.image(slotX + 31, slotY + 40, `home-v2-team-${index}`);
        poke.setDisplaySize(46, 46);
      } else {
        this.add.text(slotX + 31, slotY + 38, '+', {
          fontSize: '24px',
          color: '#9db4d1',
          fontStyle: '700'
        }).setOrigin(0.5);
      }

      this.add.text(slotX + 31, slotY + 66, state?.teamSprites[index] ? 'Activo' : 'Libre', {
        fontSize: '10px',
        color: '#9db4d1'
      }).setOrigin(0.5);
    }

    const rightPanel = this.add.rectangle(rightX - 18, shellY + 28, rightWidth, shellHeight - 56, 0x0a1424, 0.22).setOrigin(0, 0);
    rightPanel.setStrokeStyle(1, 0x86a7d0, 0.08);

    this.add.text(rightX, shellY + 38, 'Ficha del entrenador', {
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

    this.add.text(rightX, shellY + 132, state?.playerName || 'MastersMon', {
      fontSize: '42px',
      color: '#ecf4ff',
      fontStyle: '700'
    });

    this.add.text(rightX, shellY + 188, state ? 'Cuenta, economia y progreso regional visibles de forma compacta.' : 'Carga tu progreso y continua tu aventura.', {
      fontSize: '17px',
      color: '#d6e4f7',
      wordWrap: { width: rightWidth - 36 },
      lineSpacing: 6
    });

    const summary = this.add.rectangle(rightX, shellY + 246, rightWidth - 36, 88, 0x0b1628, 0.58).setOrigin(0, 0);
    summary.setStrokeStyle(1, 0x86a7d0, 0.14);

    this.add.text(rightX + 18, shellY + 264, 'Resumen del jugador', {
      fontSize: '13px',
      color: '#8fb9ff',
      fontStyle: '600'
    });

    this.add.text(rightX + 18, shellY + 286, state ? `${state.teamCount}/6 slots · ${state.onboardingPercent}% onboarding` : 'Explora y fortalece tu equipo', {
      fontSize: '18px',
      color: '#ecf4ff',
      fontStyle: '700'
    });

    this.add.text(rightX + 18, shellY + 310, state ? `Starter: ${state.starterName} · Region base: ${state.regionLabel}` : 'Tu progreso aparece aqui al iniciar sesion.', {
      fontSize: '12px',
      color: '#a9bdd8',
      wordWrap: { width: rightWidth - 36 }
    });

    state?.regionSummary.forEach((region, index) => {
      const cardX = rightX + index * 116;
      const cardY = shellY + 356;
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
      const avatarCard = this.add.rectangle(rightX + rightWidth - 118, shellY + 246, 90, 88, 0x0b1528, 0.74).setOrigin(0, 0);
      avatarCard.setStrokeStyle(1, 0x86a7d0, 0.14);
      const avatar = this.add.image(rightX + rightWidth - 73, shellY + 282, 'home-v2-avatar');
      avatar.setDisplaySize(42, 42);
      this.add.text(rightX + rightWidth - 108, shellY + 316, 'avatar', {
        fontSize: '11px',
        color: '#9db4d1'
      });
    }

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
}
