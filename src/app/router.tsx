import { createHashRouter, Navigate } from "react-router-dom";
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

export const router = createHashRouter([
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
