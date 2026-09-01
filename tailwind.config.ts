import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kds: {
          dark: "#0b0f19",
          card: "#111827",
          border: "#1f2937",
          muted: "#9ca3af",
          accent: "#3b82f6",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#ef4444",
          violet: "#8b5cf6",
        },
      },
      animation: {
        "pulse-subtle": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-red": "glowRed 1.5s ease-in-out infinite alternate",
        "glow-amber": "glowAmber 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glowRed: {
          "0%": { boxShadow: "0 0 5px rgba(239, 68, 68, 0.4), inset 0 0 5px rgba(239, 68, 68, 0.2)" },
          "100%": { boxShadow: "0 0 16px rgba(239, 68, 68, 0.8), inset 0 0 10px rgba(239, 68, 68, 0.4)" },
        },
        glowAmber: {
          "0%": { boxShadow: "0 0 5px rgba(245, 158, 11, 0.3)" },
          "100%": { boxShadow: "0 0 14px rgba(245, 158, 11, 0.7)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
