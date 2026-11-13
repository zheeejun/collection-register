import type { Book, LibraryLocation } from '../../library'
import type { Page } from '../../app/app.interface'

export interface RecordsPanelProps {
  page: Page
  filteredBooks: Book[]
  filteredLocations: LibraryLocation[]
  allBooks: Book[]
  allLocations: LibraryLocation[]
  total: number
  today: string
  query: string
  locationFilter: string
  dueFilter: string
  loading?: boolean
  saving?: boolean
  sharing?: boolean
  fatalError?: string
}
