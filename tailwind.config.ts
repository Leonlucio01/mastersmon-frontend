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
