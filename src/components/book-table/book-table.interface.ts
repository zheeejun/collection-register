import type { Book, LibraryLocation } from '../../library'
import type { Page } from '../../app/app.interface'

export interface BookTableProps {
  books: Book[]
  locations: LibraryLocation[]
  page: Page
  today: string
  saving?: boolean
}
