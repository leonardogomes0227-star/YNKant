import { CalendarDays, Flame, ListChecks, Pencil, Plus, Target } from 'lucide-react'
import { CheckCircle, EmptyState, PageHeader, ProgressBar } from '../../components/ui'
import { formatBR, todayKey } from '../../lib/dates'
import { deadlineInfo, goalProgress, linkedHabits, linkedTasks } from '../../lib/goals'
import { useNow } from '../../lib/useNow'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { Goal } from '../../types'

function GoalCard({ goal, today }: { goal: Goal; today: string }) {
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const toggleMilestone = useStore((s) => s.toggleMilestone)
  const openItem = useUI((s) => s.openItem)
  const progress = goalProgress(goal)
  const dl = deadlineInfo(goal.deadline, today, progress)
  const lt = linkedTasks(goal, tasks)
  const lh = linkedHabits(goal, habits)

  return (
    <article className="card metal p-5" aria-label={goal.title}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-xl">
            <span>{goal.title}</span>
          </h2>
          {goal.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{goal.description}</p>}
        </div>
        <button className="icon-btn icon-btn-sm" onClick={() => openItem({ kind: 'goal', id: goal.id })} aria-label={`Editar meta “${goal.title}”`}>
          <Pencil size={16} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <ProgressBar value={progress} label={`Progresso de ${goal.title}`} className="flex-1" />
        <span className="tabular w-11 text-right font-display text-xl">{progress}%</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {goal.deadline && (
          <span className={`chip ${dl?.late ? 'chip-danger' : ''}`}>
            <CalendarDays size={12} aria-hidden /> {formatBR(goal.deadline)} · {dl?.label}
          </span>
        )}
        {lt.length > 0 && (
          <span className="chip"><ListChecks size={12} aria-hidden /> {lt.filter((t) => t.done).length}/{lt.length} tarefas</span>
        )}
        {lh.length > 0 && (
          <span className="chip"><Flame size={12} aria-hidden /> {lh.length} hábito(s)</span>
        )}
      </div>

      {goal.milestones.length > 0 && (
        <ul className="mt-3 grid grid-cols-1 gap-0.5" aria-label="Marcos">
          {goal.milestones.map((m) => (
            <li key={m.id} className="flex items-center gap-1">
              <CheckCircle checked={m.done} onChange={() => toggleMilestone(goal.id, m.id)} label={m.done ? `Reabrir marco “${m.title}”` : `Concluir marco “${m.title}”`} />
              <span className={m.done ? 'text-muted line-through' : ''}>{m.title}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export function GoalsView() {
  const today = todayKey(useNow(60_000))
  const goals = useStore((s) => s.goals)
  const openItem = useUI((s) => s.openItem)
  const sorted = [...goals].sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'))

  return (
    <>
      <PageHeader
        title="Metas"
        subtitle="Objetivos maiores, como “correr 10 km”. Divida em etapas e acompanhe."
        actions={
          <button className="btn btn-primary" onClick={() => openItem({ kind: 'goal', id: 'new' })}>
            <Plus size={18} aria-hidden /> Nova meta
          </button>
        }
      />
      {sorted.length === 0 ? (
        <EmptyState icon={Target} title="Nenhuma meta ainda" action={<button className="btn btn-primary" onClick={() => openItem({ kind: 'goal', id: 'new' })}><Plus size={18} aria-hidden /> Criar a primeira meta</button>}>
          Metas dão direção ao dia a dia. Defina um prazo, quebre em marcos e vincule as tarefas e hábitos que levam até ela.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.map((g) => (
            <GoalCard key={g.id} goal={g} today={today} />
          ))}
        </div>
      )}
    </>
  )
}
