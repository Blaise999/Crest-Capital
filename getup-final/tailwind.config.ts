import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          50: "#f7f8fa",
          100: "#eef1f4",
          200: "#d9dee5",
          300: "#b6bfca",
          400: "#8491a0",
          500: "#5a6775",
          600: "#3d4753",
          700: "#262c34",
          800: "#161a1f",
          900: "#0a0c10",
        },
        // Primary: deep blue
        brand: {
          50:  "#eef4ff",
          100: "#dce8ff",
          200: "#bcd3ff",
          300: "#8db3ff",
          400: "#5a8cff",
          500: "#2f66ff",
          600: "#1a4bf0",
          700: "#143cc8",
          800: "#1236a0",
          900: "#0c2672",
        },
        azure: {
          400: "#5db0ff",
          500: "#2f8cff",
          600: "#156ce0",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(10,12,16,0.04), 0 2px 8px rgba(10,12,16,0.04)",
        pop:  "0 10px 30px -10px rgba(10,12,16,0.18), 0 4px 12px rgba(10,12,16,0.06)",
        glow: "0 20px 60px -20px rgba(47,102,255,0.45), 0 8px 24px rgba(47,102,255,0.18)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
        "3xl": "28px",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.4s linear infinite",
        floaty: "floaty 4.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
