import { company, nav } from '../data/company'
import { categories } from '../data/catalog'
import { BrandLockup } from './ui/BrandLockup'

export function Footer() {
  return (
    <footer className="border-t border-graphite/[0.12] bg-mist py-14 md:py-16">
      <div className="shell grid gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <BrandLockup variant="full" />
          <p className="mt-6 max-w-[34ch] text-[0.8125rem] leading-relaxed text-graphite/50">
            {company.tagline}
          </p>
          <p className="mt-4 text-[0.75rem] leading-relaxed text-graphite/40">{company.role}</p>
        </div>

        <div>
          <p className="eyebrow">Каталог</p>
          <ul className="mt-4 space-y-2">
            {categories.map((c) => (
              <li key={c.id}>
                <a
                  href={`catalog/${c.id}`}
                  className="text-[0.8125rem] leading-relaxed text-graphite/60 transition-colors duration-500 ease-premium hover:text-graphite"
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
                  className="text-[0.8125rem] leading-relaxed text-graphite/60 transition-colors duration-500 ease-premium hover:text-graphite"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="eyebrow mt-8">Реквизиты</p>
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-graphite/60">
            {company.legalName}
            <br />
            ИНН {company.inn}
            <br />
            ОГРН {company.ogrn}
          </p>
        </div>

        <div>
          <p className="eyebrow">Контакты</p>
          <ul className="mt-4 space-y-2 text-[0.8125rem] leading-relaxed text-graphite/60">
            {company.phones.map((phone) => (
              <li key={phone.href}>
                <a
                  href={phone.href}
                  className="transition-colors duration-500 ease-premium hover:text-graphite"
                >
                  {phone.display}
                </a>
                <span className="block text-[0.75rem] text-graphite/35">{phone.region}</span>
              </li>
            ))}
            <li className="pt-1">
              <a
                href={`mailto:${company.leadEmail}`}
                className="transition-colors duration-500 ease-premium hover:text-graphite"
              >
                {company.leadEmail}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${company.email}`}
                className="transition-colors duration-500 ease-premium hover:text-graphite"
              >
                {company.email}
              </a>
            </li>
            <li className="pt-1">{company.address}</li>
            <li>{company.schedule}</li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
