import { company } from '../data/company'

export type RetailLead = {
  intent: 'retail'
  name: string
  email: string
  city: string
  phone: string
  /** Необязательно: не у всех частных клиентов есть компания/сайт. */
  companyName?: string
  website?: string
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

export type LeadResult = { ok: true } | { ok: false; error: string }

/**
 * hp — honeypot-поле формы (у людей всегда пустое, скрыто CSS, но не
 * display:none — часть спам-ботов игнорирует именно такие поля).
 * startedAt — время рендера формы (Date.now()), для проверки на сервере,
 * что между показом формы и отправкой прошло не меньше нескольких секунд.
 */
export async function submitLead(
  lead: Lead,
  antiSpam: { hp: string; startedAt: number }
): Promise<LeadResult> {
  try {
    const res = await fetch('api/contact.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, hp: antiSpam.hp, startedAt: antiSpam.startedAt }),
    })
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error ?? 'send_failed' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'network' }
  }
}

export const leadFallbackEmail = company.leadEmail
