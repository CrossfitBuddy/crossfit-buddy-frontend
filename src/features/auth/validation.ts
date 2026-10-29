export const passwordHint = 'От 8 до 30 символов: буквы, цифры и специальный символ'

export function isStrongPassword(value: string) {
  return value.length >= 8 && value.length <= 30
    && /\p{L}/u.test(value) && /\p{Nd}/u.test(value) && /[^\p{L}\p{Nd}\s]/u.test(value)
}

export function returnAddress(value: unknown): string {
  if (!value || typeof value !== 'object') return '/'
  const from = value as { pathname?: unknown; search?: unknown; hash?: unknown }
  if (typeof from.pathname !== 'string' || !from.pathname.startsWith('/') || from.pathname.startsWith('//') || from.pathname.includes(String.fromCharCode(92))) return '/'
  if (['/login', '/forgot-password', '/reset-password'].includes(from.pathname)) return '/'
  return from.pathname + (typeof from.search === 'string' && from.search.startsWith('?') ? from.search : '')
    + (typeof from.hash === 'string' && from.hash.startsWith('#') ? from.hash : '')
}
