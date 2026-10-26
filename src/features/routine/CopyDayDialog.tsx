import { useState } from 'react'
import { Modal } from '../../components/ui'
import { WEEKDAY_LONG, WEEKDAY_ORDER } from '../../lib/dates'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'

export function CopyDayDialog({ from, open, onClose }: { from: number; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={`Copiar ${WEEKDAY_LONG[from]}`}>
      {open && <CopyForm from={from} onClose={onClose} />}
    </Modal>
  )
}

function CopyForm({ from, onClose }: { from: number; onClose: () => void }) {
  const copyDay = useStore((s) => s.copyDay)
  const toast = useUI((s) => s.toast)
  const [to, setTo] = useState<number[]>([])
  const toggle = (d: number) => setTo((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))

  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        Escolha para quais dias levar os blocos de {WEEKDAY_LONG[from]}. Os blocos que esses dias já tinham serão{' '}
        <strong className="text-ink">substituídos</strong>.
      </p>
      <fieldset className="grid gap-1">
        <legend className="sr-only">Dias de destino</legend>
        {WEEKDAY_ORDER.filter((d) => d !== from).map((d) => (
          <label key={d} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 capitalize hover:bg-surface-2">
            <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={to.includes(d)} onChange={() => toggle(d)} />
            {WEEKDAY_LONG[d]}
          </label>
        ))}
      </fieldset>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="btn btn-primary"
          disabled={to.length === 0}
          onClick={() => {
            copyDay(from, to)
            toast(`Dia copiado para ${to.length} dia(s).`)
            onClose()
          }}
        >
          Copiar
        </button>
      </div>
    </div>
  )
}
