/**
 * Контакты сайта. Сайт — самостоятельный продукт под брендом ShineMate,
 * без публичной привязки к конкретному юрлицу-дилеру.
 */

export const company = {
  role: 'Официальное оборудование ShineMate в России',
  address: 'Ростов-на-Дону, ул. Ерёменко, 45',
  schedule: 'Пн–Пт 09:00–18:00',
  email: 'shinemate_russia@mail.ru',
  /** Почта, на которую уходит заявка из формы. */
  leadEmail: 'shinemate_russia@mail.ru',
  phones: [
    { region: 'Ростовская область', display: '+7 961 301-19-19', href: 'tel:+79613011919' },
    { region: 'Краснодарский край', display: '+7 961 301-18-18', href: 'tel:+79613011818' },
  ],
} as const

export const nav = [
  { href: '#about', label: 'О ShineMate' },
  { href: '#tech', label: 'Технологии' },
  { href: '#contacts', label: 'Контакты' },
] as const
