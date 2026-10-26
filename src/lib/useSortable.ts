import { useState, type KeyboardEvent, type PointerEvent } from 'react'

/**
 * Reordenação por arrastar (mouse e toque, via pointer events) e pelo teclado
 * (setas ↑ ↓ com o foco na alça). As linhas precisam de `data-sort-id`.
 */
export function useSortable(ids: string[], onReorder: (ids: string[]) => void) {
  const [drag, setDrag] = useState<{ id: string; overId: string } | null>(null)

  const move = (from: string, to: string) => {
    if (from === to) return
    const next = ids.filter((x) => x !== from)
    next.splice(ids.indexOf(to), 0, from)
    onReorder(next)
  }

  const handleProps = (id: string) => ({
    style: { touchAction: 'none' as const, cursor: 'grab' },
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      setDrag({ id, overId: id })
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (!drag) return
      const row = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-sort-id]')
      const overId = row?.getAttribute('data-sort-id')
      if (overId && overId !== drag.overId) setDrag({ ...drag, overId })
    },
    onPointerUp: () => {
      if (drag) move(drag.id, drag.overId)
      setDrag(null)
    },
    onPointerCancel: () => setDrag(null),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      const i = ids.indexOf(id)
      if (e.key === 'ArrowUp' && i > 0) {
        e.preventDefault()
        move(id, ids[i - 1])
      } else if (e.key === 'ArrowDown' && i < ids.length - 1) {
        e.preventDefault()
        move(id, ids[i + 1])
      }
    },
  })

  return {
    handleProps,
    isDragging: (id: string) => drag?.id === id,
    isOver: (id: string) => drag !== null && drag.overId === id && drag.id !== id,
  }
}
