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
  /** Horário opcional (HH:mm): a tarefa gera um lembrete nesse horário. */
  time: TimeStr | null
  priority: Priority
  category: string
  subtasks: Subtask[]
  repeat: Repeat
  done: boolean
  completedAt: string | null
  order: number
  createdAt: string
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
}

export interface Note {
  id: string
  title: string
  body: string
  tags: string[]
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface JournalEntry {
  mood: number | null
  how: string
  good: [string, string, string]
  improve: string
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
}

export interface FocusSession {
  id: string
  startedAt: string
  date: DateKey
  seconds: number
  taskId: string | null
}

export interface Expense {
  id: string
  type: 'out' | 'in'
  /** Valor em reais (positivo). */
  amount: number
  category: string
  note: string
  date: DateKey
  createdAt: string
}

export interface ShopItem {
  id: string
  name: string
  done: boolean
  createdAt: string
}

export type MealType = 'cafe' | 'almoco' | 'lanche' | 'jantar'

export interface Meal {
  id: string
  date: DateKey
  type: MealType
  note: string
  /** Calorias, opcional. */
  kcal: number | null
  /** Macros em gramas, opcionais. */
  protein: number | null
  carbs: number | null
  fat: number | null
  createdAt: string
}

export interface TemplateExercise {
  id: string
  name: string
  /** Meta: séries × repetições, carga opcional (kg). */
  sets: number
  reps: number
  kg: number | null
}

export interface WorkoutTemplate {
  id: string
  name: string
  exercises: TemplateExercise[]
}

export interface LoggedSet {
  reps: number
  kg: number
  done: boolean
}

export interface LoggedExercise {
  id: string
  name: string
  sets: LoggedSet[]
}

export interface WorkoutLog {
  id: string
  date: DateKey
  templateId: string | null
  name: string
  durationMin: number | null
  exercises: LoggedExercise[]
  note: string
  createdAt: string
}

/** Treino em andamento (fica salvo, para não perder se você sair do app). */
export interface ActiveWorkout {
  startedAt: number
  log: WorkoutLog
}

export interface BodyEntry {
  id: string
  date: DateKey
  kg: number
  waistCm: number | null
}

export interface SleepEntry {
  hours: number
  /** Qualidade de 1 a 5. */
  quality: number | null
}

export type BookStatus = 'lendo' | 'quero' | 'lido'

export interface Book {
  id: string
  title: string
  author: string
  totalPages: number
  pagesRead: number
  status: BookStatus
  finishedAt: DateKey | null
  createdAt: string
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
  /** Avisar no horário das tarefas com hora marcada. */
  remindTasks: boolean
  /** Avisar quando um bloco da rotina começa. */
  remindBlocks: boolean
  /** Meta diária de água, em ml. */
  waterGoalMl: number
  /** Tamanho de um copo, em ml. */
  waterCupMl: number
  /** Meta de calorias por dia (0 = sem meta). */
  kcalGoal: number
  /** Meta de proteína por dia, em g (0 = sem meta). */
  proteinGoal: number
  /** Meta de horas de sono por noite. */
  sleepGoalH: number
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
  expenses: Expense[]
  shopping: ShopItem[]
  /** Água bebida por dia, em ml. */
  water: Record<DateKey, number>
  meals: Meal[]
  workouts: WorkoutTemplate[]
  workoutLogs: WorkoutLog[]
  activeWorkout: ActiveWorkout | null
  body: BodyEntry[]
  sleep: Record<DateKey, SleepEntry>
  books: Book[]
  focusSessions: FocusSession[]
  reviews: Record<DateKey, WeeklyReview>
  categories: string[]
  settings: Settings
  timer: TimerState
}

export type RouteId = 'hoje' | 'tarefas' | 'rotina' | 'habitos' | 'foco' | 'notas' | 'metas' | 'revisao' | 'gastos' | 'compras' | 'agua' | 'alimentacao' | 'treino' | 'sono' | 'leitura' | 'ajustes'
