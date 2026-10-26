import { create } from 'zustand'
import type { RouteId, Task } from '../types'

/** `id: 'new'` abre o editor para criar um item novo. */
export type OpenTarget = { kind: 'task' | 'note' | 'goal'; id: string; defaults?: Partial<Task> } | null

interface Toast {
  id: number
  text: string
}

interface UI {
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

export const ROUTES: RouteId[] = ['hoje', 'tarefas', 'rotina', 'habitos', 'foco', 'notas', 'metas', 'revisao', 'ajustes']

export function parseRoute(hash: string): RouteId {
  const id = hash.replace(/^#\/?/, '').split(/[/?]/)[0] as RouteId
  return ROUTES.includes(id) ? id : 'hoje'
}

export function go(route: RouteId) {
  if (location.hash !== `#/${route}`) location.hash = `/${route}`
}
