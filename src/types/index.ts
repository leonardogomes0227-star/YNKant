/** Data no formato yyyy-MM-dd (fuso local). */
export type DateKey = string
/** Horário no formato HH:mm. */
export type TimeStr = string

export type Priority = 'low' | 'medium' | 'high'
export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  description: string
  dueDate: DateKey | null
  priority: Priority
  category: string
  subtasks: Subtask[]
  repeat: Repeat
  done: boolean
  completedAt: string | null
  order: number
  createdAt: string
  sample?: boolean
}

export type HabitKind = 'check' | 'count'

export interface Habit {
  id: string
  name: string
  kind: HabitKind
  /** Quantidade diária para considerar concluído (1 em hábitos sim/não). */
  target: number
  unit: string
  /** Dias da semana em que vale (0 = domingo … 6 = sábado). */
  days: number[]
  /** Meta opcional em texto livre (ex.: "30 min por dia"). */
  note: string
  log: Record<DateKey, number>
  createdAt: DateKey
  sample?: boolean
}

export interface RoutineBlock {
  id: string
  title: string
  start: TimeStr
  end: TimeStr
  color: string
  category: string
  /** Dias da semana em que o bloco se aplica (0 = domingo … 6 = sábado). */
  days: number[]
  sample?: boolean
}

export interface Note {
  id: string
  title: string
  body: string
  tags: string[]
  pinned: boolean
  createdAt: string
  updatedAt: string
  sample?: boolean
}

export interface JournalEntry {
  mood: number | null
  how: string
  good: [string, string, string]
  improve: string
  sample?: boolean
}

export interface Milestone {
  id: string
  title: string
  done: boolean
}

export interface Goal {
  id: string
  title: string
  description: string
  deadline: DateKey | null
  progress: number
  autoProgress: boolean
  milestones: Milestone[]
  taskIds: string[]
  habitIds: string[]
  createdAt: string
  sample?: boolean
}

export interface FocusSession {
  id: string
  startedAt: string
  date: DateKey
  seconds: number
  taskId: string | null
  sample?: boolean
}

export interface WeeklyReview {
  priorities: string
  reflection: string
}

export type ThemePref = 'system' | 'dark' | 'light'

export interface Settings {
  theme: ThemePref
  name: string
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakEvery: number
  sound: boolean
}

export type TimerMode = 'focus' | 'short' | 'long'

export interface TimerState {
  mode: TimerMode
  running: boolean
  /** Timestamp (ms) em que o ciclo termina, quando está rodando. */
  endsAt: number | null
  /** Segundos restantes, quando pausado. */
  remaining: number
  /** Início do ciclo atual (ms), para registrar a sessão. */
  startedAt: number | null
  taskId: string | null
  /** Focos concluídos desde a última pausa longa. */
  cycles: number
}

/** Tudo o que é salvo e exportado. */
export interface AppData {
  tasks: Task[]
  habits: Habit[]
  routine: RoutineBlock[]
  routineLog: Record<DateKey, string[]>
  notes: Note[]
  journal: Record<DateKey, JournalEntry>
  goals: Goal[]
  focusSessions: FocusSession[]
  reviews: Record<DateKey, WeeklyReview>
  categories: string[]
  settings: Settings
  timer: TimerState
  samplesLoaded: boolean
}

export type RouteId =
  | 'hoje'
  | 'tarefas'
  | 'rotina'
  | 'habitos'
  | 'foco'
  | 'notas'
  | 'metas'
  | 'revisao'
  | 'ajustes'
