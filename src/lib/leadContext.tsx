import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import type { Product, Variant } from '../data/catalog'
import { navigateTo } from './router'

export type Intent = 'retail' | 'wholesale'

type LeadContextValue = {
  /** Товар, с которым пользователь пришёл в форму — розничный сценарий. */
  product: Product | null
  /** Конкретное исполнение товара, выбранное в drawer, а не всегда первое. */
  variant: Variant | null
  intent: Intent
  /**
   * Увеличивается на каждый request*() — включая случаи, когда intent
   * фактически не меняется (например, уже был 'retail', и снова
   * запросили 'retail'). Контакты держат свою локальную вкладку
   * (переключается кликом прямо на странице) и раньше синхронизировали
   * её с intent только через useEffect по intent — если значение не
   * менялось, эффект не срабатывал, и localStorage-подобный локальный
   * выбор вкладки "залипал" даже после явного перехода по "Контакты" в
   * шапке. Токен форсирует пересинхронизацию в любом случае.
   */
  requestToken: number
  /** Открыть форму с уже выбранным товаром (карточка/drawer каталога). */
  requestProduct: (product: Product, variant?: Variant) => void
  /** Открыть форму в оптовом режиме, без привязки к конкретному товару. */
  requestWholesale: () => void
  /** Открыть форму без контекста — обычный «Запросить прайс» в шапке. */
  requestGeneral: () => void
  clearProduct: () => void
}

const LeadContext = createContext<LeadContextValue | null>(null)

export function LeadProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [variant, setVariant] = useState<Variant | null>(null)
  const [intent, setIntent] = useState<Intent>('retail')
  const [requestToken, setRequestToken] = useState(0)

  const requestProduct = useCallback((p: Product, v?: Variant) => {
    setProduct(p)
    setVariant(v ?? p.variants[0] ?? null)
    setIntent('retail')
    setRequestToken((t) => t + 1)
    // Ведёт СРАЗУ на форму (#request-form), а не на верх страницы
    // "Контакты" — там первым идёт блок с картами/адресами (см.
    // Contact.tsx: standalone-версия показывает ContactDetails раньше
    // формы), и человек, нажавший «Запросить прайс» у конкретного
    // товара, раньше первым делом видел карты, а не саму форму с
    // карточкой товара.
    navigateTo('/contacts#request-form')
  }, [])

  const requestWholesale = useCallback(() => {
    setProduct(null)
    setVariant(null)
    setIntent('wholesale')
    setRequestToken((t) => t + 1)
    // Отдельная страница, а не вкладка внутри /contacts — клиент отметил,
    // что общий контент "Контактов" (карты, адреса) не должен зависеть от
    // переключателя розница/опт: это должны быть две самостоятельные кнопки.
    navigateTo('/wholesale')
  }, [])

  const requestGeneral = useCallback(() => {
    setProduct(null)
    setVariant(null)
    setIntent('retail')
    setRequestToken((t) => t + 1)
    // Тоже сразу на форму — см. комментарий в requestProduct выше. Общий
    // CTA "Запросить прайс" (шапка, каталог) должен вести к самой форме,
    // а не к верху страницы "Контакты" с картами.
    navigateTo('/contacts#request-form')
  }, [])

  const clearProduct = useCallback(() => {
    setProduct(null)
    setVariant(null)
  }, [])

  const value = useMemo(
    () => ({
      product,
      variant,
      intent,
      requestToken,
      requestProduct,
      requestWholesale,
      requestGeneral,
      clearProduct,
    }),
    [product, variant, intent, requestToken, requestProduct, requestWholesale, requestGeneral, clearProduct],
  )

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>
}

export function useLead() {
  const ctx = useContext(LeadContext)
  if (!ctx) throw new Error('useLead must be used within LeadProvider')
  return ctx
}
