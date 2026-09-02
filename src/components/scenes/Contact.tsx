import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Clock, Mail, MapPin, X } from 'lucide-react'

import { formatPrice } from '../../data/catalog'
import { company } from '../../data/company'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useLead } from '../../lib/leadContext'
import { submitLead } from '../../lib/lead'
import { revealProps, rise, riseProps, stagger } from '../../lib/motion'

const field =
  'w-full border-b border-graphite/20 bg-transparent pb-3 pt-2 text-[1.0625rem] text-graphite outline-none transition-colors duration-500 ease-premium placeholder:text-graphite/30 focus:border-graphite'

type Props = {
  onOpenConsent: () => void
}

/**
 * Только розница: карты, адреса, телефоны, почта и форма заявки. Оптовый
 * сценарий — отдельная страница (/wholesale, компонент Wholesale.tsx), а
 * не вкладка здесь — клиент отметил, что общий контент "Контактов" не
 * должен зависеть от переключателя розница/опт, это должны быть две
 * самостоятельные кнопки в шапке.
 */
export function Contact({ onOpenConsent }: Props) {
  const [sent, setSent] = useState(false)
  const reduced = useReducedMotion()
  const { product, variant, clearProduct } = useLead()

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const value = (key: string) => String(data.get(key) ?? '').trim()
    submitLead({
      intent: 'retail',
      name: value('name'),
      email: value('email'),
      city: value('city'),
      companyName: value('companyName'),
      phone: value('phone'),
      website: value('website'),
      message: value('message'),
      productModel: product?.model,
      // Именно то исполнение, что выбрали в drawer — раньше сюда всегда
      // уходило первое по списку, независимо от того, что смотрел человек.
      productSku: variant?.sku,
      productPrice: variant ? formatPrice(variant.rrp) : undefined,
    })
    setSent(true)
  }

  return (
    <section id="contacts" className="scene relative bg-porcelain py-28 md:py-40">
      <motion.div {...riseProps(reduced, { y: 24, amount: 0.3 })} className="shell">
        <div className="overflow-hidden rounded-3xl">
          <img
            src="media/stage-1920.webp"
            srcSet="media/stage-800.webp 800w, media/stage-1280.webp 1280w, media/stage-1920.webp 1920w"
            sizes="(min-width: 1024px) 1200px, 100vw"
            alt=""
            loading="lazy"
            decoding="async"
            className="h-[220px] w-full object-cover sm:h-[280px] md:h-[340px]"
          />
        </div>
      </motion.div>

      <motion.div {...revealProps(reduced, stagger(0, 0.08))} className="shell mt-14">
        <motion.p variants={rise} className="eyebrow">
          Контакты
        </motion.p>
        <motion.h2 variants={rise} className="h1 mt-5 max-w-[18ch]">
          Подберём ShineMate под вашу задачу
        </motion.h2>
        <motion.p variants={rise} className="lead mt-6 max-w-[48ch] text-graphite/60">
          Расскажите, с какими покрытиями и объёмами работаете — предложим конфигурацию машинки,
          подложек и кругов и пришлём актуальный прайс.
        </motion.p>
      </motion.div>

      <div className="shell mt-12 grid gap-14 lg:grid-cols-[1fr_0.85fr] lg:gap-24">
        <motion.form
          {...riseProps(reduced, { y: 28, amount: 0.15 })}
          onSubmit={onSubmit}
          className="min-w-0"
        >
          {product && (
            <div className="mb-8 flex items-center gap-4 rounded-2xl bg-mist p-4">
              <img
                src={product.image}
                alt=""
                width={product.imageWidth}
                height={product.imageHeight}
                className="h-14 w-14 shrink-0 object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                  Вы интересовались
                </p>
                <p className="mt-0.5 truncate text-[0.9375rem] tracking-tight">{product.model}</p>
                {product.variants.length > 1 && variant && (
                  <p className="mt-0.5 truncate text-[0.8125rem] text-graphite/50">
                    {variant.label}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={clearProduct}
                aria-label="Убрать товар из заявки"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-graphite/40 transition-colors duration-500 ease-premium hover:bg-graphite/10 hover:text-graphite"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/*
            Порядок и состав полей — по замечанию клиента на видео: имя,
            почта, город (обязательно), затем компания/телефон/сайт как
            уточняющие. Город обязателен — раньше его не было вовсе, хотя
            конфигурация машинки и логистика зависят от региона клиента.
          */}
          <div className="grid gap-7 sm:grid-cols-2">
            <Field id="name" label="Имя" required placeholder="Как к вам обращаться" />
            <Field id="email" label="Email" required type="email" placeholder="you@company.ru" />
          </div>
          <div className="mt-7">
            <Field id="city" label="Город" required placeholder="Например, Ростов-на-Дону" />
          </div>

          <div className="mt-7 grid gap-7 sm:grid-cols-2">
            <Field id="companyName" label="Компания" placeholder="Если обращаетесь от компании" />
            <Field id="phone" label="Телефон" required type="tel" placeholder="+7 900 123-45-67" />
          </div>
          <div className="mt-7">
            <Field id="website" label="Сайт" placeholder="Если есть" />
          </div>

          <div className="mt-7">
            <label htmlFor="message" className="eyebrow block">
              Сообщение
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              placeholder="С какими покрытиями и объёмами работаете"
              className={`${field} mt-3 resize-none`}
            />
          </div>

          <ConsentCheckbox id="consent-retail" onOpenConsent={onOpenConsent} />

          <button
            type="submit"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-graphite px-8 py-4 text-sm text-porcelain transition-colors duration-500 ease-premium hover:bg-ink"
          >
            Отправить заявку
          </button>

          <StatusLine sent={sent} />
        </motion.form>

        <motion.div {...revealProps(reduced, stagger(0.15, 0.07))} className="space-y-10">
          {company.phones.map((phone) => (
            <motion.div key={phone.href} variants={rise}>
              <p className="eyebrow">{phone.region}</p>
              <a
                href={phone.href}
                className="mt-2.5 block text-[clamp(1.5rem,3vw,2.25rem)] tracking-tight transition-colors duration-500 ease-premium hover:text-graphite/55"
              >
                {phone.display}
              </a>
              {/* Клиент отметил: адрес/город терялись рядом с крупным номером
                  телефона — крупнее и темнее, а не приглушённый titanium-тон. */}
              <p className="mt-2 flex items-center gap-2 text-[1.0625rem] font-medium text-graphite/85">
                <MapPin size={17} className="shrink-0 text-ember" />
                {phone.address}
              </p>
              {/* Публичный embed Google Maps по адресу — не требует API-ключа
                  (параметр output=embed), поэтому карта видна сразу, без
                  подключения биллинга. Адрес — тот же, что и текстом выше. */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-graphite/[0.12]">
                <iframe
                  title={`Карта: ${phone.region}, ${phone.address}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(`${phone.region}, ${phone.address}`)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-40 w-full grayscale-[0.2]"
                />
              </div>
            </motion.div>
          ))}

          <motion.div variants={rise} className="space-y-4 border-t border-graphite/[0.12] pt-8">
            <a
              href={`mailto:${company.email}`}
              className="flex items-center gap-3 text-[1.0625rem] transition-colors duration-500 ease-premium hover:text-graphite/55"
            >
              <Mail size={17} className="shrink-0 text-titanium" />
              {company.email}
            </a>
            <p className="flex items-center gap-3 text-[1.0625rem] text-graphite/70">
              <Clock size={17} className="shrink-0 text-titanium" />
              {company.schedule}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/**
 * Не отмечена по умолчанию и обязательна — required на нативном checkbox
 * блокирует submit браузером ещё до onSubmit, отдельной проверки в JS не
 * нужно. Ссылка открывает тот же документ, что и в футере (LegalOverlay).
 */
export function ConsentCheckbox({ id, onOpenConsent }: { id: string; onOpenConsent: () => void }) {
  return (
    <label htmlFor={id} className="mt-7 flex items-start gap-2.5 text-[0.8125rem] text-graphite/60">
      <input
        id={id}
        name="consent"
        type="checkbox"
        required
        className="mt-0.5 h-4 w-4 shrink-0 accent-graphite"
      />
      <span>
        Согласен(на) на{' '}
        <button
          type="button"
          onClick={(e) => {
            // Кнопка вложена в <label> ради общей области клика на текст —
            // без stopPropagation клик по ссылке ещё и переключил бы саму
            // галочку через родительский label.
            e.preventDefault()
            e.stopPropagation()
            onOpenConsent()
          }}
          className="underline decoration-graphite/30 underline-offset-2 transition-colors duration-300 ease-premium hover:text-graphite"
        >
          обработку персональных данных
        </button>
      </span>
    </label>
  )
}

export function StatusLine({ sent }: { sent: boolean }) {
  return (
    <p aria-live="polite" className="mt-5 max-w-[46ch] text-[0.8125rem] leading-relaxed text-graphite/45">
      {sent
        ? `Письмо открыто в вашем почтовом клиенте. Если он не запустился — напишите на ${company.leadEmail}.`
        : `Заявка откроется письмом в вашем почтовом клиенте на адрес ${company.leadEmail}.`}
    </p>
  )
}

export function Field({
  id,
  label,
  placeholder,
  required,
  type = 'text',
}: {
  id: string
  label: string
  placeholder?: string
  required?: boolean
  type?: string
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="eyebrow block">
        {label}
        {required && <span className="text-graphite/25"> *</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={
          id === 'name'
            ? 'name'
            : id === 'phone'
              ? 'tel'
              : id === 'email'
                ? 'email'
                : id === 'city'
                  ? 'address-level2'
                  : id === 'website'
                    ? 'url'
                    : id === 'companyName' || id === 'company'
                      ? 'organization'
                      : 'off'
        }
        className={`${field} mt-3`}
      />
    </div>
  )
}
