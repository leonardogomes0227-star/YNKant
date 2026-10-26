import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  format,
  getDay,
  parse,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DateKey, Repeat, TimeStr } from '../types'

const KEY = 'yyyy-MM-dd'

export function toKey(d: Date): DateKey {
  return format(d, KEY)
}

export function fromKey(key: DateKey): Date {
  return parse(key, KEY, new Date(2000, 0, 1))
}

export function todayKey(now: Date = new Date()): DateKey {
  return toKey(now)
}

export function shiftKey(key: DateKey, days: number): DateKey {
  return toKey(addDays(fromKey(key), days))
}

/** dd/mm/aaaa */
export function formatBR(key: DateKey | null | undefined): string {
  if (!key) return ''
  return format(fromKey(key), 'dd/MM/yyyy')
}

/** segunda-feira, 26 de outubro de 2026 */
export function formatLong(d: Date): string {
  const s = format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** seg, 26/10 */
export function formatShort(key: DateKey): string {
  return format(fromKey(key), 'EEE, dd/MM', { locale: ptBR })
}

/** Segunda-feira da semana que contém a data. */
export function weekStartKey(key: DateKey): DateKey {
  return toKey(startOfWeek(fromKey(key), { weekStartsOn: 1 }))
}

export function weekKeys(key: DateKey): DateKey[] {
  const start = weekStartKey(key)
  return Array.from({ length: 7 }, (_, i) => shiftKey(start, i))
}

/** 0 = domingo … 6 = sábado */
export function weekdayOf(key: DateKey): number {
  return getDay(fromKey(key))
}

/** Ordem de exibição, começando na segunda. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
export const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
export const WEEKDAY_LETTER = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
export const WEEKDAY_LONG = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
]

export function diffDays(a: DateKey, b: DateKey): number {
  return differenceInCalendarDays(fromKey(a), fromKey(b))
}

/** Próxima data de uma tarefa recorrente, sempre a partir de `from`. */
export function nextOccurrence(from: DateKey, repeat: Repeat): DateKey {
  const d = fromKey(from)
  if (repeat === 'daily') return toKey(addDays(d, 1))
  if (repeat === 'weekly') return toKey(addWeeks(d, 1))
  if (repeat === 'monthly') return toKey(addMonths(d, 1))
  return from
}

export function greeting(hour: number): string {
  if (hour < 5) return 'Boa madrugada'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

const QUOTES = [
  'Um passo de cada vez ainda é avanço.',
  'Foque no próximo bloco, não no dia inteiro.',
  'Constância vale mais que intensidade.',
  'O que você começa hoje, o você de amanhã agradece.',
  'Pequenas vitórias também contam.',
  'Priorize o importante, não só o urgente.',
  'Feito é melhor que perfeito.',
  'Descanso também faz parte da produtividade.',
  'Comece pelo mais difícil enquanto a energia está alta.',
  'Seu ritmo é o ritmo certo.',
]

/** Frase determinística: muda uma vez por dia. */
export function quoteOfDay(key: DateKey): string {
  const n = Math.abs(diffDays(key, '2020-01-01'))
  return QUOTES[n % QUOTES.length]
}

export function timeToMin(t: TimeStr): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function minToTime(min: number): TimeStr {
  const m = Math.max(0, Math.min(24 * 60, Math.round(min)))
  const h = Math.floor(m / 60)
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function nowMinutes(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes()
}

/** 1h30, 45min, 0min */
export function formatDuration(seconds: number): string {
  const totalMin = Math.round(seconds / 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
