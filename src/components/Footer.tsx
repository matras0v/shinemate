import { company, nav } from '../data/company'
import { categories } from '../data/catalog'
import { aboutCompany, paymentDelivery, publicOffer, returns } from '../data/info'
import { dataProcessingConsent, privacyPolicy, termsOfUse, type LegalDocument } from '../data/legal'
import { BrandLockup } from './ui/BrandLockup'

type Props = {
  onOpenDoc: (doc: LegalDocument) => void
}

/**
 * Свой значок вместо логотипа WhatsApp: у сайта монохромная line-icon
 * система (lucide), а цветной фирменный бейдж Meta сюда не впишется.
 * Форма — узнаваемый «чат + трубка», не копия логотипа бренда.
 */
function WhatsAppGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 21l1.65-4.95A8.5 8.5 0 1 1 8.9 19.4L3 21Z" />
      <path d="M8.7 9.6c0 3.1 2.6 5.7 5.7 5.7.4 0 .7-.3.8-.6l.3-1a.9.9 0 0 0-.5-1.1l-1.4-.6a.9.9 0 0 0-1 .2l-.3.3a5.1 5.1 0 0 1-2.1-2.1l.3-.3a.9.9 0 0 0 .2-1l-.6-1.4a.9.9 0 0 0-1.1-.5l-1 .3c-.3.1-.6.4-.6.8Z" />
    </svg>
  )
}

export function Footer({ onOpenDoc }: Props) {
  return (
    <footer className="border-t border-graphite/[0.12] bg-mist py-14 md:py-16">
      <div className="shell grid gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <BrandLockup variant="full" />
          <p className="mt-4 text-[0.75rem] leading-relaxed text-titanium">{company.role}</p>
        </div>

        <div>
          <p className="eyebrow">Каталог</p>
          <ul className="mt-4 space-y-2">
            {categories.map((c) => (
              <li key={c.id}>
                <a
                  href={`catalog/${c.id}`}
                  className="text-[0.8125rem] leading-relaxed text-slate transition-colors duration-500 ease-premium hover:text-graphite"
                >
                  {c.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Разделы</p>
          <ul className="mt-4 space-y-2">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-[0.8125rem] leading-relaxed text-slate transition-colors duration-500 ease-premium hover:text-graphite"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Контакты</p>
          <ul className="mt-4 space-y-2 text-[0.8125rem] leading-relaxed text-slate">
            {company.phones.map((phone) => (
              <li key={phone.href} className="pt-1 first:pt-0">
                <span className="block text-[0.75rem] uppercase tracking-[0.08em] text-titanium">
                  {phone.region}
                </span>
                <a
                  href={phone.href}
                  className="transition-colors duration-500 ease-premium hover:text-graphite"
                >
                  {phone.display}
                </a>
                <span className="block text-[0.75rem] text-titanium">{phone.address}</span>
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
                    className="mt-1.5 inline-flex items-center gap-1.5 text-[0.75rem] text-slate transition-colors duration-500 ease-premium hover:text-graphite"
                  >
                    <WhatsAppGlyph size={14} />
                    Написать в WhatsApp
                  </a>
                )}
              </li>
            ))}
            <li className="pt-1">
              <a
                href={`mailto:${company.email}`}
                className="transition-colors duration-500 ease-premium hover:text-graphite"
              >
                {company.email}
              </a>
            </li>
            <li>{company.schedule}</li>
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
      <div className="shell mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-graphite/[0.12] pt-6">
        <button
          type="button"
          onClick={() => onOpenDoc(aboutCompany)}
          className="text-[0.75rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          О компании
        </button>
        <button
          type="button"
          onClick={() => onOpenDoc(paymentDelivery)}
          className="text-[0.75rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          Оплата и доставка
        </button>
        <button
          type="button"
          onClick={() => onOpenDoc(returns)}
          className="text-[0.75rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          Возврат
        </button>
        <button
          type="button"
          onClick={() => onOpenDoc(publicOffer)}
          className="text-[0.75rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          Договор оферты
        </button>
        <button
          type="button"
          onClick={() => onOpenDoc(privacyPolicy)}
          className="text-[0.75rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          Политика конфиденциальности
        </button>
        <button
          type="button"
          onClick={() => onOpenDoc(termsOfUse)}
          className="text-[0.75rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          Пользовательское соглашение
        </button>
        <button
          type="button"
          onClick={() => onOpenDoc(dataProcessingConsent)}
          className="text-[0.75rem] text-titanium transition-colors duration-400 ease-premium hover:text-graphite"
        >
          Согласие на обработку данных
        </button>
      </div>
    </footer>
  )
}
