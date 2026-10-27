import { useState } from 'react'
import { LineChart, Trash2, Trophy } from 'lucide-react'
import { EmptyState, Field } from '../../components/ui'
import { formatBR, shiftKey, todayKey, weekStartKey } from '../../lib/dates'
import { exerciseHistory, knownExercises, workoutsInDates } from '../../lib/workout'
import { useStore } from '../../store/useStore'

const kg = (n: number) => `${String(n).replace('.', ',')} kg`

export function ProgressPanel() {
  const logs = useStore((s) => s.workoutLogs)
  const body = useStore((s) => s.body)
  const { addBody, deleteBody } = useStore.getState()
  const today = todayKey()
  const names = knownExercises(logs)
  const [picked, setPicked] = useState('')
  const exercise = names.includes(picked) ? picked : names[0] ?? ''
  const hist = exercise ? exerciseHistory(logs, exercise) : []
  const recent = hist.slice(-12)
  const maxKg = Math.max(1, ...recent.map((p) => p.topKg))
  const bestKg = hist.length ? Math.max(...hist.map((p) => p.topKg)) : 0
  const best1 = hist.length ? Math.max(...hist.map((p) => p.best1RM)) : 0
  const first = hist[0]
  const last = hist[hist.length - 1]

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = shiftKey(weekStartKey(today), -7 * (7 - i))
    const days = Array.from({ length: 7 }, (_, k) => shiftKey(start, k))
    return { start, n: workoutsInDates(logs, days) }
  })
  const weekMax = Math.max(1, ...weeks.map((w) => w.n))

  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const bodySorted = [...body].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const bodyRecent = bodySorted.slice(-12)
  const minW = Math.min(...bodyRecent.map((b) => b.kg))
  const maxW = Math.max(...bodyRecent.map((b) => b.kg))
  const delta = bodySorted.length > 1 ? Math.round((bodySorted[bodySorted.length - 1].kg - bodySorted[0].kg) * 10) / 10 : null

  return (
    <div className="grid grid-cols-1 gap-6">
      <section aria-label="Evolução por exercício">
        <h2 className="mb-3 text-xl">Evolução por exercício</h2>
        {names.length === 0 ? (
          <EmptyState icon={LineChart} title="Ainda sem dados de evolução">
            Finalize alguns treinos e escolha aqui um exercício para ver sua carga subindo ao longo do tempo.
          </EmptyState>
        ) : (
          <div className="card p-4">
            <Field label="Exercício" htmlFor="ev-ex">
              <select id="ev-ex" className="input" value={exercise} onChange={(e) => setPicked(e.target.value)}>
                {names.map((n) => <option key={n}>{n}</option>)}
              </select>
            </Field>
            {hist.length > 0 && (
              <>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div><div className="tabular font-display text-2xl">{kg(bestKg)}</div><div className="flex items-center justify-center gap-1 text-xs text-muted"><Trophy size={12} className="text-accent" aria-hidden /> Maior carga</div></div>
                  <div><div className="tabular font-display text-2xl">{kg(best1)}</div><div className="text-xs text-muted">1 rep. estimada</div></div>
                  <div><div className="tabular font-display text-2xl">{hist.length}</div><div className="text-xs text-muted">treinos</div></div>
                </div>
                {first && last && hist.length > 1 && (
                  <p className="mt-3 rounded-xl bg-accent-soft px-3 py-2 text-sm">
                    {last.topKg > first.topKg ? `Você subiu ${kg(Math.round((last.topKg - first.topKg) * 10) / 10)} desde o primeiro treino.` : last.topKg === first.topKg ? 'Carga estável desde o primeiro treino.' : `A carga está ${kg(Math.round((first.topKg - last.topKg) * 10) / 10)} abaixo do primeiro treino.`}
                  </p>
                )}
                <ul className="mt-4 flex h-36 items-end justify-between gap-1.5" aria-label={`Carga máxima de ${exercise} por treino`}>
                  {recent.map((p, i) => (
                    <li key={p.date + i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${formatBR(p.date)}: ${kg(p.topKg)}`}>
                      <span className="tabular text-[10px] text-muted">{p.topKg || ''}</span>
                      <span className={`w-full max-w-9 rounded-t ${i === recent.length - 1 ? 'bg-accent' : 'bg-line-strong'}`} style={{ height: `${Math.max(4, (p.topKg / maxKg) * 72)}%` }} />
                      <span className="tabular text-[10px] text-muted">{formatBR(p.date).slice(0, 5)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </section>

      <section className="card p-4" aria-label="Treinos por semana">
        <h2 className="mb-3 text-base">Treinos por semana</h2>
        <ul className="flex h-28 items-end justify-between gap-2">
          {weeks.map((w, i) => (
            <li key={w.start} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`Semana de ${formatBR(w.start)}: ${w.n} treino(s)`}>
              <span className="tabular text-xs text-muted">{w.n || ''}</span>
              <span className={`w-full max-w-9 rounded-t ${i === weeks.length - 1 ? 'bg-accent' : 'bg-line-strong'}`} style={{ height: `${Math.max(w.n ? 8 : 2, (w.n / weekMax) * 68)}%` }} />
              <span className="tabular text-[10px] text-muted">{formatBR(w.start).slice(0, 5)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4" aria-label="Peso e medidas">
        <h2 className="mb-1 text-base">Peso e medidas</h2>
        <p className="mb-3 text-sm text-muted">Anote de vez em quando (por exemplo, toda semana) para ver a tendência.</p>
        <form
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const k = Number(weight.replace(',', '.'))
            if (!(k > 20 && k < 500)) return
            const w = Number(waist.replace(',', '.'))
            addBody({ date: today, kg: Math.round(k * 10) / 10, waistCm: w > 0 ? w : null })
            setWeight('')
            setWaist('')
          }}
        >
          <Field label="Peso (kg)" htmlFor="b-kg"><input id="b-kg" className="input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="72,5" /></Field>
          <Field label="Cintura (cm)" htmlFor="b-waist"><input id="b-waist" className="input" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="opcional" /></Field>
          <button className="btn btn-primary min-h-[42px]" type="submit" disabled={!weight}>Anotar</button>
        </form>
        {bodyRecent.length > 0 && (
          <>
            {delta !== null && <p className="mt-3 text-sm text-muted">Desde o primeiro registro: <strong className={delta <= 0 ? 'text-accent' : 'text-ink'}>{delta > 0 ? '+' : ''}{String(delta).replace('.', ',')} kg</strong></p>}
            <ul className="mt-3 flex h-28 items-end justify-between gap-1.5" aria-label="Peso ao longo do tempo">
              {bodyRecent.map((b, i) => (
                <li key={b.id} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${formatBR(b.date)}: ${kg(b.kg)}`}>
                  <span className="tabular text-[10px] text-muted">{String(b.kg).replace('.', ',')}</span>
                  <span className={`w-full max-w-9 rounded-t ${i === bodyRecent.length - 1 ? 'bg-accent' : 'bg-line-strong'}`} style={{ height: `${maxW === minW ? 50 : 20 + ((b.kg - minW) / (maxW - minW)) * 55}%` }} />
                  <span className="tabular text-[10px] text-muted">{formatBR(b.date).slice(0, 5)}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-3 grid grid-cols-1 gap-0.5 text-sm">
              {[...bodySorted].reverse().slice(0, 5).map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-surface-2/60">
                  <span className="tabular">{formatBR(b.date)} · <strong>{kg(b.kg)}</strong>{b.waistCm ? ` · cintura ${String(b.waistCm).replace('.', ',')} cm` : ''}</span>
                  <button className="icon-btn icon-btn-sm" aria-label={`Apagar registro de ${formatBR(b.date)}`} onClick={() => deleteBody(b.id)}><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
