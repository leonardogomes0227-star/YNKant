import { useState } from 'react'
import { ChevronLeft, ChevronRight, Utensils, X } from 'lucide-react'
import { EmptyState, Field, PageHeader } from '../../components/ui'
import { formatLong, fromKey, shiftKey, todayKey } from '../../lib/dates'
import { MEAL_TYPES, mealsOfDay, totalKcal } from '../../lib/health'
import { useStore } from '../../store/useStore'
import type { MealType } from '../../types'

function defaultType(hour: number): MealType {
  if (hour < 10) return 'cafe'
  if (hour < 15) return 'almoco'
  if (hour < 18) return 'lanche'
  return 'jantar'
}

export function MealsView() {
  const meals = useStore((s) => s.meals)
  const { addMeal, deleteMeal } = useStore.getState()
  const today = todayKey()
  const [date, setDate] = useState(today)
  const shown = date > today ? today : date
  const [type, setType] = useState<MealType>(() => defaultType(new Date().getHours()))
  const [note, setNote] = useState('')
  const [kcal, setKcal] = useState('')
  const day = mealsOfDay(meals, shown)
  const total = totalKcal(day)

  return (
    <>
      <PageHeader title="Alimentação" subtitle="Anote o que você comeu em cada refeição. As calorias são opcionais." />

      <div className="mb-4 flex items-center justify-between">
        <button className="icon-btn" onClick={() => setDate(shiftKey(shown, -1))} aria-label="Dia anterior"><ChevronLeft size={20} /></button>
        <span className="font-semibold">{shown === today ? 'Hoje' : formatLong(fromKey(shown))}</span>
        <button className="icon-btn" onClick={() => setDate(shiftKey(shown, 1))} disabled={shown >= today} aria-label="Próximo dia"><ChevronRight size={20} /></button>
      </div>

      <form
        className="card grid grid-cols-1 gap-4 p-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!note.trim()) return
          const k = Math.floor(Number(kcal))
          addMeal({ date: shown, type, note: note.trim(), kcal: k > 0 ? k : null })
          setNote('')
          setKcal('')
        }}
      >
        <div className="seg w-full" role="group" aria-label="Refeição">
          {MEAL_TYPES.map((m) => (
            <button type="button" key={m.id} className="flex-1 px-2" aria-pressed={type === m.id} onClick={() => setType(m.id)}>
              {m.label.replace(' da manhã', '')}
            </button>
          ))}
        </div>
        <Field label="O que você comeu?" htmlFor="m-note">
          <input id="m-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: arroz, feijão, frango e salada" />
        </Field>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <Field label="Calorias (opcional)" htmlFor="m-kcal">
            <input id="m-kcal" className="input" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value.replace(/\D/g, ''))} placeholder="kcal" />
          </Field>
          <button className="btn btn-primary min-h-[42px]" type="submit" disabled={!note.trim()}>Anotar</button>
        </div>
      </form>

      <section className="mt-6" aria-label="Refeições do dia">
        {day.length === 0 ? (
          <EmptyState icon={Utensils} title="Nada anotado neste dia">
            Escolha a refeição, escreva o que comeu e toque em Anotar. Assim você acompanha a sua alimentação sem esforço.
          </EmptyState>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {MEAL_TYPES.map((t) => {
                const items = day.filter((m) => m.type === t.id)
                if (items.length === 0) return null
                return (
                  <div key={t.id}>
                    <h2 className="mb-1 px-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted">{t.label}</h2>
                    <ul className="grid grid-cols-1 gap-0.5">
                      {items.map((m) => (
                        <li key={m.id} className="flex items-center gap-2 rounded-xl px-2 hover:bg-surface-2/60">
                          <span className="min-h-11 min-w-0 flex-1 py-2.5">{m.note}</span>
                          {m.kcal && <span className="tabular text-sm text-muted">{m.kcal} kcal</span>}
                          <button className="icon-btn icon-btn-sm" onClick={() => deleteMeal(m.id)} aria-label={`Apagar “${m.note}”`}>
                            <X size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
            {total > 0 && (
              <p className="mt-5 rounded-xl bg-accent-soft px-4 py-3 text-sm">
                Total anotado no dia: <strong className="tabular">{total} kcal</strong>
              </p>
            )}
          </>
        )}
      </section>
    </>
  )
}
