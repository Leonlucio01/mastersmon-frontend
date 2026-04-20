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
      backdrop.setAlpha(0.16);
    }

    this.add.circle(width * 0.18, height * 0.26, 160, accent, 0.14).setBlendMode(Phaser.BlendModes.SCREEN);
    this.add.circle(width * 0.84, height * 0.82, 220, 0x7a5cff, 0.08).setBlendMode(Phaser.BlendModes.SCREEN);

    const margin = 34;
    const shellWidth = width - margin * 2;
    const shellHeight = height - 72;
    const shellX = margin;
    const shellY = 28;
    const mapWidth = Math.max(520, Math.floor(shellWidth * 0.72));
    const sideWidth = shellWidth - mapWidth - 34;
    const mapX = shellX + 18;
    const mapY = shellY + 18;
    const rightX = mapX + mapWidth + 16;
    const rightY = mapY;
    const heroHeight = Math.max(320, shellHeight - 176);

    const shell = this.add.rectangle(shellX, shellY, shellWidth, shellHeight, 0x0d1b31, 0.66).setOrigin(0, 0);
    shell.setStrokeStyle(1, 0x86a7d0, 0.18);

    const mapPanel = this.add.rectangle(mapX, mapY, mapWidth, shellHeight - 36, 0x08111d, 0.56).setOrigin(0, 0);
    mapPanel.setStrokeStyle(1, 0x86a7d0, 0.14);

    const hero = this.add.rectangle(mapX + 18, mapY + 18, mapWidth - 36, heroHeight, 0x102235, 0.96).setOrigin(0, 0);
    hero.setStrokeStyle(1, accent, 0.16);

    if (state?.backdropAsset && this.textures.exists('home-v2-backdrop')) {
      const heroBackdrop = this.add.image(mapX + mapWidth / 2, mapY + 18 + heroHeight / 2, 'home-v2-backdrop');
      heroBackdrop.setDisplaySize(mapWidth - 36, heroHeight);
      heroBackdrop.setAlpha(0.98);
    }

    const overlay = this.add.rectangle(mapX + 18, mapY + 18, mapWidth - 36, heroHeight, 0x08111d, 0.14).setOrigin(0, 0);
    overlay.setStrokeStyle(1, 0xffffff, 0.04);

    this.add.text(mapX + 42, mapY + 40, 'Map Preview', {
      fontSize: '16px',
      color: '#cbe0ff',
      fontStyle: '600'
    });

    this.add.text(mapX + 42, mapY + 68, state?.regionLabel.toUpperCase() || 'HOME', {
      fontSize: '12px',
      color: '#d9e7ff',
      backgroundColor: '#1b3152',
      padding: { x: 12, y: 6 }
    });

    if (state?.avatarAsset && this.textures.exists('home-v2-avatar')) {
      const avatarRing = this.add.circle(mapX + mapWidth * 0.63, mapY + heroHeight * 0.72, 34, 0x102340, 0.94);
      avatarRing.setStrokeStyle(2, accent, 0.42);
      const avatar = this.add.image(mapX + mapWidth * 0.63, mapY + heroHeight * 0.72, 'home-v2-avatar');
      avatar.setDisplaySize(54, 54);
    }

    const footer = this.add.rectangle(mapX + 18, mapY + heroHeight + 44, mapWidth - 36, 96, 0x0b1628, 0.68).setOrigin(0, 0);
    footer.setStrokeStyle(1, 0x86a7d0, 0.12);

    this.add.text(mapX + 42, mapY + heroHeight + 60, 'Field Status', {
      fontSize: '13px',
      color: '#8fb9ff',
      fontStyle: '600'
    });

    this.add.text(mapX + 42, mapY + heroHeight + 84, state ? `${state.teamCount}/6 team slots ready` : 'Load your team', {
      fontSize: '20px',
      color: '#ecf4ff',
      fontStyle: '700'
    });

    this.add.text(mapX + 42, mapY + heroHeight + 112, state ? `Starter ${state.starterName} - ${this.formatNumber(state.pokedolares)} Pokedolares` : 'Track your route from home.', {
      fontSize: '12px',
      color: '#a9bdd8'
    });

    const sidePanel = this.add.rectangle(rightX, rightY, sideWidth, shellHeight - 36, 0x0a1424, 0.4).setOrigin(0, 0);
    sidePanel.setStrokeStyle(1, 0x86a7d0, 0.12);

    const sideCards = [
      { title: 'Pokemon', value: state?.teamSprites[0] ? 'Active lead' : 'Waiting', note: 'Compact encounter slot' },
      { title: 'Items', value: state ? `${state.teamCount} ready` : '0', note: 'Capture loadout and balls' },
      { title: 'Move', value: 'Pad', note: 'North - West - East - South' }
    ];

    sideCards.forEach((card, index) => {
      const cardY = rightY + 22 + index * 156;
      const block = this.add.rectangle(rightX + 18, cardY, sideWidth - 36, 134, 0x102030, 0.86).setOrigin(0, 0);
      block.setStrokeStyle(1, index === 0 ? accent : 0x86a7d0, index === 0 ? 0.18 : 0.1);
      this.add.text(rightX + 40, cardY + 18, card.title, {
        fontSize: '13px',
        color: '#8fb9ff',
        fontStyle: '600'
      });
      this.add.text(rightX + 40, cardY + 48, card.value, {
        fontSize: '28px',
        color: '#eff7ff',
        fontStyle: '700'
      });
      this.add.text(rightX + 40, cardY + 86, card.note, {
        fontSize: '12px',
        color: '#a9bdd8',
        wordWrap: { width: sideWidth - 92 }
      });
    });

    state?.regionSummary.forEach((region, index) => {
      const cardWidth = (sideWidth - 62) / 2;
      const cardX = rightX + 18 + (index % 2) * (cardWidth + 10);
      const cardY = rightY + shellHeight - 136 + Math.floor(index / 2) * 48;
      const regionCard = this.add.rectangle(cardX, cardY, cardWidth, 40, 0x0f1f31, 0.88).setOrigin(0, 0);
      regionCard.setStrokeStyle(1, accent, 0.08);
      this.add.text(cardX + 10, cardY + 8, region.label, {
        fontSize: '10px',
        color: '#cfe1f4'
      });
      this.add.text(cardX + 10, cardY + 22, `${region.earned}/${region.total}`, {
        fontSize: '13px',
        color: region.earned > 0 ? '#e8f7ee' : '#8ea2b7',
        fontStyle: '700'
      });
    });
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
