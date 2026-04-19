export type ViewKey =
  | 'home'
  | 'pokemon'
  | 'team'
  | 'arena'
  | 'onboarding'
  | 'maps'
  | 'gyms'
  | 'bossIdle'
  | 'shop'
  | 'ranking';

export interface User {
  id: number;
  nombre: string;
  correo: string;
  foto?: string | null;
  avatar_url?: string | null;
  avatar_id?: string | null;
  pokedolares?: number;
  rol?: string;
}

export interface PlayerPokemon {
  id: number;
  pokemon_id: number;
  nombre: string;
  tipo?: string | null;
  imagen?: string | null;
  rareza?: number | null;
  generacion?: number | null;
  tiene_mega?: boolean;
  nivel: number;
  experiencia?: number;
  experiencia_total?: number;
  victorias_total?: number;
  hp_actual?: number;
  hp_max?: number;
  ataque?: number;
  defensa?: number;
  velocidad?: number;
  ataque_especial?: number;
  defensa_especial?: number;
  es_shiny: boolean;
}

export interface TeamSlot extends PlayerPokemon {
  posicion: number;
  es_lider: boolean;
}

export interface ItemRow {
  item_id: number;
  item_codigo?: string | null;
  nombre: string;
  tipo: string;
  descripcion?: string | null;
  bonus_captura?: number;
  cura_hp?: number;
  precio?: number;
  cantidad: number;
}

export interface OnboardingData {
  ok: boolean;
  habilitado: boolean;
  bienvenida_mostrada: boolean;
  tutorial_completado: boolean;
  progreso: {
    completadas: number;
    total: number;
    porcentaje: number;
    capturas: number;
    equipo: number;
    batalla: number;
  };
  misiones: Array<{
    codigo: string;
    objetivo: number;
    actual: number;
    completada: boolean;
    recompensa_reclamada: boolean;
  }>;
}

export interface TrainerSetup {
  ok: boolean;
  supported: boolean;
  usuario: User;
  avatar_id?: string | null;
  team_color?: string | null;
  starter_code?: string | null;
  setup_completed?: boolean;
}

export interface BattleStartResponse {
  ok: boolean;
  battle_session_token: string;
  dificultad_codigo: string;
  bonus_nivel_rival: number;
  exp_ganada: number;
  pokedolares_ganados: number;
  ttl_segundos: number;
}

export interface PokemonMoveRow {
  usuario_pokemon_movimiento_id: number;
  usuario_pokemon_id: number;
  movimiento_id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  categoria: string;
  potencia?: number | null;
  precision_pct?: number | null;
  cooldown_turnos?: number | null;
  prioridad?: number | null;
  objetivo?: string | null;
  efecto_codigo?: string | null;
  efecto_valor?: number | null;
  descripcion?: string | null;
  nivel_desbloqueado?: number | null;
  nivel_requerido?: number | null;
  orden_aprendizaje?: number | null;
  slot?: number | null;
  equipado?: boolean;
}

export interface PokemonMovesResponse {
  ok: boolean;
  usuario_pokemon?: {
    id: number;
    pokemon_id: number;
    nombre: string;
    tipo?: string | null;
    nivel: number;
    es_shiny: boolean;
  };
  movimientos: PokemonMoveRow[];
  equipados: PokemonMoveRow[];
}

export interface PokemonEvolutionOption {
  tipo: 'nivel' | 'item';
  evolucion_id?: number;
  evoluciona_a: number;
  evolucion_nombre: string;
  nivel_requerido?: number | null;
  item_id?: number | null;
  item_nombre?: string | null;
  tiene_item?: boolean;
  cantidad?: number;
  listo?: boolean;
}

export interface PokemonEvolutionState {
  puede_evolucionar: boolean;
  listo_ahora: boolean;
  tipo?: 'nivel' | 'item' | null;
  motivo?: string;
  pokemon_actual?: string;
  pokemon_id?: number;
  nivel_actual?: number;
  opciones?: PokemonEvolutionOption[];
}
