import type { DateKey, Priority, Task } from '../types'
import { formatBR, shiftKey } from './dates'

export type TaskView = 'inbox' | 'today' | 'week' | 'overdue' | 'done'

export const PRIORITY_LABEL: Record<Priority, string> = { low: 'Baixa', medium: 'Média', high: 'Alta' }
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export function isOverdue(t: Task, today: DateKey): boolean {
  return !t.done && t.dueDate !== null && t.dueDate < today
}

export function inView(t: Task, view: TaskView, today: DateKey): boolean {
  switch (view) {
    case 'inbox':
      return !t.done && t.dueDate === null
    case 'today':
      return t.dueDate === today && (!t.done || t.completedAt !== null)
    case 'week':
      return !t.done && t.dueDate !== null && t.dueDate >= today && t.dueDate <= shiftKey(today, 6)
    case 'overdue':
      return isOverdue(t, today)
    case 'done':
      return t.done
  }
}

export function byOrder(a: Task, b: Task): number {
  return a.order - b.order
}

/** Ordena por data, depois prioridade, depois ordem manual (para listas agrupadas por dia). */
export function byDateThenPriority(a: Task, b: Task): number {
  return (
    (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    a.order - b.order
  )
}

export function subtaskProgress(t: Task): { done: number; total: number } {
  return { done: t.subtasks.filter((s) => s.done).length, total: t.subtasks.length }
}

export function dueLabel(due: string, today: string): string {
  if (due === today) return 'Hoje'
  if (due === shiftKey(today, 1)) return 'Amanhã'
  if (due === shiftKey(today, -1)) return 'Ontem'
  return formatBR(due)
}
