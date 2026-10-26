import { describe, expect, it } from 'vitest'
import { maskDate, parseBR } from './dateInput'

describe('campo de data dd/mm/aaaa', () => {
  it('aplica a máscara enquanto digita', () => {
    expect(maskDate('2')).toBe('2')
    expect(maskDate('261')).toBe('26/1')
    expect(maskDate('26102026')).toBe('26/10/2026')
    expect(maskDate('26/10/2026999')).toBe('26/10/2026')
    expect(maskDate('ab26')).toBe('26')
  })

  it('converte para yyyy-MM-dd e rejeita datas inválidas', () => {
    expect(parseBR('26/10/2026')).toBe('2026-10-26')
    expect(parseBR('29/02/2028')).toBe('2028-02-29')
    expect(parseBR('31/02/2026')).toBeNull()
    expect(parseBR('26/13/2026')).toBeNull()
    expect(parseBR('26/10/26')).toBeNull()
    expect(parseBR('')).toBeNull()
  })
})
