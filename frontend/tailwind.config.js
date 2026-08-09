/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "Consolas", "monospace"],
      },
      colors: {
        base: {
          950: "#05070c",
          900: "#0a0e17",
          850: "#0d121c",
          800: "#111827",
          700: "#1a2233",
          600: "#242e42",
          500: "#334155",
        },
        brand: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          glow: "#8b5cf6",
        },
        signal: {
          healthy: "#22d3a8",
          "healthy-dim": "#0d3329",
          warning: "#f6ad3c",
          "warning-dim": "#3d2e0f",
          critical: "#fb5a67",
          "critical-dim": "#3d1420",
          offline: "#64748b",
          "offline-dim": "#1b2232",
          info: "#4fa2f0",
          "info-dim": "#0f2a3d",
        },
      },
      boxShadow: {
        glass: "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -15px rgba(0,0,0,0.6)",
        "glow-brand": "0 0 0 1px rgba(129,140,248,0.25), 0 8px 30px -8px rgba(99,102,241,0.5)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.5, transform: "scale(0.85)" },
        },
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "fade-up": "fade-up 0.4s ease-out",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 15% 0%, rgba(99,102,241,0.10), transparent 40%), radial-gradient(circle at 85% 20%, rgba(139,92,246,0.08), transparent 45%)",
        "brand-gradient": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
      },
    },
  },
  plugins: [],
};
