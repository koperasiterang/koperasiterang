import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terang: {
          bg: "#0B1D26",       // deep teal-navy (kegelapan yang diterangi)
          accent: "#F2B705",   // amber — "terang"
          safe: "#1E824C",
          danger: "#C0392B",
          card: "#12303D",
        },
      },
    },
  },
  plugins: [],
};
export default config;
