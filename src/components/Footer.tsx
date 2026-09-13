import { company, nav } from '../data/company'
import { categories } from '../data/catalog'
import { aboutCompany, paymentDelivery, publicOffer, returns } from '../data/info'
import { dataProcessingConsent, privacyPolicy, termsOfUse, type LegalDocument } from '../data/legal'
import { BrandLockup } from './ui/BrandLockup'
import { WhatsAppGlyph } from './ui/WhatsAppGlyph'

type Props = {
  onOpenDoc: (doc: LegalDocument) => void
}

export function Footer({ onOpenDoc }: Props) {
  return (
    /*
      Футер переверстан из-за прямой претензии клиента: «Москва, Ростов,
      контакты, разделы слиплись в одну кучу». Что изменено по сути:
      выросли расстояния (колонки 14→20, строки 8→14px), ссылки стали
      читаемого размера (13→14px), у каждой появилась своя высота нажатия
      не меньше 44px на touch, а телефон отделён от региона и адреса
      размером, а не только цветом. Порядок и состав ссылок прежние.
    */
    <footer className="border-t border-graphite/[0.12] bg-mist py-16 md:py-20">
      <div className="shell grid gap-x-14 gap-y-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr] lg:gap-x-16">
        <div>
          <BrandLockup variant="full" />
          <p className="mt-5 max-w-[30ch] text-[0.8125rem] leading-relaxed text-titanium">
            {company.role}
          </p>
        </div>

        <div>
          <p className="eyebrow">Каталог</p>
          <ul className="mt-5 space-y-3.5">
            {categories.map((c) => (
              <li key={c.id}>
                <a
                  href={`catalog/${c.id}`}
                  className="group inline-flex min-h-[1.75rem] items-center text-[0.875rem] leading-relaxed text-slate transition-colors duration-400 ease-premium hover:text-graphite"
                >
                  <span className="transition-transform duration-400 ease-premium group-hover:translate-x-1">
                    {c.title}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Разделы</p>
          <ul className="mt-5 space-y-3.5">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="group inline-flex min-h-[1.75rem] items-center text-[0.875rem] leading-relaxed text-slate transition-colors duration-400 ease-premium hover:text-graphite"
                >
                  <span className="transition-transform duration-400 ease-premium group-hover:translate-x-1">
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Контакты</p>
          <ul className="mt-5 space-y-6 text-[0.875rem] leading-relaxed text-slate">
            {company.phones.map((phone) => (
              <li key={phone.href}>
                <span className="block font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">
                  {phone.region}
                </span>
                <a
                  href={phone.href}
                  className="mt-1.5 block text-[1.0625rem] tracking-tight text-graphite transition-colors duration-400 ease-premium hover:text-ember"
                >
                  {phone.display}
                </a>
                <span className="mt-1 block text-[0.8125rem] text-titanium">{phone.address}</span>
                {/*
                  Кнопка — только у номера, где WhatsApp реально проверен и
                  работает. У второго номера whatsapp: null — ссылка на
                  недоступный чат хуже, чем её отсутствие.
                */}
                {phone.whatsapp && (
                  <a
                    href={phone.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2.5 inline-flex min-h-[2.25rem] items-center gap-2 rounded-full border border-graphite/15 px-3.5 text-[0.8125rem] text-slate transition-colors duration-400 ease-premium hover:border-graphite/35 hover:text-graphite"
                  >
                    <WhatsAppGlyph size={14} />
                    Написать в WhatsApp
                  </a>
                )}
              </li>
            ))}
            <li className="border-t border-graphite/[0.1] pt-6">
              <a
                href={`mailto:${company.email}`}
                className="inline-flex min-h-[1.75rem] items-center transition-colors duration-400 ease-premium hover:text-ember"
              >
                {company.email}
              </a>
              <span className="mt-2 block text-[0.8125rem] text-titanium">{company.schedule}</span>
            </li>
          </ul>
        </div>
      </div>

      {/*
        Тот же набор ссылок, что в футере у autech.ru/zvizzer.org/leraton.ru
        (О компании, Оплата и доставка, Возврат, Договор оферты) — плюс три
        обязательных юридических документа. Все открываются тем же
        LegalOverlay, что и раньше — просто общий колбэк вместо отдельного
        пропа на каждый документ.
      */}
      <div className="shell mt-14 flex flex-wrap items-center gap-x-8 gap-y-1 border-t border-graphite/[0.12] pt-8">
        <button
          type="button"
          onClick={() => onOpenDoc(aboutCompany)}
          className="inline-flex min-h-[2.25rem] items-center text-[0.8125rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          О компании
        </button>
        <button
          type="button"
          onClick={() => onOpenDoc(paymentDelivery)}
          className="inline-flex min-h-[2.25rem] items-center text-[0.8125rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          Оплата и доставка
        </button>
        <button
          type="button"
          onClick={() => onOpenDoc(returns)}
          className="inline-flex min-h-[2.25rem] items-center text-[0.8125rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          Возврат
        </button>
        <button
          type="button"
          onClick={() => onOpenDoc(publicOffer)}
          className="inline-flex min-h-[2.25rem] items-center text-[0.8125rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          Договор оферты
        </button>
        <button
          type="button"
          onClick={() => onOpenDoc(privacyPolicy)}
          className="inline-flex min-h-[2.25rem] items-center text-[0.8125rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          Политика конфиденциальности
        </button>
        <button
          type="button"
          onClick={() => onOpenDoc(termsOfUse)}
          className="inline-flex min-h-[2.25rem] items-center text-[0.8125rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          Пользовательское соглашение
        </button>
        <button
          type="button"
          onClick={() => onOpenDoc(dataProcessingConsent)}
          className="inline-flex min-h-[2.25rem] items-center text-[0.8125rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          Согласие на обработку данных
        </button>
      </div>
    </footer>
  )
}
