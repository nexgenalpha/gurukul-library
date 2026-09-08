import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Premium calm palette: warm white base, deep navy primary, warm gold accent
        cream: "#FAF8F3",
        navy: {
          50: "#EEF1F6",
          100: "#D6DEEA",
          400: "#3C5A80",
          600: "#1E3252",
          800: "#132139",
          900: "#0B1526",
        },
        gold: {
          400: "#D9B36A",
          500: "#C79A45",
          600: "#A87F33",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Fraunces", "Georgia", "serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 4px 24px -6px rgba(11,21,38,0.12)",
        card: "0 2px 12px -2px rgba(11,21,38,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
