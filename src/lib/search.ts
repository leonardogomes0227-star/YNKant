import type { Task } from '../types'

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Todos os termos da busca precisam aparecer no texto (sem acento, sem caixa). */
export function matches(haystack: string, query: string): boolean {
  const h = normalize(haystack)
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => h.includes(term))
}

export interface SearchHit {
  id: string
  title: string
  detail: string
}

export function searchTasks(tasks: Task[], query: string, limit = 20): SearchHit[] {
  if (!query.trim()) return []
  return tasks
    .filter((t) => matches(`${t.title} ${t.description} ${t.category}`, query))
    .slice(0, limit)
    .map((t) => ({ id: t.id, title: t.title, detail: t.done ? 'Concluída' : t.dueDate ? 'Com data' : 'Sem data' }))
}
