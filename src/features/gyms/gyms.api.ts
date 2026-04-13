import { apiFetch } from "@/shared/api/client";

export async function getGymsSummary() {
  return apiFetch<any>("/v2/gyms/summary");
}

export async function getGyms() {
  return apiFetch<any>("/v2/gyms");
}

export async function getGymDetail(code: string) {
  return apiFetch<any>("/v2/gyms/" + code);
}
