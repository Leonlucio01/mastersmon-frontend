import { api } from './api';
import { sessionStore } from '../store/session';
import type { User } from '../types/models';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  usuario: User;
  usuario_nuevo: boolean;
  mensaje: string;
}

export async function loginWithGoogleCredential(credential: string): Promise<AuthResponse> {
  const result = await api.post<AuthResponse>('/auth/google-login', { credential });
  sessionStore.setToken(result.access_token);
  sessionStore.setUser(result.usuario);
  return result;
}

export async function fetchAuthMe(): Promise<User> {
  const result = await api.get<{ autenticado: boolean; usuario: User }>('/auth/me');
  sessionStore.setUser(result.usuario);
  return result.usuario;
}

export function logout(): void {
  sessionStore.clear();
}

export function renderGoogleButton(target: HTMLElement, onSuccess: (response: AuthResponse) => void, onError: (message: string) => void): void {
  target.innerHTML = '';
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();

  if (!clientId) {
    target.innerHTML = '<div class="empty-state">Falta configurar <strong>VITE_GOOGLE_CLIENT_ID</strong> en el frontend.</div>';
    return;
  }

  if (!window.google?.accounts?.id) {
    target.innerHTML = '<div class="empty-state">Google Identity Services aún no terminó de cargar.</div>';
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: async ({ credential }) => {
      try {
        const result = await loginWithGoogleCredential(credential);
        onSuccess(result);
      } catch (error) {
        onError(error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google');
      }
    }
  });

  window.google.accounts.id.renderButton(target, {
    theme: 'filled_blue',
    size: 'large',
    shape: 'pill',
    text: 'signin_with',
    width: 320
  });

  window.google.accounts.id.prompt();
}
