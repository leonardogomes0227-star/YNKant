import { describe, expect, it } from 'vitest'
import { dueReminders } from './reminders'
import type { RoutineBlock, Task } from '../types'

const at = (h: number, m: number) => new Date(2026, 9, 26, h, m) // segunda, 26/10/2026
const task = (over: Partial<Task>) =>
  ({ id: 't1', title: 'Pagar a luz', dueDate: '2026-10-26', time: '14:00', done: false, ...over }) as Task
const block: RoutineBlock = { id: 'b1', title: 'Academia', start: '18:00', end: '19:00', color: 'brass', category: '', days: [1] }
const base = { routine: [block], reminded: {}, tasksOn: true, blocksOn: false }

describe('lembretes', () => {
  it('avisa a tarefa no horário e até 10 minutos depois', () => {
    expect(dueReminders({ ...base, tasks: [task({})], now: at(13, 59) })).toHaveLength(0)
    expect(dueReminders({ ...base, tasks: [task({})], now: at(14, 0) })).toHaveLength(1)
    expect(dueReminders({ ...base, tasks: [task({})], now: at(14, 9) })).toHaveLength(1)
    expect(dueReminders({ ...base, tasks: [task({})], now: at(14, 10) })).toHaveLength(0)
  })

  it('não repete o que já foi avisado, nem tarefas feitas ou de outro dia', () => {
    const [r] = dueReminders({ ...base, tasks: [task({})], now: at(14, 1) })
    expect(dueReminders({ ...base, tasks: [task({})], now: at(14, 2), reminded: { [r.key]: true } })).toHaveLength(0)
    expect(dueReminders({ ...base, tasks: [task({ done: true })], now: at(14, 1) })).toHaveLength(0)
    expect(dueReminders({ ...base, tasks: [task({ dueDate: '2026-10-27' })], now: at(14, 1) })).toHaveLength(0)
    expect(dueReminders({ ...base, tasks: [task({ time: null })], now: at(14, 1) })).toHaveLength(0)
  })

  it('avisa o início de blocos da rotina só se ativado', () => {
    expect(dueReminders({ ...base, tasks: [], now: at(18, 0) })).toHaveLength(0)
    const r = dueReminders({ ...base, tasks: [], now: at(18, 0), blocksOn: true })
    expect(r).toHaveLength(1)
    expect(r[0].title).toBe('Academia')
  })

  it('respeita o interruptor de tarefas', () => {
    expect(dueReminders({ ...base, tasks: [task({})], now: at(14, 0), tasksOn: false })).toHaveLength(0)
  })
})
