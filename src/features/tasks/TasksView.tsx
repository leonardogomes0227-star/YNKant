import { useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, CheckCircle2, Inbox, Plus, Search, Sun, Trash2 } from 'lucide-react'
import { ConfirmDialog, EmptyState, PageHeader } from '../../components/ui'
import { formatShort, todayKey } from '../../lib/dates'
import { matches } from '../../lib/search'
import { PRIORITY_LABEL, byDateThenPriority, byOrder, inView, type TaskView } from '../../lib/tasks'
import { useNow } from '../../lib/useNow'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { Priority, Task } from '../../types'
import { TaskList } from './TaskList'

const TABS: { id: TaskView; label: string }[] = [
  { id: 'inbox', label: 'Caixa de entrada' },
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Próximos 7 dias' },
  { id: 'overdue', label: 'Atrasadas' },
  { id: 'done', label: 'Concluídas' },
]

const EMPTY: Record<TaskView, { icon: typeof Inbox; title: string; text: string }> = {
  inbox: {
    icon: Inbox,
    title: 'Caixa de entrada vazia',
    text: 'Aqui ficam as tarefas sem data: anote tudo o que vier à cabeça e organize depois. Digite acima e aperte Enter, ou use a tecla C em qualquer tela.',
  },
  today: {
    icon: Sun,
    title: 'Nada marcado para hoje',
    text: 'Crie uma tarefa com a data de hoje ou abra uma da Caixa de entrada e dê uma data a ela.',
  },
  week: {
    icon: CalendarDays,
    title: 'Semana livre',
    text: 'As tarefas com data nos próximos 7 dias aparecem aqui, agrupadas por dia.',
  },
  overdue: {
    icon: CheckCircle2,
    title: 'Nenhuma tarefa atrasada',
    text: 'Tudo em dia! Tarefas com data anterior a hoje e ainda abertas aparecem aqui, em destaque.',
  },
  done: {
    icon: CheckCircle2,
    title: 'Nada concluído ainda',
    text: 'Marque uma tarefa como feita e ela aparece aqui. Você pode reabri-la a qualquer momento.',
  },
}

export function TasksView() {
  const now = useNow(60_000)
  const today = todayKey(now)
  const tasks = useStore((s) => s.tasks)
  const categories = useStore((s) => s.categories)
  const addTask = useStore((s) => s.addTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const openItem = useUI((s) => s.openItem)
  const toast = useUI((s) => s.toast)

  const [view, setView] = useState<TaskView>('inbox')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [prio, setPrio] = useState<Priority | ''>('')
  const [quick, setQuick] = useState('')
  const [clearing, setClearing] = useState(false)

  const filtered = (t: Task) =>
    (!cat || t.category === cat) && (!prio || t.priority === prio) && (!q.trim() || matches(`${t.title} ${t.description}`, q))

  const counts = useMemo(() => {
    const c = {} as Record<TaskView, number>
    for (const tab of TABS) c[tab.id] = tasks.filter((t) => inView(t, tab.id, today) && (tab.id !== 'today' || !t.done)).length
    return c
  }, [tasks, today])

  const list = useMemo(() => tasks.filter((t) => inView(t, view, today) && filtered(t)), [tasks, view, today, q, cat, prio]) // eslint-disable-line react-hooks/exhaustive-deps
  const open = list.filter((t) => !t.done).sort(view === 'week' ? byDateThenPriority : byOrder)
  const doneList = list.filter((t) => t.done).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const hasFilter = !!(q.trim() || cat || prio)

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
        subtitle="Capture, organize e conclua."
        actions={
          <button className="btn btn-primary" onClick={() => openItem({ kind: 'task', id: 'new', defaults: view === 'today' ? { dueDate: today } : {} })}>
            <Plus size={18} aria-hidden /> Nova tarefa
          </button>
        }
      />

      <div role="tablist" aria-label="Visões" className="seg mb-4">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={view === t.id} onClick={() => setView(t.id)}>
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`ml-1.5 tabular text-xs ${t.id === 'overdue' ? 'text-danger' : 'text-muted'}`}>{counts[t.id]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input pl-9" type="search" placeholder="Buscar nas tarefas" aria-label="Buscar nas tarefas" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-44" aria-label="Filtrar por categoria" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="input sm:w-40" aria-label="Filtrar por prioridade" value={prio} onChange={(e) => setPrio(e.target.value as Priority | '')}>
          <option value="">Qualquer prioridade</option>
          {(['high', 'medium', 'low'] as Priority[]).map((p) => (
            <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
          ))}
        </select>
      </div>

      {showQuick && (
        <form onSubmit={submitQuick} className="mb-4 flex gap-2">
          <input
            className="input"
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder={view === 'inbox' ? 'Nova tarefa na caixa de entrada…' : 'Nova tarefa para hoje…'}
            aria-label="Adicionar tarefa rapidamente"
          />
          <button className="btn" type="submit" disabled={!quick.trim()}>
            Adicionar
          </button>
        </form>
      )}

      {list.length === 0 ? (
        hasFilter ? (
          <EmptyState icon={Search} title="Nenhuma tarefa com esses filtros" action={<button className="btn" onClick={() => { setQ(''); setCat(''); setPrio('') }}>Limpar filtros</button>}>
            Tente outro termo ou remova a categoria e a prioridade selecionadas.
          </EmptyState>
        ) : (
          <EmptyState icon={empty.icon} title={empty.title}>
            {empty.text}
          </EmptyState>
        )
      ) : view === 'week' ? (
        <div className="grid gap-5">
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
                    <Trash2 size={14} aria-hidden /> Limpar concluídas
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
        title="Limpar tarefas concluídas?"
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
