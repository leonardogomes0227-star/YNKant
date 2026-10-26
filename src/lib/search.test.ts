import { describe, expect, it } from 'vitest'
import { matches, searchTasks } from './search'
import type { Task } from '../types'

const task = (id: string, title: string, done = false) =>
  ({ id, title, description: '', category: '', done, dueDate: null }) as unknown as Task

describe('busca', () => {
  it('ignora acentos e maiúsculas', () => {
    expect(matches('Reunião de Planejamento', 'reuniao')).toBe(true)
    expect(matches('Reunião de Planejamento', 'PLANEJ reun')).toBe(true)
    expect(matches('Reunião', 'viagem')).toBe(false)
  })

  it('acha tarefas pelo título', () => {
    const tasks = [task('1', 'Comprar café'), task('2', 'Ligar para o banco', true)]
    expect(searchTasks(tasks, 'cafe').map((h) => h.id)).toEqual(['1'])
    expect(searchTasks(tasks, 'banco')[0].detail).toBe('Concluída')
    expect(searchTasks(tasks, '  ')).toEqual([])
  })
})
