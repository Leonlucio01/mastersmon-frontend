import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { getProfile } from "@/features/profile/profile.api";
import { ShellLink, Badge } from "@/shared/ui";
import { useAuthStore } from "@/features/auth/auth.store";

const nav = [
  { to: "/hub", label: "Hub" },
  { to: "/adventure", label: "Aventura" },
  { to: "/collection", label: "Colección" },
  { to: "/team", label: "Equipo" },
  { to: "/gyms", label: "Gimnasios" },
  { to: "/house", label: "Casa" },
  { to: "/shop", label: "Tienda" },
  { to: "/trade", label: "Trade" },
  { to: "/ranking", label: "Ranking" },
  { to: "/profile", label: "Perfil" }
];

export function AppShell() {
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const profileQuery = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: getProfile
  });

  const displayName = useMemo(() => {
    return profileQuery.data?.display_name || profileQuery.data?.email || "Trainer";
  }, [profileQuery.data]);

  return (
    <div className="min-h-screen bg-hub-gradient">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <div className="text-lg font-bold text-white">MastersMon</div>
            <div className="text-xs text-slate-400">Hub del entrenador</div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {(profileQuery.data?.wallets || []).map((wallet: any) => (
              <Badge key={wallet.code}>
                {wallet.name}: {wallet.balance}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <div className="text-sm font-semibold text-white">{displayName}</div>
              <div className="text-xs text-slate-400">{profileQuery.data?.trainer_team || "neutral"}</div>
            </div>
            <button
              onClick={logout}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="panel h-fit p-3">
          <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Navegación
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <ShellLink key={item.to} to={item.to}>
                {item.label}
              </ShellLink>
            ))}
          </nav>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-400">
            Ruta actual: <span className="text-slate-200">{location.pathname}</span>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
