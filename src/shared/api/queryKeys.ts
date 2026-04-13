export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const
  },
  onboarding: {
    state: ["onboarding", "state"] as const,
    options: ["onboarding", "options"] as const
  },
  home: {
    summary: ["home", "summary"] as const,
    alerts: ["home", "alerts"] as const
  },
  adventure: {
    regions: ["adventure", "regions"] as const,
    region: (code: string) => ["adventure", "region", code] as const,
    zone: (code: string) => ["adventure", "zone", code] as const
  },
  collection: {
    summary: ["collection", "summary"] as const,
    pokemon: (params: string) => ["collection", "pokemon", params] as const,
    detail: (id: number) => ["collection", "detail", id] as const
  },
  team: {
    active: ["team", "active"] as const
  },
  gyms: {
    summary: ["gyms", "summary"] as const,
    list: ["gyms", "list"] as const,
    detail: (code: string) => ["gyms", "detail", code] as const
  },
  house: {
    summary: ["house", "summary"] as const,
    storage: ["house", "storage"] as const,
    upgrades: ["house", "upgrades"] as const
  },
  shop: {
    summary: ["shop", "summary"] as const,
    utilityCatalog: ["shop", "utility-catalog"] as const
  },
  trade: {
    summary: ["trade", "summary"] as const,
    offers: (scope: string) => ["trade", "offers", scope] as const,
    availablePokemon: ["trade", "available-pokemon"] as const
  },
  ranking: {
    summary: ["ranking", "summary"] as const
  },
  profile: {
    me: ["profile", "me"] as const
  }
};
