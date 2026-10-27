import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Utensils, X } from 'lucide-react'
import { EmptyState, Field, PageHeader, ProgressBar } from '../../components/ui'
import { formatBR, formatLong, fromKey, shiftKey, todayKey, weekKeys, WEEKDAY_SHORT, weekdayOf } from '../../lib/dates'
import { MEAL_TYPES, mealsOfDay } from '../../lib/health'
import { dayTotals, goalPercent, kcalByDate, recentFoods } from '../../lib/nutrition'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { Meal, MealType } from '../../types'

function defaultType(hour: number): MealType {
  if (hour < 10) return 'cafe'
  if (hour < 15) return 'almoco'
  if (hour < 18) return 'lanche'
  return 'jantar'
}

const num = (v: string): number | null => {
  const n = Math.round(Number(v.replace(',', '.')))
  return Number.isFinite(n) && n > 0 ? n : null
}

function Macro({ label, value, unit = 'g' }: { label: string; value: number; unit?: string }) {
  return (
    <div className="text-center">
      <div className="tabular font-display text-xl">{value}<span className="ml-0.5 font-sans text-xs text-muted">{unit}</span></div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}

export function MealsView() {
  const meals = useStore((s) => s.meals)
  const kcalGoal = useStore((s) => s.settings.kcalGoal)
  const proteinGoal = useStore((s) => s.settings.proteinGoal)
  const { addMeal, deleteMeal, updateSettings } = useStore.getState()
  const toast = useUI((s) => s.toast)
  const today = todayKey()
  const [date, setDate] = useState(today)
  const shown = date > today ? today : date
  const [type, setType] = useState<MealType>(() => defaultType(new Date().getHours()))
  const [note, setNote] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [more, setMore] = useState(false)
  const day = mealsOfDay(meals, shown)
  const totals = dayTotals(day)
  const week = weekKeys(today)
  const weekKcal = kcalByDate(meals, week)
  const weekMax = Math.max(1, kcalGoal, ...weekKcal)
  const recent = recentFoods(meals)

  const reset = () => {
    setNote('')
    setKcal('')
    setProtein('')
    setCarbs('')
    setFat('')
  }

  const repeat = (m: Meal) => {
    addMeal({ date: shown, type, note: m.note, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat })
    toast(`“${m.note}” anotado.`)
  }

  return (
    <>
      <PageHeader title="Alimentação" subtitle="Anote o que comeu. Calorias e proteína são opcionais; se preencher, o app soma o dia." />

      <div className="mb-4 flex items-center justify-between">
        <button className="icon-btn" onClick={() => setDate(shiftKey(shown, -1))} aria-label="Dia anterior"><ChevronLeft size={20} /></button>
        <span className="font-semibold">{shown === today ? 'Hoje' : formatLong(fromKey(shown))}</span>
        <button className="icon-btn" onClick={() => setDate(shiftKey(shown, 1))} disabled={shown >= today} aria-label="Próximo dia"><ChevronRight size={20} /></button>
      </div>

      <section className="card metal p-4" aria-label="Resumo do dia">
        <div className="grid grid-cols-4 gap-2">
          <Macro label="calorias" value={totals.kcal} unit="" />
          <Macro label="proteína" value={totals.protein} />
          <Macro label="carbo" value={totals.carbs} />
          <Macro label="gordura" value={totals.fat} />
        </div>
        {(kcalGoal > 0 || proteinGoal > 0) && (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {kcalGoal > 0 && (
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>Calorias</span>
                  <span className="tabular">{totals.kcal} de {kcalGoal} kcal</span>
                </div>
                <ProgressBar value={goalPercent(totals.kcal, kcalGoal)} label="Calorias do dia" />
              </div>
            )}
            {proteinGoal > 0 && (
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>Proteína</span>
                  <span className="tabular">{totals.protein} de {proteinGoal} g</span>
                </div>
                <ProgressBar value={goalPercent(totals.protein, proteinGoal)} label="Proteína do dia" />
              </div>
            )}
          </div>
        )}
      </section>

      <form
        className="card mt-4 grid grid-cols-1 gap-4 p-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!note.trim()) return
          addMeal({ date: shown, type, note: note.trim(), kcal: num(kcal), protein: num(protein), carbs: num(carbs), fat: num(fat) })
          reset()
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Calorias" htmlFor="m-kcal">
            <input id="m-kcal" className="input" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value.replace(/\D/g, ''))} placeholder="kcal" />
          </Field>
          <Field label="Proteína (g)" htmlFor="m-prot">
            <input id="m-prot" className="input" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value.replace(/\D/g, ''))} placeholder="g" />
          </Field>
        </div>
        <button type="button" className="flex items-center gap-1 text-left text-sm text-accent" aria-expanded={more} onClick={() => setMore((v) => !v)}>
          <ChevronDown size={16} className={more ? 'rotate-180' : ''} aria-hidden /> {more ? 'Menos detalhes' : 'Carboidrato e gordura'}
        </button>
        {more && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Carboidrato (g)" htmlFor="m-carb">
              <input id="m-carb" className="input" inputMode="numeric" value={carbs} onChange={(e) => setCarbs(e.target.value.replace(/\D/g, ''))} />
            </Field>
            <Field label="Gordura (g)" htmlFor="m-fat">
              <input id="m-fat" className="input" inputMode="numeric" value={fat} onChange={(e) => setFat(e.target.value.replace(/\D/g, ''))} />
            </Field>
          </div>
        )}
        <button className="btn btn-primary min-h-12" type="submit" disabled={!note.trim()}>
          <Plus size={18} aria-hidden /> Anotar refeição
        </button>
      </form>

      {recent.length > 0 && (
        <section className="mt-4" aria-label="Comidas recentes">
          <h2 className="mb-2 px-1 font-sans text-xs font-semibold uppercase tracking-wider text-muted">Comer de novo (toque para anotar)</h2>
          <div className="flex flex-wrap gap-2">
            {recent.map((m) => (
              <button key={m.id} className="chip min-h-9 cursor-pointer px-3 text-sm hover:text-ink" onClick={() => repeat(m)}>
                <Plus size={13} aria-hidden /> {m.note.length > 28 ? `${m.note.slice(0, 28)}…` : m.note}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6" aria-label="Refeições do dia">
        {day.length === 0 ? (
          <EmptyState icon={Utensils} title="Nada anotado neste dia">
            Escolha a refeição, escreva o que comeu e toque em Anotar refeição.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {MEAL_TYPES.map((t) => {
              const items = day.filter((m) => m.type === t.id)
              if (items.length === 0) return null
              const k = items.reduce((n, m) => n + (m.kcal ?? 0), 0)
              return (
                <div key={t.id}>
                  <h2 className="mb-1 flex justify-between px-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted">
                    <span>{t.label}</span>
                    {k > 0 && <span className="tabular">{k} kcal</span>}
                  </h2>
                  <ul className="grid grid-cols-1 gap-0.5">
                    {items.map((m) => (
                      <li key={m.id} className="flex items-center gap-2 rounded-xl px-2 hover:bg-surface-2/60">
                        <span className="min-h-11 min-w-0 flex-1 py-2.5">
                          {m.note}
                          {(m.kcal || m.protein) && (
                            <span className="tabular block text-xs text-muted">
                              {[m.kcal && `${m.kcal} kcal`, m.protein && `${m.protein} g prot.`, m.carbs && `${m.carbs} g carbo`, m.fat && `${m.fat} g gord.`].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </span>
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
        )}
      </section>

      <section className="card mt-6 p-4" aria-label="Calorias na semana">
        <h2 className="mb-3 text-base">Calorias na semana</h2>
        <ul className="flex h-32 items-end justify-between gap-2">
          {week.map((d, i) => {
            const v = weekKcal[i]
            return (
              <li key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${formatBR(d)}: ${v} kcal`}>
                <span className="tabular text-[10px] text-muted">{v || ''}</span>
                <span className={`w-full max-w-10 rounded-t ${d === today ? 'bg-accent' : 'bg-line-strong'} ${d > today ? 'opacity-30' : ''}`} style={{ height: `${Math.max(v ? 6 : 2, (v / weekMax) * 70)}%` }} />
                <span className="text-[11px] capitalize text-muted">{WEEKDAY_SHORT[weekdayOf(d)]}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card mt-4 p-4" aria-label="Metas do dia">
        <h2 className="mb-1 text-base">Suas metas do dia</h2>
        <p className="mb-3 text-sm text-muted">Opcional. Deixe 0 se não quiser acompanhar.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Calorias (kcal)" htmlFor="g-kcal">
            <input id="g-kcal" className="input" inputMode="numeric" value={kcalGoal} onChange={(e) => updateSettings({ kcalGoal: Math.min(10000, Number(e.target.value.replace(/\D/g, '')) || 0) })} />
          </Field>
          <Field label="Proteína (g)" htmlFor="g-prot">
            <input id="g-prot" className="input" inputMode="numeric" value={proteinGoal} onChange={(e) => updateSettings({ proteinGoal: Math.min(1000, Number(e.target.value.replace(/\D/g, '')) || 0) })} />
          </Field>
        </div>
      </section>
    </>
  )
}
