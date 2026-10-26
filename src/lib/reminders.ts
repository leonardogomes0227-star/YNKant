import type { DateKey, RoutineBlock, Task } from '../types'
import { nowMinutes, timeToMin, todayKey } from './dates'
import { blocksForDate } from './routine'

export interface Reminder {
  /** Chave única do aviso (evita repetir no mesmo dia). */
  key: string
  title: string
  body: string
}

/** Quantos minutos depois do horário um aviso ainda vale (cobre o app que abriu um pouco atrasado). */
export const REMINDER_WINDOW_MIN = 10

/**
 * Avisos que devem tocar agora: tarefas de hoje com horário e (opcionalmente) início de blocos
 * da rotina. `reminded` guarda o que já foi avisado.
 */
export function dueReminders(opts: {
  tasks: Task[]
  routine: RoutineBlock[]
  now: Date
  reminded: Record<string, true>
  tasksOn: boolean
  blocksOn: boolean
}): Reminder[] {
  const { tasks, routine, now, reminded, tasksOn, blocksOn } = opts
  const day: DateKey = todayKey(now)
  const minutes = nowMinutes(now)
  const out: Reminder[] = []
  const inWindow = (time: string) => {
    const t = timeToMin(time)
    return t <= minutes && minutes < t + REMINDER_WINDOW_MIN
  }

  if (tasksOn) {
    for (const t of tasks) {
      if (t.done || t.dueDate !== day || !t.time || !inWindow(t.time)) continue
      const key = `t:${t.id}:${day}:${t.time}`
      if (!reminded[key]) out.push({ key, title: t.title, body: `Tarefa para as ${t.time}` })
    }
  }
  if (blocksOn) {
    for (const b of blocksForDate(routine, day)) {
      if (!inWindow(b.start)) continue
      const key = `b:${b.id}:${day}`
      if (!reminded[key]) out.push({ key, title: b.title, body: `Começa agora (${b.start}–${b.end})` })
    }
  }
  return out
}
