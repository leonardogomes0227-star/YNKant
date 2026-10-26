import { useUI } from '../store/ui'
import type { RouteId } from '../types'

export function useRoute(): RouteId {
  return useUI((s) => s.route)
}
