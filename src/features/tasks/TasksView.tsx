import { useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, CheckCircle2, Inbox, Plus, Search, Sun, Trash2 } from 'lucide-react'
import { ConfirmDialog, EmptyState, PageHeader } from '../../components/ui'
import { formatShort, todayKey } from '../../lib/dates'
import { matches } from '../../lib/search'
import { byDateThenPriority, byOrder, inView, type TaskView } from '../../lib/tasks'
import { useNow } from '../../lib/useNow'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { Task } from '../../types'
import { TaskList } from './TaskList'

const TABS: { id: TaskView; label: string }[] = [
  { id: 'inbox', label: 'Sem data' },
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Próximos dias' },
  { id: 'overdue', label: 'Atrasadas' },
  { id: 'done', label: 'Feitas' },
]

const EMPTY: Record<TaskView, { icon: typeof Inbox; title: string; text: string }> = {
  inbox: {
    icon: Inbox,
    title: 'Nenhuma tarefa sem data',
    text: 'Aqui ficam as tarefas que ainda não têm dia marcado. Escreva acima o que precisa fazer e toque em Adicionar.',
  },
  today: {
    icon: Sun,
    title: 'Nada marcado para hoje',
    text: 'Crie uma tarefa para hoje ou abra uma tarefa e escolha o dia dela.',
  },
  week: {
    icon: CalendarDays,
    title: 'Semana livre',
    text: 'As tarefas marcadas para os próximos dias aparecem aqui, separadas por dia.',
  },
  overdue: {
    icon: CheckCircle2,
    title: 'Nenhuma tarefa atrasada',
    text: 'Tudo em dia! Tarefas com data anterior a hoje e ainda abertas aparecem aqui, em destaque.',
  },
  done: {
    icon: CheckCircle2,
    title: 'Nada feito ainda',
    text: 'Quando você tocar no círculo de uma tarefa, ela aparece aqui.',
  },
}

export function TasksView() {
  const now = useNow(60_000)
  const today = todayKey(now)
  const tasks = useStore((s) => s.tasks)
  const addTask = useStore((s) => s.addTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const openItem = useUI((s) => s.openItem)
  const toast = useUI((s) => s.toast)

  const [view, setView] = useState<TaskView>('inbox')
  const [q, setQ] = useState('')
  const [quick, setQuick] = useState('')
  const [clearing, setClearing] = useState(false)

  const filtered = (t: Task) =>
    (!q.trim() || matches(`${t.title} ${t.description}`, q))

  const counts = useMemo(() => {
    const c = {} as Record<TaskView, number>
    for (const tab of TABS) c[tab.id] = tasks.filter((t) => inView(t, tab.id, today) && (tab.id !== 'today' || !t.done)).length
    return c
  }, [tasks, today])

  const list = useMemo(() => tasks.filter((t) => inView(t, view, today) && filtered(t)), [tasks, view, today, q]) // eslint-disable-line react-hooks/exhaustive-deps
  const open = list.filter((t) => !t.done).sort(view === 'week' ? byDateThenPriority : byOrder)
  const doneList = list.filter((t) => t.done).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const hasFilter = !!q.trim()

  const groups = useMemo(() => {
    if (view !== 'week') return []
    const m = new Map<string, Task[]>()
    for (const t of open) m.set(t.dueDate!, [...(m.get(t.dueDate!) ?? []), t])
    return [...m.entries()]
  }, [view, open])

  const submitQuick = (e: React.FormEvent) => {
    e.preventDefault()
    const title = quick.trim()
    if (!title) return
    addTask({ title, dueDate: view === 'today' || view === 'week' ? today : null })
    setQuick('')
  }

  const empty = EMPTY[view]
  const showQuick = view !== 'done' && view !== 'overdue'

  return (
    <>
      <PageHeader
        title="Tarefas"
        subtitle="Tudo o que você precisa fazer. Toque no círculo para marcar como feita."
        actions={
          <button className="btn btn-primary" onClick={() => openItem({ kind: 'task', id: 'new', defaults: view === 'today' ? { dueDate: today } : {} })}>
            <Plus size={18} aria-hidden /> Nova tarefa
          </button>
        }
      />

      <div role="group" aria-label="Visões" className="seg mb-4">
        {TABS.map((t) => (
          <button key={t.id} aria-pressed={view === t.id} onClick={() => setView(t.id)}>
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`ml-1.5 tabular text-xs ${t.id === 'overdue' ? 'text-danger' : 'text-muted'}`}>{counts[t.id]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input pl-9" type="search" placeholder="Buscar nas tarefas" aria-label="Buscar nas tarefas" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {showQuick && (
        <form onSubmit={submitQuick} className="mb-4 flex gap-2">
          <input
            className="input"
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder={view === 'inbox' ? 'Escreva uma tarefa e toque em Adicionar' : 'Escreva uma tarefa para hoje'}
            aria-label="Adicionar tarefa rapidamente"
          />
          <button className="btn" type="submit" disabled={!quick.trim()}>
            Adicionar
          </button>
        </form>
      )}

      {list.length === 0 ? (
        hasFilter ? (
          <EmptyState icon={Search} title="Nenhuma tarefa encontrada" action={<button className="btn" onClick={() => setQ('')}>Limpar busca</button>}>
            Tente outro termo.
          </EmptyState>
        ) : (
          <EmptyState icon={empty.icon} title={empty.title}>
            {empty.text}
          </EmptyState>
        )
      ) : view === 'week' ? (
        <div className="grid grid-cols-1 gap-5">
          {groups.map(([date, items]) => (
            <section key={date} aria-label={formatShort(date)}>
              <h3 className="mb-1 px-2 text-sm font-semibold capitalize text-muted">{date === today ? `Hoje · ${formatShort(date)}` : formatShort(date)}</h3>
              <TaskList tasks={items} today={today} showDue={false} sortable label={formatShort(date)} />
            </section>
          ))}
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <>
              {view === 'overdue' && (
                <p className="mb-2 flex items-center gap-2 px-2 text-sm text-danger">
                  <AlertCircle size={16} aria-hidden /> Reagende ou conclua estas tarefas — abra uma para mudar a data.
                </p>
              )}
              <TaskList tasks={open} today={today} sortable={view !== 'done'} label="Tarefas abertas" />
            </>
          )}
          {doneList.length > 0 && (
            <section className={open.length ? 'mt-6' : ''}>
              <div className="mb-1 flex items-center justify-between px-2">
                <h3 className="text-sm font-semibold text-muted">{view === 'done' ? `${doneList.length} concluídas` : 'Concluídas'}</h3>
                {view === 'done' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setClearing(true)}>
                    <Trash2 size={14} aria-hidden /> Apagar feitas
                  </button>
                )}
              </div>
              <TaskList tasks={doneList} today={today} label="Tarefas concluídas" />
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={clearing}
        title="Apagar tarefas feitas?"
        message={`${doneList.length} tarefa(s) concluída(s) serão excluídas de vez.`}
        confirmLabel="Excluir"
        danger
        onCancel={() => setClearing(false)}
        onConfirm={() => {
          doneList.forEach((t) => deleteTask(t.id))
          setClearing(false)
          toast('Concluídas removidas.')
        }}
      />
    </>
  )
}
