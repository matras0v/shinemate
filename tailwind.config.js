/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        porcelain: '#F7F6F2',
        mist: '#F0F1EE',
        pearl: '#E6E9EA',
        frost: '#DCE7EA',
        steel: '#C9D7DA',
        titanium: '#9DAAAF',
        graphite: '#1A1C1E',
        ink: '#0B0C0D',
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      maxWidth: {
        shell: '1440px',
      },
    },
  },
  plugins: [],
}
