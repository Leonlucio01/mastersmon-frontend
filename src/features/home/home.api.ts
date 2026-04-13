import { apiFetch } from "@/shared/api/client";

export async function getHomeSummary() {
  return apiFetch<any>("/v2/home/summary");
}

export async function getHomeAlerts() {
  return apiFetch<any>("/v2/home/alerts");
}
