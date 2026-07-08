import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet mengikuti logo Kementerian Koperasi RI: teal + hijau limau + amber,
        // di atas latar terang (clean). Dark mode disiapkan untuk fase berikutnya.
        kem: {
          bg: "#F3F7F8",        // latar aplikasi (clean, sedikit teal)
          surface: "#FFFFFF",   // kartu / panel
          border: "#E1EAED",    // garis halus
          teal: "#0E6E87",      // warna utama (tombol, aksen, header)
          tealDark: "#0A5265",  // hover / status bar
          tealSoft: "#E5F1F4",  // background chip teal
          ink: "#0F343F",       // judul / teks tegas
          body: "#32525C",      // teks isi
          muted: "#6C878F",     // teks sekunder
          green: "#5F8C12",     // uang masuk / positif (limau Kemenkop, kontras di putih)
          greenSoft: "#EAF3D6",
          amber: "#C77A08",     // menunggu / peringatan (kontras di putih)
          amberSoft: "#FBEECD",
          danger: "#C0413A",    // uang keluar / ditolak
          dangerSoft: "#FADED9",
        },
      },
      fontFamily: {
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,52,63,0.05), 0 10px 30px -18px rgba(15,52,63,0.25)",
        soft: "0 1px 2px rgba(15,52,63,0.06)",
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
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.35s ease-out both",
        "fade-in": "fade-in 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
