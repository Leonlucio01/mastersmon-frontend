import type { ItemRow, OnboardingData, PlayerPokemon, TeamSlot, TrainerSetup } from '../types/models';

export const playerStore = {
  trainerSetup: null as TrainerSetup | null,
  items: [] as ItemRow[],
  pokemon: [] as PlayerPokemon[],
  team: [] as TeamSlot[],
  onboarding: null as OnboardingData | null,
  reset(): void {
    this.trainerSetup = null;
    this.items = [];
    this.pokemon = [];
    this.team = [];
    this.onboarding = null;
  }
};
