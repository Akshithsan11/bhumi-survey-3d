/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        secondary: {
          500: "#22c55e",
          600: "#16a34a",
        },
        accent: {
          400: "#a78bfa",
          500: "#8b5cf6",
        },
      },
    },
  },
  plugins: [],
};