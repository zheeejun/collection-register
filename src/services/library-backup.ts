import type { Book, LibraryData, LibraryLocation } from '../library'

const bookFields = ['id', 'title', 'author', 'sn', 'locationId', 'status', 'reservedOn', 'borrowedOn', 'dueOn', 'notes'] as const
const placeFields = ['id', 'name', 'address', 'floor', 'shelf', 'notes'] as const

/** Validate external snapshots before displaying or uploading them. */
export function parseLibraryData(value: unknown): LibraryData {
  const fail = () => { throw new Error('館藏資料格式不正確，請選擇此網站匯出的 JSON 備份。') }
  if (!value || typeof value !== 'object') return fail()
  const source = value as Record<string, unknown>
  if (source.version !== 1 || !Array.isArray(source.books) || !Array.isArray(source.locations)) return fail()
  function rows<T>(items: unknown[], fields: readonly string[]): T[] {
    const ids = new Set<string>()
    return items.map(item => {
      if (!item || typeof item !== 'object') return fail()
      const row = item as Record<string, unknown>
      if (fields.some(field => typeof row[field] !== 'string') || !row.id || ids.has(row.id as string)) return fail()
      ids.add(row.id as string)
      return Object.fromEntries(fields.map(field => [field, row[field]])) as T
    })
  }
  const books = rows<Book>(source.books, bookFields)
  const locations = rows<LibraryLocation>(source.locations, placeFields)
  if (books.some(book => !['available', 'reserved', 'borrowed', 'returned'].includes(book.status)
    || (book.locationId && !locations.some(place => place.id === book.locationId)))) return fail()
  return { version: 1, books, locations }
}
