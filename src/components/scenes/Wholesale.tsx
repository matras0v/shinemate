import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'

import { company } from '../../data/company'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { submitLead } from '../../lib/lead'
import { revealProps, rise, riseProps, stagger } from '../../lib/motion'
import { ConsentCheckbox, Field, StatusLine } from './Contact'

const field =
  'w-full border-b border-graphite/20 bg-transparent pb-3 pt-2 text-[1.0625rem] text-graphite outline-none transition-colors duration-500 ease-premium placeholder:text-graphite/30 focus:border-graphite'

type Props = {
  onOpenConsent: () => void
}

/**
 * Отдельная страница для оптовиков — только форма запроса прайса, без
 * карт и адресов из "Контактов". Раньше это была вкладка на той же
 * странице, что и розница — клиент отметил, что это должны быть две
 * самостоятельные кнопки в шапке с разным содержимым, а не переключатель
 * поверх одного и того же контента.
 */
export function Wholesale({ onOpenConsent }: Props) {
  const [sent, setSent] = useState(false)
  const reduced = useReducedMotion()

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
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
    <section id="wholesale" className="scene relative bg-porcelain py-28 md:py-40">
      <motion.div {...revealProps(reduced, stagger(0, 0.08))} className="shell">
        <motion.p variants={rise} className="eyebrow">
          Оптовикам
        </motion.p>
        <motion.h1 variants={rise} className="h1 mt-5 max-w-[18ch]">
          Оптовые условия и поставки
        </motion.h1>
        <motion.p variants={rise} className="lead mt-6 max-w-[48ch] text-graphite/60">
          Для детейлинг-студий, малярных производств, магазинов и сервисных компаний — оптовый
          прайс, подбор ассортимента и условия сотрудничества.
        </motion.p>
      </motion.div>

      <div className="shell mt-12">
        <motion.form
          {...riseProps(reduced, { y: 28, amount: 0.15 })}
          onSubmit={onSubmit}
          className="min-w-0 max-w-2xl"
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

          <ConsentCheckbox id="consent-wholesale" onOpenConsent={onOpenConsent} />

          <button
            type="submit"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-graphite px-8 py-4 text-sm text-porcelain transition-colors duration-500 ease-premium hover:bg-ink"
          >
            Получить оптовый прайс
          </button>

          <StatusLine sent={sent} />

          <p className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-graphite/[0.12] pt-6 text-[0.8125rem] text-graphite/55">
            <span>Или напрямую:</span>
            <a href={`mailto:${company.email}`} className="transition-colors duration-500 ease-premium hover:text-graphite">
              {company.email}
            </a>
            {company.phones.map((phone) => (
              <a
                key={phone.href}
                href={phone.href}
                className="transition-colors duration-500 ease-premium hover:text-graphite"
              >
                {phone.display}
              </a>
            ))}
          </p>
        </motion.form>
      </div>
    </section>
  )
}
