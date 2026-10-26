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
  /** Frase curta explicando para que serve (aparece no menu "Mais"). */
  hint?: string
}

/** As quatro telas principais (barra de baixo no celular). */
export const NAV: NavItem[] = [
  { id: 'hoje', label: 'Hoje', icon: Sun },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
  { id: 'rotina', label: 'Rotina', icon: CalendarClock },
  { id: 'habitos', label: 'Hábitos', icon: Flame },
]

/** Ferramentas extras (menu "Mais"). */
export const EXTRA: NavItem[] = [
  { id: 'foco', label: 'Foco', icon: Timer, hint: 'Cronômetro para estudar ou trabalhar sem distração' },
  { id: 'notas', label: 'Notas', icon: NotebookPen, hint: 'Anotações rápidas e diário do dia' },
  { id: 'metas', label: 'Metas', icon: Target, hint: 'Objetivos maiores, com prazo e etapas' },
  { id: 'revisao', label: 'Revisão da semana', icon: BarChart3, hint: 'Veja o que você fez e planeje a próxima' },
]

export const SETTINGS_NAV: NavItem = { id: 'ajustes', label: 'Ajustes', icon: Settings }
