import { useState } from 'react'
import { Pin, PinOff, Trash2 } from 'lucide-react'
import { ConfirmDialog, Field, Modal } from '../../components/ui'
import { parseTags } from '../../lib/tags'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { Note } from '../../types'

/** Editor de notas: abre quando `pendingOpen` é uma nota (ou 'new'). */
export function NoteEditorHost() {
  const target = useUI((s) => s.pendingOpen)
  const openItem = useUI((s) => s.openItem)
  const notes = useStore((s) => s.notes)
  const open = target?.kind === 'note'
  const note = open && target.id !== 'new' ? notes.find((n) => n.id === target.id) : undefined
  const close = () => openItem(null)
  return (
    <Modal open={open && (target.id === 'new' || !!note)} onClose={close} title={note ? 'Editar nota' : 'Nova nota'} wide footer={<Footer note={note} onClose={close} />}>
      {open && <NoteForm key={target.id} note={note} onClose={close} />}
    </Modal>
  )
}

function Footer({ note, onClose }: { note?: Note; onClose: () => void }) {
  const deleteNote = useStore((s) => s.deleteNote)
  const toast = useUI((s) => s.toast)
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      {note && (
        <>
          <button className="btn btn-danger mr-auto" onClick={() => setConfirm(true)}>
            <Trash2 size={16} aria-hidden /> Excluir
          </button>
          <ConfirmDialog
            open={confirm}
            title="Excluir nota?"
            message={`“${note.title || 'Nota sem título'}” será removida. Isso não pode ser desfeito.`}
            confirmLabel="Excluir"
            danger
            onCancel={() => setConfirm(false)}
            onConfirm={() => {
              deleteNote(note.id)
              setConfirm(false)
              toast('Nota excluída.')
              onClose()
            }}
          />
        </>
      )}
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" type="submit" form="note-form">Salvar</button>
    </>
  )
}

function NoteForm({ note, onClose }: { note?: Note; onClose: () => void }) {
  const { addNote, updateNote } = useStore.getState()
  const [title, setTitle] = useState(note?.title ?? '')
  const [body, setBody] = useState(note?.body ?? '')
  const [tags, setTags] = useState((note?.tags ?? []).join(', '))
  const [pinned, setPinned] = useState(note?.pinned ?? false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() && !body.trim()) return onClose()
    const data = { title: title.trim(), body, tags: parseTags(tags), pinned }
    if (note) updateNote(note.id, data)
    else addNote(data)
    onClose()
  }

  return (
    <form
      id="note-form"
      onSubmit={submit}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submit(e)
      }}
      className="grid grid-cols-1 gap-4"
    >
      <Field label="Título" htmlFor="n-title">
        <input id="n-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sem título" autoFocus />
      </Field>
      <Field label="Texto" htmlFor="n-body" hint="Ctrl/⌘ + Enter salva.">
        <textarea id="n-body" className="input min-h-48" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreva livremente…" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Field label="Etiquetas" htmlFor="n-tags" hint="Separe por vírgula.">
          <input id="n-tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ideias, trabalho" />
        </Field>
        <button type="button" className={`btn ${pinned ? 'btn-primary' : ''}`} aria-pressed={pinned} onClick={() => setPinned((p) => !p)}>
          {pinned ? <PinOff size={16} aria-hidden /> : <Pin size={16} aria-hidden />}
          {pinned ? 'Fixada no topo' : 'Fixar no topo'}
        </button>
      </div>
    </form>
  )
}
