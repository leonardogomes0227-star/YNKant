import { useEffect } from 'react'
import { formatClock } from '../../lib/dates'
import { notify, playChime } from '../../lib/sound'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'

const BASE_TITLE = 'Meu Dia'
const LABEL = { focus: 'Foco', short: 'Pausa curta', long: 'Pausa longa' } as const

/**
 * Roda no App inteiro: conclui o ciclo quando o tempo acaba (mesmo fora da tela
 * de Foco) e mostra o tempo restante no título da aba.
 */
export function useFocusTicker() {
  useEffect(() => {
    const tick = () => {
      const { timer, settings, finishTimer } = useStore.getState()
      if (!timer.running || timer.endsAt === null) {
        if (document.title !== BASE_TITLE) document.title = BASE_TITLE
        return
      }
      const left = (timer.endsAt - Date.now()) / 1000
      if (left <= 0) {
        const wasFocus = timer.mode === 'focus'
        finishTimer(true)
        if (settings.sound) playChime()
        const msg = wasFocus ? 'Sessão de foco concluída. Hora da pausa!' : 'Pausa terminada. Vamos focar?'
        notify('Meu Dia', msg)
        useUI.getState().toast(msg)
        document.title = BASE_TITLE
        return
      }
      document.title = `${formatClock(left)} · ${LABEL[timer.mode]} — ${BASE_TITLE}`
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [])
}
