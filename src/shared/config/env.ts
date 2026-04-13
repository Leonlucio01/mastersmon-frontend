export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000",
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || ""
};
