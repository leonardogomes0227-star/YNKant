import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export function resolveDark(pref: string): boolean {
  return pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
}

/** Aplica a classe `dark` no <html> conforme a preferência (e o sistema, quando "system"). */
export function useThemeEffect() {
  const theme = useStore((s) => s.settings.theme)
  useEffect(() => {
    const apply = () => {
      const dark = resolveDark(theme)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0d0e10' : '#f3f2ee')
    }
    apply()
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}

export function toggleTheme() {
  const { settings, updateSettings } = useStore.getState()
  updateSettings({ theme: resolveDark(settings.theme) ? 'light' : 'dark' })
}
