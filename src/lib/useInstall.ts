import { useEffect, useState } from 'react'

interface InstallEvent extends Event {
  prompt: () => Promise<void>
}

/** Expõe o convite de instalação do PWA quando o navegador o oferece. */
export function useInstall() {
  const [ev, setEv] = useState<InstallEvent | null>(null)
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEv(e as InstallEvent)
    }
    const onInstalled = () => setEv(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])
  return ev
    ? async () => {
        await ev.prompt()
        setEv(null)
      }
    : null
}
