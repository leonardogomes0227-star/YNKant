import { useEffect, useRef, useState } from 'react'
import { Modal } from './ui'
import { useStore } from '../store/useStore'
import { useUI } from '../store/ui'

export function QuickCaptureDialog() {
  const { captureOpen, setCaptureOpen } = useUI()
  return (
    <Modal open={captureOpen} onClose={() => setCaptureOpen(false)} title="Nova tarefa">
      <CaptureForm onDone={() => setCaptureOpen(false)} />
    </Modal>
  )
}

function CaptureForm({ onDone }: { onDone: () => void }) {
  const addTask = useStore((s) => s.addTask)
  const toast = useUI((s) => s.toast)
  const [text, setText] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => ref.current?.focus(), [])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const title = text.trim()
        if (!title) return
        addTask({ title })
        toast('Tarefa adicionada.')
        onDone()
      }}
    >
      <label className="label" htmlFor="captura">
        O que você precisa fazer?
      </label>
      <input
        id="captura"
        ref={ref}
        className="input"
        placeholder="Ex.: ligar para o dentista"
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoComplete="off"
      />
      <p className="mt-2 text-xs text-muted">Depois você pode escolher o dia dela na tela Tarefas.</p>
      <div className="mt-4 flex justify-end">
        <button className="btn btn-primary" type="submit" disabled={!text.trim()}>
          Adicionar
        </button>
      </div>
    </form>
  )
}
