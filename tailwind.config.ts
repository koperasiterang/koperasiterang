import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet brand mengikuti pitch deck: navy dalam + emerald "Terang".
        terang: {
          bg: "#0A1A24",        // base navy paling gelap ("kegelapan")
          surface: "#0E2530",   // panel/section
          card: "#12303D",      // kartu
          cardHover: "#163a48",
          border: "#1E3E4B",    // garis halus
          accent: "#12D6A0",    // emerald terang ("Terang") — warna aksi utama
          accentSoft: "#5EE7C0",
          teal: "#0FB5B0",      // teal sekunder untuk label/section
          ink: "#EAF3F2",       // teks utama nyaris putih
          muted: "#8AA6AF",     // teks sekunder
          safe: "#22C08A",
          warn: "#F2B705",      // amber untuk status pending
          danger: "#F26D5B",    // coral untuk anomali/tolak (senada ikon deck)
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(0,0,0,0.55)",
        glow: "0 0 0 1px rgba(18,214,160,0.25), 0 8px 30px -8px rgba(18,214,160,0.25)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        "fade-in": "fade-in 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
