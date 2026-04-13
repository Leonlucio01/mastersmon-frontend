import { apiFetch } from "@/shared/api/client";

export async function getActiveTeam() {
  return apiFetch<any>("/v2/team/active");
}

export async function saveActiveTeam(userPokemonIds: number[], teamName?: string) {
  return apiFetch<any>("/v2/team/active", {
    method: "POST",
    body: JSON.stringify({
      user_pokemon_ids: userPokemonIds,
      team_name: teamName || null
    })
  });
}
