import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { LibraryLocation } from '../../library'
import type { LocationListProps } from './location-list.interface'

export default defineComponent({
  name: 'LocationList',
  props: {
    locations: { type: Array as PropType<LocationListProps['locations']>, required: true },
    books: { type: Array as PropType<LocationListProps['books']>, required: true },
    saving: Boolean,
  },
  emits: { edit: (place: LibraryLocation) => !!place, delete: (place: LibraryLocation) => !!place },
  setup(props, { emit }) {
    const locationCount = (id: string) => props.books.filter(book => book.locationId === id).length
    return { emit, locationCount }
  },
})
