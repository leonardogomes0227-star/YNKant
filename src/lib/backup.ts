import type { AppData } from '../types'
import { toKey } from './dates'
import { DATA_VERSION, migrate, normalizeData } from '../store/migrations'

export const BACKUP_APP = 'meu-dia'

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  data: AppData
}

export function buildBackup(data: AppData, now: Date = new Date()): BackupFile {
  return { app: BACKUP_APP, version: DATA_VERSION, exportedAt: now.toISOString(), data }
}

export function backupFileName(now: Date = new Date()): string {
  return `meu-dia-backup-${toKey(now)}.json`
}

export type ParseResult = { ok: true; data: AppData; version: number } | { ok: false; error: string }

/** Lê e valida um arquivo de backup, migrando dados de versões anteriores. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'O arquivo não é um JSON válido.' }
  }
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'Formato de backup não reconhecido.' }
  const file = raw as Record<string, unknown>
  if (file.app !== BACKUP_APP || typeof file.version !== 'number' || typeof file.data !== 'object' || file.data === null) {
    return { ok: false, error: 'Este arquivo não parece ser um backup do Meu Dia.' }
  }
  if (file.version > DATA_VERSION) {
    return { ok: false, error: 'Este backup foi gerado por uma versão mais nova do app. Atualize o Meu Dia e tente de novo.' }
  }
  return { ok: true, version: file.version, data: normalizeData(migrate(file.data, file.version)) }
}

export function downloadBackup(data: AppData) {
  const blob = new Blob([JSON.stringify(buildBackup(data), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backupFileName()
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function dataCounts(d: AppData): string {
  return `${d.tasks.length} tarefas, ${d.habits.length} hábitos, ${d.routine.length} blocos, ${d.notes.length} notas, ${d.goals.length} metas`
}
