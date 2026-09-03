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
          purple: "#6D28D9",
          purpleDark: "#4C1D95",
          purpleLight: "#EDE9FE",
        },
        luxury: {
          dark: "#0F1117",
          sidebar: "#12141C",
          surface: "#1A1D27",
          border: "#262A38",
          purple: "#6366F1",
          cardLight: "#FFFFFF",
          bgLight: "#F8F9FC",
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['Playfair Display', 'Merriweather', 'serif'],
      },
      animation: {
        'float-3d': 'logo3dFloat 6s ease-in-out infinite',
        'glow': 'logoGlow 3s ease-in-out infinite',
        'shimmer': 'shimmerSweep 4s ease-in-out infinite',
        'wave-1': 'waveFlow1 8s ease-in-out infinite',
        'wave-2': 'waveFlow2 10s ease-in-out infinite',
        'wave-3': 'waveFlow3 12s ease-in-out infinite',
        'fade-up': 'fadeSlideUp 0.8s ease-out forwards',
      },
      backdropBlur: {
        '3xl': '64px',
      },
    },
  },
  plugins: [],
}

