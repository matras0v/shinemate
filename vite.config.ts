import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  /*
   * Сайт продолжает деплоиться через GitHub Pages (тот же workflow), но
   * теперь на клиентский домен, подключённый как custom domain к этому
   * же Pages-проекту — GitHub при этом отдаёт содержимое с корня домена
   * ("/"), а не из-под /shinemate/, как было раньше на голом
   * matras0v.github.io/shinemate/. Поэтому base — "/" и в dev, и в
   * production: раньше здесь было два разных значения именно из-за
   * подпути /shinemate/, которого на custom domain больше нет.
   * index.html и router.ts читают этот же base через %BASE_URL% и
   * import.meta.env.BASE_URL соответственно — один источник истины,
   * их менять не нужно.
   */
  base: '/',
  // dist не должен попадать в watcher: сборка во время работы dev-сервера
  // иначе вызывает лишние перезагрузки страницы.
  server: { watch: { ignored: ['**/dist/**', '**/assets/raw/**'] } },
  // vite dev и preview отдают index.html на неизвестные пути (SPA), поэтому
  // /catalog/<раздел> открывается напрямую и переживает перезагрузку.
  appType: 'spa',
  build: { target: 'es2020', assetsInlineLimit: 2048 },
})
