/** "Ideias, #Trabalho; ideias" → ["ideias", "trabalho"] */
export function parseTags(s: string): string[] {
  return [...new Set(s.split(/[,;]/).map((t) => t.trim().replace(/^#/, '').toLowerCase()).filter(Boolean))]
}
