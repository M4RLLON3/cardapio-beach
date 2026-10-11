/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f6f8f1',
          100: '#e9f0df',
          200: '#d5e2c2',
          300: '#b8cfa0',
          400: '#8fad67',
          500: '#5c7c38',
          600: '#4a692d', // Verde oliva característico da marca
          700: '#3a5323',
          800: '#2d411b',
          900: '#1e2c12',
        },
        beach: {
          bg: '#F5F2EB',      // Fundo areia/linho do cartão
          card: '#FCFAF6',    // Fundo dos cartões em off-white quente
          sand: '#ECE7D8',    // Tom areia médio
          border: '#DDD7C4',  // Borda suave estilo papel artesanal
          olive: '#4A692D',   // Verde principal do logo
          darkOlive: '#2C3E18',// Verde escuro dos textos e títulos
          palm: '#3A5223',
        },
        editorial: {
          primary: '#132512',
          'primary-container': '#283b26',
          background: '#fbf9f5',
          surface: '#fbf9f5',
          'surface-container-low': '#f5f3ef',
          'surface-container': '#efeeea',
          'surface-container-highest': '#e4e2de',
          'secondary-fixed': '#daeaaa',
          'on-secondary-fixed': '#161f00',
          outline: '#747870',
          'outline-variant': '#c4c8bf',
          'on-surface': '#1b1c1a',
          'on-surface-variant': '#434841',
        },
      },
      fontFamily: {
        sans: ['"Manrope"', '"Plus Jakarta Sans"', 'sans-serif'],
        script: ['"Caveat"', 'cursive'],
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        manrope: ['"Manrope"', 'sans-serif'],
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
