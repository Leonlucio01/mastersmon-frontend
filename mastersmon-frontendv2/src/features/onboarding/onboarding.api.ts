import { apiFetch } from "@/shared/api/client";

export type OnboardingStateResponse = {
  needs_onboarding: boolean;
  profile: {
    display_name?: string | null;
    avatar_code?: string | null;
    trainer_code?: string | null;
    trainer_team?: string | null;
    starter_species_id?: number | null;
    region_start_id?: number | null;
    language_code?: string | null;
    timezone_code?: string | null;
    onboarding_completed?: boolean;
    onboarding_step?: string | null;
  };
  owned_pokemon: number;
};

export type OnboardingOptionsResponse = {
  profile_seed: {
    email: string;
    display_name?: string | null;
  };
  trainer_teams: Array<{ code: string; name: string }>;
  avatars: Array<{ code: string; name: string; asset_url: string }>;
  starters: Array<{ id: number; name: string; generation_id: number; asset_url: string; primary_type_name?: string | null }>;
  regions: Array<{ id: number; code: string; name: string; card_asset_path?: string | null; description?: string | null }>;
};

export async function getOnboardingState() {
  return apiFetch<OnboardingStateResponse>("/v2/onboarding/state");
}

export async function getOnboardingOptions() {
  return apiFetch<OnboardingOptionsResponse>("/v2/onboarding/options");
}

export async function completeOnboarding(payload: {
  display_name: string;
  trainer_team: string;
  starter_species_id: number;
  region_code: string;
  avatar_code: string;
  language_code: string;
  timezone_code: string;
}) {
  return apiFetch("/v2/onboarding/complete", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
