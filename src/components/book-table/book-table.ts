import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { daysUntil, dueLabel, statusLabels } from '../../library'
import type { Book } from '../../library'
import type { BookTableProps } from './book-table.interface'

export default defineComponent({
  name: 'BookTable',
  props: {
    books: { type: Array as PropType<BookTableProps['books']>, required: true },
    locations: { type: Array as PropType<BookTableProps['locations']>, required: true },
    page: { type: String as PropType<BookTableProps['page']>, required: true },
    today: { type: String, required: true },
    saving: Boolean,
  },
  emits: {
    borrow: (book: Book) => !!book,
    return: (book: Book) => !!book,
    edit: (book: Book) => !!book,
    delete: (book: Book) => !!book,
  },
  setup(props, { emit }) {
    const locationName = (id: string) => props.locations.find(place => place.id === id)?.name || '未指定地點'
    function locationDetail(id: string) {
      const place = props.locations.find(item => item.id === id)
      return place ? [place.floor, place.shelf].filter(Boolean).join(' · ') : ''
    }
    return { emit, locationName, locationDetail, daysUntil, dueLabel, statusLabels }
  },
})
