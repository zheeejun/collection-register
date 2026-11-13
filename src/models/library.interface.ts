export type BookStatus = 'available' | 'reserved' | 'borrowed' | 'returned'

export interface LibraryLocation {
  id: string
  name: string
  address: string
  floor: string
  shelf: string
  notes: string
}

export interface Book {
  id: string
  title: string
  author: string
  sn: string
  locationId: string
  status: BookStatus
  reservedOn: string
  borrowedOn: string
  dueOn: string
  notes: string
}

export interface LibraryData {
  version: 1
  books: Book[]
  locations: LibraryLocation[]
}
