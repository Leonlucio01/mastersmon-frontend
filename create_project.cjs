const fs = require("fs");
const path = require("path");

const root = path.join(process.cwd(), "mastersmon-frontend");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function write(filePath, content) {
  const fullPath = path.join(root, filePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content.trimStart(), "utf8");
  console.log("created:", filePath);
}

function json(obj) {
  return JSON.stringify(obj, null, 2) + "\n";
}

ensureDir(root);

write(
  "package.json",
  json({
    name: "mastersmon-frontend",
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc -b && vite build",
      preview: "vite preview"
    },
    dependencies: {
      "@react-oauth/google": "^0.12.1",
      "@tanstack/react-query": "^5.59.20",
      clsx: "^2.1.1",
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^6.28.0",
      zustand: "^5.0.1"
    },
    devDependencies: {
      "@types/react": "^18.3.12",
      "@types/react-dom": "^18.3.1",
      "@vitejs/plugin-react": "^4.3.3",
      autoprefixer: "^10.4.20",
      postcss: "^8.4.49",
      tailwindcss: "^3.4.15",
      typescript: "^5.6.3",
      vite: "^5.4.10"
    }
  })
);

write(
  ".env.example",
  `
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
`
);

write(
  ".gitignore",
  `
node_modules
dist
.env
.DS_Store
`
);

write(
  "index.html",
  `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MastersMon</title>
  </head>
  <body class="bg-slate-950">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
);

write(
  "tsconfig.json",
  `
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
`
);

write(
  "tsconfig.app.json",
  `
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
`
);

write(
  "tsconfig.node.json",
  `
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "composite": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
`
);

write(
  "vite.config.ts",
  `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 5173
  }
});
`
);

write(
  "postcss.config.js",
  `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
`
);

write(
  "tailwind.config.ts",
  `
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d9efff",
          200: "#bbe2ff",
          300: "#8dd1ff",
          400: "#58b8ff",
          500: "#2f99ff",
          600: "#197cf5",
          700: "#1263df",
          800: "#154fb5",
          900: "#17458e"
        }
      },
      boxShadow: {
        panel: "0 20px 60px rgba(0,0,0,0.28)"
      },
      backgroundImage: {
        "hub-gradient": "radial-gradient(circle at top, rgba(47,153,255,0.25), transparent 35%), linear-gradient(180deg, #0f172a 0%, #020617 100%)"
      }
    }
  },
  plugins: []
} satisfies Config;
`
);

write(
  "src/main.tsx",
  `
import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "@/shared/api/queryClient";
import { router } from "@/app/router";
import { env } from "@/shared/config/env";
import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={env.googleClientId}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
`
);

write(
  "src/index.css",
  `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

html, body, #root {
  min-height: 100%;
}

body {
  @apply bg-slate-950 text-slate-100 antialiased;
}

* {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.5) transparent;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 999px;
}

.panel {
  @apply rounded-2xl border border-white/10 bg-white/5 shadow-panel backdrop-blur;
}

.page-title {
  @apply text-2xl font-bold tracking-tight text-white;
}

.page-subtitle {
  @apply text-sm text-slate-300;
}

.grid-dashboard {
  @apply grid gap-4 lg:grid-cols-12;
}

.widget {
  @apply panel p-4;
}

a.active-link {
  @apply bg-brand-500/20 text-brand-200;
}
`
);

write(
  "src/shared/config/env.ts",
  `
export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000",
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || ""
};
`
);

write(
  "src/shared/lib/cn.ts",
  `
import { clsx, type ClassValue } from "clsx";

export function cn(...values: ClassValue[]) {
  return clsx(values);
}
`
);

write(
  "src/shared/lib/token.ts",
  `
const TOKEN_KEY = "mastersmon_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
`
);

write(
  "src/shared/api/queryClient.ts",
  `
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
      refetchOnWindowFocus: false
    }
  }
});
`
);

write(
  "src/shared/api/client.ts",
  `
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
`
);

write(
  "src/shared/api/queryKeys.ts",
  `
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const
  },
  onboarding: {
    state: ["onboarding", "state"] as const,
    options: ["onboarding", "options"] as const
  },
  home: {
    summary: ["home", "summary"] as const,
    alerts: ["home", "alerts"] as const
  },
  adventure: {
    regions: ["adventure", "regions"] as const,
    region: (code: string) => ["adventure", "region", code] as const,
    zone: (code: string) => ["adventure", "zone", code] as const
  },
  collection: {
    summary: ["collection", "summary"] as const,
    pokemon: (params: string) => ["collection", "pokemon", params] as const,
    detail: (id: number) => ["collection", "detail", id] as const
  },
  team: {
    active: ["team", "active"] as const
  },
  gyms: {
    summary: ["gyms", "summary"] as const,
    list: ["gyms", "list"] as const,
    detail: (code: string) => ["gyms", "detail", code] as const
  },
  house: {
    summary: ["house", "summary"] as const,
    storage: ["house", "storage"] as const,
    upgrades: ["house", "upgrades"] as const
  },
  shop: {
    summary: ["shop", "summary"] as const,
    utilityCatalog: ["shop", "utility-catalog"] as const
  },
  trade: {
    summary: ["trade", "summary"] as const,
    offers: (scope: string) => ["trade", "offers", scope] as const,
    availablePokemon: ["trade", "available-pokemon"] as const
  },
  ranking: {
    summary: ["ranking", "summary"] as const
  },
  profile: {
    me: ["profile", "me"] as const
  }
};
`
);

write(
  "src/shared/ui.tsx",
  `
import type {
  PropsWithChildren,
  ReactNode,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/shared/lib/cn";

export function Card(props: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("panel p-4", props.className)}>{props.children}</div>;
}

export function Button(
  props: PropsWithChildren<{
    className?: string;
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
    disabled?: boolean;
  }>
) {
  return (
    <button
      type={props.type || "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
    >
      {props.children}
    </button>
  );
}

export function Input(
  props: InputHTMLAttributes<HTMLInputElement> & { label?: string; containerClassName?: string }
) {
  return (
    <label className={cn("block space-y-2", props.containerClassName)}>
      {props.label ? <span className="text-sm text-slate-300">{props.label}</span> : null}
      <input
        {...props}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-brand-400",
          props.className
        )}
      />
    </label>
  );
}

export function Select(
  props: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; containerClassName?: string }
) {
  return (
    <label className={cn("block space-y-2", props.containerClassName)}>
      {props.label ? <span className="text-sm text-slate-300">{props.label}</span> : null}
      <select
        {...props}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-white outline-none focus:border-brand-400",
          props.className
        )}
      />
    </label>
  );
}

export function TextArea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; containerClassName?: string }
) {
  return (
    <label className={cn("block space-y-2", props.containerClassName)}>
      {props.label ? <span className="text-sm text-slate-300">{props.label}</span> : null}
      <textarea
        {...props}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-white outline-none focus:border-brand-400",
          props.className
        )}
      />
    </label>
  );
}

export function Badge(props: PropsWithChildren<{ className?: string }>) {
  return (
    <span className={cn("inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200", props.className)}>
      {props.children}
    </span>
  );
}

export function Stat(props: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{props.label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{props.value}</div>
    </div>
  );
}

export function ProgressBar(props: { value: number; max?: number }) {
  const max = props.max || 100;
  const pct = Math.max(0, Math.min(100, (props.value / max) * 100));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: pct + "%" }} />
    </div>
  );
}

export function PageHeader(props: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="page-title">{props.title}</h1>
        {props.subtitle ? <p className="page-subtitle mt-1">{props.subtitle}</p> : null}
      </div>
      {props.actions}
    </div>
  );
}

export function LoadingBlock() {
  return <div className="panel p-6 text-sm text-slate-300">Cargando...</div>;
}

export function ErrorBlock(props: { message: string }) {
  return <div className="panel border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">{props.message}</div>;
}

export function ShellLink(props: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        cn(
          "rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10",
          isActive && "active-link"
        )
      }
    >
      {props.children}
    </NavLink>
  );
}
`
);

write(
  "src/features/auth/auth.store.ts",
  `
import { create } from "zustand";
import { clearToken, getToken, setToken } from "@/shared/lib/token";

type AuthState = {
  token: string | null;
  setAuthToken: (token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getToken(),
  setAuthToken: (token) => {
    setToken(token);
    set({ token });
  },
  logout: () => {
    clearToken();
    set({ token: null });
  }
}));
`
);

write(
  "src/features/auth/auth.api.ts",
  `
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
`
);

write(
  "src/features/onboarding/onboarding.api.ts",
  `
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
`
);

write(
  "src/app/layouts/AppShell.tsx",
  `
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
`
);

write(
  "src/features/profile/profile.api.ts",
  `
import { apiFetch } from "@/shared/api/client";

export async function getProfile() {
  return apiFetch<any>("/v2/profile/me");
}
`
);

write(
  "src/features/home/home.api.ts",
  `
import { apiFetch } from "@/shared/api/client";

export async function getHomeSummary() {
  return apiFetch<any>("/v2/home/summary");
}

export async function getHomeAlerts() {
  return apiFetch<any>("/v2/home/alerts");
}
`
);

write(
  "src/features/adventure/adventure.api.ts",
  `
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
`
);

write(
  "src/features/collection/collection.api.ts",
  `
import { apiFetch } from "@/shared/api/client";

export async function getCollectionSummary() {
  return apiFetch<any>("/v2/collection/summary");
}

export async function getCollectionPokemon(params: URLSearchParams) {
  return apiFetch<any>("/v2/collection/pokemon?" + params.toString());
}

export async function getCollectionPokemonDetail(id: number) {
  return apiFetch<any>("/v2/collection/pokemon/" + id);
}
`
);

write(
  "src/features/team/team.api.ts",
  `
import { apiFetch } from "@/shared/api/client";

export async function getActiveTeam() {
  return apiFetch<any>("/v2/team/active");
}

export async function saveActiveTeam(userPokemonIds: number[], teamName?: string) {
  return apiFetch<any>("/v2/team/active", {
    method: "POST",
    body: JSON.stringify({
      user_pokemon_ids: userPokemonIds,
      team_name: teamName || null
    })
  });
}
`
);

write(
  "src/features/gyms/gyms.api.ts",
  `
import { apiFetch } from "@/shared/api/client";

export async function getGymsSummary() {
  return apiFetch<any>("/v2/gyms/summary");
}

export async function getGyms() {
  return apiFetch<any>("/v2/gyms");
}

export async function getGymDetail(code: string) {
  return apiFetch<any>("/v2/gyms/" + code);
}
`
);

write(
  "src/features/house/house.api.ts",
  `
import { apiFetch } from "@/shared/api/client";

export async function getHouseSummary() {
  return apiFetch<any>("/v2/house/summary");
}

export async function getHouseStorage() {
  return apiFetch<any>("/v2/house/storage");
}

export async function getHouseUpgrades() {
  return apiFetch<any>("/v2/house/upgrades");
}
`
);

write(
  "src/features/shop/shop.api.ts",
  `
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
`
);

write(
  "src/features/trade/trade.api.ts",
  `
import { apiFetch } from "@/shared/api/client";

export async function getTradeSummary() {
  return apiFetch<any>("/v2/trade/summary");
}

export async function getTradeOffers(scope: "market" | "mine") {
  return apiFetch<any>("/v2/trade/offers?scope=" + scope);
}

export async function getTradeAvailablePokemon() {
  return apiFetch<any>("/v2/trade/available-pokemon");
}

export async function createTradeOffer(payload: any) {
  return apiFetch<any>("/v2/trade/offers", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function cancelTradeOffer(id: number) {
  return apiFetch<any>("/v2/trade/offers/" + id + "/cancel", { method: "POST" });
}

export async function acceptTradeOffer(id: number) {
  return apiFetch<any>("/v2/trade/offers/" + id + "/accept", { method: "POST" });
}
`
);

write(
  "src/features/ranking/ranking.api.ts",
  `
import { apiFetch } from "@/shared/api/client";

export async function getRankingSummary(limit = 10) {
  return apiFetch<any>("/v2/ranking/summary?limit=" + limit);
}
`
);

write(
  "src/app/pages.tsx",
  `
import { useMemo, useState } from "react";
import { Link, Navigate, Outlet, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
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
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  mutation.mutate(credentialResponse.credential);
                }
              }}
              onError={() => {
                alert("No se pudo autenticar con Google.");
              }}
              theme="filled_black"
              shape="pill"
              size="large"
              text="continue_with"
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
`
);

write(
  "src/app/router.tsx",
  `
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/app/layouts/AppShell";
import {
  AppGate,
  PublicOnly,
  LoginPage,
  OnboardingPage,
  HomePage
} from "@/app/pages";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="panel p-6">
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle mt-2">
        Esta sección queda lista para conectar después.
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <PublicOnly />,
    children: [{ index: true, element: <LoginPage /> }]
  },
  {
    path: "/onboarding",
    element: <AppGate />,
    children: [{ index: true, element: <OnboardingPage /> }]
  },
  {
    path: "/",
    element: <AppGate />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/hub" replace /> },
          { path: "hub", element: <HomePage /> },
          { path: "adventure", element: <PlaceholderPage title="Aventura" /> },
          { path: "collection", element: <PlaceholderPage title="Colección" /> },
          { path: "team", element: <PlaceholderPage title="Equipo" /> },
          { path: "gyms", element: <PlaceholderPage title="Gimnasios" /> },
          { path: "house", element: <PlaceholderPage title="Casa" /> },
          { path: "shop", element: <PlaceholderPage title="Tienda" /> },
          { path: "trade", element: <PlaceholderPage title="Trade" /> },
          { path: "ranking", element: <PlaceholderPage title="Ranking" /> },
          { path: "profile", element: <PlaceholderPage title="Perfil" /> }
        ]
      }
    ]
  }
]);
`);

write(
  "src/app/pages.home.txt",
  `
Reemplaza manualmente la función HomePage dentro de src/app/pages.tsx por esta versión:
`
);

write(
  "src/app/homepage-replacement.txt",
  `
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
            <Stat label="Progreso región" value={\`\${data.progress.current_region_completion_pct}%\`} />
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
`
);

write(
  "src/shared/ui-fix.txt",
  `
Reemplaza manualmente el import inicial de src/shared/ui.tsx por este:

import type {
  PropsWithChildren,
  ReactNode,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/shared/lib/cn";

Y cambia estas tres firmas:

export function Input(
  props: InputHTMLAttributes<HTMLInputElement> & { label?: string; containerClassName?: string }
)

export function Select(
  props: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; containerClassName?: string }
)

export function TextArea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; containerClassName?: string }
)
`
);
