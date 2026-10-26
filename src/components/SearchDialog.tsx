import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckSquare, Search } from 'lucide-react'
import { Modal } from './ui'
import { searchTasks, type SearchHit } from '../lib/search'
import { useStore } from '../store/useStore'
import { useUI } from '../store/ui'

export function SearchDialog() {
  const { searchOpen, setSearchOpen, openItem } = useUI()
  return (
    <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Buscar tarefas">
      <SearchBody
        onPick={(hit) => {
          setSearchOpen(false)
          openItem({ kind: 'task', id: hit.id })
        }}
      />
    </Modal>
  )
}

function SearchBody({ onPick }: { onPick: (h: SearchHit) => void }) {
  const tasks = useStore((s) => s.tasks)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const hits = useMemo(() => searchTasks(tasks, q), [tasks, q])

  useEffect(() => inputRef.current?.focus(), [])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIdx((i) => Math.min(i + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && hits[idx]) {
      e.preventDefault()
      onPick(hits[idx])
    }
  }

  return (
    <div onKeyDown={onKey}>
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          ref={inputRef}
          className="input pl-10"
          type="text"
          role="searchbox"
          placeholder="Buscar tarefas…"
          aria-label="Buscar"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setIdx(0)
          }}
        />
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-1" role="listbox" aria-label="Resultados">
        {hits.map((h, i) => {
          return (
            <li key={h.id} role="option" aria-selected={i === idx}>
              <button
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left ${
                  i === idx ? 'bg-surface-2' : 'hover:bg-surface-2/60'
                }`}
                onClick={() => onPick(h)}
                onMouseEnter={() => setIdx(i)}
              >
                <CheckSquare size={18} className="shrink-0 text-accent" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{h.title}</span>
                <span className="text-xs text-muted">{h.detail}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {q.trim() && hits.length === 0 && (
        <p className="py-8 text-center text-sm text-muted">Nada encontrado para “{q}”.</p>
      )}
      {!q.trim() && (
        <p className="py-8 text-center text-sm text-muted">
          Digite para buscar nas suas tarefas.
        </p>
      )}
    </div>
  )
}
