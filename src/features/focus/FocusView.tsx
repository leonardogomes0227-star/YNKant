import { useState } from 'react'
import { Pause, Play, RotateCcw, Settings2, Square, Trash2 } from 'lucide-react'
import { EmptyState, Field, PageHeader, SectionTitle } from '../../components/ui'
import { formatBR, formatClock, formatDuration, shiftKey, todayKey, weekKeys, WEEKDAY_SHORT, weekdayOf } from '../../lib/dates'
import { secondsByDate, secondsInDates } from '../../lib/focus'
import { askNotificationPermission, unlockAudio } from '../../lib/sound'
import { useNow } from '../../lib/useNow'
import { modeSeconds, useStore } from '../../store/useStore'
import type { TimerMode } from '../../types'

const MODES: { id: TimerMode; label: string }[] = [
  { id: 'focus', label: 'Foco' },
  { id: 'short', label: 'Pausa curta' },
  { id: 'long', label: 'Pausa longa' },
]

function Ring({ progress, children }: { progress: number; children: React.ReactNode }) {
  const r = 108
  const c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto grid size-[min(78vw,280px)] place-items-center">
      <svg viewBox="0 0 240 240" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="120" cy="120" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
        <circle
          cx="120"
          cy="120"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, progress)))}
          style={{ transition: 'stroke-dashoffset 0.4s linear' }}
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  )
}

export function FocusView() {
  const now = useNow(250)
  const today = todayKey(now)
  const timer = useStore((s) => s.timer)
  const settings = useStore((s) => s.settings)
  const sessions = useStore((s) => s.focusSessions)
  const tasks = useStore((s) => s.tasks)
  const { startTimer, pauseTimer, resetTimer, setTimerMode, setTimerTask, finishTimer, updateSettings, deleteSession } = useStore.getState()
  const [showSettings, setShowSettings] = useState(false)

  const total = modeSeconds(settings, timer.mode)
  const remaining = timer.running && timer.endsAt !== null ? Math.max(0, (timer.endsAt - now.getTime()) / 1000) : timer.remaining
  const elapsed = total - remaining
  const started = timer.running || timer.startedAt !== null
  const openTasks = tasks.filter((t) => !t.done)
  const taskOf = (id: string | null) => tasks.find((t) => t.id === id)

  const week = weekKeys(today)
  const byDate = secondsByDate(sessions)
  const weekMax = Math.max(1, ...week.map((d) => byDate[d] ?? 0))
  const todaySessions = sessions.filter((s) => s.date === today)
  const recent = [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 25)

  const setNum = (key: 'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes' | 'longBreakEvery', v: string, max: number) => {
    const n = Math.floor(Number(v))
    if (Number.isFinite(n) && n >= 1) updateSettings({ [key]: Math.min(max, n) })
  }

  const label = timer.mode === 'focus' ? 'Hora de focar' : timer.mode === 'short' ? 'Pausa curta' : 'Pausa longa'

  return (
    <>
      <PageHeader
        title="Foco"
        subtitle="Cronômetro para focar: 25 minutos de trabalho e depois uma pausa. Toque em Iniciar."
        actions={
          <button className="btn" onClick={() => setShowSettings((v) => !v)} aria-expanded={showSettings}>
            <Settings2 size={16} aria-hidden /> Configurar
          </button>
        }
      />

      {showSettings && (
        <section className="card mb-6 p-4" aria-label="Configurações do timer">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Foco (min)" htmlFor="f-focus"><input id="f-focus" className="input" type="number" min={1} max={180} value={settings.focusMinutes} onChange={(e) => setNum('focusMinutes', e.target.value, 180)} /></Field>
            <Field label="Pausa curta" htmlFor="f-short"><input id="f-short" className="input" type="number" min={1} max={60} value={settings.shortBreakMinutes} onChange={(e) => setNum('shortBreakMinutes', e.target.value, 60)} /></Field>
            <Field label="Pausa longa" htmlFor="f-long"><input id="f-long" className="input" type="number" min={1} max={120} value={settings.longBreakMinutes} onChange={(e) => setNum('longBreakMinutes', e.target.value, 120)} /></Field>
            <Field label="Longa a cada" htmlFor="f-every" hint="focos"><input id="f-every" className="input" type="number" min={1} max={12} value={settings.longBreakEvery} onChange={(e) => setNum('longBreakEvery', e.target.value, 12)} /></Field>
          </div>
          <label className="mt-4 flex min-h-10 cursor-pointer items-center gap-3">
            <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={settings.sound} onChange={(e) => updateSettings({ sound: e.target.checked })} />
            Tocar som ao terminar
          </label>
        </section>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="card metal p-5 sm:p-8" aria-label="Timer">
          <div className="seg mb-6 flex w-full justify-center" role="group" aria-label="Tipo de ciclo">
            {MODES.map((m) => (
              <button key={m.id} className="flex-1" aria-pressed={timer.mode === m.id} onClick={() => setTimerMode(m.id)} disabled={timer.running && timer.mode !== m.id} >
                {m.label}
              </button>
            ))}
          </div>

          <Ring progress={total ? elapsed / total : 0}>
            <div className="tabular font-display text-6xl leading-none sm:text-7xl" role="timer" aria-label={`Tempo restante ${formatClock(remaining)}`}>
              {formatClock(remaining)}
            </div>
            <div className="mt-2 text-sm text-muted">{label}</div>
          </Ring>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {timer.running ? (
              <button className="btn btn-primary min-w-36" onClick={pauseTimer}>
                <Pause size={18} aria-hidden /> Pausar
              </button>
            ) : (
              <button
                className="btn btn-primary min-w-36"
                onClick={() => {
                  unlockAudio()
                  askNotificationPermission()
                  startTimer()
                }}
              >
                <Play size={18} aria-hidden /> {started ? 'Continuar' : 'Iniciar'}
              </button>
            )}
            <button className="btn" onClick={resetTimer} disabled={!started}>
              <RotateCcw size={16} aria-hidden /> Reiniciar
            </button>
            <button
              className="btn"
              onClick={() => finishTimer(false)}
              disabled={timer.mode === 'focus' ? !started : false}
              title={timer.mode === 'focus' ? 'Encerra e registra o tempo focado até agora' : 'Pula esta pausa'}
            >
              <Square size={15} aria-hidden /> {timer.mode === 'focus' ? 'Encerrar e registrar' : 'Pular pausa'}
            </button>
          </div>
          {timer.mode === 'focus' && started && elapsed < 60 && (
            <p className="mt-3 text-center text-xs text-muted">Sessões com menos de 1 minuto não entram no histórico.</p>
          )}

          <div className="mx-auto mt-6 max-w-sm">
            <Field label="Vincular a uma tarefa" htmlFor="f-task">
              <select id="f-task" className="input" value={timer.taskId ?? ''} onChange={(e) => setTimerTask(e.target.value || null)}>
                <option value="">Sem tarefa vinculada</option>
                {openTasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2" aria-label={`${timer.cycles} de ${settings.longBreakEvery} focos até a pausa longa`} role="img">
            {Array.from({ length: settings.longBreakEvery }, (_, i) => (
              <span key={i} className={`size-2.5 rounded-full ${i < timer.cycles ? 'bg-accent' : 'bg-surface-2 ring-1 ring-line-strong'}`} />
            ))}
          </div>
        </section>

        <aside className="grid content-start gap-6" aria-label="Resumo de foco">
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">Hoje</div>
              <div className="tabular mt-1 font-display text-3xl">{formatDuration(byDate[today] ?? 0)}</div>
              <div className="text-xs text-muted">{todaySessions.length} sessão(ões)</div>
            </div>
            <div className="card p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">Semana</div>
              <div className="tabular mt-1 font-display text-3xl">{formatDuration(secondsInDates(sessions, week))}</div>
              <div className="text-xs text-muted">seg a dom</div>
            </div>
          </div>
          <div className="card p-4">
            <h2 className="mb-3 text-base">Por dia</h2>
            <ul className="flex h-28 items-end justify-between gap-2" aria-label="Tempo focado por dia da semana">
              {week.map((d) => {
                const v = byDate[d] ?? 0
                return (
                  <li key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${formatBR(d)}: ${formatDuration(v)}`}>
                    <span className="tabular text-[10px] text-muted">{v ? formatDuration(v) : ''}</span>
                    <span className={`w-full rounded-t ${d === today ? 'bg-accent' : 'bg-line-strong'}`} style={{ height: `${Math.max(v ? 6 : 2, (v / weekMax) * 70)}%` }} />
                    <span className="text-[11px] capitalize text-muted">{WEEKDAY_SHORT[weekdayOf(d)]}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>
      </div>

      <section className="mt-10" aria-label="Histórico de sessões">
        <SectionTitle>Histórico</SectionTitle>
        {recent.length === 0 ? (
          <EmptyState icon={Play} title="Nenhuma sessão registrada">
            Inicie um ciclo de foco acima. Quando ele terminar, a sessão aparece aqui com o tempo e a tarefa vinculada.
          </EmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-0.5">
            {recent.map((s) => {
              const t = taskOf(s.taskId)
              return (
                <li key={s.id} className="flex items-center gap-2 rounded-xl px-2 py-2 sm:gap-3 sm:px-3 hover:bg-surface-2/60">
                  <span className="tabular w-[76px] shrink-0 text-sm text-muted sm:w-24">{s.date === today ? 'Hoje' : s.date === shiftKey(today, -1) ? 'Ontem' : formatBR(s.date)}</span>
                  <span className="tabular w-14 shrink-0 font-semibold sm:w-16">{formatDuration(s.seconds)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">{t ? t.title : 'Sem tarefa vinculada'}</span>
                  <button className="icon-btn icon-btn-sm" aria-label="Remover sessão do histórico" onClick={() => deleteSession(s.id)}>
                    <Trash2 size={15} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
