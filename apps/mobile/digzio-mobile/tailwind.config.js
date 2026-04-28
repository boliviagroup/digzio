/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors — exact match to www.digzio.co.za
        navy: {
          DEFAULT: "#0F2D4A",
          light: "#1A4A6B",
          dark: "#0A1F33",
        },
        teal: {
          DEFAULT: "#1A9BAD",
          light: "#2EC4C4",
          dark: "#147A8A",
        },
        // Semantic Colors
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        coral: "#E05A4E",
        // Neutral Colors
        "off-white": "#F5F7FA",
        "muted-grey": "#E8ECEF",
        charcoal: "#2C3E50",
      },
      fontFamily: {
        sans: ["SpaceGrotesk-Regular"],
        "sans-medium": ["SpaceGrotesk-Medium"],
        "sans-semibold": ["SpaceGrotesk-SemiBold"],
        "sans-bold": ["SpaceGrotesk-Bold"],
        "sans-extrabold": ["SpaceGrotesk-ExtraBold"],
      },
    },
  },
  plugins: [],
};
