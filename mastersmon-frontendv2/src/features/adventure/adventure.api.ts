import { apiFetch } from "@/shared/api/client";

export async function getRegions() {
  return apiFetch<any[]>("/v2/adventure/regions");
}

export async function getRegionDetail(regionCode: string) {
  return apiFetch<any>("/v2/adventure/regions/" + regionCode);
}

export async function getZoneDetail(zoneCode: string) {
  return apiFetch<any>("/v2/adventure/zones/" + zoneCode);
}

export async function createEncounter(zoneCode: string, mode: string) {
  return apiFetch<any>("/v2/adventure/zones/" + zoneCode + "/encounters", {
    method: "POST",
    body: JSON.stringify({ mode })
  });
}

export async function captureEncounter(encounterId: string, ballItemCode: string) {
  return apiFetch<any>("/v2/adventure/encounters/" + encounterId + "/capture", {
    method: "POST",
    body: JSON.stringify({ ball_item_code: ballItemCode })
  });
}
