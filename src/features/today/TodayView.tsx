import { useMemo, useState } from 'react'
import { CalendarClock, CheckSquare, Flame, Plus } from 'lucide-react'
import { NavLink } from '../../components/NavLink'
import { SectionTitle } from '../../components/ui'
import { formatLong, greeting, nowMinutes, todayKey } from '../../lib/dates'
import { blocksForDate, currentBlock, nextBlock } from '../../lib/routine'
import { isDone, isScheduled } from '../../lib/streak'
import { byOrder, inView, isOverdue } from '../../lib/tasks'
import { useNow } from '../../lib/useNow'
import { useStore } from '../../store/useStore'
import { HabitControl } from '../habits/HabitControl'
import { TaskList } from '../tasks/TaskList'

export function TodayView() {
  const now = useNow(30_000)
  const today = todayKey(now)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const routine = useStore((s) => s.routine)
  const name = useStore((s) => s.settings.name)
  const addTask = useStore((s) => s.addTask)
  const [text, setText] = useState('')

  const todayTasks = useMemo(() => tasks.filter((t) => inView(t, 'today', today)), [tasks, today])
  const open = todayTasks.filter((t) => !t.done).sort(byOrder)
  const done = todayTasks.filter((t) => t.done)
  const overdue = useMemo(() => tasks.filter((t) => isOverdue(t, today)).sort(byOrder), [tasks, today])
  const todayHabits = habits.filter((h) => isScheduled(h, today))

  const minutes = nowMinutes(now)
  const dayBlocks = blocksForDate(routine, today)
  const current = currentBlock(dayBlocks, minutes)
  const next = nextBlock(dayBlocks, minutes)

  const isNew = tasks.length === 0 && habits.length === 0 && routine.length === 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = text.trim()
    if (!title) return
    addTask({ title, dueDate: today })
    setText('')
  }

  return (
    <>
      <header className="mb-5">
        <p className="text-sm text-muted">{formatLong(now)}</p>
        <h1 className="mt-1 text-[32px] leading-tight sm:text-5xl">
          {greeting(now.getHours())}
          {name.trim() ? `, ${name.trim()}` : ''}
        </h1>
      </header>

      <form onSubmit={submit} className="flex gap-2">
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="O que você precisa fazer hoje?"
          aria-label="Nova tarefa para hoje"
        />
        <button className="btn btn-primary" type="submit" disabled={!text.trim()}>
          <Plus size={18} aria-hidden /> Adicionar
        </button>
      </form>

      {(current || next) && (
        <NavLink to="rotina" className="mt-4 flex items-center gap-3 rounded-xl bg-accent-soft px-4 py-3">
          <CalendarClock size={20} className="shrink-0 text-accent" aria-hidden />
          <span className="min-w-0 flex-1 text-sm">
            {current ? (
              <>
                <span className="text-muted">Agora:</span> <strong>{current.title}</strong> <span className="text-muted">(até {current.end})</span>
              </>
            ) : (
              next && (
                <>
                  <span className="text-muted">Depois:</span> <strong>{next.title}</strong> <span className="text-muted">(às {next.start})</span>
                </>
              )
            )}
          </span>
        </NavLink>
      )}

      {isNew && (
        <section className="card mt-6 p-5" aria-label="Como começar">
          <h2 className="text-xl">Como usar</h2>
          <ol className="mt-3 grid grid-cols-1 gap-3 text-[15px]">
            <li className="flex gap-3">
              <CheckSquare size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              <span><strong>Tarefas:</strong> escreva acima o que precisa fazer hoje e toque no círculo quando terminar.</span>
            </li>
            <li className="flex gap-3">
              <CalendarClock size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              <span><strong>Rotina:</strong> monte seus horários fixos, como trabalho, academia e almoço.</span>
            </li>
            <li className="flex gap-3">
              <Flame size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              <span><strong>Hábitos:</strong> coisas para repetir todo dia, como beber água ou ler.</span>
            </li>
          </ol>
          <p className="mt-4 text-sm text-muted">Use o menu (embaixo no celular, à esquerda no computador) para trocar de tela.</p>
        </section>
      )}

      {overdue.length > 0 && (
        <section className="mt-6" aria-label="Atrasadas">
          <SectionTitle>Atrasadas</SectionTitle>
          <TaskList tasks={overdue} today={today} label="Tarefas atrasadas" />
        </section>
      )}

      {!isNew && (
        <section className="mt-6" aria-label="Tarefas de hoje">
          <SectionTitle aside={<NavLink to="tarefas" className="text-sm text-accent hover:underline">Ver todas</NavLink>}>Tarefas de hoje</SectionTitle>
          {todayTasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted">
              Nada para hoje ainda. Escreva a primeira tarefa no campo acima.
            </p>
          ) : (
            <>
              {open.length > 0 && <TaskList tasks={open} today={today} showDue={false} sortable label="Tarefas de hoje" />}
              {done.length > 0 && (
                <div className="mt-3">
                  <h3 className="mb-1 px-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted">Feitas</h3>
                  <TaskList tasks={done} today={today} showDue={false} label="Tarefas feitas hoje" />
                </div>
              )}
            </>
          )}
        </section>
      )}

      {todayHabits.length > 0 && (
        <section className="mt-8" aria-label="Hábitos de hoje">
          <SectionTitle aside={<NavLink to="habitos" className="text-sm text-accent hover:underline">Ver todos</NavLink>}>Hábitos de hoje</SectionTitle>
          <ul className="grid grid-cols-1 gap-0.5">
            {todayHabits.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2 rounded-xl px-2 py-1 hover:bg-surface-2/60">
                <span className={`flex min-h-11 min-w-0 flex-1 items-center truncate font-medium ${isDone(h, today) ? 'text-muted' : ''}`}>{h.name}</span>
                <HabitControl habit={h} date={today} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {!isNew && todayHabits.length === 0 && habits.length === 0 && (
        <p className="mt-8 text-sm text-muted">
          Quer criar uma rotina de hábitos? Vá em <NavLink to="habitos" className="text-accent underline">Hábitos</NavLink>.
        </p>
      )}
    </>
  )
}
