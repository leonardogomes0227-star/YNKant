import { CalendarDays, GripVertical, ListChecks, Repeat } from 'lucide-react'
import { CheckCircle } from '../../components/ui'
import { PRIORITY_LABEL, dueLabel, isOverdue, subtaskProgress } from '../../lib/tasks'
import type { Task } from '../../types'

export function TaskRow({
  task,
  today,
  onToggle,
  onOpen,
  handleProps,
  dragging,
  over,
  showDue = true,
}: {
  task: Task
  today: string
  onToggle: () => void
  onOpen: () => void
  handleProps?: ReturnType<typeof import('../../lib/useSortable').useSortable>['handleProps']
  dragging?: boolean
  over?: boolean
  showDue?: boolean
}) {
  const overdue = isOverdue(task, today)
  const sub = subtaskProgress(task)
  return (
    <li
      data-sort-id={task.id}
      className={`group flex items-center gap-1 rounded-xl border px-2 py-1 transition-colors ${
        overdue ? 'border-danger/40 bg-danger-soft' : 'border-transparent hover:bg-surface-2/60'
      } ${dragging ? 'opacity-40' : ''} ${over ? 'drag-over' : ''}`}
    >
      {handleProps && (
        <button
          className="icon-btn icon-btn-sm -ml-1"
          aria-label={`Reordenar “${task.title}”: arraste ou use as setas ↑ ↓`}
          {...handleProps(task.id)}
        >
          <GripVertical size={16} />
        </button>
      )}
      <CheckCircle
        checked={task.done}
        onChange={onToggle}
        label={task.done ? `Reabrir “${task.title}”` : `Concluir “${task.title}”`}
      />
      <button
        onClick={onOpen}
        className="flex min-h-11 min-w-0 flex-1 flex-col items-start justify-center gap-1 rounded-lg py-1 pl-1 text-left"
      >
        <span className={`max-w-full truncate font-medium ${task.done ? 'text-muted line-through' : ''}`}>
          {task.title}
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          {showDue && task.dueDate && (
            <span className={`chip ${overdue ? 'chip-danger' : ''}`}>
              <CalendarDays size={12} aria-hidden />
              {dueLabel(task.dueDate, today)}
            </span>
          )}
          {task.priority === 'high' && <span className="chip chip-accent">Prioridade alta</span>}
          {task.priority === 'low' && <span className="chip">{PRIORITY_LABEL.low}</span>}
          {task.category && <span className="chip">{task.category}</span>}
          {sub.total > 0 && (
            <span className="chip">
              <ListChecks size={12} aria-hidden />
              {sub.done}/{sub.total}
            </span>
          )}
          {task.repeat !== 'none' && (
            <span className="chip" title="Tarefa recorrente">
              <Repeat size={12} aria-hidden />
              {{ daily: 'Diária', weekly: 'Semanal', monthly: 'Mensal' }[task.repeat]}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}
