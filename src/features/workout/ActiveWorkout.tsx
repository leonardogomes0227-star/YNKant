import { useRef, useState } from 'react'
import { Check, Plus, Timer, Trash2, X } from 'lucide-react'
import { ConfirmDialog, Field } from '../../components/ui'
import { formatBR, formatClock } from '../../lib/dates'
import { notify, playChime, unlockAudio } from '../../lib/sound'
import { useNow } from '../../lib/useNow'
import { initialSets, knownExercises, lastPerformance, logVolume, summarizeSets } from '../../lib/workout'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { ActiveWorkout as Active, LoggedExercise, LoggedSet, WorkoutLog } from '../../types'

const nowMs = () => Date.now()

const REST_OPTIONS = [60, 90, 120, 180]

const numOf = (v: string) => {
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function ActiveWorkoutPanel({ active }: { active: Active }) {
  const now = useNow(500)
  const logs = useStore((s) => s.workoutLogs)
  const templates = useStore((s) => s.workouts)
  const sound = useStore((s) => s.settings.sound)
  const { setActiveWorkout, finishWorkout } = useStore.getState()
  const toast = useUI((s) => s.toast)
  const [restSecs, setRestSecs] = useState(90)
  const [restEnd, setRestEnd] = useState<number | null>(null)
  const restTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [newName, setNewName] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const log = active.log
  const names = knownExercises(logs, templates)

  const save = (next: WorkoutLog) => setActiveWorkout({ ...active, log: next })
  const setExercises = (fn: (e: LoggedExercise[]) => LoggedExercise[]) => save({ ...log, exercises: fn(log.exercises) })
  const setSet = (exId: string, i: number, patch: Partial<LoggedSet>) =>
    setExercises((all) => all.map((e) => (e.id === exId ? { ...e, sets: e.sets.map((s, k) => (k === i ? { ...s, ...patch } : s)) } : e)))

  const startRest = (secs: number) => {
    clearTimeout(restTimer.current)
    setRestEnd(nowMs() + secs * 1000)
    restTimer.current = setTimeout(() => {
      setRestEnd(null)
      if (sound) playChime()
      notify('Descanso terminou', 'Hora da próxima série!')
      toast('Descanso terminou. Próxima série!')
    }, secs * 1000)
  }
  const stopRest = () => {
    clearTimeout(restTimer.current)
    setRestEnd(null)
  }

  const toggleDone = (exId: string, i: number, done: boolean) => {
    setSet(exId, i, { done: !done })
    if (!done) {
      unlockAudio()
      startRest(restSecs)
    }
  }

  const addExercise = () => {
    const name = newName.trim()
    if (!name) return
    const sets = initialSets(logs, name, { sets: 3, reps: 10, kg: null })
    setExercises((all) => [...all, { id: crypto.randomUUID?.() ?? String(Math.random()), name, sets }])
    setNewName('')
  }

  const elapsed = Math.max(0, Math.floor((now.getTime() - active.startedAt) / 1000))
  const restLeft = restEnd ? Math.max(0, Math.ceil((restEnd - now.getTime()) / 1000)) : 0
  const volume = logVolume(log)
  const done = log.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
  const total = log.exercises.reduce((n, e) => n + e.sets.length, 0)

  return (
    <div className="grid grid-cols-1 gap-4">
      <section className="card metal sticky top-14 z-20 p-4 md:top-2" aria-label="Treino em andamento">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl">{log.name}</h2>
            <p className="tabular text-sm text-muted">
              {formatClock(elapsed).padStart(5, '0')} de treino · {done}/{total} séries · {volume} kg de volume
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => {
            if (finishWorkout()) toast(`Treino salvo! ${done} ${done === 1 ? "série" : "séries"}.`)
            else toast('Marque pelo menos uma série como feita (toque no ✓).')
          }}>
            <Check size={16} aria-hidden /> Finalizar
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {restEnd ? (
            <>
              <span className="chip chip-accent tabular min-h-8 px-3 text-sm"><Timer size={14} aria-hidden /> Descanso {formatClock(restLeft)}</span>
              <button className="btn btn-sm" onClick={stopRest}>Pular descanso</button>
            </>
          ) : (
            <>
              <span className="text-xs text-muted">Descanso entre séries:</span>
              {REST_OPTIONS.map((s) => (
                <button key={s} className={`chip min-h-8 cursor-pointer px-3 ${restSecs === s ? 'chip-accent' : ''}`} aria-pressed={restSecs === s} onClick={() => setRestSecs(s)}>
                  {s < 120 ? `${s}s` : `${s / 60} min`}
                </button>
              ))}
            </>
          )}
        </div>
      </section>

      {log.exercises.length === 0 && (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted">
          Nenhum exercício ainda. Escreva o nome de um exercício abaixo e toque em Adicionar.
        </p>
      )}

      {log.exercises.map((ex) => {
        const last = lastPerformance(logs, ex.name)
        return (
          <section key={ex.id} className="card p-4" aria-label={ex.name}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-sans text-base font-semibold">{ex.name}</h3>
                {last && <p className="text-xs text-muted">Última vez ({formatBR(last.date)}): {summarizeSets(last.sets)}</p>}
              </div>
              <button className="icon-btn icon-btn-sm" onClick={() => setExercises((all) => all.filter((e) => e.id !== ex.id))} aria-label={`Remover ${ex.name} do treino`}>
                <Trash2 size={16} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)_44px_32px] items-center gap-2 text-center text-xs text-muted">
              <span>Série</span><span>Carga (kg)</span><span>Repetições</span><span>Feita</span><span />
            </div>
            <ul className="mt-1 grid grid-cols-1 gap-1.5">
              {ex.sets.map((s, i) => (
                <li key={i} className={`grid grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)_44px_32px] items-center gap-2 rounded-xl ${s.done ? 'bg-accent-soft' : ''}`}>
                  <span className="tabular text-center text-sm text-muted">{i + 1}</span>
                  <input className="input min-h-11 text-center" inputMode="decimal" aria-label={`${ex.name}, série ${i + 1}, carga em kg`} value={s.kg || ''} placeholder="0" onChange={(e) => setSet(ex.id, i, { kg: numOf(e.target.value) })} />
                  <input className="input min-h-11 text-center" inputMode="numeric" aria-label={`${ex.name}, série ${i + 1}, repetições`} value={s.reps || ''} placeholder="0" onChange={(e) => setSet(ex.id, i, { reps: Math.floor(numOf(e.target.value)) })} />
                  <button
                    role="checkbox"
                    aria-checked={s.done}
                    aria-label={`Série ${i + 1} de ${ex.name} feita`}
                    onClick={() => toggleDone(ex.id, i, s.done)}
                    className={`grid size-11 place-items-center rounded-xl border ${s.done ? 'border-transparent bg-accent text-accent-fg' : 'border-line-strong text-muted'}`}
                  >
                    <Check size={18} strokeWidth={3} aria-hidden />
                  </button>
                  <button className="icon-btn icon-btn-sm" aria-label={`Remover série ${i + 1}`} onClick={() => setExercises((all) => all.map((e) => (e.id === ex.id ? { ...e, sets: e.sets.filter((_, k) => k !== i) } : e)))}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <button
              className="btn btn-sm mt-3"
              onClick={() => setExercises((all) => all.map((e) => (e.id === ex.id ? { ...e, sets: [...e.sets, { ...(e.sets[e.sets.length - 1] ?? { reps: 10, kg: 0 }), done: false }] } : e)))}
            >
              <Plus size={14} aria-hidden /> Série
            </button>
          </section>
        )
      })}

      <form className="card flex gap-2 p-3" onSubmit={(e) => { e.preventDefault(); addExercise() }}>
        <input className="input" list="ex-names" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Adicionar exercício (ex.: Supino reto)" aria-label="Nome do exercício" />
        <datalist id="ex-names">{names.map((n) => <option key={n} value={n} />)}</datalist>
        <button className="btn" type="submit" disabled={!newName.trim()}><Plus size={16} aria-hidden /> Adicionar</button>
      </form>

      <Field label="Observações do treino (opcional)" htmlFor="w-note">
        <textarea id="w-note" className="input min-h-20" value={log.note} onChange={(e) => save({ ...log, note: e.target.value })} placeholder="Como se sentiu, o que ajustar na próxima…" />
      </Field>

      <button className="btn btn-ghost text-danger" onClick={() => setCancelling(true)}>Cancelar este treino</button>
      <ConfirmDialog
        open={cancelling}
        title="Cancelar o treino?"
        message="O que você marcou neste treino será descartado e não vai para o histórico."
        confirmLabel="Descartar treino"
        danger
        onCancel={() => setCancelling(false)}
        onConfirm={() => {
          stopRest()
          setActiveWorkout(null)
          setCancelling(false)
        }}
      />
    </div>
  )
}
