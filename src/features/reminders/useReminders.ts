import { useEffect } from 'react'
import { dueReminders } from '../../lib/reminders'
import { notify, playChime } from '../../lib/sound'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'

const STORAGE = 'meu-dia-avisos'

function load(): Record<string, true> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) ?? '{}')
  } catch {
    return {}
  }
}

function save(map: Record<string, true>) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(map))
  } catch {
    /* sem armazenamento: pode repetir o aviso, sem prejuízo */
  }
}

/** Confere a cada 20 s se há tarefa ou bloco da rotina para avisar (com o app aberto). */
export function useReminders() {
  useEffect(() => {
    const check = () => {
      const { tasks, routine, settings } = useStore.getState()
      if (!settings.remindTasks && !settings.remindBlocks) return
      const reminded = load()
      const due = dueReminders({
        tasks,
        routine,
        now: new Date(),
        reminded,
        tasksOn: settings.remindTasks,
        blocksOn: settings.remindBlocks,
      })
      if (due.length === 0) return
      for (const r of due) {
        reminded[r.key] = true
        notify(r.title, r.body)
        useUI.getState().toast(`${r.title} — ${r.body}`)
      }
      if (settings.sound) playChime()
      save(reminded)
    }
    check()
    const id = setInterval(check, 20_000)
    return () => clearInterval(id)
  }, [])
}
