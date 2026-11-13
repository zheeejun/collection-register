import type { BookStatus, LibraryData } from './models/library.interface'
export type { BookStatus, Book, LibraryData, LibraryLocation } from './models/library.interface'

export const statusLabels: Record<BookStatus, string> = {
  available: '館藏中', reserved: '已預約', borrowed: '已借出', returned: '已歸還',
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function daysUntil(date: string, today = localDate()) {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
}
export function dueLabel(date: string, today = localDate()) {
  const days = daysUntil(date, today)
  if (!Number.isFinite(days)) return '尚未設定到期日'
  if (days < 0) return `逾期 ${-days} 天`
  if (days === 0) return '今天到期'
  return `${days} 天後到期`
}
// Preserve the original localStorage value as a recovery copy.
export function migrateLegacy(raw: string | null): LibraryData {
  const result: LibraryData = { version: 1, books: [], locations: [] }
  if (!raw) return result
  const legacy = JSON.parse(raw)
  if (!legacy || !Array.isArray(legacy.rows)) throw new Error('舊版館藏資料格式不正確，原始資料已保留。')
  const names = new Set<string>()
  for (const value of [...(Array.isArray(legacy.locs) ? legacy.locs : []), ...legacy.rows.map((row: { loc?: unknown }) => row?.loc)]) {
    if (typeof value === 'string' && value.trim()) names.add(value.trim())
  }
  for (const name of names) result.locations.push({ id: crypto.randomUUID(), name, address: '', floor: '', shelf: '', notes: '' })
  for (const row of legacy.rows) {
    if (!row || typeof row !== 'object') continue
    result.books.push({
      id: crypto.randomUUID(), title: String(row.title ?? ''), author: '', sn: String(row.sn ?? ''),
      locationId: result.locations.find(place => place.name === String(row.loc ?? '').trim())?.id ?? '',
      status: 'available', reservedOn: '', borrowedOn: '', dueOn: '', notes: '',
    })
  }
  return result
}
