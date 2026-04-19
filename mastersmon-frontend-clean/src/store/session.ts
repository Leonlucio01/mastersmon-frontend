import type { User } from '../types/models';

const TOKEN_KEY = 'mastersmon_token';
const USER_KEY = 'mastersmon_user';

let token = localStorage.getItem(TOKEN_KEY) ?? '';
let user: User | null = null;

try {
  const raw = localStorage.getItem(USER_KEY);
  user = raw ? (JSON.parse(raw) as User) : null;
} catch {
  user = null;
}

export const sessionStore = {
  getToken(): string {
    return token;
  },
  setToken(next: string): void {
    token = next;
    localStorage.setItem(TOKEN_KEY, next);
  },
  clearToken(): void {
    token = '';
    localStorage.removeItem(TOKEN_KEY);
  },
  getUser(): User | null {
    return user;
  },
  setUser(next: User | null): void {
    user = next;
    if (next) {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },
  clear(): void {
    this.clearToken();
    this.setUser(null);
  },
  isAuthenticated(): boolean {
    return Boolean(token);
  }
};
