export type Page = 'all' | 'reserved' | 'borrowed' | 'locations'

export interface PageDefinition {
  id: Page
  label: string
  description: string
}
