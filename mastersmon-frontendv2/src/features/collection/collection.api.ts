import { apiFetch } from "@/shared/api/client";

export async function getCollectionSummary() {
  return apiFetch<any>("/v2/collection/summary");
}

export async function getCollectionPokemon(params: URLSearchParams) {
  return apiFetch<any>("/v2/collection/pokemon?" + params.toString());
}

export async function getCollectionPokemonDetail(id: number) {
  return apiFetch<any>("/v2/collection/pokemon/" + id);
}
