import { useState } from 'react'
import { Dumbbell, Trash2 } from 'lucide-react'
import { ConfirmDialog, EmptyState, Modal } from '../../components/ui'
import { formatBR, weekdayName } from '../../lib/dates'
import { doneSets, logVolume, summarizeSets } from '../../lib/workout'
import { useStore } from '../../store/useStore'
import type { WorkoutLog } from '../../types'

export function HistoryPanel() {
  const logs = useStore((s) => s.workoutLogs)
  const deleteWorkoutLog = useStore((s) => s.deleteWorkoutLog)
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const list = [...logs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  const log: WorkoutLog | undefined = list.find((l) => l.id === openId)

  if (list.length === 0) {
    return (
      <EmptyState icon={Dumbbell} title="Nenhum treino no histórico">
        Quando você finalizar um treino, ele aparece aqui com as séries, a carga e o tempo.
      </EmptyState>
    )
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-2" aria-label="Treinos feitos">
        {list.map((l) => (
          <li key={l.id}>
            <button className="card flex w-full items-center gap-3 p-4 text-left hover:border-line-strong" onClick={() => setOpenId(l.id)}>
              <Dumbbell size={22} className="shrink-0 text-accent" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{l.name}</span>
                <span className="block text-xs text-muted">
                  {weekdayName(l.date)}, {formatBR(l.date)}
                </span>
              </span>
              <span className="tabular text-right text-xs text-muted">
                {doneSets(l)} séries<br />
                {l.durationMin ? `${l.durationMin} min` : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={!!log}
        onClose={() => setOpenId(null)}
        title={log ? log.name : 'Treino'}
        footer={
          log && (
            <>
              <button className="btn btn-danger mr-auto" onClick={() => setConfirm(true)}><Trash2 size={16} aria-hidden /> Excluir</button>
              <button className="btn" onClick={() => setOpenId(null)}>Fechar</button>
            </>
          )
        }
      >
        {log && (
          <div className="grid grid-cols-1 gap-4">
            <p className="text-sm text-muted">
              {weekdayName(log.date)}, {formatBR(log.date)}
              {log.durationMin ? ` · ${log.durationMin} min` : ''} · volume {logVolume(log)} kg
            </p>
            {log.exercises.map((e) => (
              <div key={e.id}>
                <h3 className="font-sans text-base font-semibold">{e.name}</h3>
                <p className="tabular text-sm text-muted">{summarizeSets(e.sets)}</p>
              </div>
            ))}
            {log.note && <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm">{log.note}</p>}
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={confirm}
        title="Excluir este treino?"
        message="Ele sai do histórico e da evolução dos exercícios."
        confirmLabel="Excluir"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          if (log) deleteWorkoutLog(log.id)
          setConfirm(false)
          setOpenId(null)
        }}
      />
    </>
  )
}
