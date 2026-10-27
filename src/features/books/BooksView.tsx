import { useState } from 'react'
import { BookOpen, Check, Plus, Trash2 } from 'lucide-react'
import { EmptyState, Field, PageHeader, ProgressBar } from '../../components/ui'
import { formatBR, todayKey } from '../../lib/dates'
import { useStore } from '../../store/useStore'
import type { Book, BookStatus } from '../../types'

const pct = (b: Book) => (b.totalPages > 0 ? Math.min(100, Math.round((b.pagesRead / b.totalPages) * 100)) : b.status === 'lido' ? 100 : 0)

function BookCard({ book }: { book: Book }) {
  const { updateBook, deleteBook } = useStore.getState()
  const [page, setPage] = useState('')
  const left = Math.max(0, book.totalPages - book.pagesRead)

  const setPages = (n: number) => {
    const read = Math.max(0, Math.min(book.totalPages || n, Math.floor(n)))
    const finished = book.totalPages > 0 && read >= book.totalPages
    updateBook(book.id, { pagesRead: read, ...(finished ? { status: 'lido' as BookStatus, finishedAt: todayKey() } : { status: 'lendo' as BookStatus, finishedAt: null }) })
  }

  return (
    <article className="card p-4" aria-label={book.title}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-snug">{book.title}</h3>
          {book.author && <p className="text-sm text-muted">{book.author}</p>}
        </div>
        <button className="icon-btn icon-btn-sm" onClick={() => deleteBook(book.id)} aria-label={`Remover “${book.title}”`}><Trash2 size={16} /></button>
      </div>

      {book.status === 'lido' ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-accent"><Check size={16} aria-hidden /> Lido{book.finishedAt ? ` em ${formatBR(book.finishedAt)}` : ''}</p>
      ) : book.status === 'quero' ? (
        <button className="btn btn-sm mt-3" onClick={() => updateBook(book.id, { status: 'lendo' })}>Começar a ler</button>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar className="flex-1" value={pct(book)} label={`Progresso de ${book.title}`} />
            <span className="tabular text-sm">{pct(book)}%</span>
          </div>
          <p className="tabular mt-1 text-xs text-muted">{book.pagesRead} de {book.totalPages || '?'} páginas{book.totalPages > 0 ? ` · faltam ${left}` : ''}</p>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = Number(page); if (n >= 0 && page) setPages(n); setPage('') }}>
            <input className="input" inputMode="numeric" value={page} onChange={(e) => setPage(e.target.value.replace(/\D/g, ''))} placeholder="Li até a página…" aria-label={`Página atual de ${book.title}`} />
            <button className="btn" type="submit" disabled={!page}>Atualizar</button>
          </form>
          <button className="btn btn-ghost btn-sm mt-2" onClick={() => updateBook(book.id, { status: 'lido', finishedAt: todayKey(), pagesRead: book.totalPages || book.pagesRead })}>
            <Check size={14} aria-hidden /> Terminei o livro
          </button>
        </>
      )}
    </article>
  )
}

export function BooksView() {
  const books = useStore((s) => s.books)
  const addBook = useStore((s) => s.addBook)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [pages, setPages] = useState('')
  const [status, setStatus] = useState<BookStatus>('lendo')
  const group = (s: BookStatus) => books.filter((b) => b.status === s)
  const reading = group('lendo')
  const want = group('quero')
  const done = group('lido').sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))

  return (
    <>
      <PageHeader title="Leitura" subtitle="Cadastre os livros que você está lendo e atualize a página em que parou." />

      <form
        className="card mb-6 grid grid-cols-1 gap-4 p-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          addBook({ title: title.trim(), author: author.trim(), totalPages: Number(pages) || 0, status })
          setTitle('')
          setAuthor('')
          setPages('')
        }}
      >
        <Field label="Título do livro" htmlFor="bk-title"><input id="bk-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Hábitos Atômicos" /></Field>
        <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
          <Field label="Autor (opcional)" htmlFor="bk-author"><input id="bk-author" className="input" value={author} onChange={(e) => setAuthor(e.target.value)} /></Field>
          <Field label="Páginas" htmlFor="bk-pages"><input id="bk-pages" className="input" inputMode="numeric" value={pages} onChange={(e) => setPages(e.target.value.replace(/\D/g, ''))} /></Field>
        </div>
        <div className="seg w-full" role="group" aria-label="Situação">
          <button type="button" className="flex-1" aria-pressed={status === 'lendo'} onClick={() => setStatus('lendo')}>Estou lendo</button>
          <button type="button" className="flex-1" aria-pressed={status === 'quero'} onClick={() => setStatus('quero')}>Quero ler</button>
        </div>
        <button className="btn btn-primary min-h-12" type="submit" disabled={!title.trim()}><Plus size={18} aria-hidden /> Adicionar livro</button>
      </form>

      {books.length === 0 ? (
        <EmptyState icon={BookOpen} title="Nenhum livro ainda">
          Adicione o livro que está lendo agora. Depois, toda vez que ler, escreva até que página foi e o app mostra o seu progresso.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reading.length > 0 && <section aria-label="Lendo"><h2 className="mb-2 text-xl">Lendo agora</h2><div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{reading.map((b) => <BookCard key={b.id} book={b} />)}</div></section>}
          {want.length > 0 && <section aria-label="Quero ler"><h2 className="mb-2 text-xl">Quero ler</h2><div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{want.map((b) => <BookCard key={b.id} book={b} />)}</div></section>}
          {done.length > 0 && <section aria-label="Lidos"><h2 className="mb-2 text-xl">Já li ({done.length})</h2><div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{done.map((b) => <BookCard key={b.id} book={b} />)}</div></section>}
        </div>
      )}
    </>
  )
}
