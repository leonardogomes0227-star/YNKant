import type { AppData } from '../types'

export function isEmptyData(d: AppData): boolean {
  return (
    d.tasks.length === 0 &&
    d.habits.length === 0 &&
    d.routine.length === 0 &&
    d.notes.length === 0 &&
    d.goals.length === 0
  )
}

/**
 * Primeira sincronização depois de entrar na conta:
 * - nuvem vazia → envia o que está no aparelho;
 * - nuvem com dados → a nuvem vence (é a fonte de verdade).
 */
export function initialSyncAction(cloudRowExists: boolean): 'upload-local' | 'use-cloud' {
  return cloudRowExists ? 'use-cloud' : 'upload-local'
}

/** Traduz erros do Supabase Auth para português. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Este e-mail já tem conta. Use “Entrar”.'
  if (m.includes('password') && m.includes('6')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail pelo link que enviamos e tente de novo.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Espere um pouco e tente de novo.'
  if (m.includes('fetch') || m.includes('network')) return 'Sem internet. Conecte e tente de novo.'
  if (m.includes('invalid email') || m.includes('valid email')) return 'Digite um e-mail válido.'
  return 'Não foi possível entrar agora. Tente de novo.'
}
