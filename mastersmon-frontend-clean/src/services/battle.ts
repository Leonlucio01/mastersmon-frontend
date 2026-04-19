import { api } from './api';
import type { BattleStartResponse } from '../types/models';

export function startArena(dificultad: 'normal' | 'challenge' | 'expert' | 'master', usuarioPokemonIds?: number[]) {
  return api.post<BattleStartResponse>('/battle/iniciar', {
    dificultad,
    usuario_pokemon_ids: usuarioPokemonIds,
    guardar_equipo: true
  });
}

export function claimArenaVictory(battleSessionToken: string, usuarioPokemonIds: number[]) {
  return api.post('/battle/recompensa-victoria', {
    battle_session_token: battleSessionToken,
    usuario_pokemon_ids: usuarioPokemonIds
  });
}
