/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ssp: {
          dark: '#0B1B32',    // Azul Marinho Profundo
          navy: '#1B365D',    // Azul SSP-BA
          red: '#C8102E',     // Vermelho Alerta
          gold: '#D4AF37',    // Dourado (Brasão/Destaque)
          gray: '#E5E7EB',
          tactical: '#1F2937' // Cinza Chumbo
        }
      },
      backgroundImage: {
        'tactical-pattern': "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')",
      }
    },
  },
  plugins: [],
}