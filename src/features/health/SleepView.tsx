import { useState } from 'react'
import { ChevronLeft, ChevronRight, Moon } from 'lucide-react'
import { Field, PageHeader } from '../../components/ui'
import { formatLong, fromKey, shiftKey, todayKey, weekKeys, WEEKDAY_SHORT, weekdayOf } from '../../lib/dates'
import { averageSleep, formatHours, sleepHours } from '../../lib/sleep'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'

const QUALITY = ['Ruim', 'Fraco', 'Normal', 'Bom', 'Ótimo']

export function SleepView() {
  const sleep = useStore((s) => s.sleep)
  const goal = useStore((s) => s.settings.sleepGoalH)
  const { setSleep, updateSettings } = useStore.getState()
  const toast = useUI((s) => s.toast)
  const today = todayKey()
  const [date, setDate] = useState(today)
  const shown = date > today ? today : date
  const saved = sleep[shown]
  const [bed, setBed] = useState('23:00')
  const [wake, setWake] = useState('07:00')
  const [quality, setQuality] = useState<number | null>(null)
  const hours = sleepHours(bed, wake)
  const week = weekKeys(today)
  const avg = averageSleep(sleep, week)
  const weekMax = Math.max(goal, 10, ...week.map((d) => sleep[d]?.hours ?? 0))

  return (
    <>
      <PageHeader title="Sono" subtitle="Anote a hora que deitou e a que acordou. O app calcula quantas horas você dormiu." />

      <div className="mb-4 flex items-center justify-between">
        <button className="icon-btn" onClick={() => setDate(shiftKey(shown, -1))} aria-label="Dia anterior"><ChevronLeft size={20} /></button>
        <span className="text-center font-semibold">
          {shown === today ? 'Noite passada (acordei hoje)' : `Acordei em ${formatLong(fromKey(shown))}`}
        </span>
        <button className="icon-btn" onClick={() => setDate(shiftKey(shown, 1))} disabled={shown >= today} aria-label="Próximo dia"><ChevronRight size={20} /></button>
      </div>

      {saved && (
        <section className="card metal mb-4 p-5 text-center" aria-label="Sono registrado">
          <Moon size={26} className="mx-auto text-accent" aria-hidden />
          <div className="tabular mt-2 font-display text-5xl">{formatHours(saved.hours)}</div>
          <p className="mt-1 text-sm text-muted">
            {saved.hours >= goal ? 'Meta de sono batida.' : `Faltaram ${formatHours(goal - saved.hours)} para a meta de ${formatHours(goal)}.`}
            {saved.quality ? ` Qualidade: ${QUALITY[saved.quality - 1]}.` : ''}
          </p>
          <button className="btn btn-ghost btn-sm mt-3" onClick={() => setSleep(shown, null)}>Apagar este registro</button>
        </section>
      )}

      <form
        className="card grid grid-cols-1 gap-4 p-4"
        onSubmit={(e) => {
          e.preventDefault()
          setSleep(shown, { hours, quality })
          toast(`Sono anotado: ${formatHours(hours)}.`)
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fui dormir às" htmlFor="sl-bed"><input id="sl-bed" type="time" className="input" value={bed} onChange={(e) => setBed(e.target.value)} required /></Field>
          <Field label="Acordei às" htmlFor="sl-wake"><input id="sl-wake" type="time" className="input" value={wake} onChange={(e) => setWake(e.target.value)} required /></Field>
        </div>
        <p className="text-center text-sm">
          Isso dá <strong className="tabular">{formatHours(hours)}</strong> de sono
        </p>
        <div>
          <span className="label" id="sl-q">Como foi a qualidade? (opcional)</span>
          <div className="grid grid-cols-5 gap-1.5" role="group" aria-labelledby="sl-q">
            {QUALITY.map((q, i) => (
              <button type="button" key={q} aria-pressed={quality === i + 1} onClick={() => setQuality(quality === i + 1 ? null : i + 1)} className={`min-h-11 rounded-lg border text-xs font-semibold ${quality === i + 1 ? 'border-transparent bg-accent text-accent-fg' : 'border-line-strong text-muted'}`}>
                {q}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary min-h-12" type="submit">{saved ? 'Atualizar registro' : 'Anotar sono'}</button>
      </form>

      <section className="card mt-4 p-4" aria-label="Sono na semana">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base">Esta semana</h2>
          <span className="tabular text-sm text-muted">{avg !== null ? `média ${formatHours(avg)}` : 'sem registros'}</span>
        </div>
        <ul className="relative flex h-32 items-end justify-between gap-2">
          {week.map((d) => {
            const h = sleep[d]?.hours ?? 0
            return (
              <li key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={h ? formatHours(h) : 'sem registro'}>
                <span className="tabular text-[10px] text-muted">{h ? formatHours(h) : ''}</span>
                <span className={`w-full max-w-10 rounded-t ${h >= goal ? 'bg-accent' : 'bg-line-strong'} ${d > today ? 'opacity-30' : ''}`} style={{ height: `${Math.max(h ? 6 : 2, (h / weekMax) * 70)}%` }} />
                <span className="text-[11px] capitalize text-muted">{WEEKDAY_SHORT[weekdayOf(d)]}</span>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-muted">Dourado = bateu a meta de {formatHours(goal)}.</p>
        <div className="mt-3 max-w-[200px]">
          <Field label="Meta de sono (horas)" htmlFor="sl-goal">
            <input id="sl-goal" className="input" inputMode="decimal" value={goal} onChange={(e) => { const n = Number(e.target.value.replace(',', '.')); if (n >= 3 && n <= 14) updateSettings({ sleepGoalH: n }) }} />
          </Field>
        </div>
      </section>
    </>
  )
}
