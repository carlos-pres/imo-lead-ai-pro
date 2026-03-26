/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'slate': {
          '950': '#0f172a',
          '900': '#0f1729',
        },
        'purple': {
          '600': '#9333ea',
          '500': '#a855f7',
        },
        'blue': {
          '500': '#3b82f6',
          '400': '#60a5fa',
        },
      },
      backgroundImage: {
        'gradient-agent': 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      },
      boxShadow: {
        'premium': '0 20px 60px rgba(0, 0, 0, 0.3)',
        'card': '0 10px 30px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-in': 'slideIn 0.4s ease-out',
      },
      keyframes: {
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
