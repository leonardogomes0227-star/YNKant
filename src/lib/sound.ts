let ctx: AudioContext | null = null

/** Chame dentro de um clique do usuário para o navegador liberar o áudio. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    /* sem suporte a áudio */
  }
}

export function playChime() {
  try {
    ctx ??= new AudioContext()
    const c = ctx
    const notes = [660, 880, 1100]
    notes.forEach((f, i) => {
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = 'sine'
      o.frequency.value = f
      const t0 = c.currentTime + i * 0.22
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5)
      o.connect(g).connect(c.destination)
      o.start(t0)
      o.stop(t0 + 0.55)
    })
  } catch {
    /* sem suporte a áudio */
  }
}

export function askNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    void Notification.requestPermission()
  }
}

export function notify(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: `${import.meta.env.BASE_URL}icons/icon-192.png` })
    } catch {
      /* alguns navegadores móveis exigem service worker */
    }
  }
}
