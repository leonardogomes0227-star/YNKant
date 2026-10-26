import { CalendarClock, CheckSquare, Flame, Settings, Sun, type LucideIcon } from 'lucide-react'
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
]

export const SETTINGS_NAV: NavItem = { id: 'ajustes', label: 'Ajustes', icon: Settings }
