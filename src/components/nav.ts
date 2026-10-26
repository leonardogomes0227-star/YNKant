import {
  BarChart3,
  CalendarClock,
  CheckSquare,
  Flame,
  NotebookPen,
  Settings,
  Sun,
  Target,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import type { RouteId } from '../types'

export interface NavItem {
  id: RouteId
  label: string
  icon: LucideIcon
}

export const NAV: NavItem[] = [
  { id: 'hoje', label: 'Hoje', icon: Sun },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
  { id: 'rotina', label: 'Rotina', icon: CalendarClock },
  { id: 'habitos', label: 'Hábitos', icon: Flame },
  { id: 'foco', label: 'Foco', icon: Timer },
  { id: 'notas', label: 'Notas', icon: NotebookPen },
  { id: 'metas', label: 'Metas', icon: Target },
  { id: 'revisao', label: 'Revisão semanal', icon: BarChart3 },
]

export const SETTINGS_NAV: NavItem = { id: 'ajustes', label: 'Ajustes', icon: Settings }

/** Itens fixos da barra inferior no celular; o resto vai em "Mais". */
export const MOBILE_MAIN: RouteId[] = ['hoje', 'tarefas', 'rotina', 'habitos', 'foco']
