import type { DateKey, LoggedExercise, LoggedSet, WorkoutLog, WorkoutTemplate } from '../types'
import { todayKey } from './dates'
import { uid } from './id'

/** "Supino  Reto" e "supino reto" são o mesmo exercício. */
export function exerciseKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Carga máxima estimada para 1 repetição (fórmula de Epley). */
export function estimate1RM(kg: number, reps: number): number {
  if (kg <= 0 || reps <= 0) return 0
  if (reps === 1) return kg
  return Math.round(kg * (1 + reps / 30) * 10) / 10
}

/** Volume = soma de carga × repetições das séries feitas. */
export function logVolume(log: Pick<WorkoutLog, 'exercises'>): number {
  let v = 0
  for (const e of log.exercises) for (const s of e.sets) if (s.done) v += s.kg * s.reps
  return Math.round(v)
}

export function doneSets(log: Pick<WorkoutLog, 'exercises'>): number {
  return log.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
}

/** Última vez em que o exercício foi feito (séries registradas), ou null. */
export function lastPerformance(logs: WorkoutLog[], name: string): { date: DateKey; sets: LoggedSet[] } | null {
  const key = exerciseKey(name)
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  for (const log of sorted) {
    const ex = log.exercises.find((e) => exerciseKey(e.name) === key)
    if (ex && ex.sets.some((s) => s.done)) return { date: log.date, sets: ex.sets.filter((s) => s.done) }
  }
  return null
}

export function summarizeSets(sets: LoggedSet[]): string {
  if (sets.length === 0) return ''
  const same = sets.every((s) => s.reps === sets[0].reps && s.kg === sets[0].kg)
  const kg = (n: number) => (n > 0 ? ` · ${String(n).replace('.', ',')} kg` : '')
  if (same) return `${sets.length}×${sets[0].reps}${kg(sets[0].kg)}`
  return sets.map((s) => `${s.reps}${s.kg > 0 ? `×${String(s.kg).replace('.', ',')}kg` : ''}`).join(' · ')
}

/** Séries iniciais de um exercício: repete a última vez; se nunca fez, usa a meta do modelo. */
export function initialSets(logs: WorkoutLog[], name: string, target: { sets: number; reps: number; kg: number | null }): LoggedSet[] {
  const last = lastPerformance(logs, name)
  if (last) return last.sets.map((s) => ({ reps: s.reps, kg: s.kg, done: false }))
  return Array.from({ length: Math.max(1, target.sets) }, () => ({ reps: target.reps, kg: target.kg ?? 0, done: false }))
}

export function startFromTemplate(template: WorkoutTemplate, logs: WorkoutLog[], date: DateKey): WorkoutLog {
  return {
    id: uid(),
    date,
    templateId: template.id,
    name: template.name,
    durationMin: null,
    note: '',
    createdAt: '',
    exercises: template.exercises.map((e) => ({ id: uid(), name: e.name, sets: initialSets(logs, e.name, e) })),
  }
}

/** Treino em andamento a partir de um treino montado (começa agora, com a data de hoje). */
export function newActive(log: WorkoutLog): { startedAt: number; log: WorkoutLog } {
  return { startedAt: Date.now(), log: { ...log, date: todayKey() } }
}

export function emptyWorkout(date: DateKey): WorkoutLog {
  return { id: uid(), date, templateId: null, name: 'Treino livre', durationMin: null, note: '', createdAt: '', exercises: [] }
}

export interface ExercisePoint {
  date: DateKey
  topKg: number
  best1RM: number
  volume: number
}

/** Evolução de um exercício, uma entrada por treino, em ordem de data. */
export function exerciseHistory(logs: WorkoutLog[], name: string): ExercisePoint[] {
  const key = exerciseKey(name)
  const points: ExercisePoint[] = []
  for (const log of [...logs].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))) {
    const ex = log.exercises.find((e) => exerciseKey(e.name) === key)
    if (!ex) continue
    const sets = ex.sets.filter((s) => s.done)
    if (sets.length === 0) continue
    points.push({
      date: log.date,
      topKg: Math.max(...sets.map((s) => s.kg)),
      best1RM: Math.max(...sets.map((s) => estimate1RM(s.kg, s.reps))),
      volume: Math.round(sets.reduce((n, s) => n + s.kg * s.reps, 0)),
    })
  }
  return points
}

/** Nomes distintos de exercícios já feitos (mais usados primeiro). */
export function knownExercises(logs: WorkoutLog[], templates: WorkoutTemplate[] = []): string[] {
  const count = new Map<string, { name: string; n: number }>()
  const add = (name: string) => {
    const k = exerciseKey(name)
    if (!k) return
    const cur = count.get(k)
    if (cur) cur.n++
    else count.set(k, { name: name.trim(), n: 1 })
  }
  for (const l of logs) for (const e of l.exercises as LoggedExercise[]) add(e.name)
  for (const t of templates) for (const e of t.exercises) add(e.name)
  return [...count.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)).map((x) => x.name)
}

/** Quantos treinos foram feitos nos dias dados. */
export function workoutsInDates(logs: WorkoutLog[], dates: DateKey[]): number {
  return logs.filter((l) => dates.includes(l.date)).length
}

export const PRESET_TEMPLATES: { name: string; exercises: [string, number, number][] }[] = [
  {
    name: 'Corpo todo (iniciante)',
    exercises: [['Agachamento', 3, 12], ['Supino reto', 3, 10], ['Remada curvada', 3, 10], ['Desenvolvimento', 3, 10], ['Prancha (segundos)', 3, 30]],
  },
  {
    name: 'Treino A: peito, ombro e tríceps',
    exercises: [['Supino reto', 4, 10], ['Supino inclinado', 3, 10], ['Desenvolvimento', 3, 10], ['Elevação lateral', 3, 12], ['Tríceps na polia', 3, 12]],
  },
  {
    name: 'Treino B: costas e bíceps',
    exercises: [['Puxada na frente', 4, 10], ['Remada baixa', 3, 10], ['Remada curvada', 3, 10], ['Rosca direta', 3, 12], ['Rosca martelo', 3, 12]],
  },
  {
    name: 'Treino C: pernas',
    exercises: [['Agachamento', 4, 10], ['Leg press', 3, 12], ['Cadeira extensora', 3, 12], ['Mesa flexora', 3, 12], ['Panturrilha em pé', 4, 15]],
  },
]
