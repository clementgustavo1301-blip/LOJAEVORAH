import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          background: "#FAF9F6",
          surface: "#FFFFFF",
          elevated: "#F3F1EC",
          border: "#E8E5DF",
          text: "#0A0A0A",
          textMuted: "#6E6D6A",
          accent: "#1C1B19",
          gold: "#C9A452",
          goldMuted: "#DFC383",
          silver: "#A3A7AE",
          silverBright: "#E4E6EA",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Manrope", "sans-serif"],
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
      },
      letterSpacing: {
        widest: "0.18em",
        tightest: "-0.03em",
      },
      borderRadius: {
        none: "0px",
        xs: "1px",
        sm: "2px",
        DEFAULT: "2px",
        md: "2px",
        lg: "4px",
        xl: "6px",
        "2xl": "8px",
        "3xl": "12px",
        full: "9999px",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(10, 10, 10, 0.03)",
        luxury: "0 20px 50px -12px rgba(10, 10, 10, 0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
