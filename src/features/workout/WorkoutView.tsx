import { useState } from 'react'
import { Dumbbell, Pencil, Play, Plus } from 'lucide-react'
import { EmptyState, PageHeader } from '../../components/ui'
import { todayKey, weekKeys } from '../../lib/dates'
import { PRESET_TEMPLATES, emptyWorkout, newActive, startFromTemplate, workoutsInDates } from '../../lib/workout'
import { uid } from '../../lib/id'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import { ActiveWorkoutPanel } from './ActiveWorkout'
import { HistoryPanel } from './HistoryPanel'
import { ProgressPanel } from './ProgressPanel'
import { TemplateEditor, type TemplateTarget } from './TemplateEditor'

type Tab = 'treinar' | 'modelos' | 'historico' | 'evolucao'
const TABS: { id: Tab; label: string }[] = [
  { id: 'treinar', label: 'Treinar' },
  { id: 'modelos', label: 'Meus treinos' },
  { id: 'historico', label: 'Histórico' },
  { id: 'evolucao', label: 'Evolução' },
]

export function WorkoutView() {
  const templates = useStore((s) => s.workouts)
  const logs = useStore((s) => s.workoutLogs)
  const active = useStore((s) => s.activeWorkout)
  const { setActiveWorkout, addTemplate } = useStore.getState()
  const toast = useUI((s) => s.toast)
  const [tab, setTab] = useState<Tab>('treinar')
  const [target, setTarget] = useState<TemplateTarget>(null)
  const today = todayKey()
  const thisWeek = workoutsInDates(logs, weekKeys(today))

  const addPreset = (p: (typeof PRESET_TEMPLATES)[number]) => {
    addTemplate({ name: p.name, exercises: p.exercises.map(([name, sets, reps]) => ({ id: uid(), name, sets, reps, kg: null })) })
    toast(`“${p.name}” adicionado.`)
  }

  return (
    <>
      <PageHeader
        title="Treino"
        subtitle="Escolha um treino, marque cada série e o app guarda tudo para você ver a evolução."
        actions={
          tab === 'modelos' && (
            <button className="btn btn-primary" onClick={() => setTarget({ id: 'new' })}>
              <Plus size={18} aria-hidden /> Novo treino
            </button>
          )
        }
      />

      <div role="group" aria-label="Seções" className="seg mb-5">
        {TABS.map((t) => (
          <button key={t.id} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'treinar' && active && <span className="ml-1.5 inline-block size-2 rounded-full bg-accent align-middle" aria-label="treino em andamento" />}
          </button>
        ))}
      </div>

      {tab === 'treinar' &&
        (active ? (
          <ActiveWorkoutPanel active={active} />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <p className="text-sm text-muted">
              Treinos nesta semana: <strong className="tabular text-ink">{thisWeek}</strong>
            </p>
            {templates.length === 0 ? (
              <EmptyState icon={Dumbbell} title="Você ainda não tem treinos montados" action={<button className="btn btn-primary" onClick={() => setTab('modelos')}>Montar meus treinos</button>}>
                Crie um treino (por exemplo, Treino A) ou use um modelo pronto. Também dá para fazer um treino livre agora, adicionando os exercícios na hora.
              </EmptyState>
            ) : (
              <ul className="grid grid-cols-1 gap-3">
                {templates.map((t) => (
                  <li key={t.id} className="card flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg">{t.name}</h2>
                      <p className="truncate text-sm text-muted">{t.exercises.map((e) => e.name).join(' · ') || 'Sem exercícios'}</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setActiveWorkout(newActive(startFromTemplate(t, logs, today)))}>
                      <Play size={16} aria-hidden /> Começar
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button className="btn" onClick={() => setActiveWorkout(newActive(emptyWorkout(today)))}>
              <Plus size={16} aria-hidden /> Treino livre (sem modelo)
            </button>
          </div>
        ))}

      {tab === 'modelos' && (
        <div className="grid grid-cols-1 gap-6">
          {templates.length > 0 && (
            <ul className="grid grid-cols-1 gap-3" aria-label="Meus treinos">
              {templates.map((t) => (
                <li key={t.id}>
                  <button className="card flex w-full items-center gap-3 p-4 text-left hover:border-line-strong" onClick={() => setTarget({ id: t.id })}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-lg">{t.name}</span>
                      <span className="block truncate text-sm text-muted">{t.exercises.length} exercício(s): {t.exercises.map((e) => e.name).join(', ')}</span>
                    </span>
                    <Pencil size={16} className="shrink-0 text-muted" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <section aria-label="Modelos prontos">
            <h2 className="mb-1 text-lg">Modelos prontos</h2>
            <p className="mb-3 text-sm text-muted">Toque para adicionar à sua lista. Depois você pode editar à vontade.</p>
            <ul className="grid grid-cols-1 gap-2">
              {PRESET_TEMPLATES.map((p) => (
                <li key={p.name} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block truncate text-xs text-muted">{p.exercises.map((e) => e[0]).join(', ')}</span>
                  </span>
                  <button className="btn btn-sm" onClick={() => addPreset(p)} disabled={templates.some((t) => t.name === p.name)}>
                    {templates.some((t) => t.name === p.name) ? 'Já adicionado' : 'Adicionar'}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {tab === 'historico' && <HistoryPanel />}
      {tab === 'evolucao' && <ProgressPanel />}

      <TemplateEditor target={target} onClose={() => setTarget(null)} />
    </>
  )
}
