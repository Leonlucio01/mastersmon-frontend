import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Outlet, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { ApiError } from "@/shared/api/client";
import { Button, Card, ErrorBlock, Input, LoadingBlock, PageHeader, ProgressBar, Select, Stat, TextArea, Badge } from "@/shared/ui";
import { useAuthStore } from "@/features/auth/auth.store";
import { getAuthMe, loginWithGoogle } from "@/features/auth/auth.api";
import { completeOnboarding, getOnboardingOptions, getOnboardingState } from "@/features/onboarding/onboarding.api";
import { getHomeAlerts, getHomeSummary } from "@/features/home/home.api";
import { getRegions, getRegionDetail, getZoneDetail, createEncounter, captureEncounter } from "@/features/adventure/adventure.api";
import { getCollectionPokemon, getCollectionPokemonDetail, getCollectionSummary } from "@/features/collection/collection.api";
import { getActiveTeam, saveActiveTeam } from "@/features/team/team.api";
import { getGyms, getGymsSummary, getGymDetail } from "@/features/gyms/gyms.api";
import { getHouseStorage, getHouseSummary, getHouseUpgrades } from "@/features/house/house.api";
import { getShopSummary, getUtilityCatalog, purchaseUtility } from "@/features/shop/shop.api";
import { acceptTradeOffer, cancelTradeOffer, createTradeOffer, getTradeAvailablePokemon, getTradeOffers, getTradeSummary } from "@/features/trade/trade.api";
import { getRankingSummary } from "@/features/ranking/ranking.api";
import { getProfile } from "@/features/profile/profile.api";

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
    queryFn: getAuthMe
  });

  const onboardingQuery = useQuery({
    queryKey: queryKeys.onboarding.state,
    queryFn: getOnboardingState,
    enabled: meQuery.isSuccess
  });

  if (meQuery.isLoading || onboardingQuery.isLoading) {
    return <div className="mx-auto max-w-3xl p-8"><LoadingBlock /></div>;
  }

  if (meQuery.isError) {
    return <div className="mx-auto max-w-3xl p-8"><ErrorBlock message={(meQuery.error as Error).message} /></div>;
  }

  if (onboardingQuery.isSuccess && onboardingQuery.data.needs_onboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

const GOOGLE_CLIENT_ID =
  "353230935122-vqqd262fjhetd408li95420bb8cas5vb.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: any;
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
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Google GSI")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google GSI"));
    document.head.appendChild(script);
  });
}

function GoogleSignInButton(props: { onCredential: (credential: string) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initGoogle() {
      try {
        await loadGoogleIdentityScript();

        if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential?: string }) => {
            if (response?.credential) {
              props.onCredential(response.credential);
            }
          }
        });

        containerRef.current.innerHTML = "";

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 260
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("No se pudo cargar Google Sign-In.");
        }
      }
    }

    initGoogle();

    return () => {
      cancelled = true;
    };
  }, [props]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} />
      {error ? <div className="text-xs text-red-300">{error}</div> : null}
    </div>
  );
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
    }
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <Card className="w-full p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white">MastersMon</h1>
          <p className="mt-2 text-sm text-slate-300">Ingresa con Google para entrar al hub del juego.</p>
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
    }
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
              {token ? (
                <Button
                  className="px-6 py-3 text-base"
                  onClick={() => navigate("/hub")}
                >
                  Continuar partida
                </Button>
              ) : (
                <Button
                  className="px-6 py-3 text-base"
                  onClick={() => {
                    const loginSection = document.getElementById("public-login-box");
                    loginSection?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  Conectarse con Google
                </Button>
              )}

              <Button
                className="border border-white/10 bg-white/5 px-6 py-3 text-base text-white hover:bg-white/10"
                onClick={() => navigate("/hub")}
              >
                Ver hub
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card>
                <div className="text-sm text-slate-400">Colección</div>
                <div className="mt-1 text-lg font-semibold text-white">Pokédex viva</div>
              </Card>
              <Card>
                <div className="text-sm text-slate-400">Progreso</div>
                <div className="mt-1 text-lg font-semibold text-white">Gimnasios y regiones</div>
              </Card>
              <Card>
                <div className="text-sm text-slate-400">Social</div>
                <div className="mt-1 text-lg font-semibold text-white">Trade y ranking</div>
              </Card>
            </div>
          </div>

          <Card className="mx-auto w-full max-w-md p-8" id="public-login-box">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-white">Empieza tu aventura</h2>
              <p className="mt-2 text-sm text-slate-300">
                Entra con Google para guardar tu progreso y acceder al hub del juego.
              </p>
            </div>

            <div className="space-y-4">
              {!token ? (
              <div className="flex justify-center">
                <GoogleSignInButton
                  onCredential={(credential) => {
                    mutation.mutate(credential);
                  }}
                />
              </div>
              ) : (
                <Button className="w-full" onClick={() => navigate("/hub")}>
                  Ir al hub
                </Button>
              )}

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 text-sm font-semibold text-white">Acceso rápido</div>
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
    queryFn: getOnboardingOptions
  });

  const [form, setForm] = useState({
    display_name: "",
    trainer_team: "neutral",
    starter_species_id: 0,
    region_code: "",
    avatar_code: "steven",
    language_code: "es",
    timezone_code: "America/Lima"
  });

  const mutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      qc.invalidateQueries();
      navigate("/hub", { replace: true });
    }
  });

  const seeded = optionsQuery.data?.profile_seed;

  const starters = optionsQuery.data?.starters || [];
  const avatars = optionsQuery.data?.avatars || [];
  const regions = optionsQuery.data?.regions || [];
  const teams = optionsQuery.data?.trainer_teams || [];

  return (
    <div className="mx-auto max-w-5xl p-4">
      <PageHeader title="Completa tu onboarding" subtitle="Configura tu entrenador, región inicial y starter." />
      {optionsQuery.isLoading ? <LoadingBlock /> : null}
      {optionsQuery.isError ? <ErrorBlock message={(optionsQuery.error as Error).message} /> : null}

      {optionsQuery.data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-4">
            <Input
              label="Nombre visible"
              value={form.display_name}
              onChange={(e) => setForm((s) => ({ ...s, display_name: e.target.value }))}
              placeholder={seeded?.display_name || "Tu nombre"}
            />

            <Select
              label="Equipo"
              value={form.trainer_team}
              onChange={(e) => setForm((s) => ({ ...s, trainer_team: e.target.value }))}
            >
              {teams.map((team: any) => (
                <option key={team.code} value={team.code}>{team.name}</option>
              ))}
            </Select>

            <Select
              label="Avatar"
              value={form.avatar_code}
              onChange={(e) => setForm((s) => ({ ...s, avatar_code: e.target.value }))}
            >
              {avatars.map((avatar: any) => (
                <option key={avatar.code} value={avatar.code}>{avatar.name}</option>
              ))}
            </Select>

            <Select
              label="Región inicial"
              value={form.region_code}
              onChange={(e) => setForm((s) => ({ ...s, region_code: e.target.value }))}
            >
              <option value="">Selecciona una región</option>
              {regions.map((region: any) => (
                <option key={region.code} value={region.code}>{region.name}</option>
              ))}
            </Select>

            <Select
              label="Starter"
              value={String(form.starter_species_id || "")}
              onChange={(e) => setForm((s) => ({ ...s, starter_species_id: Number(e.target.value) }))}
            >
              <option value="">Selecciona un starter</option>
              {starters.map((starter: any) => (
                <option key={starter.id} value={starter.id}>
                  {starter.name} {starter.primary_type_name ? "· " + starter.primary_type_name : ""}
                </option>
              ))}
            </Select>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Idioma"
                value={form.language_code}
                onChange={(e) => setForm((s) => ({ ...s, language_code: e.target.value }))}
              />
              <Input
                label="Timezone"
                value={form.timezone_code}
                onChange={(e) => setForm((s) => ({ ...s, timezone_code: e.target.value }))}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => {
                mutation.mutate({
                  ...form,
                  display_name: form.display_name || seeded?.display_name || "Trainer"
                });
              }}
              disabled={!form.region_code || !form.starter_species_id}
            >
              Completar onboarding
            </Button>

            {mutation.isError ? <ErrorBlock message={(mutation.error as Error).message} /> : null}
          </Card>

          <Card>
            <div className="mb-3 text-lg font-semibold text-white">Vista previa</div>
            <div className="space-y-3 text-sm text-slate-300">
              <div><span className="text-slate-400">Email:</span> {seeded?.email}</div>
              <div><span className="text-slate-400">Nombre:</span> {form.display_name || seeded?.display_name || "Trainer"}</div>
              <div><span className="text-slate-400">Equipo:</span> {form.trainer_team}</div>
              <div><span className="text-slate-400">Avatar:</span> {form.avatar_code}</div>
              <div><span className="text-slate-400">Región:</span> {form.region_code || "No seleccionada"}</div>
              <div><span className="text-slate-400">Starter:</span> {starters.find((s: any) => s.id === form.starter_species_id)?.name || "No seleccionado"}</div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {starters.slice(0, 8).map((starter: any) => (
                <div key={starter.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="font-medium text-white">{starter.name}</div>
                  <div className="text-xs text-slate-400">Gen {starter.generation_id}</div>
                  {starter.primary_type_name ? <div className="mt-2 text-xs text-brand-200">{starter.primary_type_name}</div> : null}
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export function HomePage() {
    const summaryQuery = useQuery({
        queryKey: queryKeys.home.summary,
        queryFn: getHomeSummary
    });

    const alertsQuery = useQuery({
        queryKey: queryKeys.home.alerts,
        queryFn: getHomeAlerts
    });

    if (summaryQuery.isLoading) return <LoadingBlock />;
    if (summaryQuery.isError) {
        return <ErrorBlock message={(summaryQuery.error as Error).message} />;
    }

    const data = summaryQuery.data;
    const alerts = alertsQuery.data;

    return (
        <div>
            <PageHeader
                title="Hub principal"
                subtitle="Tu centro de control del entrenador."
            />

            <div className="grid-dashboard">
                <Card className="lg:col-span-8">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">
                                Entrenador
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {data.trainer.display_name}
                            </div>
                            <div className="text-sm text-slate-300">
                                Región activa: {data.trainer.active_region?.name || "Sin región"}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                            <Stat label="Nivel trainer" value={data.trainer.trainer_level} />
                            <Stat label="Exp actual" value={data.trainer.trainer_exp} />
                            <Stat label="Siguiente nivel" value={data.trainer.next_level_exp} />
                        </div>
                    </div>

                    <div className="mt-4">
                        <ProgressBar
                            value={data.trainer.trainer_exp}
                            max={data.trainer.next_level_exp}
                        />
                    </div>
                </Card>

                <Card className="lg:col-span-4">
                    <div className="mb-3 text-lg font-semibold text-white">
                        Acciones rápidas
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Link className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm hover:bg-white/10" to="/adventure">Explorar</Link>
                        <Link className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm hover:bg-white/10" to="/team">Equipo</Link>
                        <Link className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm hover:bg-white/10" to="/collection">Colección</Link>
                        <Link className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm hover:bg-white/10" to="/gyms">Gimnasios</Link>
                        <Link className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm hover:bg-white/10" to="/house">Casa</Link>
                        <Link className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm hover:bg-white/10" to="/shop">Tienda</Link>
                        <Link className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm hover:bg-white/10" to="/trade">Trade</Link>
                    </div>
                </Card>

                <Card className="lg:col-span-6">
                    <div className="mb-3 text-lg font-semibold text-white">Aventura</div>

                    {data.adventure.current_zone ? (
                        <div className="space-y-2 text-sm text-slate-300">
                            <div><strong>Zona:</strong> {data.adventure.current_zone.name}</div>
                            <div><strong>Bioma:</strong> {data.adventure.current_zone.biome}</div>
                            <div>
                                <strong>Nivel recomendado:</strong>{" "}
                                {data.adventure.current_zone.recommended_level_min} - {data.adventure.current_zone.recommended_level_max}
                            </div>
                            <Link to="/adventure" className="inline-block mt-3 text-brand-300 hover:underline">
                                Continuar aventura →
                            </Link>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-400">No hay zona activa.</div>
                    )}
                </Card>

                <Card className="lg:col-span-6">
                    <div className="mb-3 text-lg font-semibold text-white">Progreso</div>
                    <div className="grid grid-cols-2 gap-3">
                        <Stat label="Zonas desbloqueadas" value={data.progress.unlocked_zones} />
                        <Stat label="Gimnasios completados" value={data.progress.completed_gyms} />
                        <Stat label="Progreso región" value={`${data.progress.current_region_completion_pct}%`} />
                    </div>
                </Card>

                <Card className="lg:col-span-6">
                    <div className="mb-3 text-lg font-semibold text-white">Equipo</div>

                    {data.team_summary.members?.length ? (
                        <div className="grid grid-cols-3 gap-2">
                            {data.team_summary.members.map((p: any) => (
                                <div
                                    key={p.user_pokemon_id}
                                    className="rounded-xl border border-white/10 bg-black/20 p-2 text-xs"
                                >
                                    <div className="font-medium text-white">{p.name}</div>
                                    <div className="text-slate-400">Lv {p.level}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-slate-400">Sin equipo activo.</div>
                    )}
                </Card>

                <Card className="lg:col-span-6">
                    <div className="mb-3 text-lg font-semibold text-white">Alertas</div>

                    {alertsQuery.isLoading && <LoadingBlock />}
                    {alertsQuery.isError && (
                        <ErrorBlock message={(alertsQuery.error as Error).message} />
                    )}

                    {alerts && !alertsQuery.isLoading && !alertsQuery.isError ? (
                        <div className="grid grid-cols-2 gap-3">
                            <Stat label="Trades pendientes" value={alerts.pending_trade_count ?? 0} />
                            <Stat label="Rewards sin reclamar" value={alerts.unclaimed_rewards_count ?? 0} />
                            <Stat label="Nuevos desbloqueos" value={alerts.new_unlocks_count ?? 0} />
                            <Stat label="Battle rewards" value={alerts.battle_rewards_ready ? "Listas" : "No"} />
                        </div>
                    ) : null}
                </Card>
            </div>
        </div>
    );
}


