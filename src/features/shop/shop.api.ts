import { apiFetch } from "@/shared/api/client";

export async function getShopSummary() {
  return apiFetch<any>("/v2/shop/summary");
}

export async function getUtilityCatalog() {
  return apiFetch<any>("/v2/shop/utility-catalog");
}

export async function purchaseUtility(itemCode: string, quantity: number) {
  return apiFetch<any>("/v2/shop/utility-purchase", {
    method: "POST",
    body: JSON.stringify({ item_code: itemCode, quantity })
  });
}
