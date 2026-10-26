import { useEffect, type ComponentType } from 'react'
import { Layout } from './components/Layout'
import { LoginScreen } from './components/LoginScreen'
import { QuickCaptureDialog } from './components/QuickCapture'
import { SearchDialog } from './components/SearchDialog'
import { Toasts } from './components/ui'
import { ExpensesView } from './features/expenses/ExpensesView'
import { ShoppingView } from './features/shopping/ShoppingView'
import { useReminders } from './features/reminders/useReminders'
import { useFocusTicker } from './features/focus/useFocusTicker'
import { FocusView } from './features/focus/FocusView'
import { NotesView } from './features/notes/NotesView'
import { GoalsView } from './features/goals/GoalsView'
import { ReviewView } from './features/review/ReviewView'
import { GoalEditorHost } from './features/goals/GoalEditor'
import { NoteEditorHost } from './features/notes/NoteEditor'
import { TaskEditorHost } from './features/tasks/TaskEditor'
import { TodayView } from './features/today/TodayView'
import { TasksView } from './features/tasks/TasksView'
import { RoutineView } from './features/routine/RoutineView'
import { HabitsView } from './features/habits/HabitsView'
import { SettingsView } from './features/settings/SettingsView'
import { useRoute } from './lib/useRoute'
import { useThemeEffect } from './lib/useTheme'
import { useCloud } from './store/cloud'
import { useUI } from './store/ui'
import type { RouteId } from './types'

const VIEWS: Record<RouteId, ComponentType> = {
  hoje: TodayView,
  tarefas: TasksView,
  rotina: RoutineView,
  habitos: HabitsView,
  foco: FocusView,
  notas: NotesView,
  metas: GoalsView,
  revisao: ReviewView,
  gastos: ExpensesView,
  compras: ShoppingView,
  ajustes: SettingsView,
}

function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

export default function App() {
  const route = useRoute()
  const { toasts, dismissToast, setSearchOpen, setCaptureOpen } = useUI()
  useThemeEffect()
  useFocusTicker()
  useReminders()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target)) {
        if (document.querySelector('dialog[open]')) return
        e.preventDefault()
        setCaptureOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSearchOpen, setCaptureOpen])

  const cloud = useCloud((s) => s.status)
  if (cloud === 'checking') return <div className="grid min-h-dvh place-items-center text-muted">Carregando…</div>
  if (cloud === 'signedOut') return <LoginScreen />

  const View = VIEWS[route]
  return (
    <>
      <Layout>
        <View />
      </Layout>
      <SearchDialog />
      <QuickCaptureDialog />
      <TaskEditorHost />
      <NoteEditorHost />
      <GoalEditorHost />
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
