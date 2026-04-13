import { env } from "@/shared/config/env";
import { getToken } from "@/shared/lib/token";

export type ApiErrorShape = {
  code?: string;
  message?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(pathname: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(env.apiBaseUrl + pathname, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(init?.headers || {})
    }
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || !payload?.ok) {
    const error = payload?.error || payload?.detail || {};
    const message = error?.message || error?.detail || "Ocurrió un error inesperado.";
    const code = error?.code;
    throw new ApiError(message, res.status, code);
  }

  return payload.data as T;
}
