import { company, nav } from '../data/company'
import { categories } from '../data/catalog'
import { BrandLockup } from './ui/BrandLockup'

export function Footer() {
  return (
    <footer className="border-t border-graphite/[0.12] bg-mist py-14 md:py-16">
      <div className="shell grid gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <BrandLockup variant="full" />
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
        </div>

        <div>
          <p className="eyebrow">Контакты</p>
          <ul className="mt-4 space-y-2 text-[0.8125rem] leading-relaxed text-graphite/60">
            {company.phones.map((phone) => (
              <li key={phone.href} className="pt-1 first:pt-0">
                <span className="block text-[0.75rem] uppercase tracking-[0.08em] text-graphite/35">
                  {phone.region}
                </span>
                <a
                  href={phone.href}
                  className="transition-colors duration-500 ease-premium hover:text-graphite"
                >
                  {phone.display}
                </a>
                <span className="block text-[0.75rem] text-graphite/35">{phone.address}</span>
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
    </footer>
  )
}
