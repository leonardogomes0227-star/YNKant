/* Service worker simples do Meu Dia: funciona offline depois da primeira visita.
 * - Instalação: guarda o shell do app (HTML + JS/CSS referenciados nele).
 * - Páginas: rede primeiro, cache como reserva (assim atualizações chegam sozinhas).
 * - Demais arquivos (inclusive Google Fonts): do cache, atualizando em segundo plano.
 * Para forçar a atualização do cache, mude CACHE. */
const CACHE = 'meu-dia-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      let assets = []
      try {
        const html = await (await fetch('/', { cache: 'reload' })).text()
        assets = [...html.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)].map((m) => m[1])
      } catch {
        /* sem rede na instalação: o cache é preenchido aos poucos */
      }
      await Promise.allSettled([...new Set([...SHELL, ...assets])].map((u) => cache.add(u)))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const sameOrigin = url.origin === self.location.origin
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
  if (!sameOrigin && !isFont) return

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE)
        try {
          const fresh = await fetch(req)
          cache.put('/', fresh.clone())
          return fresh
        } catch {
          return (await cache.match('/')) || Response.error()
        }
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(req)
      const network = fetch(req)
        .then((res) => {
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone())
          return res
        })
        .catch(() => undefined)
      return cached || (await network) || Response.error()
    })(),
  )
})
