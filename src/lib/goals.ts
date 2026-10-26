import type { DateKey, Goal, Habit, Task } from '../types'
import { diffDays } from './dates'

/** Progresso exibido: pelos marcos (se ativado e existirem) ou o valor manual. */
export function goalProgress(g: Pick<Goal, 'autoProgress' | 'milestones' | 'progress'>): number {
  if (g.autoProgress && g.milestones.length > 0) {
    return Math.round((g.milestones.filter((m) => m.done).length / g.milestones.length) * 100)
  }
  return Math.max(0, Math.min(100, Math.round(g.progress)))
}

export interface DeadlineInfo {
  label: string
  late: boolean
}

export function deadlineInfo(deadline: DateKey | null, today: DateKey, progress: number): DeadlineInfo | null {
  if (!deadline) return null
  const d = diffDays(deadline, today)
  if (progress >= 100) return { label: 'Meta concluída', late: false }
  if (d < 0) return { label: `Prazo vencido há ${-d} dia${d === -1 ? '' : 's'}`, late: true }
  if (d === 0) return { label: 'Prazo é hoje', late: false }
  if (d === 1) return { label: 'Falta 1 dia', late: false }
  return { label: `Faltam ${d} dias`, late: false }
}

export function linkedTasks(g: Goal, tasks: Task[]): Task[] {
  return g.taskIds.map((id) => tasks.find((t) => t.id === id)).filter((t): t is Task => !!t)
}

export function linkedHabits(g: Goal, habits: Habit[]): Habit[] {
  return g.habitIds.map((id) => habits.find((h) => h.id === id)).filter((h): h is Habit => !!h)
}
