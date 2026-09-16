// Lightweight stroke-icon set (no external dependency), matching the
// stroke-based style already used in public/icons.svg (documentation/social icons).
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconHome(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  )
}

export function IconCart(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...props}>
      <path d="M3 4h2l1.6 10.2A2 2 0 0 0 8.6 16h8.1a2 2 0 0 0 2-1.6L20 7H6" />
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconCar(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...props}>
      <path d="M4 16v-3.2c0-.5.2-.9.6-1.2l1.8-1.5.9-2.6A2 2 0 0 1 9.2 6h5.6a2 2 0 0 1 1.9 1.5l.9 2.6 1.8 1.5c.4.3.6.7.6 1.2V16" />
      <path d="M4 16h16v2.2c0 .4-.3.8-.8.8H16a.8.8 0 0 1-.8-.8V17H8.8v1.2c0 .4-.3.8-.8.8H4.8a.8.8 0 0 1-.8-.8z" />
      <circle cx="8" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconSettings(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8 6.3 6.3" />
    </svg>
  )
}

export function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  )
}

export function IconLock(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...props}>
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  )
}

export function IconEye(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  )
}

export function IconEyeOff(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...props}>
      <path d="M3.5 3.5l17 17" />
      <path d="M9.9 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15 15 0 0 1-3.2 4M6.5 7.4A14.7 14.7 0 0 0 2.5 12S6 18.5 12 18.5a9.7 9.7 0 0 0 3.5-.65" />
      <path d="M9.9 12a2.6 2.6 0 0 0 3.7 2.9" />
    </svg>
  )
}

export function IconChevronRight(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...base} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function IconChevronDown(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

export function IconArrowLeft(props) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" {...base} {...props}>
      <path d="m11 5-6 7 6 7M5 12h14" />
    </svg>
  )
}

export function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconLogout(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...base} {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M16 16l4-4-4-4M20 12H9" />
    </svg>
  )
}

export function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...base} {...props}>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5 1.5 5h-15S6 14 6 10Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  )
}

export function IconStore(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...base} {...props}>
      <path d="M4 9.5 5.5 4h13L20 9.5" />
      <path d="M4.5 9.5h15v9a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1z" />
      <path d="M10 19v-4.5h4V19" />
    </svg>
  )
}

export function IconCard(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...base} {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M3.5 10h17" />
    </svg>
  )
}

export function IconHelp(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1 .8-1 1.6" />
      <circle cx="12" cy="16.6" r="0.15" fill="currentColor" />
    </svg>
  )
}

export function IconShield(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...base} {...props}>
      <path d="M12 3.5 19 6.5v5.2c0 4.6-3 7.4-7 8.8-4-1.4-7-4.2-7-8.8V6.5Z" />
      <path d="m9.3 12 1.9 1.9 3.5-3.9" />
    </svg>
  )
}
