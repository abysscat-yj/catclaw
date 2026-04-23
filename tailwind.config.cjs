/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/renderer/**/*.{html,tsx,ts}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
      animation: {
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "card-flip": "cardFlip 0.6s ease-in-out",
        "card-reveal": "cardReveal 0.8s ease-out",
        sparkle: "sparkle 1.5s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "bounce-once": "bounceOnce 0.5s ease-out",
      },
      keyframes: {
        glow: {
          "0%": { filter: "drop-shadow(0 0 4px rgba(139,92,246,0.3))" },
          "100%": { filter: "drop-shadow(0 0 12px rgba(139,92,246,0.6))" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        cardFlip: {
          "0%": { transform: "rotateY(180deg)", opacity: "0" },
          "50%": { transform: "rotateY(90deg)", opacity: "0.5" },
          "100%": { transform: "rotateY(0deg)", opacity: "1" },
        },
        cardReveal: {
          "0%": { transform: "scale(0.8) rotateY(180deg)", opacity: "0" },
          "60%": { transform: "scale(1.05) rotateY(0deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotateY(0deg)", opacity: "1" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.2)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bounceOnce: {
          "0%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-8px)" },
          "50%": { transform: "translateY(0)" },
          "70%": { transform: "translateY(-4px)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
