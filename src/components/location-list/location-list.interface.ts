import type { Book, LibraryLocation } from '../../library'

export interface LocationListProps {
  locations: LibraryLocation[]
  books: Book[]
  saving?: boolean
}
