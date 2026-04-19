import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { HomeSceneV2 } from './scenes/HomeSceneV2';
import { PokemonScene } from './scenes/PokemonScene';
import { TeamScene } from './scenes/TeamScene';
import { ArenaScene } from './scenes/ArenaScene';
import { OnboardingScene } from './scenes/OnboardingScene';
import { MapsScene } from './scenes/MapsScene';
import { GymsScene } from './scenes/GymsScene';
import { BossIdleScene } from './scenes/BossIdleScene';
import { ShopScene } from './scenes/ShopScene';
import { RankingScene } from './scenes/RankingScene';
import { gameConfig } from './config';

export function createGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    ...gameConfig,
    parent,
    scene: [
      BootScene,
      PreloadScene,
      HomeSceneV2,
      PokemonScene,
      TeamScene,
      ArenaScene,
      OnboardingScene,
      MapsScene,
      GymsScene,
      BossIdleScene,
      ShopScene,
      RankingScene
    ]
  });
}
