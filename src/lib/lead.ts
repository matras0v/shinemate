import { company } from '../data/company'

export type RetailLead = {
  intent: 'retail'
  name: string
  phone: string
  email: string
  message: string
  /** Заполняется автоматически, когда заявка пришла из карточки товара. */
  productModel?: string
  productSku?: string
  productPrice?: string
}

export type WholesaleLead = {
  intent: 'wholesale'
  name: string
  company: string
  phone: string
  email: string
  city: string
  inn: string
  businessType: string
  message: string
}

export type Lead = RetailLead | WholesaleLead

/**
 * ТОЧКА ИНТЕГРАЦИИ С БЭКЕНДОМ.
 *
 * Пока у концепта нет ни SMTP, ни API, поэтому заявка не «отправляется» —
 * она открывается письмом в почтовом клиенте пользователя. Интерфейс никогда
 * не сообщает об успешной отправке, потому что её не происходит.
 *
 * Когда появится эндпоинт, тело функции заменяется на реальный запрос:
 *
 *   const res = await fetch('/api/lead', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(lead),
 *   })
 *   if (!res.ok) throw new Error('lead request failed')
 *   return { transport: 'api' }
 *
 * Тогда же в форме нужно включить состояние успешной отправки.
 */
export function submitLead(lead: Lead): { transport: 'mailto' } {
  const targetEmail = lead.intent === 'wholesale' ? company.leadEmail : company.leadEmail

  if (lead.intent === 'wholesale') {
    const subject = `Оптовый запрос ShineMate — ${lead.company || lead.name || 'без названия'}`
    const body = [
      `Компания: ${lead.company || '—'}`,
      `Контактное лицо: ${lead.name}`,
      `Телефон: ${lead.phone}`,
      `Email: ${lead.email || '—'}`,
      `Город / регион: ${lead.city || '—'}`,
      `ИНН: ${lead.inn || '—'}`,
      `Тип бизнеса: ${lead.businessType || '—'}`,
      '',
      'Комментарий:',
      lead.message || '—',
    ].join('\n')
    window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    return { transport: 'mailto' }
  }

  const subject = lead.productModel
    ? `Заявка с сайта ShineMate — ${lead.productModel}`
    : `Заявка с сайта ShineMate — ${lead.name || 'без имени'}`
  const body = [
    lead.productModel ? `Интересует: ShineMate ${lead.productModel}${lead.productSku ? ` (${lead.productSku})` : ''}` : null,
    lead.productPrice ? `РРЦ: ${lead.productPrice}` : null,
    lead.productModel ? '' : null,
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    `Email: ${lead.email || '—'}`,
    '',
    'Сообщение:',
    lead.message || '—',
  ]
    .filter((line) => line !== null)
    .join('\n')

  window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  return { transport: 'mailto' }
}
