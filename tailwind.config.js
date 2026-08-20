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
        navy: {
          DEFAULT: '#1a2b4a',
          50: '#f0f4f9',
          100: '#dde6f1',
          200: '#b7cde3',
          300: '#84add0',
          400: '#4e84b8',
          500: '#1a2b4a',
          600: '#15243e',
          700: '#111d33',
          800: '#0c1626',
          900: '#080e1a',
        },
        offwhite: {
          DEFAULT: '#f7f5f0',
          50: '#ffffff',
          100: '#fcfbf9',
          200: '#f7f5f0',
          300: '#ede9df',
          400: '#ded7c5',
          500: '#c7bca4',
        },
        teal: {
          DEFAULT: '#0d9488',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0d9488',
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#134e4a',
        }
      },
      fontFamily: {
        hyperlegible: ['"Atkinson Hyperlegible"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
