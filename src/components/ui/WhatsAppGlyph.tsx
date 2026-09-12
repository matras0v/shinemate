/**
 * Свой значок вместо логотипа WhatsApp: у сайта монохромная line-icon
 * система (lucide), а цветной фирменный бейдж Meta сюда не впишется.
 * Форма — узнаваемый «чат + трубка», не копия логотипа бренда.
 */
export function WhatsAppGlyph({ size = 16 }: { size?: number }) {
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
