/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base surfaces — near-black with a faint blue-violet tint, not a flat gray.
        ink: {
          950: "#07080D",
          900: "#0B0D14",
          800: "#12141F",
          700: "#1B1E2C",
          600: "#262A3D",
        },
        // Brand — indigo -> cyan. The gradient itself is the "bridge" motif:
        // indigo (Deriv side) flowing to cyan (M-Pesa cash-out side).
        indigo: {
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        cyan: {
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
        },
        slate: {
          300: "#C7CCDA",
          400: "#9AA0B4",
          500: "#6E7488",
        },
        mint: { 500: "#34D399" },
        amber: { 500: "#FBBF24" },
        rose: { 500: "#FB7185" },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #4F46E5 0%, #6366F1 45%, #06B6D4 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, rgba(79,70,229,0.16) 0%, rgba(6,182,212,0.16) 100%)",
      },
      boxShadow: {
        glow: "0 0 60px -12px rgba(99, 102, 241, 0.45)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(3%, -4%) scale(1.06)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(34, 211, 238, 0.45)" },
          "100%": { boxShadow: "0 0 0 14px rgba(34, 211, 238, 0)" },
        },
      },
      animation: {
        drift: "drift 14s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};
