import { useEffect, type ComponentType } from 'react'
import { Layout } from './components/Layout'
import { QuickCaptureDialog } from './components/QuickCapture'
import { SearchDialog } from './components/SearchDialog'
import { Toasts } from './components/ui'
import { useFocusTicker } from './features/focus/useFocusTicker'
import { TaskEditorHost } from './features/tasks/TaskEditor'
import { GoalEditorHost } from './features/goals/GoalEditor'
import { NoteEditorHost } from './features/notes/NoteEditor'
import { TodayView } from './features/today/TodayView'
import { TasksView } from './features/tasks/TasksView'
import { RoutineView } from './features/routine/RoutineView'
import { HabitsView } from './features/habits/HabitsView'
import { FocusView } from './features/focus/FocusView'
import { NotesView } from './features/notes/NotesView'
import { GoalsView } from './features/goals/GoalsView'
import { ReviewView } from './features/review/ReviewView'
import { SettingsView } from './features/settings/SettingsView'
import { useRoute } from './lib/useRoute'
import { useThemeEffect } from './lib/useTheme'
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
