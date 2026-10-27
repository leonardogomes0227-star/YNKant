import type {
  AppData,
  Goal,
  Habit,
  Note,
  RoutineBlock,
  Settings,
  Task,
  TimerState,
} from '../types'
import { todayKey } from '../lib/dates'

export const DEFAULT_CATEGORIES = ['Pessoal', 'Trabalho', 'Estudos', 'Saúde', 'Casa', 'Finanças']

export const defaultSettings: Settings = {
  theme: 'dark',
  name: '',
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  sound: true,
  remindTasks: true,
  remindBlocks: false,
  waterGoalMl: 2000,
  waterCupMl: 250,
}

export function freshTimer(settings: Settings = defaultSettings): TimerState {
  return {
    mode: 'focus',
    running: false,
    endsAt: null,
    remaining: settings.focusMinutes * 60,
    startedAt: null,
    taskId: null,
    cycles: 0,
  }
}

export function emptyData(): AppData {
  return {
    tasks: [],
    habits: [],
    routine: [],
    routineLog: {},
    notes: [],
    journal: {},
    goals: [],
    expenses: [],
    shopping: [],
    water: {},
    meals: [],
    focusSessions: [],
    reviews: {},
    categories: [...DEFAULT_CATEGORIES],
    settings: { ...defaultSettings },
    timer: freshTimer(),
  }
}

// Valores padrão por item: ao carregar dados antigos/importados, campos
// ausentes recebem estes valores (facilita evoluir o modelo).
export const taskDefaults: Omit<Task, 'id' | 'title'> = {
  description: '',
  dueDate: null,
  time: null,
  priority: 'medium',
  category: '',
  subtasks: [],
  repeat: 'none',
  done: false,
  completedAt: null,
  order: 0,
  createdAt: new Date(0).toISOString(),
}

export const habitDefaults: Omit<Habit, 'id' | 'name'> = {
  kind: 'check',
  target: 1,
  unit: '',
  days: [0, 1, 2, 3, 4, 5, 6],
  note: '',
  log: {},
  createdAt: todayKey(),
}

export const blockDefaults: Omit<RoutineBlock, 'id' | 'title'> = {
  start: '09:00',
  end: '10:00',
  color: 'brass',
  category: '',
  days: [1, 2, 3, 4, 5],
}

export const noteDefaults: Omit<Note, 'id'> = {
  title: '',
  body: '',
  tags: [],
  pinned: false,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
}

export const goalDefaults: Omit<Goal, 'id' | 'title'> = {
  description: '',
  deadline: null,
  progress: 0,
  autoProgress: false,
  milestones: [],
  taskIds: [],
  habitIds: [],
  createdAt: new Date(0).toISOString(),
}
