import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d", paper: "#faf6ef", card: "#fffdf8", line: "#e6dfd0",
        heart: "#b3263e", heartdark: "#8c1c30", teal: "#1f6f78", gold: "#b7791f", muted: "#5f6678"
      },
      fontFamily: {
        serif: ["Iowan Old Style", "Palatino Linotype", "Palatino", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
