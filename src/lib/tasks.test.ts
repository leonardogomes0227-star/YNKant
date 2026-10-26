import { describe, expect, it } from 'vitest'
import { inView, isOverdue } from './tasks'
import type { Task } from '../types'

const TODAY = '2026-10-26'
const base: Task = {
  id: '1',
  title: 't',
  description: '',
  dueDate: null,
  priority: 'medium',
  category: '',
  subtasks: [],
  repeat: 'none',
  done: false,
  completedAt: null,
  order: 1,
  createdAt: '',
}

describe('visões de tarefas', () => {
  it('caixa de entrada: sem data e não concluída', () => {
    expect(inView(base, 'inbox', TODAY)).toBe(true)
    expect(inView({ ...base, dueDate: TODAY }, 'inbox', TODAY)).toBe(false)
    expect(inView({ ...base, done: true, completedAt: 'x' }, 'inbox', TODAY)).toBe(false)
  })

  it('hoje inclui as concluídas de hoje', () => {
    expect(inView({ ...base, dueDate: TODAY }, 'today', TODAY)).toBe(true)
    expect(inView({ ...base, dueDate: TODAY, done: true, completedAt: 'x' }, 'today', TODAY)).toBe(true)
    expect(inView({ ...base, dueDate: '2026-10-27' }, 'today', TODAY)).toBe(false)
  })

  it('próximos 7 dias: de hoje até hoje+6', () => {
    expect(inView({ ...base, dueDate: '2026-11-01' }, 'week', TODAY)).toBe(true)
    expect(inView({ ...base, dueDate: '2026-11-02' }, 'week', TODAY)).toBe(false)
    expect(inView({ ...base, dueDate: '2026-10-25' }, 'week', TODAY)).toBe(false)
  })

  it('atrasadas: data passada e aberta', () => {
    expect(isOverdue({ ...base, dueDate: '2026-10-25' }, TODAY)).toBe(true)
    expect(isOverdue({ ...base, dueDate: TODAY }, TODAY)).toBe(false)
    expect(isOverdue({ ...base, dueDate: '2026-10-25', done: true }, TODAY)).toBe(false)
    expect(isOverdue(base, TODAY)).toBe(false)
  })
})
