import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  Button,
  Card,
  ErrorBlock,
  Input,
  LoadingBlock,
  PageHeader,
  ProgressBar,
  Select,
  Stat,
} from "@/shared/ui";
import { useAuthStore } from "@/features/auth/auth.store";
import { getAuthMe, loginWithGoogle } from "@/features/auth/auth.api";
import {
  completeOnboarding,
  getOnboardingOptions,
  getOnboardingState,
} from "@/features/onboarding/onboarding.api";
import { getHomeAlerts, getHomeSummary } from "@/features/home/home.api";

const GOOGLE_CLIENT_ID =
  "535230935122-vqqd262fjhetd408li95420bb8cas5vb.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number;
            }
          ) => void;
          cancel?: () => void;
        };
      };
    };
  }
}

function loadGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("No se pudo cargar Google Identity Services.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("No se pudo cargar Google Identity Services."));
    document.head.appendChild(script);
  });
}

function GoogleSignInButton(props: {
  onCredential: (credential: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(props.onCredential);
  const [error, setError] = useState("");

  useEffect(() => {
    onCredentialRef.current = props.onCredential;
  }, [props.onCredential]);

  useEffect(() => {
    let cancelled = false;

    async function initGoogle() {
      try {
        await loadGoogleIdentityScript();

        const googleId = window.google?.accounts?.id;
        if (cancelled || !googleId || !containerRef.current) return;

        googleId.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential?: string }) => {
            if (response?.credential) {
              onCredentialRef.current(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        containerRef.current.innerHTML = "";

        googleId.renderButton(containerRef.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 280,
        });
      } catch (err) {
        console.error("Google GSI init error:", err);
        if (!cancelled) {
          setError("No se pudo cargar Google Sign-In.");
        }
      }
    }

    initGoogle();

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel?.();
      } catch {
        // noop
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} />
      {error ? <div className="text-xs text-red-300">{error}</div> : null}
    </div>
  );
}

export function PublicOnly() {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/hub" replace />;
  return <Outlet />;
}

export function AppGate() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/" replace />;

  const meQuery = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getAuthMe,
  });

  const onboardingQuery = useQuery({
    queryKey: queryKeys.onboarding.state,
    queryFn: getOnboardingState,
    enabled: meQuery.isSuccess,
  });

  if (meQuery.isLoading || onboardingQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <LoadingBlock />
      </div>
    );
  }

  if (meQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <ErrorBlock message={(meQuery.error as Error).message} />
      </div>
    );
  }

  if (onboardingQuery.isSuccess && onboardingQuery.data.needs_onboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function LoginPage() {
  const setAuthToken = useAuthStore((s) => s.setAuthToken);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [manualToken, setManualToken] = useState("");

  const mutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: (data) => {
      setAuthToken(data.token);
      qc.invalidateQueries();
      navigate("/hub", { replace: true });
    },
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <Card className="w-full p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white">MastersMon</h1>
          <p className="mt-2 text-sm text-slate-300">
            Ingresa con Google para entrar al hub del juego.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <GoogleSignInButton
              onCredential={(credential) => {
                mutation.mutate(credential);
              }}
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 text-sm font-semibold text-white">
              Fallback manual
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Si ya tienes un token válido, puedes pegarlo aquí para entrar rápido.
            </p>
            <Input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Bearer token"
            />
            <Button
              className="mt-3 w-full"
              onClick={() => {
                if (!manualToken.trim()) return;
                setAuthToken(manualToken.trim());
                qc.invalidateQueries();
                navigate("/hub", { replace: true });
              }}
            >
              Entrar con token
            </Button>
          </div>

          {mutation.isError ? (
            <ErrorBlock message={(mutation.error as Error).message} />
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export function PublicHomePage() {
  const token = useAuthStore((s) => s.token);

  if (token) {
    return <Navigate to="/hub" replace />;
  }

  const navigate = useNavigate();
  const qc = useQueryClient();
  const setAuthToken = useAuthStore((s) => s.setAuthToken);

  const mutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: async (data) => {
      setAuthToken(data.token);
      await qc.invalidateQueries();
      navigate("/hub", { replace: true });
    },
  });

  return (
    <div className="min-h-screen bg-hub-gradient">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-sm text-brand-200">
              Mundo Pokémon · Colección · Aventura · Gimnasios
            </span>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl">
                MastersMon
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                Explora regiones, captura Pokémon, arma tu equipo, mejora tu casa y
                progresa como entrenador en una experiencia online conectada a tu cuenta.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="px-6 py-3 text-base"
                onClick={() => {
                  const loginSection = document.getElementById("public-login-box");
                  loginSection?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }}
              >
                Conectarse con Google
              </Button>

              <Button
                className="border border-white/10 bg-white/5 px-6 py-3 text-base text-white hover:bg-white/10"
                onClick={() => navigate("/acceso")}
              >
                Ir a acceso
              </Button>
            </div>
          </div>

          <Card className="mx-auto w-full max-w-md p-8" id="public-login-box">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-white">
                Empieza tu aventura
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Entra con Google para guardar tu progreso y acceder al hub del juego.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <GoogleSignInButton
                  onCredential={(credential) => {
                    mutation.mutate(credential);
                  }}
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 text-sm font-semibold text-white">
                  Acceso rápido
                </div>
                <p className="mb-3 text-xs text-slate-400">
                  Si ya tienes un token válido, puedes pegarlo aquí para entrar manualmente.
                </p>

                <ManualTokenLogin />
              </div>

              {mutation.isError ? (
                <ErrorBlock message={(mutation.error as Error).message} />
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ManualTokenLogin() {
  const [manualToken, setManualToken] = useState("");
  const setAuthToken = useAuthStore((s) => s.setAuthToken);
  const navigate = useNavigate();
  const qc = useQueryClient();

  return (
    <>
      <Input
        value={manualToken}
        onChange={(e) => setManualToken(e.target.value)}
        placeholder="Bearer token"
      />
      <Button
        className="mt-3 w-full"
        onClick={() => {
          if (!manualToken.trim()) return;
          setAuthToken(manualToken.trim());
          qc.invalidateQueries();
          navigate("/hub", { replace: true });
        }}
      >
        Entrar con token
      </Button>
    </>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const optionsQuery = useQuery({
    queryKey: queryKeys.onboarding.options,
    queryFn: getOnboardingOptions,
  });

  const [form, setForm] = useState({
    display_name: "",
    trainer_team: "neutral",
    starter_species_id: 0,
    region_code: "",
    avatar_code: "steven",
    language_code: "es",
    timezone_code: "America/Lima",
  });

  const mutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      qc.invalidateQueries();
      navigate("/hub", { replace: true });
    },
  });

  const seeded = optionsQuery.data?.profile_seed;
  const starters = optionsQuery.data?.starters || [];
  const avatars = optionsQuery.data?.avatars || [];
  const regions = optionsQuery.data?.regions || [];
  const teams = optionsQuery.data?.trainer_teams || [];

  return (
    <div className="mx-auto max-w-5xl p-4">
      <PageHeader
        title="Completa tu onboarding"
        subtitle="Configura tu entrenador, región inicial y starter."
      />

      {optionsQuery.isLoading ? <LoadingBlock /> : null}
      {optionsQuery.isError ? (
        <ErrorBlock message={(optionsQuery.error as Error).message} />
      ) : null}

      {optionsQuery.data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-4">
            <Input
              label="Nombre visible"
              value={form.display_name}
              onChange={(e) =>
                setForm((s) => ({ ...s, display_name: e.target.value }))
              }
              placeholder={seeded?.display_name || "Tu nombre"}
            />

            <Select
              label="Equipo"
              value={form.trainer_team}
              onChange={(e) =>
                setForm((s) => ({ ...s, trainer_team: e.target.value }))
              }
            >
              {teams.map((team: any) => (
                <option key={team.code} value={team.code}>
                  {team.name}
                </option>
              ))}
            </Select>

            <Select
              label="Avatar"
              value={form.avatar_code}
              onChange={(e) =>
                setForm((s) => ({ ...s, avatar_code: e.target.value }))
              }
            >
              {avatars.map((avatar: any) => (
                <option key={avatar.code} value={avatar.code}>
                  {avatar.name}
                </option>
              ))}
            </Select>

            <Select
              label="Región inicial"
              value={form.region_code}
              onChange={(e) =>
                setForm((s) => ({ ...s, region_code: e.target.value }))
              }
            >
              <option value="">Selecciona una región</option>
              {regions.map((region: any) => (
                <option key={region.code} value={region.code}>
                  {region.name}
                </option>
              ))}
            </Select>

            <Select
              label="Starter"
              value={String(form.starter_species_id || "")}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  starter_species_id: Number(e.target.value),
                }))
              }
            >
              <option value="">Selecciona un starter</option>
              {starters.map((starter: any) => (
                <option key={starter.id} value={starter.id}>
                  {starter.name}
                </option>
              ))}
            </Select>

            <Button
              className="w-full"
              onClick={() => {
                mutation.mutate({
                  ...form,
                  display_name:
                    form.display_name || seeded?.display_name || "Trainer",
                });
              }}
              disabled={!form.region_code || !form.starter_species_id}
            >
              Completar onboarding
            </Button>
          </Card>

          <Card>
            <div className="text-white">Vista previa onboarding</div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export function HomePage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <PageHeader title="Hub principal" subtitle="Login completado." />
      <Card className="p-6 text-white">Estás dentro del juego.</Card>
    </div>
  );
}