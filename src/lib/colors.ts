export const BLOCK_COLORS: Record<string, { label: string; hex: string }> = {
  brass: { label: 'Latão', hex: '#d4a24c' },
  silver: { label: 'Prata', hex: '#a9b1bb' },
  steel: { label: 'Aço', hex: '#6f93b8' },
  sage: { label: 'Sálvia', hex: '#7fa88b' },
  rose: { label: 'Rosé', hex: '#c9818c' },
  violet: { label: 'Violeta', hex: '#9d8dc7' },
  clay: { label: 'Argila', hex: '#c48b6a' },
}

export function colorHex(key: string): string {
  return (BLOCK_COLORS[key] ?? BLOCK_COLORS.brass).hex
}
