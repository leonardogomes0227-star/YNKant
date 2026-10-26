import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { DateField } from '../../components/DateField'
import { ConfirmDialog, Field, Modal } from '../../components/ui'
import { uid } from '../../lib/id'
import { PRIORITY_LABEL } from '../../lib/tasks'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { Priority, Repeat, Subtask, Task } from '../../types'

/** Editor global de tarefas: abre quando `pendingOpen` é uma tarefa (ou 'new'). */
export function TaskEditorHost() {
  const target = useUI((s) => s.pendingOpen)
  const openItem = useUI((s) => s.openItem)
  const tasks = useStore((s) => s.tasks)
  const open = target?.kind === 'task'
  const task = open && target.id !== 'new' ? tasks.find((t) => t.id === target.id) : undefined
  // mantém a tarefa exibida enquanto o modal fecha
  const close = () => openItem(null)

  return (
    <Modal open={open && (target.id === 'new' || !!task)} onClose={close} title={task ? 'Editar tarefa' : 'Nova tarefa'} wide footer={<EditorFooter task={task} onClose={close} />}>
      {open && <TaskForm key={target.id} task={task} defaults={target.defaults} onClose={close} />}
    </Modal>
  )
}

function EditorFooter({ task, onClose }: { task?: Task; onClose: () => void }) {
  const deleteTask = useStore((s) => s.deleteTask)
  const toast = useUI((s) => s.toast)
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      {task && (
        <>
          <button className="btn btn-danger mr-auto" onClick={() => setConfirm(true)}>
            <Trash2 size={16} aria-hidden /> Excluir
          </button>
          <ConfirmDialog
            open={confirm}
            title="Excluir tarefa?"
            message={`“${task.title}” será removida. Isso não pode ser desfeito.`}
            confirmLabel="Excluir"
            danger
            onCancel={() => setConfirm(false)}
            onConfirm={() => {
              deleteTask(task.id)
              setConfirm(false)
              toast('Tarefa excluída.')
              onClose()
            }}
          />
        </>
      )}
      <button className="btn" onClick={onClose}>
        Cancelar
      </button>
      <button className="btn btn-primary" type="submit" form="task-form">
        Salvar
      </button>
    </>
  )
}

function TaskForm({ task, defaults, onClose }: { task?: Task; defaults?: Partial<Task>; onClose: () => void }) {
  const { addTask, updateTask, addCategory } = useStore.getState()
  const categories = useStore((s) => s.categories)
  const init = { ...defaults, ...task }
  const [title, setTitle] = useState(init.title ?? '')
  const [description, setDescription] = useState(init.description ?? '')
  const [dueDate, setDueDate] = useState(init.dueDate ?? '')
  const [priority, setPriority] = useState<Priority>(init.priority ?? 'medium')
  const [category, setCategory] = useState(init.category ?? '')
  const [repeat, setRepeat] = useState<Repeat>(init.repeat ?? 'none')
  const [subtasks, setSubtasks] = useState<Subtask[]>(init.subtasks ?? [])
  const [newSub, setNewSub] = useState('')
  const [dateOk, setDateOk] = useState(true)

  const addSub = () => {
    const t = newSub.trim()
    if (!t) return
    setSubtasks((s) => [...s, { id: uid(), title: t, done: false }])
    setNewSub('')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dateOk) return
    const pendingSub = newSub.trim()
    const subs = pendingSub ? [...subtasks, { id: uid(), title: pendingSub, done: false }] : subtasks
    const cat = category.trim()
    if (cat) addCategory(cat)
    const data = {
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      priority,
      category: cat,
      // recorrência exige uma data de referência
      repeat: repeat !== 'none' && !dueDate ? 'none' : repeat,
      subtasks: subs,
    }
    if (task) updateTask(task.id, data)
    else addTask(data)
    onClose()
  }

  return (
    <form id="task-form" onSubmit={submit} className="grid grid-cols-1 gap-4">
      <Field label="Título" htmlFor="t-title">
        <input
          id="t-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="O que precisa ser feito?"
          autoFocus
          required
        />
      </Field>
      <Field label="Descrição" htmlFor="t-desc">
        <textarea id="t-desc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Data" htmlFor="t-date" hint="Pode deixar em branco. Formato: dia/mês/ano.">
          <DateField id="t-date" value={dueDate} onChange={setDueDate} onValidity={setDateOk} />
        </Field>
        <Field label="Repetição" htmlFor="t-repeat" hint={repeat !== 'none' && !dueDate ? 'Escolha uma data para repetir.' : undefined}>
          <select id="t-repeat" className="input" value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)}>
            <option value="none">Não repete</option>
            <option value="daily">Todo dia</option>
            <option value="weekly">Toda semana</option>
            <option value="monthly">Todo mês</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <span className="label" id="t-prio-l">Prioridade</span>
          <div className="seg" role="group" aria-labelledby="t-prio-l">
            {(['low', 'medium', 'high'] as Priority[]).map((p) => (
              <button type="button" key={p} aria-pressed={priority === p} onClick={() => setPriority(p)}>
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
        <Field label="Categoria" htmlFor="t-cat">
          <input
            id="t-cat"
            className="input"
            list="t-cats"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Escolha ou digite uma nova"
          />
          <datalist id="t-cats">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>
      <div>
        <span className="label">Subtarefas</span>
        <ul className="grid grid-cols-1 gap-1">
          {subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-[var(--accent)]"
                checked={s.done}
                aria-label={`Concluir subtarefa “${s.title}”`}
                onChange={() => setSubtasks((all) => all.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))}
              />
              <span className={`min-w-0 flex-1 truncate ${s.done ? 'text-muted line-through' : ''}`}>{s.title}</span>
              <button
                type="button"
                className="icon-btn icon-btn-sm"
                aria-label={`Remover subtarefa “${s.title}”`}
                onClick={() => setSubtasks((all) => all.filter((x) => x.id !== s.id))}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <input
            className="input"
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSub()
              }
            }}
            placeholder="Adicionar subtarefa"
            aria-label="Nova subtarefa"
          />
          <button type="button" className="btn" onClick={addSub} aria-label="Adicionar subtarefa">
            <Plus size={16} />
          </button>
        </div>
      </div>
    </form>
  )
}
