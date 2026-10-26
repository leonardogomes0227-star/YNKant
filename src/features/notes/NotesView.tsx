import { useMemo, useState } from 'react'
import { NotebookPen, Pin, Plus, Search } from 'lucide-react'
import { EmptyState, PageHeader, SampleBadge } from '../../components/ui'
import { formatBR } from '../../lib/dates'
import { matches } from '../../lib/search'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { Note } from '../../types'
import { JournalPanel } from './JournalPanel'

function NoteCard({ note, onOpen }: { note: Note; onOpen: () => void }) {
  return (
    <li>
      <button onClick={onOpen} className="card flex h-full min-h-32 w-full flex-col items-start gap-2 p-4 text-left transition-colors hover:border-line-strong">
        <span className="flex w-full items-start justify-between gap-2">
          <span className="line-clamp-2 font-display text-lg leading-snug">{note.title || 'Nota sem título'}</span>
          {note.pinned && <Pin size={15} className="mt-1.5 shrink-0 text-accent" aria-label="Fixada" />}
        </span>
        {note.body && <span className="line-clamp-3 whitespace-pre-line text-sm text-muted">{note.body}</span>}
        <span className="mt-auto flex w-full flex-wrap items-center gap-1.5 pt-1">
          {note.tags.map((t) => (
            <span key={t} className="chip">#{t}</span>
          ))}
          {note.sample && <SampleBadge />}
          <span className="tabular ml-auto text-xs text-muted">{formatBR(note.updatedAt.slice(0, 10))}</span>
        </span>
      </button>
    </li>
  )
}

export function NotesView() {
  const notes = useStore((s) => s.notes)
  const openItem = useUI((s) => s.openItem)
  const [tab, setTab] = useState<'notas' | 'diario'>('notas')
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')

  const allTags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags))].sort(), [notes])
  const list = notes
    .filter((n) => (!tag || n.tags.includes(tag)) && (!q.trim() || matches(`${n.title} ${n.body} ${n.tags.join(' ')}`, q)))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))
  const pinned = list.filter((n) => n.pinned)
  const rest = list.filter((n) => !n.pinned)

  return (
    <>
      <PageHeader
        title="Notas"
        subtitle="Anotações rápidas e o diário do dia."
        actions={
          tab === 'notas' && (
            <button className="btn btn-primary" onClick={() => openItem({ kind: 'note', id: 'new' })}>
              <Plus size={18} aria-hidden /> Nova nota
            </button>
          )
        }
      />
      <div role="group" aria-label="Seções" className="seg mb-5">
        <button aria-pressed={tab === 'notas'} onClick={() => setTab('notas')}>Notas</button>
        <button aria-pressed={tab === 'diario'} onClick={() => setTab('diario')}>Diário</button>
      </div>

      {tab === 'diario' ? (
        <JournalPanel />
      ) : notes.length === 0 ? (
        <EmptyState icon={NotebookPen} title="Nenhuma nota ainda" action={<button className="btn btn-primary" onClick={() => openItem({ kind: 'note', id: 'new' })}><Plus size={18} aria-hidden /> Criar a primeira nota</button>}>
          Use notas para ideias, listas e lembretes. Dê etiquetas para encontrar depois e fixe as mais importantes no topo.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <input className="input pl-9" type="search" placeholder="Buscar nas notas" aria-label="Buscar nas notas" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por etiqueta">
                <button className={`chip cursor-pointer ${!tag ? 'chip-accent' : ''}`} aria-pressed={!tag} onClick={() => setTag('')}>Todas</button>
                {allTags.map((t) => (
                  <button key={t} className={`chip cursor-pointer ${tag === t ? 'chip-accent' : ''}`} aria-pressed={tag === t} onClick={() => setTag(tag === t ? '' : t)}>#{t}</button>
                ))}
              </div>
            )}
          </div>
          {list.length === 0 ? (
            <EmptyState icon={Search} title="Nenhuma nota encontrada" action={<button className="btn" onClick={() => { setQ(''); setTag('') }}>Limpar busca</button>}>
              Tente outro termo ou escolha outra etiqueta.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {pinned.length > 0 && (
                <section aria-label="Notas fixadas">
                  <h2 className="mb-2 flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted"><Pin size={13} aria-hidden /> Fixadas</h2>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{pinned.map((n) => <NoteCard key={n.id} note={n} onOpen={() => openItem({ kind: 'note', id: n.id })} />)}</ul>
                </section>
              )}
              {rest.length > 0 && (
                <section aria-label="Outras notas">
                  {pinned.length > 0 && <h2 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted">Outras</h2>}
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{rest.map((n) => <NoteCard key={n.id} note={n} onOpen={() => openItem({ kind: 'note', id: n.id })} />)}</ul>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
