import { useEffect, useState, type FormEvent } from 'react'
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

export function Contact() {
  const [sent, setSent] = useState(false)
  const reduced = useReducedMotion()
  const { product, variant, intent, clearProduct } = useLead()
  const [tab, setTab] = useState<'retail' | 'wholesale'>(intent)

  // Форма подхватывает намерение из карточки товара или шапки; дальше
  // пользователь волен переключаться между вкладками сам.
  useEffect(() => {
    setTab(intent)
  }, [intent])

  const onSubmitRetail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const value = (key: string) => String(data.get(key) ?? '').trim()
    submitLead({
      intent: 'retail',
      name: value('name'),
      phone: value('phone'),
      email: value('email'),
      message: value('message'),
      productModel: product?.model,
      // Именно то исполнение, что выбрали в drawer — раньше сюда всегда
      // уходило первое по списку, независимо от того, что смотрел человек.
      productSku: variant?.sku,
      productPrice: variant ? formatPrice(variant.rrp) : undefined,
    })
    setSent(true)
  }

  const onSubmitWholesale = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const value = (key: string) => String(data.get(key) ?? '').trim()
    submitLead({
      intent: 'wholesale',
      name: value('name'),
      company: value('company'),
      phone: value('phone'),
      email: value('email'),
      city: value('city'),
      inn: value('inn'),
      businessType: value('businessType'),
      message: value('message'),
    })
    setSent(true)
  }

  return (
    <section id="contacts" className="scene relative bg-porcelain py-28 md:py-40">
      <motion.div {...revealProps(reduced, stagger(0, 0.08))} className="shell">
        <motion.p variants={rise} className="eyebrow">
          Контакты
        </motion.p>
        <motion.h2 variants={rise} className="h1 mt-5 max-w-[18ch]">
          {tab === 'wholesale' ? 'Оптовые условия и поставки' : 'Подберём ShineMate под вашу задачу'}
        </motion.h2>
        <motion.p variants={rise} className="lead mt-6 max-w-[48ch] text-graphite/60">
          {tab === 'wholesale'
            ? 'Для детейлинг-студий, малярных производств, магазинов и сервисных компаний — оптовый прайс, подбор ассортимента и условия сотрудничества.'
            : 'Расскажите, с какими покрытиями и объёмами работаете — предложим конфигурацию машины, подложек и кругов и пришлём актуальный прайс.'}
        </motion.p>

        <motion.div variants={rise} className="mt-8 inline-flex rounded-full border border-graphite/15 p-1">
          <TabButton active={tab === 'retail'} onClick={() => setTab('retail')}>
            Розница
          </TabButton>
          <TabButton active={tab === 'wholesale'} onClick={() => setTab('wholesale')}>
            Оптовикам
          </TabButton>
        </motion.div>
      </motion.div>

      <div className="shell mt-12 grid gap-14 lg:grid-cols-[1fr_0.85fr] lg:gap-24">
        {tab === 'retail' ? (
          <motion.form
            key="retail"
            {...riseProps(reduced, { y: 28, amount: 0.15 })}
            onSubmit={onSubmitRetail}
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

            <div className="grid gap-7 sm:grid-cols-2">
              <Field id="name" label="Имя" required placeholder="Как к вам обращаться" />
              <Field id="phone" label="Телефон" required type="tel" placeholder="+7 900 000-00-00" />
            </div>
            <div className="mt-7">
              <Field id="email" label="Email" type="email" placeholder="you@company.ru" />
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

            <button
              type="submit"
              className="mt-9 inline-flex items-center justify-center rounded-full bg-graphite px-8 py-4 text-sm text-porcelain transition-colors duration-500 ease-premium hover:bg-ink"
            >
              Отправить заявку
            </button>

            <StatusLine sent={sent} />
          </motion.form>
        ) : (
          <motion.form
            key="wholesale"
            {...riseProps(reduced, { y: 28, amount: 0.15 })}
            onSubmit={onSubmitWholesale}
            className="min-w-0"
          >
            <div className="grid gap-7 sm:grid-cols-2">
              <Field id="name" label="Имя" required placeholder="Контактное лицо" />
              <Field id="company" label="Компания" required placeholder="Название компании" />
              <Field id="phone" label="Телефон" required type="tel" placeholder="+7 900 000-00-00" />
              <Field id="email" label="Email" type="email" placeholder="you@company.ru" />
            </div>

            <div className="mt-7 grid gap-7 sm:grid-cols-2">
              <Field id="city" label="Город / регион" placeholder="Ростов-на-Дону" />
              <Field id="inn" label="ИНН" placeholder="Если уже есть под рукой" />
            </div>

            <div className="mt-7">
              <label htmlFor="businessType" className="eyebrow block">
                Тип бизнеса
              </label>
              <select id="businessType" name="businessType" defaultValue="" className={`${field} mt-3`}>
                <option value="">Выберите вариант</option>
                <option value="Детейлинг-студия">Детейлинг-студия</option>
                <option value="Малярное производство">Малярное производство</option>
                <option value="Магазин">Магазин автохимии / инструмента</option>
                <option value="Сервисная компания">Сервисная компания</option>
                <option value="Другое">Другое</option>
              </select>
            </div>

            <div className="mt-7">
              <label htmlFor="message" className="eyebrow block">
                Комментарий
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                placeholder="Что интересует, ориентировочный объём"
                className={`${field} mt-3 resize-none`}
              />
            </div>

            <button
              type="submit"
              className="mt-9 inline-flex items-center justify-center rounded-full bg-graphite px-8 py-4 text-sm text-porcelain transition-colors duration-500 ease-premium hover:bg-ink"
            >
              Получить оптовый прайс
            </button>

            <StatusLine sent={sent} />
          </motion.form>
        )}

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
              <p className="mt-1.5 flex items-center gap-2 text-[0.9375rem] text-graphite/60">
                <MapPin size={15} className="shrink-0 text-titanium" />
                {phone.address}
              </p>
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-5 py-2 text-[0.8125rem] transition-colors duration-400 ease-premium ${
        active ? 'bg-graphite text-porcelain' : 'text-graphite/60 hover:text-graphite'
      }`}
    >
      {children}
    </button>
  )
}

function StatusLine({ sent }: { sent: boolean }) {
  return (
    <p aria-live="polite" className="mt-5 max-w-[46ch] text-[0.8125rem] leading-relaxed text-graphite/45">
      {sent
        ? `Письмо открыто в вашем почтовом клиенте. Если он не запустился — напишите на ${company.leadEmail}.`
        : `Заявка откроется письмом в вашем почтовом клиенте на адрес ${company.leadEmail}.`}
    </p>
  )
}

function Field({
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
        autoComplete={id === 'name' ? 'name' : id === 'phone' ? 'tel' : id === 'email' ? 'email' : 'organization'}
        className={`${field} mt-3`}
      />
    </div>
  )
}
