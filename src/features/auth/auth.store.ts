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
