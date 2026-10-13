/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#111111",
          dark: "#2b2b2b",
          soft: "#ececec",
        },
        danger: {
          DEFAULT: "#e23d5b",
          soft: "#fdecef",
        },
        success: "#1f9d63",
        accent: {
          DEFAULT: "#0f766e",
          dark: "#0b5c56",
          soft: "#e6f4f1",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};