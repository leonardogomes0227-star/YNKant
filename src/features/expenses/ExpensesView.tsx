import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { DateField } from '../../components/DateField'
import { ConfirmDialog, EmptyState, Field, Modal, PageHeader } from '../../components/ui'
import { formatBR, fromKey, todayKey } from '../../lib/dates'
import { EXPENSE_CATEGORIES, formatBRL, monthOf, monthSummary, parseAmount, shiftMonth } from '../../lib/money'
import { useStore } from '../../store/useStore'
import type { Expense } from '../../types'

type Target = { id: string } | null

function monthLabel(month: string): string {
  const s = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(fromKey(`${month}-01`))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function ExpensesView() {
  const expenses = useStore((s) => s.expenses)
  const today = todayKey()
  const [month, setMonth] = useState(monthOf(today))
  const [target, setTarget] = useState<Target>(null)
  const sum = monthSummary(expenses, month)
  const list = expenses.filter((e) => monthOf(e.date) === month).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  const maxCat = Math.max(1, ...sum.byCategory.map((c) => c.total))

  return (
    <>
      <PageHeader
        title="Gastos"
        subtitle="Anote o que você gastou ou recebeu e veja o total do mês."
        actions={
          <button className="btn btn-primary" onClick={() => setTarget({ id: 'new' })}>
            <Plus size={18} aria-hidden /> Anotar gasto
          </button>
        }
      />

      <div className="mb-4 flex items-center justify-between">
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mês anterior">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl">{monthLabel(month)}</h2>
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= monthOf(today)} aria-label="Próximo mês">
          <ChevronRight size={20} />
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3" aria-label="Resumo do mês">
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">Gastou</div>
          <div className="tabular mt-1 font-display text-2xl">{formatBRL(sum.out)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">Recebeu</div>
          <div className="tabular mt-1 font-display text-2xl">{formatBRL(sum.in)}</div>
        </div>
        <div className="card col-span-2 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">Sobrou no mês</div>
          <div className={`tabular mt-1 font-display text-3xl ${sum.balance < 0 ? 'text-danger' : ''}`}>{formatBRL(sum.balance)}</div>
        </div>
      </section>

      {sum.byCategory.length > 0 && (
        <section className="card mt-4 p-4" aria-label="Gastos por categoria">
          <h2 className="mb-3 text-base">Onde foi o dinheiro</h2>
          <ul className="grid grid-cols-1 gap-3">
            {sum.byCategory.map((c) => (
              <li key={c.category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{c.category}</span>
                  <span className="tabular text-muted">{formatBRL(c.total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(c.total / maxCat) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6" aria-label="Lançamentos">
        {list.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nenhum lançamento neste mês"
            action={
              <button className="btn btn-primary" onClick={() => setTarget({ id: 'new' })}>
                <Plus size={18} aria-hidden /> Anotar o primeiro gasto
              </button>
            }
          >
            Toque em “Anotar gasto”, escreva o valor e escolha a categoria. Para dinheiro que entrou, escolha “Recebi”.
          </EmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-0.5">
            {list.map((e) => (
              <li key={e.id}>
                <button onClick={() => setTarget({ id: e.id })} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-surface-2/60">
                  {e.type === 'out' ? <ArrowDownCircle size={22} className="shrink-0 text-muted" aria-hidden /> : <ArrowUpCircle size={22} className="shrink-0 text-accent" aria-hidden />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{e.note || e.category}</span>
                    <span className="block text-xs text-muted">{e.category} · {formatBR(e.date)}</span>
                  </span>
                  <span className={`tabular font-semibold ${e.type === 'in' ? 'text-accent' : ''}`}>
                    {e.type === 'out' ? '−' : '+'} {formatBRL(e.amount)}
                  </span>
                  <Pencil size={14} className="shrink-0 text-muted" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ExpenseEditor target={target} onClose={() => setTarget(null)} />
    </>
  )
}

function ExpenseEditor({ target, onClose }: { target: Target; onClose: () => void }) {
  const expenses = useStore((s) => s.expenses)
  const item = target && target.id !== 'new' ? expenses.find((e) => e.id === target.id) : undefined
  const open = !!target && (target.id === 'new' || !!item)
  return (
    <Modal open={open} onClose={onClose} title={item ? 'Editar lançamento' : 'Anotar gasto'} footer={<Footer item={item} onClose={onClose} />}>
      {open && <ExpenseForm key={target.id} item={item} onClose={onClose} />}
    </Modal>
  )
}

function Footer({ item, onClose }: { item?: Expense; onClose: () => void }) {
  const deleteExpense = useStore((s) => s.deleteExpense)
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      {item && (
        <>
          <button className="btn btn-danger mr-auto" onClick={() => setConfirm(true)}>
            <Trash2 size={16} aria-hidden /> Excluir
          </button>
          <ConfirmDialog
            open={confirm}
            title="Excluir lançamento?"
            message="Este lançamento será apagado."
            confirmLabel="Excluir"
            danger
            onCancel={() => setConfirm(false)}
            onConfirm={() => {
              deleteExpense(item.id)
              setConfirm(false)
              onClose()
            }}
          />
        </>
      )}
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" type="submit" form="expense-form">Salvar</button>
    </>
  )
}

function ExpenseForm({ item, onClose }: { item?: Expense; onClose: () => void }) {
  const { addExpense, updateExpense } = useStore.getState()
  const [type, setType] = useState<'out' | 'in'>(item?.type ?? 'out')
  const [amount, setAmount] = useState(item ? String(item.amount).replace('.', ',') : '')
  const [category, setCategory] = useState(item?.category ?? EXPENSE_CATEGORIES[0])
  const [note, setNote] = useState(item?.note ?? '')
  const [date, setDate] = useState(item?.date ?? todayKey())
  const [dateOk, setDateOk] = useState(true)
  const value = parseAmount(amount)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value === null || !date || !dateOk) return
    const data = { type, amount: value, category, note: note.trim(), date }
    if (item) updateExpense(item.id, data)
    else addExpense(data)
    onClose()
  }

  return (
    <form id="expense-form" onSubmit={submit} className="grid grid-cols-1 gap-4">
      <div className="seg w-full" role="group" aria-label="Tipo">
        <button type="button" className="flex-1" aria-pressed={type === 'out'} onClick={() => setType('out')}>Gastei</button>
        <button type="button" className="flex-1" aria-pressed={type === 'in'} onClick={() => setType('in')}>Recebi</button>
      </div>
      <Field label="Valor (R$)" htmlFor="x-amount">
        <input id="x-amount" className="input text-lg" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus required />
      </Field>
      <Field label="O que foi (opcional)" htmlFor="x-note">
        <input id="x-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: almoço, gasolina" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Categoria" htmlFor="x-cat">
          <select id="x-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Data" htmlFor="x-date">
          <DateField id="x-date" value={date} onChange={setDate} onValidity={setDateOk} />
        </Field>
      </div>
    </form>
  )
}
