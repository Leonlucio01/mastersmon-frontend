import { api } from './api';

export function getRankingSummary(limit = 10) {
  return api.get(`/ranking/resumen?limit=${limit}`);
}
