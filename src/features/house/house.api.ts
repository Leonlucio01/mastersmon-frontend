import { apiFetch } from "@/shared/api/client";

export async function getHouseSummary() {
  return apiFetch<any>("/v2/house/summary");
}

export async function getHouseStorage() {
  return apiFetch<any>("/v2/house/storage");
}

export async function getHouseUpgrades() {
  return apiFetch<any>("/v2/house/upgrades");
}
