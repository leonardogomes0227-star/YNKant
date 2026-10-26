import type { AppData, FocusSession, JournalEntry, WeeklyReview } from '../types'
import {
  blockDefaults,
  defaultSettings,
  emptyData,
  freshTimer,
  goalDefaults,
  habitDefaults,
  noteDefaults,
  taskDefaults,
} from './defaults'

/** Versão atual do formato salvo. Ao mudar o modelo, some 1 e adicione um passo em `steps`. */
export const DATA_VERSION = 1

type Raw = Record<string, unknown>

/**
 * Passos de migração: `steps[n]` converte dados da versão n-1 para a n.
 * Exemplo futuro: steps[2] = (d) => ({ ...d, novoCampo: [] })
 */
const steps: Record<number, (d: Raw) => Raw> = {}

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)
const arr = (v: unknown): Raw[] => (Array.isArray(v) ? v.filter(isObj) : [])
const hasStr = (o: Raw, k: string) => typeof o[k] === 'string' && (o[k] as string).length > 0

/** Aplica migrações em sequência até a versão atual. */
export function migrate(data: unknown, fromVersion: number): unknown {
  let d: Raw = isObj(data) ? data : {}
  for (let v = fromVersion + 1; v <= DATA_VERSION; v++) {
    const step = steps[v]
    if (step) d = step(d)
  }
  return d
}

/** Garante que o objeto tenha o formato completo de AppData, preenchendo o que faltar. */
export function normalizeData(input: unknown): AppData {
  const raw: Raw = isObj(input) ? input : {}
  const base = emptyData()
  const settings = { ...defaultSettings, ...(isObj(raw.settings) ? raw.settings : {}) }

  const journal: Record<string, JournalEntry> = {}
  if (isObj(raw.journal)) {
    for (const [k, v] of Object.entries(raw.journal)) {
      if (!isObj(v)) continue
      const good = Array.isArray(v.good) ? v.good.map(String) : []
      journal[k] = {
        mood: typeof v.mood === 'number' ? v.mood : null,
        how: typeof v.how === 'string' ? v.how : '',
        good: [good[0] ?? '', good[1] ?? '', good[2] ?? ''],
        improve: typeof v.improve === 'string' ? v.improve : '',
      }
    }
  }

  const reviews: Record<string, WeeklyReview> = {}
  if (isObj(raw.reviews)) {
    for (const [k, v] of Object.entries(raw.reviews)) {
      if (!isObj(v)) continue
      reviews[k] = {
        priorities: typeof v.priorities === 'string' ? v.priorities : '',
        reflection: typeof v.reflection === 'string' ? v.reflection : '',
      }
    }
  }

  const routineLog: Record<string, string[]> = {}
  if (isObj(raw.routineLog)) {
    for (const [k, v] of Object.entries(raw.routineLog)) {
      if (Array.isArray(v)) routineLog[k] = v.map(String)
    }
  }

  const categories = Array.isArray(raw.categories)
    ? raw.categories.filter((c): c is string => typeof c === 'string')
    : base.categories

  return {
    ...base,
    tasks: arr(raw.tasks)
      .filter((t) => hasStr(t, 'id') && hasStr(t, 'title'))
      .map((t) => ({ ...taskDefaults, ...t }) as AppData['tasks'][number]),
    habits: arr(raw.habits)
      .filter((h) => hasStr(h, 'id') && hasStr(h, 'name'))
      .map((h) => ({ ...habitDefaults, ...h }) as AppData['habits'][number]),
    routine: arr(raw.routine)
      .filter((b) => hasStr(b, 'id') && hasStr(b, 'title'))
      .map((b) => ({ ...blockDefaults, ...b }) as AppData['routine'][number]),
    notes: arr(raw.notes)
      .filter((n) => hasStr(n, 'id'))
      .map((n) => ({ ...noteDefaults, ...n }) as AppData['notes'][number]),
    goals: arr(raw.goals)
      .filter((g) => hasStr(g, 'id') && hasStr(g, 'title'))
      .map((g) => ({ ...goalDefaults, ...g }) as AppData['goals'][number]),
    expenses: arr(raw.expenses).filter((e) => hasStr(e, 'id') && typeof e.amount === 'number') as unknown as AppData['expenses'],
    shopping: arr(raw.shopping).filter((i) => hasStr(i, 'id') && hasStr(i, 'name')) as unknown as AppData['shopping'],
    focusSessions: arr(raw.focusSessions).filter(
      (s) => hasStr(s, 'id') && typeof s.seconds === 'number',
    ) as unknown as FocusSession[],
    routineLog,
    journal,
    reviews,
    categories,
    settings,
    timer: isObj(raw.timer)
      ? { ...freshTimer(settings), ...(raw.timer as object) }
      : freshTimer(settings),
  }
}
