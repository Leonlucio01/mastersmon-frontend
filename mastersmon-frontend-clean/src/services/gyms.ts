import { api } from './api';

export function getGymCatalog() {
  return api.get('/battle/gyms/catalogo');
}

export function getGymProgress() {
  return api.get('/battle/gyms/progreso');
}

export function startGym(gymCodigo: string, usuarioPokemonIds?: number[]) {
  return api.post('/battle/gyms/iniciar', {
    gym_codigo: gymCodigo,
    usuario_pokemon_ids: usuarioPokemonIds,
    guardar_equipo: true
  });
}

export function claimGymReward(gymSessionToken: string, victoria: boolean, turnos = 12) {
  return api.post('/battle/gyms/recompensa', {
    gym_session_token: gymSessionToken,
    victoria,
    turnos
  });
}
