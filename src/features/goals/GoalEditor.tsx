import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog, Field, Modal } from '../../components/ui'
import { uid } from '../../lib/id'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { Goal, Milestone } from '../../types'

/** Editor de metas: abre quando `pendingOpen` é uma meta (ou 'new'). */
export function GoalEditorHost() {
  const target = useUI((s) => s.pendingOpen)
  const openItem = useUI((s) => s.openItem)
  const goals = useStore((s) => s.goals)
  const open = target?.kind === 'goal'
  const goal = open && target.id !== 'new' ? goals.find((g) => g.id === target.id) : undefined
  const close = () => openItem(null)
  return (
    <Modal open={open && (target.id === 'new' || !!goal)} onClose={close} title={goal ? 'Editar meta' : 'Nova meta'} wide footer={<Footer goal={goal} onClose={close} />}>
      {open && <GoalForm key={target.id} goal={goal} onClose={close} />}
    </Modal>
  )
}

function Footer({ goal, onClose }: { goal?: Goal; onClose: () => void }) {
  const deleteGoal = useStore((s) => s.deleteGoal)
  const toast = useUI((s) => s.toast)
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      {goal && (
        <>
          <button className="btn btn-danger mr-auto" onClick={() => setConfirm(true)}>
            <Trash2 size={16} aria-hidden /> Excluir
          </button>
          <ConfirmDialog
            open={confirm}
            title="Excluir meta?"
            message={`“${goal.title}” será removida. As tarefas e hábitos vinculados continuam existindo.`}
            confirmLabel="Excluir"
            danger
            onCancel={() => setConfirm(false)}
            onConfirm={() => {
              deleteGoal(goal.id)
              setConfirm(false)
              toast('Meta excluída.')
              onClose()
            }}
          />
        </>
      )}
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" type="submit" form="goal-form">Salvar</button>
    </>
  )
}

function GoalForm({ goal, onClose }: { goal?: Goal; onClose: () => void }) {
  const { addGoal, updateGoal } = useStore.getState()
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [deadline, setDeadline] = useState(goal?.deadline ?? '')
  const [progress, setProgress] = useState(goal?.progress ?? 0)
  const [auto, setAuto] = useState(goal?.autoProgress ?? false)
  const [milestones, setMilestones] = useState<Milestone[]>(goal?.milestones ?? [])
  const [newMs, setNewMs] = useState('')
  const [taskIds, setTaskIds] = useState<string[]>(goal?.taskIds ?? [])
  const [habitIds, setHabitIds] = useState<string[]>(goal?.habitIds ?? [])

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  const addMs = () => {
    const t = newMs.trim()
    if (!t) return
    setMilestones((m) => [...m, { id: uid(), title: t, done: false }])
    setNewMs('')
  }
  const useAuto = auto && milestones.length > 0
  const selectable = tasks.filter((t) => !t.done || taskIds.includes(t.id))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const pending = newMs.trim()
    const ms = pending ? [...milestones, { id: uid(), title: pending, done: false }] : milestones
    const data = {
      title: title.trim(),
      description: description.trim(),
      deadline: deadline || null,
      progress,
      autoProgress: auto && ms.length > 0,
      milestones: ms,
      taskIds,
      habitIds,
    }
    if (goal) updateGoal(goal.id, data)
    else addGoal(data)
    onClose()
  }

  return (
    <form id="goal-form" onSubmit={submit} className="grid gap-5">
      <Field label="Título" htmlFor="g-title">
        <input id="g-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Correr 10 km" autoFocus required />
      </Field>
      <Field label="Descrição" htmlFor="g-desc">
        <textarea id="g-desc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Prazo" htmlFor="g-deadline">
          <input id="g-deadline" type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <div>
          <label className="label" htmlFor="g-progress">Progresso: <span className="tabular text-ink">{useAuto ? Math.round((milestones.filter((m) => m.done).length / milestones.length) * 100) : progress}%</span></label>
          <input id="g-progress" type="range" min={0} max={100} step={5} className="h-10 w-full accent-[var(--accent)]" value={progress} disabled={useAuto} onChange={(e) => setProgress(Number(e.target.value))} />
        </div>
      </div>

      <div>
        <span className="label">Marcos (etapas)</span>
        <ul className="grid gap-1">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={m.done} aria-label={`Marco “${m.title}” concluído`} onChange={() => setMilestones((all) => all.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)))} />
              <span className={`min-w-0 flex-1 truncate ${m.done ? 'text-muted line-through' : ''}`}>{m.title}</span>
              <button type="button" className="icon-btn icon-btn-sm" aria-label={`Remover marco “${m.title}”`} onClick={() => setMilestones((all) => all.filter((x) => x.id !== m.id))}>
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <input className="input" aria-label="Novo marco" placeholder="Adicionar marco" value={newMs} onChange={(e) => setNewMs(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMs() } }} />
          <button type="button" className="btn" onClick={addMs} aria-label="Adicionar marco"><Plus size={16} /></button>
        </div>
        <label className="mt-3 flex min-h-10 cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={auto} disabled={milestones.length === 0} onChange={(e) => setAuto(e.target.checked)} />
          Calcular o progresso pelos marcos concluídos
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="label">Tarefas vinculadas</legend>
          {selectable.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma tarefa aberta para vincular.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-line p-1">
              {selectable.map((t) => (
                <label key={t.id} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-surface-2">
                  <input type="checkbox" className="size-4 shrink-0 accent-[var(--accent)]" checked={taskIds.includes(t.id)} onChange={() => toggle(taskIds, setTaskIds, t.id)} />
                  <span className="min-w-0 truncate text-sm">{t.title}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="label">Hábitos vinculados</legend>
          {habits.length === 0 ? (
            <p className="text-sm text-muted">Nenhum hábito criado ainda.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-line p-1">
              {habits.map((h) => (
                <label key={h.id} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-surface-2">
                  <input type="checkbox" className="size-4 shrink-0 accent-[var(--accent)]" checked={habitIds.includes(h.id)} onChange={() => toggle(habitIds, setHabitIds, h.id)} />
                  <span className="min-w-0 truncate text-sm">{h.name}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      </div>
    </form>
  )
}
