import { useRef, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Mail, MapPin, X } from 'lucide-react'

import { formatPrice } from '../../data/catalog'
import { company } from '../../data/company'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useLead } from '../../lib/leadContext'
import { submitLead } from '../../lib/lead'
import { revealProps, rise, riseProps, stagger } from '../../lib/motion'

const field =
  'w-full border-b border-graphite/20 bg-transparent pb-3 pt-2 text-[1.0625rem] text-graphite outline-none transition-colors duration-500 ease-premium placeholder:text-smoke focus:border-graphite'

type Props = {
  onOpenConsent: () => void
  /** На отдельной странице «Контакты» заголовок блока — h1 страницы. */
  standalone?: boolean
}

/**
 * Только розница: карты, адреса, телефоны, почта и форма заявки. Оптовый
 * сценарий — отдельная страница (/wholesale, компонент Wholesale.tsx), а
 * не вкладка здесь — клиент отметил, что общий контент "Контактов" не
 * должен зависеть от переключателя розница/опт, это должны быть две
 * самостоятельные кнопки в шапке.
 */
export function Contact({ onOpenConsent, standalone }: Props) {
  /*
   * На главной этот блок — секция под hero, и заголовок там h2. На
   * отдельной странице «Контакты» он единственный крупный заголовок,
   * то есть должен быть h1: иначе у страницы нет h1 вообще.
   */
  const Heading = standalone ? motion.h1 : motion.h2
  const [status, setStatus] = useState<Status>('idle')
  const reduced = useReducedMotion()
  const { product, variant, clearProduct } = useLead()
  /** Момент показа формы — сервер отклоняет отправку раньше нескольких секунд как ботовую. */
  const startedAt = useRef(Date.now())

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return
    const data = new FormData(e.currentTarget)
    const value = (key: string) => String(data.get(key) ?? '').trim()
    setStatus('sending')
    const result = await submitLead(
      {
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
      },
      { hp: value('fax_number'), startedAt: startedAt.current }
    )
    setStatus(result.ok ? 'sent' : 'error')
  }

  return (
    <section id="contacts" className="scene relative bg-porcelain py-28 md:py-40">
      {/*
        На отдельной странице «Контакты» не было ни одной ссылки назад —
        только логотип в шапке. Клиент показал на видео, что пытался
        вернуться и не нашёл рабочего пути обратно. Тот же паттерн, что
        уже используется в каталоге (CatalogView).
      */}
      {standalone && (
        <div className="shell mb-8">
          <a
            href="."
            className="group inline-flex items-center gap-2 text-[0.875rem] text-slate transition-colors duration-500 ease-premium hover:text-graphite"
          >
            <ArrowLeft size={15} className="transition-transform duration-500 ease-premium group-hover:-translate-x-0.5" />
            На главную
          </a>
        </div>
      )}
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
        {/*
          На отдельной странице «Контакты» заголовок и лид были те же, что
          и в лид-форме на главной («Подберём ShineMate под вашу задачу») —
          человек, который зашёл узнать телефон, вместо этого видел призыв
          заполнить анкету подбора. На главной эта формулировка остаётся:
          там форма — продолжение карточки товара, а не самостоятельная
          страница «Контакты».
        */}
        <Heading variants={rise} className="h1 mt-5 max-w-[18ch]">
          {standalone ? 'Телефоны, адреса и почта' : 'Подберём ShineMate под вашу задачу'}
        </Heading>
        <motion.p variants={rise} className="lead mt-6 max-w-[48ch] text-slate">
          {standalone
            ? 'Звоните или пишите напрямую — ниже актуальные номера по регионам, адреса и карта. Если удобнее, оставьте заявку в форме, и мы подберём конфигурацию под задачу и объёмы.'
            : 'Расскажите, с какими покрытиями и объёмами работаете — предложим конфигурацию машинки, подложек и кругов и пришлём актуальный прайс.'}
        </motion.p>
      </motion.div>

      <div
        className={`shell mt-12 grid gap-14 lg:grid-cols-[1fr_0.85fr] lg:gap-24 ${
          standalone ? 'lg:grid-cols-[0.85fr_1fr]' : ''
        }`}
      >
        {/*
          На отдельной странице «Контакты» реальные номера и адрес идут
          ПЕРВЫМИ и в разметке, и визуально — это то, за чем сюда приходят.
          Форма подбора конфигурации остаётся, но уже вторым, необязательным
          шагом. На главной порядок прежний: там страница уже вела к форме
          через CTA у товара, и контакты там — уточнение, а не цель захода.
        */}
        {standalone && <ContactDetails />}

        <motion.form
          {...riseProps(reduced, { y: 28, amount: 0.15 })}
          onSubmit={onSubmit}
          /*
            Якорь для "Запросить прайс" — CTA со всего сайта ведут на
            /contacts#request-form (см. leadContext.tsx), а не на верх
            страницы "Контакты", где на standalone-версии первым идёт блок
            с картами/адресами. id — ТОЛЬКО на standalone-варианте: тот же
            компонент рендерится ещё и встроенным в главную (!standalone),
            и во время перехода С главной НА /contacts (до того, как React
            перерисует маршрут) document.getElementById ещё видит DOM
            главной страницы — если бы id был на обеих версиях, поиск
            находил бы форму embedded-версии на главной и скроллил туда,
            а не к реальной цели на странице контактов, до которой доедет
            только после смены маршрута. Итог такой гонки — прыжок мимо
            формы, в самый низ уже другой, стандалон-страницы (см. футер).
            scroll-mt компенсирует фиксированную шапку (h-[4.75rem] /
            lg:h-[5.25rem] в Header.tsx) при scrollIntoView({block:'start'}).
          */
          id={standalone ? 'request-form' : undefined}
          className="min-w-0 scroll-mt-24 lg:scroll-mt-28"
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
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-titanium">
                  Вы интересовались
                </p>
                <p className="mt-0.5 truncate text-[0.9375rem] tracking-tight">{product.model}</p>
                {product.variants.length > 1 && variant && (
                  <p className="mt-0.5 truncate text-[0.8125rem] text-slate">
                    {variant.label}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={clearProduct}
                aria-label="Убрать товар из заявки"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-titanium transition-colors duration-500 ease-premium hover:bg-graphite/10 hover:text-graphite"
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

          <Honeypot />

          <ConsentCheckbox id="consent-retail" onOpenConsent={onOpenConsent} />

          <button
            type="submit"
            disabled={status === 'sending'}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-graphite px-8 py-4 text-sm text-porcelain transition-colors duration-500 ease-premium hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
          </button>

          <StatusLine status={status} />
        </motion.form>

        {!standalone && <ContactDetails />}
      </div>
    </section>
  )
}

/** Реальные телефоны, адрес, карта, почта и часы работы — вынесено, чтобы показывать первым на /contacts. */
function ContactDetails() {
  const reduced = useReducedMotion()
  return (
    <motion.div {...revealProps(reduced, stagger(0.15, 0.07))} className="space-y-10">
      {company.phones.map((phone) => (
        <motion.div key={phone.href} variants={rise}>
          <p className="eyebrow">{phone.region}</p>
          <a
            href={phone.href}
            className="mt-2.5 block text-[clamp(1.5rem,3vw,2.25rem)] tracking-tight transition-colors duration-500 ease-premium hover:text-slate"
          >
            {phone.display}
          </a>
          {/* Клиент отметил: адрес/город терялись рядом с крупным номером
              телефона — крупнее и темнее, а не приглушённый titanium-тон. */}
          <p className="mt-2 flex items-center gap-2 text-[1.0625rem] font-medium text-ash">
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
          className="flex items-center gap-3 text-[1.0625rem] transition-colors duration-500 ease-premium hover:text-slate"
        >
          <Mail size={17} className="shrink-0 text-titanium" />
          {company.email}
        </a>
        <p className="flex items-center gap-3 text-[1.0625rem] text-ash">
          <Clock size={17} className="shrink-0 text-titanium" />
          {company.schedule}
        </p>
      </motion.div>
    </motion.div>
  )
}

/**
 * Не отмечена по умолчанию и обязательна — required на нативном checkbox
 * блокирует submit браузером ещё до onSubmit, отдельной проверки в JS не
 * нужно. Ссылка открывает тот же документ, что и в футере (LegalOverlay).
 */
export function ConsentCheckbox({ id, onOpenConsent }: { id: string; onOpenConsent: () => void }) {
  return (
    <label htmlFor={id} className="mt-7 flex items-start gap-2.5 text-[0.8125rem] text-slate">
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

export type Status = 'idle' | 'sending' | 'sent' | 'error'

export function StatusLine({ status }: { status: Status }) {
  const text =
    status === 'sent'
      ? 'Заявка отправлена. Мы свяжемся с вами в ближайшее время.'
      : status === 'error'
        ? `Не получилось отправить заявку — попробуйте ещё раз или напишите напрямую на ${company.leadEmail}.`
        : status === 'sending'
          ? 'Отправляем заявку…'
          : `Заявка уходит на адрес ${company.leadEmail}.`
  return (
    <p aria-live="polite" className="mt-5 max-w-[46ch] text-[0.8125rem] leading-relaxed text-titanium">
      {text}
    </p>
  )
}

/**
 * Honeypot: поле, которое видят и заполняют только боты (скрыто с экрана,
 * но не display:none — часть спам-скриптов игнорирует именно такие поля).
 * Живой посетитель никогда его не видит и не может случайно заполнить —
 * tabIndex=-1 и aria-hidden убирают его из табуляции и озвучки скринридером.
 */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
      <label htmlFor="fax_number">Факс</label>
      <input id="fax_number" name="fax_number" type="text" tabIndex={-1} autoComplete="off" />
    </div>
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
        {required && <span className="text-titanium"> *</span>}
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
