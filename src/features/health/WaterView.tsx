import { useState } from 'react'
import { ChevronLeft, ChevronRight, Droplets, Minus, Plus } from 'lucide-react'
import { Field, PageHeader, ProgressBar } from '../../components/ui'
import { formatLong, fromKey, shiftKey, todayKey, weekKeys, WEEKDAY_SHORT, weekdayOf } from '../../lib/dates'
import { formatMl, waterPercent } from '../../lib/health'
import { useStore } from '../../store/useStore'

export function WaterView() {
  const water = useStore((s) => s.water)
  const goal = useStore((s) => s.settings.waterGoalMl)
  const cup = useStore((s) => s.settings.waterCupMl)
  const { addWater, updateSettings } = useStore.getState()
  const today = todayKey()
  const [date, setDate] = useState(today)
  const shown = date > today ? today : date
  const ml = water[shown] ?? 0
  const pct = waterPercent(ml, goal)
  const week = weekKeys(today)
  const weekMax = Math.max(goal, ...week.map((d) => water[d] ?? 0))
  const [custom, setCustom] = useState('')

  const setNum = (key: 'waterGoalMl' | 'waterCupMl', v: string, min: number, max: number) => {
    const n = Math.floor(Number(v))
    if (Number.isFinite(n) && n >= min) updateSettings({ [key]: Math.min(max, n) })
  }

  return (
    <>
      <PageHeader title="Água" subtitle="Toque em “1 copo” toda vez que beber. O app conta até a sua meta do dia." />

      <div className="mb-4 flex items-center justify-between">
        <button className="icon-btn" onClick={() => setDate(shiftKey(shown, -1))} aria-label="Dia anterior"><ChevronLeft size={20} /></button>
        <span className="font-semibold">{shown === today ? 'Hoje' : formatLong(fromKey(shown))}</span>
        <button className="icon-btn" onClick={() => setDate(shiftKey(shown, 1))} disabled={shown >= today} aria-label="Próximo dia"><ChevronRight size={20} /></button>
      </div>

      <section className="card metal p-6 text-center" aria-label="Água do dia">
        <Droplets size={28} className="mx-auto text-accent" aria-hidden />
        <div className="tabular mt-2 font-display text-5xl">{formatMl(ml)}</div>
        <p className="mt-1 text-sm text-muted">
          de {formatMl(goal)} · {pct}% {ml >= goal && <strong className="text-accent">· meta batida!</strong>}
        </p>
        <ProgressBar className="mx-auto mt-4 max-w-sm" value={pct} label="Progresso da água" />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button className="btn btn-primary min-h-14 min-w-44 text-base" onClick={() => addWater(shown, cup)}>
            <Plus size={20} aria-hidden /> 1 copo ({formatMl(cup)})
          </button>
          <button className="btn min-h-14" onClick={() => addWater(shown, 500)}>
            <Plus size={18} aria-hidden /> 500 ml
          </button>
          <button className="btn min-h-14" onClick={() => addWater(shown, -cup)} disabled={ml === 0} aria-label={`Desfazer um copo (${formatMl(cup)})`}>
            <Minus size={18} aria-hidden /> Desfazer
          </button>
        </div>

        <form
          className="mx-auto mt-5 flex max-w-xs gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const n = Math.floor(Number(custom))
            if (n > 0 && n <= 5000) addWater(shown, n)
            setCustom('')
          }}
        >
          <input className="input" inputMode="numeric" placeholder="Outro valor, em ml" aria-label="Outro valor em mililitros" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} />
          <button className="btn" type="submit" disabled={!custom}>Somar</button>
        </form>
      </section>

      <section className="card mt-4 p-4" aria-label="Água na semana">
        <h2 className="mb-3 text-base">Esta semana</h2>
        <ul className="flex h-32 items-end justify-between gap-2">
          {week.map((d) => {
            const v = water[d] ?? 0
            return (
              <li key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${formatMl(v)}`}>
                <span className="tabular text-[10px] text-muted">{v ? formatMl(v) : ''}</span>
                <span className={`w-full max-w-10 rounded-t ${v >= goal ? 'bg-accent' : 'bg-line-strong'} ${d > today ? 'opacity-30' : ''}`} style={{ height: `${Math.max(v ? 6 : 2, (v / weekMax) * 70)}%` }} />
                <span className="text-[11px] capitalize text-muted">{WEEKDAY_SHORT[weekdayOf(d)]}</span>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-muted">A barra fica dourada nos dias em que a meta foi batida.</p>
      </section>

      <section className="card mt-4 grid grid-cols-2 gap-4 p-4" aria-label="Configurar água">
        <Field label="Meta por dia (ml)" htmlFor="w-goal">
          <input id="w-goal" className="input" inputMode="numeric" value={goal} onChange={(e) => setNum('waterGoalMl', e.target.value, 100, 10000)} />
        </Field>
        <Field label="Tamanho do copo (ml)" htmlFor="w-cup">
          <input id="w-cup" className="input" inputMode="numeric" value={cup} onChange={(e) => setNum('waterCupMl', e.target.value, 50, 2000)} />
        </Field>
      </section>
    </>
  )
}
