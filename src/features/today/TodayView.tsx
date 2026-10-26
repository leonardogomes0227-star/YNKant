import { useMemo, useRef, useState } from 'react'
import { CalendarClock, CheckSquare, Flame, Plus, Sparkles, Timer } from 'lucide-react'
import { EmptyState, ProgressBar, SampleBadge, SectionTitle } from '../../components/ui'
import { formatDuration, formatLong, greeting, nowMinutes, quoteOfDay, todayKey, weekStartKey, shiftKey } from '../../lib/dates'
import { blocksForDate, currentBlock, nextBlock } from '../../lib/routine'
import { isScheduled, isDone } from '../../lib/streak'
import { inView, isOverdue, byOrder } from '../../lib/tasks'
import { useNow } from '../../lib/useNow'
import { hasSamples, useStore } from '../../store/useStore'
import { go, useUI } from '../../store/ui'
import { HabitControl } from '../habits/HabitControl'
import { TaskList } from '../tasks/TaskList'

function Stat({
  icon: Icon,
  label,
  value,
  detail,
  to,
}: {
  icon: typeof Timer
  label: string
  value: string
  detail?: string
  to: Parameters<typeof go>[0]
}) {
  return (
    <a href={`#/${to}`} className="card metal block p-4 transition-colors hover:border-line-strong">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <Icon size={14} className="text-accent" aria-hidden />
        {label}
      </div>
      <div className="mt-2 truncate font-display text-2xl tabular">{value}</div>
      {detail && <div className="mt-0.5 truncate text-xs text-muted">{detail}</div>}
    </a>
  )
}

export function TodayView() {
  const now = useNow(30_000)
  const today = todayKey(now)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const routine = useStore((s) => s.routine)
  const routineLog = useStore((s) => s.routineLog)
  const sessions = useStore((s) => s.focusSessions)
  const name = useStore((s) => s.settings.name)
  const reviews = useStore((s) => s.reviews)
  const addTask = useStore((s) => s.addTask)
  const clearSamples = useStore((s) => s.clearSamples)
  const showSamples = useStore(hasSamples)
  const toast = useUI((s) => s.toast)
  const [quick, setQuick] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const todayTasks = useMemo(() => tasks.filter((t) => inView(t, 'today', today)), [tasks, today])
  const open = todayTasks.filter((t) => !t.done).sort(byOrder)
  const doneToday = todayTasks.filter((t) => t.done)
  const overdue = useMemo(() => tasks.filter((t) => isOverdue(t, today)).sort(byOrder), [tasks, today])

  const todayHabits = habits.filter((h) => isScheduled(h, today))
  const habitsDone = todayHabits.filter((h) => isDone(h, today)).length

  const dayBlocks = blocksForDate(routine, today)
  const minutes = nowMinutes(now)
  const current = currentBlock(dayBlocks, minutes)
  const next = nextBlock(dayBlocks, minutes)
  const blockDone = (routineLog[today] ?? []).length

  const focusSeconds = sessions.filter((s) => s.date === today).reduce((sum, s) => sum + s.seconds, 0)

  const total = todayTasks.length + todayHabits.length
  const doneCount = doneToday.length + habitsDone
  const pct = total ? (doneCount / total) * 100 : 0

  const weekPriorities = reviews[shiftKey(weekStartKey(today), -7)]?.priorities?.trim()

  const submitQuick = (e: React.FormEvent) => {
    e.preventDefault()
    const title = quick.trim()
    if (!title) return
    addTask({ title })
    setQuick('')
    toast('Jogado na caixa de entrada.')
    inputRef.current?.focus()
  }

  return (
    <>
      <header className="mb-6">
        <p className="text-sm text-muted">{formatLong(now)}</p>
        <h1 className="mt-1 text-[30px] leading-tight sm:text-5xl">
          {greeting(now.getHours())}
          {name.trim() ? `, ${name.trim()}` : ''}
        </h1>
        <p className="mt-2 flex items-start gap-2 text-muted">
          <Sparkles size={16} className="mt-1 shrink-0 text-accent" aria-hidden />
          <span className="font-display italic">{quoteOfDay(today)}</span>
        </p>
      </header>

      {showSamples && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line-strong px-4 py-3 text-sm">
          <span className="text-muted">
            Você está vendo <strong className="text-ink">dados de exemplo</strong> para conhecer o app.
          </span>
          <button
            className="btn btn-sm"
            onClick={() => {
              clearSamples()
              toast('Exemplos removidos. Tudo pronto para os seus dados.')
            }}
          >
            Limpar exemplos
          </button>
        </div>
      )}

      <section aria-label="Resumo do dia" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={CheckSquare} label="Tarefas" value={`${doneToday.length}/${todayTasks.length}`} detail={overdue.length ? `${overdue.length} atrasada(s)` : 'feitas hoje'} to="tarefas" />
        <Stat icon={Flame} label="Hábitos" value={`${habitsDone}/${todayHabits.length}`} detail="concluídos hoje" to="habitos" />
        <Stat
          icon={CalendarClock}
          label={current ? 'Agora' : 'Próximo bloco'}
          value={current ? current.title : next ? next.title : '—'}
          detail={
            current
              ? `até ${current.end}`
              : next
                ? `às ${next.start}`
                : dayBlocks.length
                  ? `${blockDone}/${dayBlocks.length} cumpridos`
                  : 'sem blocos hoje'
          }
          to="rotina"
        />
        <Stat icon={Timer} label="Foco hoje" value={formatDuration(focusSeconds)} detail={`${sessions.filter((s) => s.date === today).length} sessão(ões)`} to="foco" />
      </section>

      <section className="card metal mt-3 p-4" aria-label="Progresso do dia">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-semibold">Progresso do dia</span>
          <span className="tabular text-sm text-muted">
            {total ? `${doneCount} de ${total} · ${Math.round(pct)}%` : 'Nada planejado ainda'}
          </span>
        </div>
        <ProgressBar value={pct} label="Progresso do dia" />
      </section>

      <form onSubmit={submitQuick} className="mt-6 flex gap-2">
        <input
          ref={inputRef}
          className="input"
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          placeholder="Jogar na caixa de entrada…  (atalho: C)"
          aria-label="Captura rápida para a caixa de entrada"
        />
        <button className="btn btn-primary" type="submit" disabled={!quick.trim()}>
          <Plus size={18} aria-hidden />
          <span className="hidden sm:inline">Adicionar</span>
          <span className="sr-only sm:hidden">Adicionar</span>
        </button>
      </form>

      {weekPriorities && (
        <section className="card mt-6 p-4" aria-label="Prioridades da semana">
          <h2 className="mb-1.5 text-base">Prioridades da semana</h2>
          <p className="whitespace-pre-line text-sm text-muted">{weekPriorities}</p>
        </section>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section aria-label="Tarefas de hoje">
          <SectionTitle aside={<a href="#/tarefas" className="text-sm text-accent hover:underline">Ver todas</a>}>Tarefas de hoje</SectionTitle>
          {overdue.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1 px-2 font-sans text-xs font-semibold uppercase tracking-wider text-danger">Atrasadas</h3>
              <TaskList tasks={overdue} today={today} label="Tarefas atrasadas" />
            </div>
          )}
          {todayTasks.length === 0 && overdue.length === 0 ? (
            <EmptyState icon={CheckSquare} title="Nenhuma tarefa para hoje">
              Dê a data de hoje a uma tarefa em Tarefas, ou capture algo acima e organize depois.
            </EmptyState>
          ) : (
            <>
              {open.length > 0 && <TaskList tasks={open} today={today} showDue={false} sortable label="Tarefas de hoje" />}
              {doneToday.length > 0 && (
                <div className="mt-3">
                  <h3 className="mb-1 px-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted">Feitas</h3>
                  <TaskList tasks={doneToday} today={today} showDue={false} label="Tarefas feitas hoje" />
                </div>
              )}
            </>
          )}
        </section>

        <section aria-label="Hábitos de hoje">
          <SectionTitle aside={<a href="#/habitos" className="text-sm text-accent hover:underline">Ver todos</a>}>Hábitos</SectionTitle>
          {todayHabits.length === 0 ? (
            <EmptyState icon={Flame} title="Nenhum hábito para hoje">
              Crie um hábito em Hábitos e escolha os dias da semana em que ele vale.
            </EmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-0.5">
              {todayHabits.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2 rounded-xl px-2 py-1 hover:bg-surface-2/60">
                  <span className="flex min-h-11 min-w-0 flex-1 items-center gap-2">
                    <span className={`truncate font-medium ${isDone(h, today) ? 'text-muted' : ''}`}>{h.name}</span>
                    {h.sample && <SampleBadge />}
                  </span>
                  <HabitControl habit={h} date={today} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
