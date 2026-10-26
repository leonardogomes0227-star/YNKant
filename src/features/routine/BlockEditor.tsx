import { useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { ConfirmDialog, Field, Modal } from '../../components/ui'
import { BLOCK_COLORS, colorHex } from '../../lib/colors'
import { WEEKDAY_LONG, WEEKDAY_ORDER, WEEKDAY_SHORT, timeToMin } from '../../lib/dates'
import { overlaps } from '../../lib/routine'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { RoutineBlock } from '../../types'

const PRESETS: { label: string; days: number[] }[] = [
  { label: 'Seg a sex', days: [1, 2, 3, 4, 5] },
  { label: 'Sábado', days: [6] },
  { label: 'Domingo', days: [0] },
  { label: 'Todos os dias', days: [0, 1, 2, 3, 4, 5, 6] },
]

export type BlockTarget = { id: string; days?: number[] } | null

export function BlockEditor({ target, onClose }: { target: BlockTarget; onClose: () => void }) {
  const routine = useStore((s) => s.routine)
  const block = target && target.id !== 'new' ? routine.find((b) => b.id === target.id) : undefined
  const open = !!target && (target.id === 'new' || !!block)
  return (
    <Modal open={open} onClose={onClose} title={block ? 'Editar bloco' : 'Novo bloco'} footer={<Footer block={block} onClose={onClose} />}>
      {open && <BlockForm key={target.id} block={block} defaultDays={target.days} onClose={onClose} />}
    </Modal>
  )
}

function Footer({ block, onClose }: { block?: RoutineBlock; onClose: () => void }) {
  const { deleteBlock, duplicateBlock } = useStore.getState()
  const toast = useUI((s) => s.toast)
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      {block && (
        <div className="mr-auto flex gap-2">
          <button
            className="btn btn-danger"
            onClick={() => setConfirm(true)}
            aria-label="Excluir bloco"
          >
            <Trash2 size={16} aria-hidden /> <span className="hidden sm:inline">Excluir</span>
          </button>
          <button
            className="btn"
            onClick={() => {
              duplicateBlock(block.id)
              toast('Bloco duplicado.')
              onClose()
            }}
          >
            <Copy size={16} aria-hidden /> <span className="hidden sm:inline">Duplicar</span>
            <span className="sr-only sm:hidden">Duplicar</span>
          </button>
          <ConfirmDialog
            open={confirm}
            title="Excluir bloco?"
            message={`“${block.title}” será removido de todos os dias em que aparece.`}
            confirmLabel="Excluir"
            danger
            onCancel={() => setConfirm(false)}
            onConfirm={() => {
              deleteBlock(block.id)
              setConfirm(false)
              onClose()
            }}
          />
        </div>
      )}
      <button className="btn" onClick={onClose}>
        Cancelar
      </button>
      <button className="btn btn-primary" type="submit" form="block-form">
        Salvar
      </button>
    </>
  )
}

function BlockForm({ block, defaultDays, onClose }: { block?: RoutineBlock; defaultDays?: number[]; onClose: () => void }) {
  const { addBlock, updateBlock, addCategory } = useStore.getState()
  const categories = useStore((s) => s.categories)
  const routine = useStore((s) => s.routine)
  const [title, setTitle] = useState(block?.title ?? '')
  const [start, setStart] = useState(block?.start ?? '09:00')
  const [end, setEnd] = useState(block?.end ?? '10:00')
  const [color, setColor] = useState(block?.color ?? 'brass')
  const [category, setCategory] = useState(block?.category ?? '')
  const [days, setDays] = useState<number[]>(block?.days ?? defaultDays ?? [1, 2, 3, 4, 5])

  const invalid = !start || !end || timeToMin(end) <= timeToMin(start)
  const clashes = routine.filter(
    (b) => b.id !== block?.id && b.days.some((d) => days.includes(d)) && overlaps({ start, end }, b),
  )

  const toggleDay = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))
  const sameDays = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || invalid || days.length === 0) return
    const cat = category.trim()
    if (cat) addCategory(cat)
    const data = { title: title.trim(), start, end, color, category: cat, days: [...days].sort() }
    if (block) updateBlock(block.id, data)
    else addBlock(data)
    onClose()
  }

  return (
    <form id="block-form" onSubmit={submit} className="grid gap-4">
      <Field label="Título" htmlFor="b-title">
        <input id="b-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Trabalho focado" autoFocus required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Início" htmlFor="b-start">
          <input id="b-start" type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} required />
        </Field>
        <Field label="Fim" htmlFor="b-end">
          <input id="b-end" type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </Field>
      </div>
      {invalid && (
        <p role="alert" className="-mt-2 text-sm text-danger">
          O fim precisa ser depois do início (blocos não atravessam a meia-noite).
        </p>
      )}
      <div>
        <span className="label" id="b-days-l">Dias da semana</span>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.label}
              className={`chip cursor-pointer ${sameDays(days, p.days) ? 'chip-accent' : ''}`}
              onClick={() => setDays(p.days)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="b-days-l">
          {WEEKDAY_ORDER.map((d) => (
            <button
              type="button"
              key={d}
              aria-pressed={days.includes(d)}
              aria-label={WEEKDAY_LONG[d]}
              onClick={() => toggleDay(d)}
              className={`grid h-10 w-12 place-items-center rounded-lg border text-sm font-semibold capitalize transition-colors ${
                days.includes(d) ? 'border-transparent bg-accent text-accent-fg' : 'border-line-strong text-muted hover:text-ink'
              }`}
            >
              {WEEKDAY_SHORT[d]}
            </button>
          ))}
        </div>
        {days.length === 0 && <p role="alert" className="mt-1 text-sm text-danger">Escolha pelo menos um dia.</p>}
        <p className="mt-1.5 text-xs text-muted">O bloco vale para todos os dias marcados; alterar aqui muda todos eles.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoria" htmlFor="b-cat">
          <input id="b-cat" className="input" list="b-cats" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Opcional" />
          <datalist id="b-cats">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <div>
          <span className="label" id="b-color-l">Cor</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="b-color-l">
            {Object.entries(BLOCK_COLORS).map(([key, c]) => (
              <button
                type="button"
                key={key}
                role="radio"
                aria-checked={color === key}
                aria-label={c.label}
                title={c.label}
                onClick={() => setColor(key)}
                className="grid size-9 place-items-center rounded-full border-2 transition-transform hover:scale-105"
                style={{ borderColor: color === key ? 'var(--text)' : 'transparent' }}
              >
                <span className="size-6 rounded-full" style={{ background: colorHex(key) }} />
              </button>
            ))}
          </div>
        </div>
      </div>
      {clashes.length > 0 && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm">
          Atenção: este horário se sobrepõe a {clashes.slice(0, 3).map((b) => `“${b.title}”`).join(', ')}
          {clashes.length > 3 ? ' e outros' : ''}. Você ainda pode salvar.
        </p>
      )}
    </form>
  )
}
