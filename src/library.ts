import type { Book, BookStatus, LibraryData } from './models/library.interface'
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
export const LOAN_DAYS = 28
export function addLoanDays(date: string, days = LOAN_DAYS) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return ''
  const value = new Date(`${date}T00:00:00Z`)
  if (!Number.isFinite(value.getTime()) || value.toISOString().slice(0, 10) !== date) return ''
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}
export function renewalBlockReason(book: Book) {
  if (book.status !== 'borrowed') return '只有借閱中的圖書可以續借'
  if (book.hasReservation) return '有人預約，不能續借'
  if ((book.renewalCount ?? 0) >= 1) return '已續借一次，不能再次續借'
  if (!addLoanDays(book.dueOn)) return '請先設定有效的到期日'
  return ''
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
      status: 'available', reservedOn: '', borrowedOn: '', dueOn: '', hasReservation: false, renewalCount: 0, notes: '',
    })
  }
  return result
}
