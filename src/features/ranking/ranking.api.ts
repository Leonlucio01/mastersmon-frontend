import { apiFetch } from "@/shared/api/client";

export async function getRankingSummary(limit = 10) {
  return apiFetch<any>("/v2/ranking/summary?limit=" + limit);
}
