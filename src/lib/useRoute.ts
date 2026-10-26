import { useSyncExternalStore } from 'react'
import { parseRoute } from '../store/ui'
import type { RouteId } from '../types'

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): RouteId {
  return useSyncExternalStore(subscribe, () => parseRoute(location.hash), () => 'hoje' as RouteId)
}
