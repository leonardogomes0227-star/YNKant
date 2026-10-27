import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog, Field, Modal } from '../../components/ui'
import { uid } from '../../lib/id'
import { knownExercises } from '../../lib/workout'
import { useStore } from '../../store/useStore'
import type { TemplateExercise, WorkoutTemplate } from '../../types'

export type TemplateTarget = { id: string } | null

export function TemplateEditor({ target, onClose }: { target: TemplateTarget; onClose: () => void }) {
  const templates = useStore((s) => s.workouts)
  const item = target && target.id !== 'new' ? templates.find((t) => t.id === target.id) : undefined
  const open = !!target && (target.id === 'new' || !!item)
  return (
    <Modal open={open} onClose={onClose} wide title={item ? 'Editar treino' : 'Novo treino'} footer={<Footer item={item} onClose={onClose} />}>
      {open && <Form key={target.id} item={item} onClose={onClose} />}
    </Modal>
  )
}

function Footer({ item, onClose }: { item?: WorkoutTemplate; onClose: () => void }) {
  const deleteTemplate = useStore((s) => s.deleteTemplate)
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      {item && (
        <>
          <button className="btn btn-danger mr-auto" onClick={() => setConfirm(true)}><Trash2 size={16} aria-hidden /> Excluir</button>
          <ConfirmDialog open={confirm} title="Excluir treino?" message={`“${item.name}” será apagado. O histórico de treinos já feitos não muda.`} confirmLabel="Excluir" danger onCancel={() => setConfirm(false)} onConfirm={() => { deleteTemplate(item.id); setConfirm(false); onClose() }} />
        </>
      )}
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" type="submit" form="template-form">Salvar</button>
    </>
  )
}

function Form({ item, onClose }: { item?: WorkoutTemplate; onClose: () => void }) {
  const { addTemplate, updateTemplate } = useStore.getState()
  const logs = useStore((s) => s.workoutLogs)
  const templates = useStore((s) => s.workouts)
  const [name, setName] = useState(item?.name ?? '')
  const [exercises, setExercises] = useState<TemplateExercise[]>(item?.exercises ?? [])
  const names = knownExercises(logs, templates)

  const patch = (id: string, p: Partial<TemplateExercise>) => setExercises((all) => all.map((e) => (e.id === id ? { ...e, ...p } : e)))
  const move = (i: number, d: -1 | 1) =>
    setExercises((all) => {
      const next = [...all]
      const j = i + d
      if (j < 0 || j >= next.length) return all
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  const n = (v: string, min: number, max: number) => Math.min(max, Math.max(min, Math.floor(Number(v)) || min))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const data = { name: name.trim(), exercises: exercises.filter((x) => x.name.trim()).map((x) => ({ ...x, name: x.name.trim() })) }
    if (item) updateTemplate(item.id, data)
    else addTemplate(data)
    onClose()
  }

  return (
    <form id="template-form" onSubmit={submit} className="grid grid-cols-1 gap-4">
      <Field label="Nome do treino" htmlFor="tpl-name">
        <input id="tpl-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Treino A, peito e tríceps" autoFocus required />
      </Field>
      <div>
        <span className="label">Exercícios</span>
        <datalist id="tpl-names">{names.map((x) => <option key={x} value={x} />)}</datalist>
        <ul className="grid grid-cols-1 gap-3">
          {exercises.map((e, i) => (
            <li key={e.id} className="rounded-xl border border-line p-3">
              <div className="flex gap-2">
                <input className="input" list="tpl-names" aria-label={`Nome do exercício ${i + 1}`} value={e.name} onChange={(ev) => patch(e.id, { name: ev.target.value })} placeholder="Nome do exercício" />
                <button type="button" className="icon-btn icon-btn-sm" aria-label="Mover para cima" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} /></button>
                <button type="button" className="icon-btn icon-btn-sm" aria-label="Mover para baixo" disabled={i === exercises.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} /></button>
                <button type="button" className="icon-btn icon-btn-sm" aria-label={`Remover ${e.name || 'exercício'}`} onClick={() => setExercises((all) => all.filter((x) => x.id !== e.id))}><Trash2 size={16} /></button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Field label="Séries" htmlFor={`s-${e.id}`}><input id={`s-${e.id}`} className="input text-center" inputMode="numeric" value={e.sets} onChange={(ev) => patch(e.id, { sets: n(ev.target.value, 1, 20) })} /></Field>
                <Field label="Repetições" htmlFor={`r-${e.id}`}><input id={`r-${e.id}`} className="input text-center" inputMode="numeric" value={e.reps} onChange={(ev) => patch(e.id, { reps: n(ev.target.value, 1, 200) })} /></Field>
                <Field label="Carga (kg)" htmlFor={`k-${e.id}`}><input id={`k-${e.id}`} className="input text-center" inputMode="decimal" placeholder="—" value={e.kg ?? ''} onChange={(ev) => patch(e.id, { kg: ev.target.value ? Number(ev.target.value.replace(',', '.')) || null : null })} /></Field>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className="btn mt-3" onClick={() => setExercises((all) => [...all, { id: uid(), name: '', sets: 3, reps: 10, kg: null }])}>
          <Plus size={16} aria-hidden /> Adicionar exercício
        </button>
        <p className="mt-2 text-xs text-muted">Na hora de treinar, o app já preenche a carga da última vez que você fez cada exercício.</p>
      </div>
    </form>
  )
}
