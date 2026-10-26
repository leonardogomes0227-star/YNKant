import type { Goal, Note, Task } from '../types'

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
  kind: 'task' | 'note' | 'goal'
  id: string
  title: string
  detail: string
}

export function searchAll(
  data: { tasks: Task[]; notes: Note[]; goals: Goal[] },
  query: string,
  limit = 20,
): SearchHit[] {
  if (!query.trim()) return []
  const hits: SearchHit[] = []
  for (const t of data.tasks) {
    if (matches(`${t.title} ${t.description} ${t.category}`, query))
      hits.push({ kind: 'task', id: t.id, title: t.title, detail: t.done ? 'Tarefa concluída' : 'Tarefa' })
  }
  for (const n of data.notes) {
    if (matches(`${n.title} ${n.body} ${n.tags.join(' ')}`, query))
      hits.push({ kind: 'note', id: n.id, title: n.title || 'Nota sem título', detail: 'Nota' })
  }
  for (const g of data.goals) {
    if (matches(`${g.title} ${g.description}`, query))
      hits.push({ kind: 'goal', id: g.id, title: g.title, detail: 'Meta' })
  }
  return hits.slice(0, limit)
}
