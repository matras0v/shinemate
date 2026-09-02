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
        // Было #9DAAAF — контраст на porcelain/mist всего ~2.2:1, надписи
        // вроде типа товара на карточке реально сливались с фоном (клиент
        // жаловался на видео). Тот же оттенок, но темнее — контраст ~5:1.
        titanium: '#5E6C72',
        graphite: '#1A1C1E',
        ink: '#0B0C0D',
        // Фирменный оранжевый ShineMate — снят с их официального сайта
        // (background-color кнопок/акцентов на shinemate.com), не подобран
        // на глаз. Используется точечно (пара акцентов), а не как замена
        // основной монохромной палитры.
        ember: '#FE8B0C',
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
