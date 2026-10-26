import { isValid, parse } from 'date-fns'
import { formatBR, toKey } from './dates'

/** Aplica a máscara dd/mm/aaaa a qualquer texto digitado. */
export function maskDate(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/** "26/10/2026" → "2026-10-26"; devolve null se incompleta ou inexistente (ex.: 31/02). */
export function parseBR(text: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return null
  const d = parse(text, 'dd/MM/yyyy', new Date(2000, 0, 1))
  if (!isValid(d) || d.getFullYear() < 1900) return null
  return toKey(d)
}

export function textFromKey(key: string): string {
  return key ? formatBR(key) : ''
}
