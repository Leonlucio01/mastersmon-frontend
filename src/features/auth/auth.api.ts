import { apiFetch } from "@/shared/api/client";

export type AuthMeResponse = {
  user: {
    id: number;
    email: string;
    display_name?: string | null;
    avatar_code?: string | null;
    photo_url?: string | null;
    trainer_team?: string | null;
    onboarding_completed?: boolean;
  };
};

export type GoogleLoginResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    display_name?: string | null;
    avatar_code?: string | null;
    photo_url?: string | null;
  };
};

export async function loginWithGoogle(credential: string) {
  return apiFetch<GoogleLoginResponse>("/v2/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential })
  });
}

export async function getAuthMe() {
  return apiFetch<AuthMeResponse>("/v2/auth/me");
}
