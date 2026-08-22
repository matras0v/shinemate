import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Сайт публикуется на GitHub Pages как проектный сайт репозитория —
  // https://matras0v.github.io/shinemate/ — поэтому все ассеты и роуты
  // должны резолвиться относительно этого подпути, а не корня домена.
  // В dev-режиме подпути нет: Vite поднимает сервер на "/", поведение не
  // меняется. index.html и router.ts читают этот же base через %BASE_URL%
  // и import.meta.env.BASE_URL соответственно — один источник истины.
  base: command === 'build' ? '/shinemate/' : '/',
  // dist не должен попадать в watcher: сборка во время работы dev-сервера
  // иначе вызывает лишние перезагрузки страницы.
  server: { watch: { ignored: ['**/dist/**', '**/assets/raw/**'] } },
  // vite dev и preview отдают index.html на неизвестные пути (SPA), поэтому
  // /catalog/<раздел> открывается напрямую и переживает перезагрузку.
  appType: 'spa',
  build: { target: 'es2020', assetsInlineLimit: 2048 },
}))
