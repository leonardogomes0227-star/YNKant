import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { initialSyncAction } from '../lib/syncRules'
import { emptyData } from './defaults'
import { normalizeData } from './migrations'
import { pickData, useStore } from './useStore'

export type CloudStatus = 'off' | 'checking' | 'signedOut' | 'ready'
export type SyncState = 'idle' | 'saving' | 'saved' | 'offline'

interface Cloud {
  status: CloudStatus
  email: string | null
  sync: SyncState
}

export const useCloud = create<Cloud>()(() => ({
  status: supabase ? 'checking' : 'off',
  email: null,
  sync: 'idle',
}))

const set = (p: Partial<Cloud>) => useCloud.setState(p)

let userId: string | null = null
let active = false // só envia depois da primeira sincronização
let lastJson = '' // último estado confirmado na nuvem
let seenAt = '' // updated_at da nuvem que já aplicamos
let timer: ReturnType<typeof setTimeout> | undefined
let unsubscribe: (() => void) | undefined

const snapshot = () => JSON.stringify(pickData(useStore.getState()))

async function push(): Promise<boolean> {
  if (!supabase || !userId || !active) return false
  const json = snapshot()
  if (json === lastJson) {
    set({ sync: 'saved' })
    return true
  }
  set({ sync: 'saving' })
  const updated_at = new Date().toISOString()
  const { error } = await supabase.from('app_data').upsert({ user_id: userId, data: JSON.parse(json), updated_at })
  if (error) {
    set({ sync: 'offline' })
    return false
  }
  lastJson = json
  seenAt = updated_at
  set({ sync: 'saved' })
  return true
}

function schedulePush() {
  if (!active) return
  clearTimeout(timer)
  set({ sync: 'saving' })
  timer = setTimeout(() => void push(), 1200)
}

/** Busca a nuvem; aplica se houver versão mais nova e não houver alterações não enviadas. */
async function pull(first: boolean) {
  if (!supabase || !userId) return
  const { data: row, error } = await supabase
    .from('app_data')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    set({ sync: 'offline' })
    return
  }
  if (first) {
    if (initialSyncAction(!!row) === 'upload-local') {
      active = true
      lastJson = ''
      await push()
      return
    }
  }
  if (!row) return
  const unsent = active && snapshot() !== lastJson
  if (row.updated_at === seenAt || unsent) {
    active = true
    return
  }
  useStore.getState().replaceAll(normalizeData(row.data))
  lastJson = snapshot()
  seenAt = row.updated_at
  active = true
  set({ sync: 'saved' })
}

async function onSession(session: Session | null) {
  if (!session) {
    userId = null
    active = false
    unsubscribe?.()
    unsubscribe = undefined
    set({ status: 'signedOut', email: null, sync: 'idle' })
    return
  }
  if (userId === session.user.id && active) return
  userId = session.user.id
  set({ status: 'ready', email: session.user.email ?? null, sync: 'saving' })
  await pull(true)
  unsubscribe?.()
  unsubscribe = useStore.subscribe(schedulePush)
}

export function initCloud() {
  if (!supabase) return
  void supabase.auth.getSession().then(({ data }) => onSession(data.session))
  supabase.auth.onAuthStateChange((_event, session) => void onSession(session))
  const refresh = () => {
    if (document.visibilityState === 'visible' && active) void pull(false)
  }
  document.addEventListener('visibilitychange', refresh)
  window.addEventListener('online', () => {
    if (active) void push().then(() => pull(false))
  })
}

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Login indisponível.'
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? error.message : null
}

/** Devolve erro, ou 'confirm' se o Supabase pediu confirmação por e-mail. */
export async function signUp(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Login indisponível.'
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return error.message
  return data.session ? null : 'confirm'
}

export async function syncNow() {
  if (!active) return
  await push()
  await pull(false)
}

/** Só sai depois de garantir que tudo foi para a nuvem; depois apaga os dados deste aparelho. */
export async function signOut(): Promise<string | null> {
  if (!supabase) return null
  clearTimeout(timer)
  if (active && !(await push())) return 'Não deu para salvar na nuvem agora. Conecte à internet e tente sair de novo, para não perder dados.'
  await supabase.auth.signOut()
  useStore.getState().replaceAll(emptyData())
  lastJson = ''
  seenAt = ''
  return null
}
