import { describe, expect, it } from 'vitest'
import { authErrorMessage, initialSyncAction, isEmptyData } from './syncRules'
import { emptyData } from '../store/defaults'

describe('regras de sincronização', () => {
  it('nuvem vazia recebe o que está no aparelho; nuvem com dados vence', () => {
    expect(initialSyncAction(false)).toBe('upload-local')
    expect(initialSyncAction(true)).toBe('use-cloud')
  })

  it('detecta dados vazios', () => {
    const d = emptyData()
    expect(isEmptyData(d)).toBe(true)
    d.tasks.push({ id: '1', title: 'x' } as never)
    expect(isEmptyData(d)).toBe(false)
  })

  it('traduz erros de login', () => {
    expect(authErrorMessage('Invalid login credentials')).toBe('E-mail ou senha incorretos.')
    expect(authErrorMessage('User already registered')).toContain('já tem conta')
    expect(authErrorMessage('coisa estranha')).toContain('Não foi possível')
  })
})
