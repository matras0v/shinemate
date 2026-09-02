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
        /*
         * Фоновая ритмика длинных страниц товара: porcelain (тёплый
         * off-white) → mist (нейтральный светлый) → haze (прохладный
         * серо-голубой для «технических» блоков) → graphite (финальный
         * CTA). Без чередования страница истории читается одной белой
         * простынёй — клиент отдельно отметил «слишком много чистого
         * белого пространства».
         */
        haze: '#EDF1F2',
        hazeSurface: '#F4F7F7',
        /*
         * Текстовая шкала контраста (клиент: "вторичный текст слишком
         * бледный, приходится вглядываться"). Раньше "вторичный" текст
         * задавался opacity-модификаторами прямо на graphite (/70, /60,
         * /45...) — простой и удобный способ писать классы, но он тащит
         * цвет к ФОНУ, а не просто затемняет: text-graphite/45 на
         * porcelain даёт контраст ~2.8:1 (в разы ниже WCAG AA 4.5:1),
         * text-graphite/60 — ~4.4:1, тоже не дотягивает. Ниже — сплошные
         * (не полупрозрачные) оттенки с реально проверенным контрастом на
         * porcelain (#F7F6F2), от самого тёмного к самому светлому:
         *   graphite  (headings, ~15.8:1) — не изменился
         *   ash       (body/лиды,          ~9.5:1)
         *   slate     (secondary,          ~6.3:1)
         *   titanium  (muted/meta/счётчики,~5.9:1 — было ~5:1)
         *   smoke     (placeholder,        ~3.5:1 — сознательно легче
         *              остального текста, placeholder и должен читаться
         *              как подсказка, а не как введённое значение)
         */
        ash: '#34383B',
        slate: '#565C60',
        titanium: '#546166',
        smoke: '#7E8589',
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
