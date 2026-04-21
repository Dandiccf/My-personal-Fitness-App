/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      colors: {
        ink: {
          950: '#07090c',
          900: '#0b0f14',
          800: '#11161d',
          700: '#1a212b',
          600: '#242d3a',
          500: '#3a4657',
          400: '#6b7788',
          300: '#9aa4b2',
          200: '#c7ccd3',
          100: '#eef0f3'
        },
        accent: {
          400: '#7cffd1',
          500: '#3dffb8',
          600: '#14e59a',
          700: '#0bbb7d'
        },
        warn: {
          500: '#ffbb55'
        },
        danger: {
          500: '#ff6b6b'
        }
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 30px rgba(0,0,0,0.35)',
        soft: '0 2px 10px rgba(0,0,0,0.35)'
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem'
      }
    }
  },
  plugins: []
};
