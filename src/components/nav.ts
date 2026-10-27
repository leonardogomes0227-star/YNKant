import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckSquare,
  Droplets,
  Dumbbell,
  Flame,
  Moon,
  NotebookPen,
  Settings,
  ShoppingCart,
  Sun,
  Target,
  Timer,
  Utensils,
  Wallet,
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

/** Ferramentas extras (menu "Mais"), em grupos. */
export const EXTRA_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Saúde e corpo',
    items: [
      { id: 'treino', label: 'Treino', icon: Dumbbell, hint: 'Monte treinos, registre as séries e veja sua evolução' },
      { id: 'alimentacao', label: 'Alimentação', icon: Utensils, hint: 'Refeições, calorias e proteína do dia' },
      { id: 'agua', label: 'Água', icon: Droplets, hint: 'Conte os copos e bata a meta do dia' },
      { id: 'sono', label: 'Sono', icon: Moon, hint: 'Quantas horas você dormiu e como foi' },
    ],
  },
  {
    title: 'Mente e foco',
    items: [
      { id: 'foco', label: 'Foco', icon: Timer, hint: 'Cronômetro para estudar ou trabalhar sem distração' },
      { id: 'leitura', label: 'Leitura', icon: BookOpen, hint: 'Seus livros e quantas páginas você já leu' },
      { id: 'notas', label: 'Notas', icon: NotebookPen, hint: 'Anotações rápidas e diário do dia' },
      { id: 'metas', label: 'Metas', icon: Target, hint: 'Objetivos maiores, com prazo e etapas' },
      { id: 'revisao', label: 'Revisão da semana', icon: BarChart3, hint: 'Veja o que você fez e planeje a próxima' },
    ],
  },
  {
    title: 'Vida prática',
    items: [
      { id: 'gastos', label: 'Gastos', icon: Wallet, hint: 'Anote o que gastou e veja o total do mês' },
      { id: 'compras', label: 'Compras', icon: ShoppingCart, hint: 'Lista de compras para riscar no mercado' },
    ],
  },
]

export const EXTRA: NavItem[] = EXTRA_GROUPS.flatMap((g) => g.items)

export const SETTINGS_NAV: NavItem = { id: 'ajustes', label: 'Ajustes', icon: Settings }
