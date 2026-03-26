/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'black': {
          '950': '#0f0f0f',
          '900': '#1a1a1a',
          '800': '#2a2a2a',
        },
        'gold': {
          '600': '#c9a961',
          '500': '#d4af37',
          '400': '#f4d03f',
        },
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        'gradient-gold-subtle': 'linear-gradient(135deg, #d4af37 0%, #c9a961 100%)',
      },
      boxShadow: {
        'premium': '0 20px 60px rgba(212, 175, 55, 0.15)',
        'gold-glow': '0 0 30px rgba(212, 175, 55, 0.25)',
        'card': '0 10px 30px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-gold': 'pulse-gold 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-in': 'slideIn 0.4s ease-out',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
