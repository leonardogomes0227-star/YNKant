import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppData,
  DateKey,
  FocusSession,
  ActiveWorkout,
  Book,
  Expense,
  Goal,
  Habit,
  JournalEntry,
  Meal,
  SleepEntry,
  WorkoutLog,
  WorkoutTemplate,
  Note,
  RoutineBlock,
  Settings,
  ShopItem,
  Task,
  TimerMode,
  WeeklyReview,
} from '../types'
import { nextOccurrence, todayKey } from '../lib/dates'
import { uid } from '../lib/id'
import { copyDayBlocks } from '../lib/routine'
import { blockDefaults, emptyData, freshTimer, goalDefaults, habitDefaults, noteDefaults, taskDefaults } from './defaults'
import { DATA_VERSION, migrate, normalizeData } from './migrations'

export function modeSeconds(s: Settings, mode: TimerMode): number {
  const min = mode === 'focus' ? s.focusMinutes : mode === 'short' ? s.shortBreakMinutes : s.longBreakMinutes
  return Math.max(1, min) * 60
}

type NewTask = Partial<Omit<Task, 'id' | 'createdAt' | 'order'>> & { title: string }

interface Actions {
  addTask: (t: NewTask) => string
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  reorderTasks: (orderedIds: string[]) => void

  addHabit: (h: Partial<Habit> & { name: string }) => string
  updateHabit: (id: string, patch: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  setHabitValue: (id: string, date: DateKey, value: number) => void

  addBlock: (b: Partial<RoutineBlock> & { title: string }) => string
  updateBlock: (id: string, patch: Partial<RoutineBlock>) => void
  deleteBlock: (id: string) => void
  duplicateBlock: (id: string) => void
  copyDay: (from: number, to: number[]) => void
  toggleBlockDone: (date: DateKey, id: string) => void

  addNote: (n?: Partial<Note>) => string
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
  setJournal: (date: DateKey, patch: Partial<JournalEntry>) => void

  addGoal: (g: Partial<Goal> & { title: string }) => string
  updateGoal: (id: string, patch: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  toggleMilestone: (goalId: string, milestoneId: string) => void

  setReview: (week: DateKey, patch: Partial<WeeklyReview>) => void
  addExpense: (e: Omit<Expense, 'id' | 'createdAt'>) => void
  updateExpense: (id: string, patch: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  addShopItem: (name: string) => void
  toggleShopItem: (id: string) => void
  deleteShopItem: (id: string) => void
  clearBoughtItems: () => void
  addWater: (date: DateKey, ml: number) => void
  addMeal: (m: Omit<Meal, 'id' | 'createdAt'>) => void
  deleteMeal: (id: string) => void
  addTemplate: (t: Omit<WorkoutTemplate, 'id'>) => string
  updateTemplate: (id: string, patch: Partial<WorkoutTemplate>) => void
  deleteTemplate: (id: string) => void
  /** Substitui o treino em andamento (ou limpa, com null). */
  setActiveWorkout: (a: ActiveWorkout | null) => void
  /** Guarda o treino em andamento no histórico (só séries marcadas como feitas). Devolve false se nada foi feito. */
  finishWorkout: () => boolean
  deleteWorkoutLog: (id: string) => void
  addBody: (b: { date: DateKey; kg: number; waistCm: number | null }) => void
  deleteBody: (id: string) => void
  setSleep: (date: DateKey, entry: SleepEntry | null) => void
  addBook: (b: Pick<Book, 'title' | 'author' | 'totalPages'> & Partial<Book>) => void
  updateBook: (id: string, patch: Partial<Book>) => void
  deleteBook: (id: string) => void
  addCategory: (name: string) => void
  updateSettings: (patch: Partial<Settings>) => void

  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  setTimerMode: (mode: TimerMode) => void
  setTimerTask: (id: string | null) => void
  /** Encerra o ciclo atual. `natural` = o tempo acabou sozinho. */
  finishTimer: (natural: boolean) => void
  deleteSession: (id: string) => void

  replaceAll: (data: AppData) => void
}

export type Store = AppData & Actions

const DATA_KEYS: (keyof AppData)[] = [
  'tasks',
  'habits',
  'routine',
  'routineLog',
  'notes',
  'journal',
  'goals',
  'expenses',
  'shopping',
  'water',
  'meals',
  'workouts',
  'workoutLogs',
  'activeWorkout',
  'body',
  'sleep',
  'books',
  'focusSessions',
  'reviews',
  'categories',
  'settings',
  'timer',
]

export function pickData(s: AppData): AppData {
  return Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]])) as unknown as AppData
}

const nowIso = () => new Date().toISOString()
const maxOrder = (tasks: Task[]) => tasks.reduce((m, t) => Math.max(m, t.order), 0)

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...emptyData(),

      // ---------- tarefas ----------
      addTask: (t) => {
        const id = uid()
        set((s) => ({
          tasks: [
            ...s.tasks,
            { ...taskDefaults, ...t, id, createdAt: nowIso(), order: maxOrder(s.tasks) + 1 },
          ],
        }))
        return id
      },
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          goals: s.goals.map((g) => ({ ...g, taskIds: g.taskIds.filter((x) => x !== id) })),
          timer: s.timer.taskId === id ? { ...s.timer, taskId: null } : s.timer,
        })),
      toggleTask: (id) =>
        set((s) => {
          const t = s.tasks.find((x) => x.id === id)
          if (!t) return {}
          if (t.done) {
            return {
              tasks: s.tasks.map((x) => (x.id === id ? { ...x, done: false, completedAt: null } : x)),
            }
          }
          const stamp = nowIso()
          if (t.repeat === 'none') {
            return {
              tasks: s.tasks.map((x) => (x.id === id ? { ...x, done: true, completedAt: stamp } : x)),
            }
          }
          // recorrente: registra a conclusão como cópia e reagenda a original
          const today = todayKey()
          let next = nextOccurrence(t.dueDate ?? today, t.repeat)
          while (next <= today) next = nextOccurrence(next, t.repeat)
          const record: Task = {
            ...t,
            id: uid(),
            repeat: 'none',
            done: true,
            completedAt: stamp,
            order: maxOrder(s.tasks) + 1,
          }
          return {
            tasks: [
              ...s.tasks.map((x) =>
                x.id === id
                  ? { ...x, dueDate: next, subtasks: x.subtasks.map((st) => ({ ...st, done: false })) }
                  : x,
              ),
              record,
            ],
          }
        }),
      reorderTasks: (orderedIds) =>
        set((s) => {
          const slots = s.tasks
            .filter((t) => orderedIds.includes(t.id))
            .map((t) => t.order)
            .sort((a, b) => a - b)
          const orderOf = new Map(orderedIds.map((id, i) => [id, slots[i]]))
          return { tasks: s.tasks.map((t) => (orderOf.has(t.id) ? { ...t, order: orderOf.get(t.id)! } : t)) }
        }),

      // ---------- hábitos ----------
      addHabit: (h) => {
        const id = uid()
        set((s) => ({ habits: [...s.habits, { ...habitDefaults, createdAt: todayKey(), ...h, id }] }))
        return id
      },
      updateHabit: (id, patch) =>
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      deleteHabit: (id) =>
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
          goals: s.goals.map((g) => ({ ...g, habitIds: g.habitIds.filter((x) => x !== id) })),
        })),
      setHabitValue: (id, date, value) =>
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h
            const log = { ...h.log }
            if (value <= 0) delete log[date]
            else log[date] = value
            return { ...h, log }
          }),
        })),

      // ---------- rotina ----------
      addBlock: (b) => {
        const id = uid()
        set((s) => ({ routine: [...s.routine, { ...blockDefaults, ...b, id }] }))
        return id
      },
      updateBlock: (id, patch) =>
        set((s) => ({ routine: s.routine.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      deleteBlock: (id) => set((s) => ({ routine: s.routine.filter((b) => b.id !== id) })),
      duplicateBlock: (id) =>
        set((s) => {
          const b = s.routine.find((x) => x.id === id)
          if (!b) return {}
          return { routine: [...s.routine, { ...b, id: uid(), title: `${b.title} (cópia)`}] }
        }),
      copyDay: (from, to) => set((s) => ({ routine: copyDayBlocks(s.routine, from, to) })),
      toggleBlockDone: (date, id) =>
        set((s) => {
          const cur = s.routineLog[date] ?? []
          const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
          return { routineLog: { ...s.routineLog, [date]: next } }
        }),

      // ---------- notas ----------
      addNote: (n = {}) => {
        const id = uid()
        const stamp = nowIso()
        set((s) => ({ notes: [{ ...noteDefaults, ...n, id, createdAt: stamp, updatedAt: stamp }, ...s.notes] }))
        return id
      },
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: nowIso() } : n)),
        })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      setJournal: (date, patch) =>
        set((s) => {
          const base: JournalEntry = s.journal[date] ?? { mood: null, how: '', good: ['', '', ''], improve: '' }
          return { journal: { ...s.journal, [date]: { ...base, ...patch} } }
        }),

      // ---------- metas ----------
      addGoal: (g) => {
        const id = uid()
        set((s) => ({ goals: [...s.goals, { ...goalDefaults, ...g, id, createdAt: nowIso() }] }))
        return id
      },
      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      deleteGoal: (id) =>
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
        })),

      toggleMilestone: (goalId, milestoneId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, milestones: g.milestones.map((m) => (m.id === milestoneId ? { ...m, done: !m.done } : m)) }
              : g,
          ),
        })),

      // ---------- revisão, categorias, ajustes ----------
      addExpense: (e) =>
        set((s) => ({ expenses: [...s.expenses, { ...e, id: uid(), createdAt: nowIso() }] })),
      updateExpense: (id, patch) =>
        set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
      addShopItem: (name) => {
        const n = name.trim()
        if (!n) return
        const item: ShopItem = { id: uid(), name: n, done: false, createdAt: nowIso() }
        set((s) => ({ shopping: [...s.shopping, item] }))
      },
      toggleShopItem: (id) =>
        set((s) => ({ shopping: s.shopping.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) })),
      deleteShopItem: (id) => set((s) => ({ shopping: s.shopping.filter((i) => i.id !== id) })),
      addWater: (date, ml) =>
        set((s) => {
          const next = Math.max(0, (s.water[date] ?? 0) + ml)
          const water = { ...s.water }
          if (next === 0) delete water[date]
          else water[date] = next
          return { water }
        }),
      addMeal: (m) => set((s) => ({ meals: [...s.meals, { ...m, id: uid(), createdAt: nowIso() }] })),
      deleteMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
      addTemplate: (t) => {
        const id = uid()
        set((s) => ({ workouts: [...s.workouts, { ...t, id }] }))
        return id
      },
      updateTemplate: (id, patch) =>
        set((s) => ({ workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),
      deleteTemplate: (id) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),
      setActiveWorkout: (activeWorkout) => set({ activeWorkout }),
      finishWorkout: () => {
        const a = get().activeWorkout
        if (!a) return false
        const exercises = a.log.exercises
          .map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }))
          .filter((e) => e.sets.length > 0)
        if (exercises.length === 0) return false
        const log: WorkoutLog = {
          ...a.log,
          exercises,
          durationMin: Math.max(1, Math.round((Date.now() - a.startedAt) / 60000)),
          createdAt: nowIso(),
        }
        set((s) => ({ workoutLogs: [...s.workoutLogs, log], activeWorkout: null }))
        return true
      },
      deleteWorkoutLog: (id) => set((s) => ({ workoutLogs: s.workoutLogs.filter((w) => w.id !== id) })),
      addBody: (b) => set((s) => ({ body: [...s.body, { ...b, id: uid() }] })),
      deleteBody: (id) => set((s) => ({ body: s.body.filter((b) => b.id !== id) })),
      setSleep: (date, entry) =>
        set((s) => {
          const sleep = { ...s.sleep }
          if (entry) sleep[date] = entry
          else delete sleep[date]
          return { sleep }
        }),
      addBook: (b) =>
        set((s) => ({
          books: [
            ...s.books,
            { pagesRead: 0, status: 'lendo', finishedAt: null, ...b, id: uid(), createdAt: nowIso() } as Book,
          ],
        })),
      updateBook: (id, patch) => set((s) => ({ books: s.books.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      deleteBook: (id) => set((s) => ({ books: s.books.filter((b) => b.id !== id) })),
      clearBoughtItems: () => set((s) => ({ shopping: s.shopping.filter((i) => !i.done) })),

      setReview: (week, patch) =>
        set((s) => ({
          reviews: { ...s.reviews, [week]: { ...(s.reviews[week] ?? { priorities: '', reflection: '' }), ...patch } },
        })),
      addCategory: (name) =>
        set((s) => {
          const n = name.trim()
          if (!n || s.categories.some((c) => c.toLowerCase() === n.toLowerCase())) return {}
          return { categories: [...s.categories, n] }
        }),
      updateSettings: (patch) =>
        set((s) => {
          const settings = { ...s.settings, ...patch }
          const idle = !s.timer.running && s.timer.startedAt === null
          return {
            settings,
            timer: idle ? { ...s.timer, remaining: modeSeconds(settings, s.timer.mode) } : s.timer,
          }
        }),

      // ---------- foco ----------
      startTimer: () =>
        set((s) => {
          const t = s.timer
          if (t.running) return {}
          const remaining = t.remaining > 0 ? t.remaining : modeSeconds(s.settings, t.mode)
          const now = Date.now()
          return {
            timer: { ...t, running: true, remaining, endsAt: now + remaining * 1000, startedAt: t.startedAt ?? now },
          }
        }),
      pauseTimer: () =>
        set((s) => {
          const t = s.timer
          if (!t.running || t.endsAt === null) return {}
          return {
            timer: { ...t, running: false, endsAt: null, remaining: Math.max(1, Math.ceil((t.endsAt - Date.now()) / 1000)) },
          }
        }),
      resetTimer: () =>
        set((s) => ({
          timer: { ...s.timer, running: false, endsAt: null, startedAt: null, remaining: modeSeconds(s.settings, s.timer.mode) },
        })),
      setTimerMode: (mode) =>
        set((s) => ({
          timer: { ...s.timer, mode, running: false, endsAt: null, startedAt: null, remaining: modeSeconds(s.settings, mode) },
        })),
      setTimerTask: (id) => set((s) => ({ timer: { ...s.timer, taskId: id } })),
      finishTimer: (natural) => {
        const s = get()
        const t = s.timer
        const total = modeSeconds(s.settings, t.mode)
        const left = t.running && t.endsAt !== null ? Math.max(0, Math.ceil((t.endsAt - Date.now()) / 1000)) : t.remaining
        const seconds = natural ? total : Math.max(0, total - left)

        let sessions: FocusSession[] = s.focusSessions
        let cycles = t.cycles
        let nextMode: TimerMode = 'focus'
        if (t.mode === 'focus') {
          if (seconds >= 60) {
            sessions = [
              ...sessions,
              {
                id: uid(),
                startedAt: new Date(t.startedAt ?? Date.now() - seconds * 1000).toISOString(),
                date: todayKey(),
                seconds,
                taskId: t.taskId,
              },
            ]
            cycles += 1
          }
          nextMode = cycles >= s.settings.longBreakEvery ? 'long' : 'short'
        } else if (t.mode === 'long') {
          cycles = 0
        }
        set({
          focusSessions: sessions,
          timer: {
            ...t,
            mode: nextMode,
            running: false,
            endsAt: null,
            startedAt: null,
            remaining: modeSeconds(s.settings, nextMode),
            cycles,
          },
        })
      },

      deleteSession: (id) => set((s) => ({ focusSessions: s.focusSessions.filter((x) => x.id !== id) })),

      // ---------- dados ----------
      replaceAll: (data) => set({ ...data, timer: freshTimer(data.settings) }),
    }),
    {
      name: 'meu-dia',
      version: DATA_VERSION,
      partialize: (s) => pickData(s) as Store,
      migrate: (persisted, version) => normalizeData(migrate(persisted, version)) as Store,
      // sem nada salvo (primeiro acesso) o zustand chama merge com `undefined`
      merge: (persisted, current) =>
        persisted && typeof persisted === 'object' ? { ...current, ...normalizeData(persisted) } : current,
    },
  ),
)

export { emptyData, freshTimer }
