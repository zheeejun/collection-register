import type { Page } from '../../app/app.interface'

export interface LibraryStatsProps {
  counts: Record<Page, number>
  overdue: number
  soon: number
}
