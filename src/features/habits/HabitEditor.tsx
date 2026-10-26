import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog, Field, Modal } from '../../components/ui'
import { WEEKDAY_LONG, WEEKDAY_ORDER, WEEKDAY_SHORT } from '../../lib/dates'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { Habit, HabitKind } from '../../types'

const PRESETS = [
  { label: 'Todos os dias', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Dias úteis', days: [1, 2, 3, 4, 5] },
  { label: 'Fins de semana', days: [0, 6] },
]

export type HabitTarget = { id: string } | null

export function HabitEditor({ target, onClose }: { target: HabitTarget; onClose: () => void }) {
  const habits = useStore((s) => s.habits)
  const habit = target && target.id !== 'new' ? habits.find((h) => h.id === target.id) : undefined
  const open = !!target && (target.id === 'new' || !!habit)
  return (
    <Modal open={open} onClose={onClose} title={habit ? 'Editar hábito' : 'Novo hábito'} footer={<Footer habit={habit} onClose={onClose} />}>
      {open && <HabitForm key={target.id} habit={habit} onClose={onClose} />}
    </Modal>
  )
}

function Footer({ habit, onClose }: { habit?: Habit; onClose: () => void }) {
  const deleteHabit = useStore((s) => s.deleteHabit)
  const toast = useUI((s) => s.toast)
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      {habit && (
        <>
          <button className="btn btn-danger mr-auto" onClick={() => setConfirm(true)}>
            <Trash2 size={16} aria-hidden /> Excluir
          </button>
          <ConfirmDialog
            open={confirm}
            title="Excluir hábito?"
            message={`“${habit.name}” e todo o histórico dele serão apagados. Isso não pode ser desfeito.`}
            confirmLabel="Excluir"
            danger
            onCancel={() => setConfirm(false)}
            onConfirm={() => {
              deleteHabit(habit.id)
              setConfirm(false)
              toast('Hábito excluído.')
              onClose()
            }}
          />
        </>
      )}
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" type="submit" form="habit-form">Salvar</button>
    </>
  )
}

function HabitForm({ habit, onClose }: { habit?: Habit; onClose: () => void }) {
  const { addHabit, updateHabit } = useStore.getState()
  const [name, setName] = useState(habit?.name ?? '')
  const [kind, setKind] = useState<HabitKind>(habit?.kind ?? 'check')
  const [target, setTarget] = useState(String(habit?.target ?? 8))
  const [unit, setUnit] = useState(habit?.unit ?? '')
  const [days, setDays] = useState<number[]>(habit?.days ?? [0, 1, 2, 3, 4, 5, 6])
  const [note, setNote] = useState(habit?.note ?? '')

  const toggle = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))
  const same = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x))
  const targetNum = Math.max(1, Math.floor(Number(target) || 1))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || days.length === 0) return
    const data = {
      name: name.trim(),
      kind,
      target: kind === 'count' ? targetNum : 1,
      unit: kind === 'count' ? unit.trim() : '',
      days: [...days].sort(),
      note: note.trim(),
    }
    if (habit) updateHabit(habit.id, data)
    else addHabit(data)
    onClose()
  }

  return (
    <form id="habit-form" onSubmit={submit} className="grid grid-cols-1 gap-4">
      <Field label="Nome" htmlFor="h-name">
        <input id="h-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Beber água" autoFocus required />
      </Field>
      <div>
        <span className="label" id="h-kind-l">Tipo</span>
        <div className="seg" role="group" aria-labelledby="h-kind-l">
          <button type="button" aria-pressed={kind === 'check'} onClick={() => setKind('check')}>Sim / não</button>
          <button type="button" aria-pressed={kind === 'count'} onClick={() => setKind('count')}>Contagem</button>
        </div>
      </div>
      {kind === 'count' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Meta por dia" htmlFor="h-target">
            <input id="h-target" type="number" min={1} className="input" value={target} onChange={(e) => setTarget(e.target.value)} />
          </Field>
          <Field label="Unidade" htmlFor="h-unit">
            <input id="h-unit" className="input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="copos, páginas…" />
          </Field>
        </div>
      )}
      <div>
        <span className="label" id="h-days-l">Frequência</span>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button type="button" key={p.label} className={`chip min-h-8 cursor-pointer px-3 ${same(days, p.days) ? 'chip-accent' : ''}`} onClick={() => setDays(p.days)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5" role="group" aria-labelledby="h-days-l">
          {WEEKDAY_ORDER.map((d) => (
            <button
              type="button"
              key={d}
              aria-pressed={days.includes(d)}
              aria-label={WEEKDAY_LONG[d]}
              onClick={() => toggle(d)}
              className={`grid h-10 w-full place-items-center rounded-lg border text-sm font-semibold capitalize transition-colors ${
                days.includes(d) ? 'border-transparent bg-accent text-accent-fg' : 'border-line-strong text-muted hover:text-ink'
              }`}
            >
              {WEEKDAY_SHORT[d]}
            </button>
          ))}
        </div>
        {days.length === 0 && <p role="alert" className="mt-1 text-sm text-danger">Escolha pelo menos um dia.</p>}
      </div>
      <Field label="Meta (opcional)" htmlFor="h-note" hint="Um lembrete do que você quer alcançar, como “30 minutos por dia”.">
        <input id="h-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
    </form>
  )
}
