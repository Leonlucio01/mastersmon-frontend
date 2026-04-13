import { apiFetch } from "@/shared/api/client";

export async function getTradeSummary() {
  return apiFetch<any>("/v2/trade/summary");
}

export async function getTradeOffers(scope: "market" | "mine") {
  return apiFetch<any>("/v2/trade/offers?scope=" + scope);
}

export async function getTradeAvailablePokemon() {
  return apiFetch<any>("/v2/trade/available-pokemon");
}

export async function createTradeOffer(payload: any) {
  return apiFetch<any>("/v2/trade/offers", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function cancelTradeOffer(id: number) {
  return apiFetch<any>("/v2/trade/offers/" + id + "/cancel", { method: "POST" });
}

export async function acceptTradeOffer(id: number) {
  return apiFetch<any>("/v2/trade/offers/" + id + "/accept", { method: "POST" });
}
