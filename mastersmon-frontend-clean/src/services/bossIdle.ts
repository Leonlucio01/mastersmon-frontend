import { api } from './api';

export function getBossState() {
  return api.get('/battle/boss/estado');
}

export function startBoss(usuarioPokemonIds?: number[]) {
  return api.post('/battle/boss/iniciar', {
    usuario_pokemon_ids: usuarioPokemonIds,
    guardar_equipo: true
  });
}

export function claimBossReward(bossSessionToken: string, damageTotal = 0, bossDerrotado = false, turnos = 0) {
  return api.post('/battle/boss/recompensa', {
    boss_session_token: bossSessionToken,
    damage_total: damageTotal,
    boss_derrotado: bossDerrotado,
    turnos
  });
}

export function getBossRanking(limit = 20) {
  return api.get(`/battle/boss/ranking?limit=${limit}`);
}

export function getIdleState() {
  return api.get('/battle/idle/estado');
}

export function startIdle(tierCodigo: string, duracionSegundos: number, usuarioPokemonIds?: number[]) {
  return api.post('/battle/idle/iniciar', {
    tier_codigo: tierCodigo,
    duracion_segundos: duracionSegundos,
    usuario_pokemon_ids: usuarioPokemonIds,
    guardar_equipo: true
  });
}

export function claimIdle() {
  return api.post('/battle/idle/reclamar');
}

export function cancelIdle(idleSessionToken?: string) {
  return api.post('/battle/idle/cancelar', {
    idle_session_token: idleSessionToken ?? null
  });
}
