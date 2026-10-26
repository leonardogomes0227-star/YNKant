import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Field } from '../../components/ui'
import { formatBR, formatLong, fromKey, shiftKey, todayKey } from '../../lib/dates'
import { MOODS } from '../../lib/moods'
import { useNow } from '../../lib/useNow'
import { useStore } from '../../store/useStore'
import type { DateKey } from '../../types'

export function JournalPanel() {
  const now = useNow(60_000)
  const today = todayKey(now)
  const journal = useStore((s) => s.journal)
  const setJournal = useStore((s) => s.setJournal)
  const [date, setDate] = useState<DateKey>(today)
  const shown = date > today ? today : date
  const entry = journal[shown] ?? { mood: null, how: '', good: ['', '', ''] as [string, string, string], improve: '' }
  const isToday = shown === today
  const recent = Object.entries(journal)
    .filter(([k, e]) => k <= today && (e.mood !== null || e.how || e.improve || e.good.some(Boolean)))
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 10)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <section aria-label="Diário do dia" className="card metal p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl">{isToday ? 'Hoje' : formatLong(fromKey(shown))}</h2>
          <div className="flex items-center gap-1">
            <button className="icon-btn" onClick={() => setDate(shiftKey(shown, -1))} aria-label="Dia anterior"><ChevronLeft size={20} /></button>
            <button className="btn btn-sm" onClick={() => setDate(today)} disabled={isToday}>Hoje</button>
            <button className="icon-btn" onClick={() => setDate(shiftKey(shown, 1))} disabled={isToday} aria-label="Próximo dia"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid gap-5">
          <div>
            <span className="label" id="mood-l">Humor</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="mood-l">
              {MOODS.map((m) => {
                const on = entry.mood === m.value
                return (
                  <button
                    key={m.value}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setJournal(shown, { mood: on ? null : m.value })}
                    className={`flex min-h-16 w-[calc(20%-7px)] min-w-[58px] flex-col items-center justify-center gap-1 rounded-xl border text-xs font-semibold transition-colors ${
                      on ? 'border-transparent bg-accent text-accent-fg' : 'border-line-strong text-muted hover:text-ink'
                    }`}
                  >
                    <m.icon size={22} aria-hidden />
                    <span className="tabular">{m.value}</span>
                    <span className="sr-only">{m.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-1 text-xs text-muted">{entry.mood ? `${entry.mood} — ${MOODS[entry.mood - 1].label}` : '1 = péssimo, 5 = ótimo'}</p>
          </div>

          <Field label={isToday ? 'Como foi hoje' : 'Como foi o dia'} htmlFor="j-how">
            <textarea id="j-how" className="input" value={entry.how} onChange={(e) => setJournal(shown, { how: e.target.value })} placeholder="Escreva em poucas linhas…" />
          </Field>

          <fieldset className="m-0 border-0 p-0">
            <legend className="label">Três coisas boas</legend>
            <div className="grid gap-2">
              {[0, 1, 2].map((i) => (
                <input
                  key={i}
                  className="input"
                  aria-label={`Coisa boa ${i + 1}`}
                  placeholder={`${i + 1}.`}
                  value={entry.good[i]}
                  onChange={(e) => {
                    const good = [...entry.good] as [string, string, string]
                    good[i] = e.target.value
                    setJournal(shown, { good })
                  }}
                />
              ))}
            </div>
          </fieldset>

          <Field label="O que melhorar amanhã" htmlFor="j-improve">
            <textarea id="j-improve" className="input" value={entry.improve} onChange={(e) => setJournal(shown, { improve: e.target.value })} />
          </Field>
          <p className="text-xs text-muted">Salvo automaticamente neste aparelho.</p>
        </div>
      </section>

      <aside aria-label="Dias anteriores">
        <h2 className="mb-3 text-base">Dias recentes</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">Quando você registrar um dia, ele aparece aqui para consulta rápida.</p>
        ) : (
          <ul className="grid gap-1">
            {recent.map(([k, e]) => {
              const Icon = e.mood ? MOODS[e.mood - 1].icon : null
              return (
                <li key={k}>
                  <button className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-surface-2 ${k === shown ? 'bg-surface-2' : ''}`} onClick={() => setDate(k)}>
                    {Icon ? <Icon size={18} className="shrink-0 text-accent" aria-label={`Humor ${e.mood}`} /> : <span className="size-[18px]" />}
                    <span className="tabular text-sm">{k === today ? 'Hoje' : formatBR(k)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </aside>
    </div>
  )
}
