import { describe, expect, it } from 'vitest'
import { matches, searchAll } from './search'
import type { Goal, Note, Task } from '../types'

describe('busca', () => {
  it('ignora acentos e maiúsculas', () => {
    expect(matches('Reunião de Planejamento', 'reuniao')).toBe(true)
    expect(matches('Reunião de Planejamento', 'PLANEJ reun')).toBe(true)
    expect(matches('Reunião', 'viagem')).toBe(false)
  })

  it('acha tarefas, notas e metas', () => {
    const data = {
      tasks: [{ id: 't', title: 'Comprar café', description: '', category: '', done: false }] as unknown as Task[],
      notes: [{ id: 'n', title: 'Receitas', body: 'bolo de café', tags: [] }] as unknown as Note[],
      goals: [{ id: 'g', title: 'Beber menos café', description: '' }] as unknown as Goal[],
    }
    expect(searchAll(data, 'cafe').map((h) => h.kind)).toEqual(['task', 'note', 'goal'])
    expect(searchAll(data, '  ')).toEqual([])
  })
})
