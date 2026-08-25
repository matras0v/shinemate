/**
 * Контакты сайта. Сайт — самостоятельный продукт под брендом ShineMate,
 * без публичной привязки к конкретному юрлицу-дилеру.
 */

export const company = {
  role: 'Официальное оборудование ShineMate в России',
  schedule: 'Пн–Пт 09:00–18:00',
  email: 'shinemate_russia@mail.ru',
  /** Почта, на которую уходит заявка из формы. */
  leadEmail: 'shinemate_russia@mail.ru',
  phones: [
    {
      region: 'Москва',
      display: '+7 961 432-99-99',
      href: 'tel:+79614329999',
      address: 'ул. Рябиновая, 43 к 2',
    },
    {
      region: 'Ростов-на-Дону',
      display: '+7 989 129-37-47',
      href: 'tel:+79891293747',
      address: 'ул. Ерёменко, 45',
    },
  ],
} as const

export const nav = [
  { href: '#about', label: 'О ShineMate' },
  { href: '#tech', label: 'Технологии' },
  { href: '#contacts', label: 'Контакты' },
] as const
