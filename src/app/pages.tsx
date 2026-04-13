import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  Button,
  Card,
  ErrorBlock,
  Input,
  LoadingBlock,
  PageHeader,
} from "@/shared/ui";
import { useAuthStore } from "@/features/auth/auth.store";
import { getAuthMe, loginWithGoogle } from "@/features/auth/auth.api";
import {
  completeOnboarding,
  getOnboardingOptions,
  getOnboardingState,
} from "@/features/onboarding/onboarding.api";

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

function DebugPanel({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
      <div className="mb-2 text-sm font-semibold text-yellow-200">Debug login</div>
      <div className="space-y-1 text-xs text-yellow-100">
        {lines.length ? lines.map((line, i) => <div key={i}>• {line}</div>) : <div>Sin eventos todavía.</div>}
      </div>
    </div>
  );
}

function GoogleSignInButton(props: {
  onCredential: (credential: string) => void;
  onDebug: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(props.onCredential);
  const onDebugRef = useRef(props.onDebug);
  const [error, setError] = useState("");

  useEffect(() => {
    onCredentialRef.current = props.onCredential;
    onDebugRef.current = props.onDebug;
  }, [props.onCredential, props.onDebug]);

  useEffect(() => {
    let cancelled = false;

    async function initGoogle() {
      try {
        onDebugRef.current(`CLIENT_ID: ${GOOGLE_CLIENT_ID}`);
        await loadGoogleIdentityScript();
        onDebugRef.current("Script Google cargado.");

        const googleId = window.google?.accounts?.id;
        if (cancelled || !googleId || !containerRef.current) {
          onDebugRef.current("Google ID no disponible.");
          return;
        }

        googleId.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential?: string }) => {
            if (response?.credential) {
              onDebugRef.current(`Credential recibida (${response.credential.length} chars).`);
              onCredentialRef.current(response.credential);
            } else {
              onDebugRef.current("Google respondió sin credential.");
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        onDebugRef.current("Google initialize OK.");
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

        onDebugRef.current("Botón renderizado.");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error cargando Google.";
        console.error(err);
        setError(msg);
        onDebugRef.current(`Error: ${msg}`);
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
  if (!token) return <Navigate to="/login" replace />;

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
  const [debugLines, setDebugLines] = useState<string[]>([]);

  const pushDebug = (message: string) => {
    setDebugLines((prev) => [message, ...prev].slice(0, 12));
  };

  const mutation = useMutation({
    mutationFn: loginWithGoogle,
    onMutate: () => pushDebug("Enviando credential al backend..."),
    onSuccess: (data) => {
      pushDebug("Backend respondió OK.");
      setAuthToken(data.token);
      qc.invalidateQueries();
      navigate("/hub", { replace: true });
    },
    onError: (error) => {
      pushDebug(`Error backend: ${(error as Error).message}`);
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
              onDebug={pushDebug}
              onCredential={(credential) => {
                pushDebug("onCredential ejecutado.");
                mutation.mutate(credential);
              }}
            />
          </div>

          <DebugPanel lines={debugLines} />

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 text-sm font-semibold text-white">Fallback manual</div>
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
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4">
      <Card className="w-full p-10">
        <h1 className="text-4xl font-bold text-white">MastersMon</h1>
        <p className="mt-3 text-slate-300">
          Home pública temporal.
        </p>
        <Button className="mt-6" onClick={() => (window.location.href = "/login")}>
          Ir a login
        </Button>
      </Card>
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
      <PageHeader title="Hub principal" subtitle="Debug hub" />
      <Card className="p-6 text-white">Login completado.</Card>
    </div>
  );
}