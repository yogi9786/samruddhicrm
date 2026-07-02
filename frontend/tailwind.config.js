/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          maroon: "#800000",   // Sirisamruddhi text color
          maroonDark: "#5c0000",
          gold: "#F59E0B",     // Logo sun inner color
          goldLight: "#FBBF24",
          orange: "#F97316",   // Logo sun rays
          cream: "#FEFCE8",    // Soft background for jewelry theme
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'], // For premium headers
      }
    },
  },
  plugins: [],
}
