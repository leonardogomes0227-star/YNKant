import type { ReactNode } from 'react'
import { Moon, Plus, Search, Settings, Sun } from 'lucide-react'
import { NAV, SETTINGS_NAV, type NavItem } from './nav'
import { NavLink } from './NavLink'
import { useRoute } from '../lib/useRoute'
import { modKey } from '../lib/platform'
import { toggleTheme } from '../lib/useTheme'
import { useStore } from '../store/useStore'
import { useUI } from '../store/ui'


function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={28} height={28} className="rounded-lg" />
      <span className="silver-text font-display text-xl font-medium tracking-tight">Meu Dia</span>
    </div>
  )
}

function ThemeButton({ className = '' }: { className?: string }) {
  const theme = useStore((s) => s.settings.theme)
  const dark =
    theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  return (
    <button
      className={`icon-btn ${className}`}
      onClick={toggleTheme}
      aria-label={dark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      title={dark ? 'Tema claro' : 'Tema escuro'}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  )
}

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.id}
      current={active}
      className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-[14.5px] font-medium transition-colors ${
        active ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface-2/60 hover:text-ink'
      }`}
    >
      <Icon size={18} className={active ? 'text-accent' : ''} aria-hidden />
      {item.label}
    </NavLink>
  )
}

function Sidebar({ route }: { route: string }) {
  const { setSearchOpen, setCaptureOpen } = useUI()
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-bg px-3 py-5 md:flex">
      <div className="px-3 pb-6">
        <Logo />
      </div>
      <nav aria-label="Principal" className="flex flex-1 flex-col gap-0.5">
        {NAV.map((n) => (
          <SideLink key={n.id} item={n} active={route === n.id} />
        ))}
      </nav>
      <div className="flex flex-col gap-0.5 border-t border-line pt-3">
        <button
          onClick={() => setCaptureOpen(true)}
          className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-left text-[14.5px] font-medium text-muted transition-colors hover:bg-surface-2/60 hover:text-ink"
        >
          <Plus size={18} aria-hidden />
          <span className="flex-1">Captura rápida</span>
          <kbd className="rounded border border-line px-1.5 text-[11px]">C</kbd>
        </button>
        <button
          onClick={() => setSearchOpen(true)}
          className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-left text-[14.5px] font-medium text-muted transition-colors hover:bg-surface-2/60 hover:text-ink"
        >
          <Search size={18} aria-hidden />
          <span className="flex-1">Buscar</span>
          <kbd className="rounded border border-line px-1.5 text-[11px]">{modKey} K</kbd>
        </button>
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <SideLink item={SETTINGS_NAV} active={route === 'ajustes'} />
          </div>
          <ThemeButton />
        </div>
      </div>
    </aside>
  )
}

function MobileTop({ route }: { route: string }) {
  const { setSearchOpen, setCaptureOpen } = useUI()
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/95 px-4 py-1.5 pt-[max(6px,env(safe-area-inset-top))] backdrop-blur md:hidden">
      <Logo />
      <div className="flex items-center gap-1">
        <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Buscar">
          <Search size={20} />
        </button>
        <NavLink to="ajustes" className="icon-btn" current={route === 'ajustes'}>
          <Settings size={20} aria-label="Ajustes" />
        </NavLink>
        <button
          className="flex h-10 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-bold text-accent-fg"
          onClick={() => setCaptureOpen(true)}
          aria-label="Captura rápida: anotar na caixa de entrada"
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden /> Anotar
        </button>
      </div>
    </div>
  )
}

function BottomNav({ route }: { route: string }) {
  const cls = (active: boolean) =>
    `relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
      active ? 'text-accent' : 'text-muted active:text-ink'
    }`
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {NAV.map((n) => (
        <NavLink key={n.id} to={n.id} current={route === n.id} className={cls(route === n.id)}>
          {route === n.id && <span className="absolute inset-x-5 top-0 h-0.5 rounded-b bg-accent" aria-hidden />}
          <n.icon size={23} aria-hidden />
          {n.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const route = useRoute()
  return (
    <div className="min-h-dvh">
      <a
        href="#conteudo"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('conteudo')?.focus()
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg"
      >
        Pular para o conteúdo
      </a>
      <Sidebar route={route} />
      <MobileTop route={route} />
      <main
        id="conteudo"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl px-4 pb-[calc(92px+env(safe-area-inset-bottom))] pt-6 outline-none sm:px-6 md:ml-60 md:w-[calc(100%-15rem)] md:max-w-none md:px-10 md:pb-16 md:pt-10"
      >
        <div key={route} className="page-enter mx-auto max-w-4xl">
          {children}
        </div>
      </main>
      <BottomNav route={route} />
    </div>
  )
}


