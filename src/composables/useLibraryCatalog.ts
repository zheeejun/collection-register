import { computed } from 'vue'
import { daysUntil } from '../library'
import type { LibraryStore } from './useLibraryStore'
import type { LibraryNavigation } from '../app/app.navigation'

export function useLibraryCatalog(store: LibraryStore, navigation: LibraryNavigation) {
  const { data, today } = store
  const { page, query, locationFilter, dueFilter } = navigation
  const borrowed = computed(() => data.value.books.filter(book => book.status === 'borrowed'))
  const reserved = computed(() => data.value.books.filter(book => book.status === 'reserved'))
  const overdue = computed(() => borrowed.value.filter(book => daysUntil(book.dueOn, today.value) < 0))
  const soon = computed(() => borrowed.value.filter(book => {
    const days = daysUntil(book.dueOn, today.value)
    return days >= 0 && days <= 3
  }))
  const locationName = (id: string) => data.value.locations.find(place => place.id === id)?.name || '未指定地點'

  const filteredBooks = computed(() => {
    const keyword = query.value.trim().toLocaleLowerCase()
    const books = data.value.books.filter(book => {
      if (page.value === 'reserved' && book.status !== 'reserved') return false
      if (page.value === 'borrowed' && book.status !== 'borrowed') return false
      if (locationFilter.value && book.locationId !== locationFilter.value) return false
      if (page.value === 'borrowed' && dueFilter.value !== 'all') {
        const days = daysUntil(book.dueOn, today.value)
        if (dueFilter.value === 'overdue' && days >= 0) return false
        if (dueFilter.value === 'soon' && (days < 0 || days > 3)) return false
      }
      return !keyword || [book.title, book.author, book.sn, locationName(book.locationId), book.notes].some(value => value.toLocaleLowerCase().includes(keyword))
    })
    return page.value === 'borrowed' ? books.sort((a, b) => a.dueOn.localeCompare(b.dueOn)) : books
  })
  const filteredLocations = computed(() => data.value.locations.filter(place =>
    [place.name, place.address, place.floor, place.shelf, place.notes].some(value => value.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())),
  ))


  const counts = computed(() => ({ all: data.value.books.length, reserved: reserved.value.length, borrowed: borrowed.value.length, locations: data.value.locations.length }))
  return { reserved, borrowed, overdue, soon, filteredBooks, filteredLocations, counts }
}
