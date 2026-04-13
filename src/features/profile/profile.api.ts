import { apiFetch } from "@/shared/api/client";

export async function getProfile() {
  return apiFetch<any>("/v2/profile/me");
}
