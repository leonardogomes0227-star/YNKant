import { useState } from 'react'
import { ShoppingCart, Trash2, X } from 'lucide-react'
import { CheckCircle, EmptyState, PageHeader } from '../../components/ui'
import { useStore } from '../../store/useStore'

export function ShoppingView() {
  const items = useStore((s) => s.shopping)
  const { addShopItem, toggleShopItem, deleteShopItem, clearBoughtItems } = useStore.getState()
  const [name, setName] = useState('')
  const todo = items.filter((i) => !i.done)
  const bought = items.filter((i) => i.done)

  return (
    <>
      <PageHeader title="Compras" subtitle="Sua lista de compras. Toque no círculo ao colocar o item no carrinho." />
      <form
        className="mb-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          addShopItem(name)
          setName('')
        }}
      >
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: arroz, leite, sabão" aria-label="Novo item" />
        <button className="btn btn-primary" type="submit" disabled={!name.trim()}>
          Adicionar
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Lista vazia">
          Escreva acima o que precisa comprar e toque em Adicionar. No mercado, toque no círculo de cada item para riscar da lista.
        </EmptyState>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-0.5" aria-label="Itens para comprar">
            {todo.map((i) => (
              <li key={i.id} className="flex items-center gap-1 rounded-xl px-2 hover:bg-surface-2/60">
                <CheckCircle checked={false} onChange={() => toggleShopItem(i.id)} label={`Comprei “${i.name}”`} />
                <span className="min-h-11 min-w-0 flex-1 truncate py-2.5 font-medium">{i.name}</span>
                <button className="icon-btn icon-btn-sm" onClick={() => deleteShopItem(i.id)} aria-label={`Remover “${i.name}”`}>
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
          {todo.length === 0 && <p className="rounded-xl border border-dashed border-line-strong px-4 py-5 text-center text-sm text-muted">Tudo comprado!</p>}
          {bought.length > 0 && (
            <section className="mt-6" aria-label="Já comprados">
              <div className="mb-1 flex items-center justify-between px-2">
                <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">Comprados ({bought.length})</h2>
                <button className="btn btn-ghost btn-sm" onClick={clearBoughtItems}>
                  <Trash2 size={14} aria-hidden /> Limpar comprados
                </button>
              </div>
              <ul className="grid grid-cols-1 gap-0.5">
                {bought.map((i) => (
                  <li key={i.id} className="flex items-center gap-1 rounded-xl px-2">
                    <CheckCircle checked onChange={() => toggleShopItem(i.id)} label={`Voltar “${i.name}” para a lista`} />
                    <span className="min-h-11 min-w-0 flex-1 truncate py-2.5 text-muted line-through">{i.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  )
}
