/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CLAIM'N Brand Colors
        charcoal: '#1C1C1E',
        jordbrun: '#5E503F',
        sandbeige: '#E5D9C7',
        oliv: '#3A4A42',
        dimblag: '#A1B1C6',
        koppar: '#B87333',
        // kalkvit uses CSS variable for theme switching
        kalkvit: 'rgb(var(--color-kalkvit) / <alpha-value>)',
        tegelrod: '#B54A46',
        'brand-amber': '#CC8B3C',
        skogsgron: '#6B8E6F',
        // Glass background color
        'glass-dark': '#0A0A0B',
      },
      fontFamily: {
        display: ['Neutraface 2', 'Montserrat', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        sans: ['Lato', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
