import { describe, expect, it } from 'vitest'
import { weekSummary } from './review'
import { weekKeys } from './dates'
import type { FocusSession, Habit, Task } from '../types'

const week = weekKeys('2026-10-28') // 26/10 a 01/11
const today = '2026-10-28'

const task = (id: string, completedAt: string | null): Task => ({
  id, title: id, description: '', dueDate: null, priority: 'medium', category: '', subtasks: [],
  repeat: 'none', done: completedAt !== null, completedAt, order: 0, createdAt: '',
})
const habit: Habit = {
  id: 'h', name: 'h', kind: 'check', target: 1, unit: '', days: [1, 2, 3, 4, 5, 6, 0], note: '',
  log: { '2026-10-26': 1, '2026-10-28': 1 }, createdAt: '2026-10-01',
}
const session = (date: string, seconds: number): FocusSession => ({ id: date, startedAt: '', date, seconds, taskId: null })

describe('weekSummary', () => {
  const s = weekSummary(
    {
      tasks: [
        task('a', new Date(2026, 9, 26, 10).toISOString()),
        task('b', new Date(2026, 9, 28, 9).toISOString()),
        task('fora', new Date(2026, 9, 20, 9).toISOString()),
        task('aberta', null),
      ],
      habits: [habit],
      focusSessions: [session('2026-10-26', 1500), session('2026-10-27', 600), session('2026-10-15', 999)],
      journal: { '2026-10-26': { mood: 4, how: '', good: ['', '', ''], improve: '' }, '2026-10-27': { mood: 2, how: '', good: ['', '', ''], improve: '' } },
    },
    week,
    today,
  )

  it('conta tarefas concluídas só da semana', () => {
    expect(s.tasksDone).toBe(2)
    expect(s.days[0].tasks).toBe(1)
  })

  it('hábitos consideram apenas dias até hoje', () => {
    expect(s.habitsScheduled).toBe(3) // seg, ter, qua
    expect(s.habitsDone).toBe(2)
    expect(s.habitRate).toBeCloseTo(2 / 3)
    expect(s.days[5].habitsScheduled).toBe(0) // sábado ainda não chegou
  })

  it('soma foco e calcula humor médio', () => {
    expect(s.focusSeconds).toBe(2100)
    expect(s.moodAvg).toBe(3)
  })

  it('sem humor registrado, média é nula', () => {
    const e = weekSummary({ tasks: [], habits: [], focusSessions: [], journal: {} }, week, today)
    expect(e.moodAvg).toBeNull()
    expect(e.habitRate).toBe(0)
  })
})
