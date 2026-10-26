import { describe, expect, it } from 'vitest'
import { backupFileName, buildBackup, parseBackup } from './backup'
import { emptyData } from '../store/defaults'
import { DATA_VERSION, normalizeData } from '../store/migrations'

describe('backup', () => {
  it('exporta e importa sem perder dados (ida e volta)', () => {
    const data = emptyData()
    data.tasks.push({
      id: 't1', title: 'Teste', description: '', dueDate: '2026-10-26', time: null, priority: 'high', category: 'Casa',
      subtasks: [{ id: 's', title: 'x', done: true }], repeat: 'weekly', done: false, completedAt: null, order: 1, createdAt: 'x',
    })
    data.journal['2026-10-26'] = { mood: 4, how: 'ok', good: ['a', 'b', 'c'], improve: 'd' }
    const out = parseBackup(JSON.stringify(buildBackup(data)))
    expect(out.ok).toBe(true)
    if (out.ok) expect(out.data).toEqual(normalizeData(data))
  })

  it('rejeita JSON inválido, arquivo de outro app e versão futura', () => {
    expect(parseBackup('{oops').ok).toBe(false)
    expect(parseBackup('{"app":"outro","version":1,"data":{}}').ok).toBe(false)
    const future = parseBackup(JSON.stringify({ app: 'meu-dia', version: DATA_VERSION + 1, data: {} }))
    expect(future.ok).toBe(false)
  })

  it('preenche campos que faltam em dados antigos', () => {
    const out = parseBackup(JSON.stringify({ app: 'meu-dia', version: 1, data: { tasks: [{ id: 'a', title: 'Só título' }] } }))
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.data.tasks[0].priority).toBe('medium')
      expect(out.data.tasks[0].subtasks).toEqual([])
      expect(out.data.settings.focusMinutes).toBe(25)
      expect(out.data.categories.length).toBeGreaterThan(0)
    }
  })

  it('descarta itens sem id/título', () => {
    const d = normalizeData({ tasks: [{ id: 'a' }, { title: 'sem id' }, 'lixo', null] })
    expect(d.tasks).toHaveLength(0)
  })

  it('nome do arquivo usa a data', () => {
    expect(backupFileName(new Date(2026, 9, 26))).toBe('meu-dia-backup-2026-10-26.json')
  })
})
