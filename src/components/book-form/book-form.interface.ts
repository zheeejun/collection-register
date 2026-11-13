import type { Book, LibraryLocation } from '../../library'

export interface BookFormProps {
  initial: Book
  locations: LibraryLocation[]
  saving?: boolean
}
