import { create } from 'zustand'
import type { RouteId, Task } from '../types'

/** `id: 'new'` abre o editor para criar um item novo. */
export type OpenTarget = { kind: 'task' | 'note' | 'goal'; id: string; defaults?: Partial<Task> } | null

export const ROUTES: RouteId[] = ['hoje', 'tarefas', 'rotina', 'habitos', 'foco', 'notas', 'metas', 'revisao', 'gastos', 'compras', 'ajustes']

export function parseRoute(hash: string): RouteId {
  const id = hash.replace(/^#\/?/, '').split(/[/?]/)[0] as RouteId
  return ROUTES.includes(id) ? id : 'hoje'
}

interface Toast {
  id: number
  text: string
}

interface UI {
  /** Aba atual. Fica no app (a URL é só um complemento), então funciona mesmo se o navegador bloquear o #. */
  route: RouteId
  searchOpen: boolean
  captureOpen: boolean
  moreOpen: boolean
  /** Item a abrir assim que a tela de destino montar (vindo da busca global). */
  pendingOpen: OpenTarget
  toasts: Toast[]
  setSearchOpen: (v: boolean) => void
  setCaptureOpen: (v: boolean) => void
  setMoreOpen: (v: boolean) => void
  openItem: (t: OpenTarget) => void
  toast: (text: string) => void
  dismissToast: (id: number) => void
}

let toastSeq = 0

export const useUI = create<UI>()((set) => ({
  route: parseRoute(typeof location === 'undefined' ? '' : location.hash),
  searchOpen: false,
  captureOpen: false,
  moreOpen: false,
  pendingOpen: null,
  toasts: [],
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setCaptureOpen: (captureOpen) => set({ captureOpen }),
  setMoreOpen: (moreOpen) => set({ moreOpen }),
  openItem: (pendingOpen) => set({ pendingOpen }),
  toast: (text) => {
    const id = ++toastSeq
    set((s) => ({ toasts: [...s.toasts, { id, text }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Troca de aba: atualiza o app primeiro e a URL depois (se o navegador permitir). */
export function go(route: RouteId) {
  useUI.setState({ route })
  try {
    if (location.hash !== `#/${route}`) history.pushState(null, '', `#/${route}`)
  } catch {
    /* navegador/visualizador sem acesso à URL: a aba já mudou no app */
  }
  window.scrollTo(0, 0)
}

if (typeof window !== 'undefined') {
  const sync = () => useUI.setState({ route: parseRoute(location.hash) })
  window.addEventListener('hashchange', sync)
  window.addEventListener('popstate', sync)
}
