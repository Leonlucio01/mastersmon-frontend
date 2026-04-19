import { api } from './api';
import type { ItemRow, OnboardingData, PlayerPokemon, PokemonEvolutionState, PokemonMovesResponse, TeamSlot, TrainerSetup, User } from '../types/models';

export function getMe(): Promise<User> {
  return api.get<User>('/usuario/me');
}

export function getTrainerSetup(): Promise<TrainerSetup> {
  return api.get<TrainerSetup>('/usuario/me/trainer-setup');
}

export function getMyItems(): Promise<ItemRow[]> {
  return api.get<ItemRow[]>('/usuario/me/items');
}

export function getMyPokemon(): Promise<PlayerPokemon[]> {
  return api.get<PlayerPokemon[]>('/usuario/me/pokemon');
}

export function getMyTeam(): Promise<{ ok: boolean; usuario_id: number; equipo: TeamSlot[] }> {
  return api.get<{ ok: boolean; usuario_id: number; equipo: TeamSlot[] }>('/usuario/me/equipo');
}

export function saveMyTeam(usuarioPokemonIds: number[]): Promise<{ ok: boolean; equipo_ids: number[]; equipo: TeamSlot[] }> {
  return api.post<{ ok: boolean; equipo_ids: number[]; equipo: TeamSlot[] }>('/usuario/me/equipo', { usuario_pokemon_ids: usuarioPokemonIds });
}

export function getOnboarding(): Promise<OnboardingData> {
  return api.get<OnboardingData>('/onboarding/me');
}

export function markOnboardingWelcome(vista = true): Promise<OnboardingData> {
  return api.post<OnboardingData>('/onboarding/me/bienvenida', { vista });
}

export function getPokemonMoves(usuarioPokemonId: number): Promise<unknown> {
  return api.get<PokemonMovesResponse>(`/usuario/pokemon/${usuarioPokemonId}/movimientos`);
}

export function equipPokemonMove(usuarioPokemonId: number, movimientoId: number, slot: number): Promise<PokemonMovesResponse> {
  return api.post<PokemonMovesResponse>(`/usuario/pokemon/${usuarioPokemonId}/movimientos/equipar`, {
    movimiento_id: movimientoId,
    slot
  });
}

export function getPokemonEvolutionState(usuarioPokemonId: number): Promise<PokemonEvolutionState> {
  return api.get<PokemonEvolutionState>(`/usuario/pokemon/${usuarioPokemonId}/evolucion`);
}

export function evolvePokemonByLevel(usuarioId: number, usuarioPokemonId: number): Promise<{ ok: boolean; mensaje: string }> {
  return api.post<{ ok: boolean; mensaje: string }>('/pokemon/evolucionar-nivel', {
    usuario_id: usuarioId,
    usuario_pokemon_id: usuarioPokemonId
  });
}

export function evolvePokemonByItem(usuarioId: number, usuarioPokemonId: number, itemId: number): Promise<{ ok: boolean; mensaje: string }> {
  return api.post<{ ok: boolean; mensaje: string }>('/pokemon/evolucionar-item', {
    usuario_id: usuarioId,
    usuario_pokemon_id: usuarioPokemonId,
    item_id: itemId
  });
}

export function releaseMyPokemon(usuarioId: number, usuarioPokemonId: number): Promise<{ ok: boolean; mensaje: string }> {
  return api.post<{ ok: boolean; mensaje: string }>('/usuario/soltar-pokemon', {
    usuario_id: usuarioId,
    usuario_pokemon_id: usuarioPokemonId
  });
}
