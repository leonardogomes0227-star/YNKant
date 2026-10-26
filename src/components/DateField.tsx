import { useRef, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { maskDate, parseBR, textFromKey } from '../lib/dateInput'

/**
 * Campo de data sempre em dd/mm/aaaa (o <input type="date"> nativo segue o idioma
 * do navegador). Digite com máscara ou use o botão para abrir o calendário.
 * `onChange` recebe yyyy-MM-dd, ou '' se o campo está vazio/incompleto.
 */
export function DateField({
  id,
  value,
  onChange,
  onValidity,
}: {
  id: string
  value: string
  onChange: (key: string) => void
  onValidity?: (valid: boolean) => void
}) {
  const [text, setText] = useState(textFromKey(value))
  const picker = useRef<HTMLInputElement>(null)
  const invalid = text.length > 0 && parseBR(text) === null

  const update = (t: string) => {
    setText(t)
    const key = parseBR(t)
    onChange(key ?? '')
    onValidity?.(t.length === 0 || key !== null)
  }

  return (
    <div className="relative">
      <input
        id={id}
        className="input pr-12"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={text}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-err` : undefined}
        onChange={(e) => update(maskDate(e.target.value))}
      />
      <button
        type="button"
        className="icon-btn icon-btn-sm absolute right-1.5 top-1/2 -translate-y-1/2"
        aria-label="Abrir calendário"
        onClick={() => {
          const el = picker.current
          if (!el) return
          try {
            el.showPicker()
          } catch {
            el.focus()
            el.click()
          }
        }}
      >
        <CalendarDays size={17} />
      </button>
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 size-0 opacity-0"
        value={parseBR(text) ?? ''}
        onChange={(e) => update(e.target.value ? textFromKey(e.target.value) : '')}
      />
      {invalid && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-danger">
          Data inválida. Use o formato dd/mm/aaaa.
        </p>
      )}
    </div>
  )
}
