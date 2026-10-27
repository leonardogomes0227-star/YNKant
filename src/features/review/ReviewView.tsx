import { useState } from 'react'
import { ChevronLeft, ChevronRight, ClipboardCheck } from 'lucide-react'
import { Field, PageHeader, ProgressBar, SectionTitle } from '../../components/ui'
import { formatBR, formatDuration, shiftKey, todayKey, weekKeys, weekStartKey, WEEKDAY_SHORT, weekdayOf } from '../../lib/dates'
import { MOODS } from '../../lib/moods'
import { formatMl } from '../../lib/health'
import { healthWeek } from '../../lib/healthWeek'
import { formatHours } from '../../lib/sleep'
import { weekSummary } from '../../lib/review'
import { useNow } from '../../lib/useNow'
import { useStore } from '../../store/useStore'
import type { DateKey } from '../../types'

type Metric = 'tasks' | 'habits' | 'focus' | 'mood'

const METRICS: { id: Metric; label: string }[] = [
  { id: 'tasks', label: 'Tarefas' },
  { id: 'habits', label: 'Hábitos' },
  { id: 'focus', label: 'Foco' },
  { id: 'mood', label: 'Humor' },
]

function Kpi({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="card metal p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="tabular mt-1.5 font-display text-3xl">{value}</div>
      {detail && <div className="mt-0.5 text-xs text-muted">{detail}</div>}
    </div>
  )
}

export function ReviewView() {
  const now = useNow(60_000)
  const today = todayKey(now)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const focusSessions = useStore((s) => s.focusSessions)
  const journal = useStore((s) => s.journal)
  const reviews = useStore((s) => s.reviews)
  const workoutLogs = useStore((s) => s.workoutLogs)
  const water = useStore((s) => s.water)
  const sleep = useStore((s) => s.sleep)
  const meals = useStore((s) => s.meals)
  const setReview = useStore((s) => s.setReview)
  const [anchor, setAnchor] = useState<DateKey>(today)
  const [metric, setMetric] = useState<Metric>('tasks')

  const start = weekStartKey(anchor)
  const days = weekKeys(start)
  const isCurrent = start === weekStartKey(today)
  const sum = weekSummary({ tasks, habits, focusSessions, journal }, days, today)
  const health = healthWeek({ workoutLogs, water, sleep, meals }, days)
  const review = reviews[start] ?? { priorities: '', reflection: '' }

  const value = (d: (typeof sum.days)[number]) =>
    metric === 'tasks' ? d.tasks : metric === 'habits' ? d.habitsDone : metric === 'focus' ? Math.round(d.focusSeconds / 60) : (d.mood ?? 0)
  const max = metric === 'mood' ? 5 : Math.max(1, ...sum.days.map(value))
  const fmt = (n: number) => (metric === 'focus' ? (n ? formatDuration(n * 60) : '') : metric === 'mood' ? (n ? String(n) : '') : n ? String(n) : '')
  const unit = { tasks: 'concluídas', habits: 'hábitos feitos', focus: 'de foco', mood: 'de humor' }[metric]

  return (
    <>
      <PageHeader title="Revisão semanal" subtitle="Veja o que você fez nesta semana e escreva o que quer priorizar na próxima." />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl">
          {isCurrent ? 'Esta semana' : 'Semana'} · <span className="tabular text-muted">{formatBR(days[0]).slice(0, 5)} a {formatBR(days[6]).slice(0, 5)}</span>
        </h2>
        <div className="flex items-center gap-1">
          <button className="icon-btn" onClick={() => setAnchor(shiftKey(start, -7))} aria-label="Semana anterior"><ChevronLeft size={20} /></button>
          <button className="btn btn-sm" onClick={() => setAnchor(today)} disabled={isCurrent}>Esta semana</button>
          <button className="icon-btn" onClick={() => setAnchor(shiftKey(start, 7))} disabled={isCurrent} aria-label="Próxima semana"><ChevronRight size={20} /></button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumo da semana">
        <Kpi label="Tarefas concluídas" value={String(sum.tasksDone)} detail="na semana" />
        <Kpi label="Hábitos" value={sum.habitsScheduled ? `${Math.round(sum.habitRate * 100)}%` : '—'} detail={sum.habitsScheduled ? `${sum.habitsDone} de ${sum.habitsScheduled} previstos` : 'nenhum previsto'} />
        <Kpi label="Horas de foco" value={formatDuration(sum.focusSeconds)} detail={`${focusSessions.filter((s) => days.includes(s.date)).length} sessões`} />
        <Kpi label="Humor médio" value={sum.moodAvg !== null ? sum.moodAvg.toFixed(1).replace('.', ',') : '—'} detail={sum.moodAvg !== null ? MOODS[Math.round(sum.moodAvg) - 1].label : 'sem registros no diário'} />
      </section>

      <section className="card mt-4 p-4" aria-label="Saúde da semana">
        <h2 className="mb-3 text-base">Saúde na semana</h2>
        <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div><dd className="tabular m-0 font-display text-2xl">{health.workouts}</dd><dt className="text-xs text-muted">treinos</dt></div>
          <div><dd className="tabular m-0 font-display text-2xl">{health.waterAvg !== null ? formatMl(health.waterAvg) : '—'}</dd><dt className="text-xs text-muted">água por dia</dt></div>
          <div><dd className="tabular m-0 font-display text-2xl">{health.sleepAvg !== null ? formatHours(health.sleepAvg) : '—'}</dd><dt className="text-xs text-muted">sono por noite</dt></div>
          <div><dd className="tabular m-0 font-display text-2xl">{health.kcalAvg !== null ? health.kcalAvg : '—'}</dd><dt className="text-xs text-muted">kcal por dia</dt></div>
        </dl>
      </section>

      <section className="card mt-4 p-5" aria-label="Gráfico por dia">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg">Por dia</h2>
          <div className="seg" role="group" aria-label="Métrica do gráfico">
            {METRICS.map((m) => (
              <button key={m.id} aria-pressed={metric === m.id} onClick={() => setMetric(m.id)}>{m.label}</button>
            ))}
          </div>
        </div>
        <ul className="flex h-44 items-end justify-between gap-2 sm:gap-4" aria-label={`${METRICS.find((m) => m.id === metric)?.label} por dia`}>
          {sum.days.map((d) => {
            const v = value(d)
            const future = d.date > today
            return (
              <li key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" aria-label={`${WEEKDAY_SHORT[weekdayOf(d.date)]}: ${v ? fmt(v) : 'nada'} ${unit}`}>
                <span className="tabular text-xs text-muted">{fmt(v)}</span>
                <span
                  className={`w-full max-w-12 rounded-t-md transition-[height] duration-500 ${d.date === today ? 'bg-accent' : 'bg-line-strong'} ${future ? 'opacity-30' : ''}`}
                  style={{ height: `${v ? Math.max(4, (v / max) * 78) : 1.5}%` }}
                />
                <span className="text-xs capitalize text-muted">{WEEKDAY_SHORT[weekdayOf(d.date)]}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section aria-label="Hábitos da semana">
          <SectionTitle>Hábitos</SectionTitle>
          {sum.byHabit.length === 0 ? (
            <p className="text-sm text-muted">Nenhum hábito previsto nesta semana até agora.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3">
              {sum.byHabit.map(({ habit, done, scheduled }) => (
                <li key={habit.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{habit.name}</span>
                    <span className="tabular text-muted">{done}/{scheduled}</span>
                  </div>
                  <ProgressBar value={(done / scheduled) * 100} label={`${habit.name}: ${done} de ${scheduled}`} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-label="Tarefas concluídas na semana">
          <SectionTitle>Tarefas concluídas</SectionTitle>
          {sum.completedTasks.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma tarefa concluída nesta semana.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-1 text-sm">
              {sum.completedTasks.slice(0, 12).map((t) => (
                <li key={t.id} className="flex items-center gap-2"><ClipboardCheck size={15} className="shrink-0 text-accent" aria-hidden /><span className="truncate">{t.title}</span></li>
              ))}
              {sum.completedTasks.length > 12 && <li className="text-muted">e mais {sum.completedTasks.length - 12}…</li>}
            </ul>
          )}
        </section>
      </div>

      <section className="card metal mt-8 grid grid-cols-1 gap-5 p-5" aria-label="Reflexão e prioridades">
        <Field label="O que funcionou e o que não funcionou nesta semana" htmlFor="r-ref">
          <textarea id="r-ref" className="input" value={review.reflection} onChange={(e) => setReview(start, { reflection: e.target.value })} placeholder="Aprendizados, vitórias, travas…" />
        </Field>
        <Field label="Prioridades da semana seguinte" htmlFor="r-prio" hint="Aparecem na tela Hoje durante a próxima semana.">
          <textarea id="r-prio" className="input" value={review.priorities} onChange={(e) => setReview(start, { priorities: e.target.value })} placeholder={'1. …\n2. …\n3. …'} />
        </Field>
        <p className="text-xs text-muted">Salvo automaticamente neste aparelho.</p>
      </section>
    </>
  )
}
