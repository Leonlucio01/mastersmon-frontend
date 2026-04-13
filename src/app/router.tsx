import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/app/layouts/AppShell";
import {
  AppGate,
  LoginPage,
  OnboardingPage,
  HomePage,
  PublicHomePage,
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
    path: "/",
    element: <PublicHomePage />,
  },
  {
    path: "/login",
    element: <PublicHomePage />,
  },
  {
    path: "/acceso",
    element: <LoginPage />,
  },
  {
    path: "/onboarding",
    element: <AppGate />,
    children: [{ index: true, element: <OnboardingPage /> }],
  },
  {
    path: "/hub",
    element: <AppGate />,
    children: [
      {
        element: <AppShell />,
        children: [{ index: true, element: <HomePage /> }],
      },
    ],
  },
  {
    path: "/adventure",
    element: <AppGate />,
    children: [
      {
        element: <AppShell />,
        children: [{ index: true, element: <PlaceholderPage title="Aventura" /> }],
      },
    ],
  },
  {
    path: "/collection",
    element: <AppGate />,
    children: [
      {
        element: <AppShell />,
        children: [{ index: true, element: <PlaceholderPage title="Colección" /> }],
      },
    ],
  },
  {
    path: "/team",
    element: <AppGate />,
    children: [
      {
        element: <AppShell />,
        children: [{ index: true, element: <PlaceholderPage title="Equipo" /> }],
      },
    ],
  },
  {
    path: "/gyms",
    element: <AppGate />,
    children: [
      {
        element: <AppShell />,
        children: [{ index: true, element: <PlaceholderPage title="Gimnasios" /> }],
      },
    ],
  },
  {
    path: "/house",
    element: <AppGate />,
    children: [
      {
        element: <AppShell />,
        children: [{ index: true, element: <PlaceholderPage title="Casa" /> }],
      },
    ],
  },
  {
    path: "/shop",
    element: <AppGate />,
    children: [
      {
        element: <AppShell />,
        children: [{ index: true, element: <PlaceholderPage title="Tienda" /> }],
      },
    ],
  },
  {
    path: "/trade",
    element: <AppGate />,
    children: [
      {
        element: <AppShell />,
        children: [{ index: true, element: <PlaceholderPage title="Trade" /> }],
      },
    ],
  },
  {
    path: "/ranking",
    element: <AppGate />,
    children: [
      {
        element: <AppShell />,
        children: [{ index: true, element: <PlaceholderPage title="Ranking" /> }],
      },
    ],
  },
  {
    path: "/profile",
    element: <AppGate />,
    children: [
      {
        element: <AppShell />,
        children: [{ index: true, element: <PlaceholderPage title="Perfil" /> }],
      },
    ],
  },
]);