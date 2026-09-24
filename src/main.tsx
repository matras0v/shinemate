import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './index.css'
import { applyCatalogOverrides } from './lib/overrides'

/*
 * Оперативные цены/наличие с /admin применяются ДО первого рендера —
 * не после: иначе на экране на мгновение мелькнула бы старая цена из
 * бандла, а через кадр — актуальная. Запрос лёгкий (JSON того же
 * домена, с таймаутом), поэтому задержка первого рендера незаметна;
 * при сбое applyCatalogOverrides сама молча ничего не меняет.
 */
applyCatalogOverrides().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
