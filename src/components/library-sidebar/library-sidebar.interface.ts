import type { Page } from '../../app/app.interface'

export interface LibrarySidebarProps {
  page: Page
  counts: Record<Page, number>
  loading?: boolean
  saving?: boolean
  fatalError?: string
}
