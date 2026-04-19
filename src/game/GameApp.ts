import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { HomeScene } from './scenes/HomeScene';
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
      HomeScene,
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
