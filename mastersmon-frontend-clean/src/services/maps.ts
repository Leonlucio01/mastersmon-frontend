import { api } from './api';

export interface Zone {
  id: number;
  nombre: string;
  descripcion?: string | null;
  imagen?: string | null;
  card_imagen?: string | null;
  escenario_imagen?: string | null;
  species_count?: number;
}

export function getZones(): Promise<Zone[]> {
  return api.get<Zone[]>('/zonas');
}

export function getPresence(zonaId: number) {
  return api.get(`/maps/presencia/${zonaId}`);
}

export function updatePresence(zonaId: number, nodoId: string) {
  return api.post('/maps/presencia', { zona_id: zonaId, nodo_id: nodoId });
}

export function removePresence() {
  return api.delete('/maps/presencia');
}

export function generateEncounter(zonaId: number) {
  return api.post('/maps/encuentro', { zona_id: zonaId });
}

export function tryCapture(payload: {
  pokemon_id: number;
  nivel: number;
  es_shiny: boolean;
  hp_actual: number;
  hp_maximo: number;
  item_id: number;
  encuentro_token: string;
}) {
  return api.post('/maps/intentar-captura', payload);
}
