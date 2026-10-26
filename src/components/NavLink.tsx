import type { ReactNode } from 'react'
import { go } from '../store/ui'
import type { RouteId } from '../types'

/** Link de navegação interna: troca a aba pelo app (e atualiza a URL quando possível). */
export function NavLink({
  to,
  className,
  current,
  children,
}: {
  to: RouteId
  className?: string
  current?: boolean
  children: ReactNode
}) {
  return (
    <a
      href={`#/${to}`}
      className={className}
      aria-current={current ? 'page' : undefined}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        go(to)
      }}
    >
      {children}
    </a>
  )
}
