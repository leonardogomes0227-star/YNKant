import { Minus, Plus } from 'lucide-react'
import { CheckCircle } from '../../components/ui'
import { isDone } from '../../lib/streak'
import { useStore } from '../../store/useStore'
import type { DateKey, Habit } from '../../types'

/** Marca o dia de um hábito: check (sim/não) ou contador (− n/meta +). */
export function HabitControl({ habit, date }: { habit: Habit; date: DateKey }) {
  const setValue = useStore((s) => s.setHabitValue)
  const value = habit.log[date] ?? 0
  const done = isDone(habit, date)

  if (habit.kind === 'check') {
    return (
      <CheckCircle
        checked={done}
        onChange={() => setValue(habit.id, date, done ? 0 : 1)}
        label={done ? `Desmarcar “${habit.name}”` : `Marcar “${habit.name}” como feito`}
      />
    )
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label={`${habit.name}: ${value} de ${habit.target}`}>
      <button
        className="icon-btn icon-btn-sm"
        onClick={() => setValue(habit.id, date, value - 1)}
        disabled={value <= 0}
        aria-label={`Diminuir ${habit.name}`}
      >
        <Minus size={16} />
      </button>
      <span className={`tabular min-w-12 text-center text-sm font-semibold ${done ? 'text-accent' : ''}`}>
        {value}/{habit.target}
      </span>
      <button className="icon-btn icon-btn-sm" onClick={() => setValue(habit.id, date, value + 1)} aria-label={`Aumentar ${habit.name}`}>
        <Plus size={16} />
      </button>
    </div>
  )
}
