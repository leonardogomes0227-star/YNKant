import { useMemo } from 'react'
import { useSortable } from '../../lib/useSortable'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { Task } from '../../types'
import { TaskRow } from './TaskRow'

/** Lista de tarefas; com `sortable`, aceita reordenação (arrastar ou setas). */
export function TaskList({
  tasks,
  today,
  sortable = false,
  showDue = true,
  label,
}: {
  tasks: Task[]
  today: string
  sortable?: boolean
  showDue?: boolean
  label: string
}) {
  const toggleTask = useStore((s) => s.toggleTask)
  const reorderTasks = useStore((s) => s.reorderTasks)
  const openItem = useUI((s) => s.openItem)
  const ids = useMemo(() => tasks.map((t) => t.id), [tasks])
  const sort = useSortable(ids, reorderTasks)

  return (
    <ul className="grid gap-0.5" aria-label={label}>
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          today={today}
          showDue={showDue}
          onToggle={() => toggleTask(t.id)}
          onOpen={() => openItem({ kind: 'task', id: t.id })}
          handleProps={sortable && tasks.length > 1 ? sort.handleProps : undefined}
          dragging={sort.isDragging(t.id)}
          over={sort.isOver(t.id)}
        />
      ))}
    </ul>
  )
}
