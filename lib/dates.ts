export function toDateKey(timestamp: number): string {
  const d = new Date(timestamp)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function matchesDateKey(timestamp: number | null | undefined, key: string): boolean {
  if (!key) return true
  if (!timestamp) return false
  return toDateKey(timestamp) === key
}

export function formatDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}