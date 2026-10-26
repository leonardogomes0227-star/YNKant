import { describe, expect, it } from 'vitest'
import { parseTags } from './tags'

describe('parseTags', () => {
  it('normaliza, remove # e duplicados', () => {
    expect(parseTags('Ideias, #Trabalho; ideias,  ')).toEqual(['ideias', 'trabalho'])
    expect(parseTags('')).toEqual([])
  })
})
