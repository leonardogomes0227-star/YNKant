import { useEffect, useState } from 'react'

/** Data/hora atual, atualizada a cada `ms` (padrão 30 s). */
export function useNow(ms = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}
