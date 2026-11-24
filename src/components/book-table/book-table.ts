import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { daysUntil, dueLabel, renewalBlockReason, statusLabels } from '../../library'
import type { Book } from '../../library'
import type { BookTableProps } from './book-table.interface'
import { LiButton, LiCheckbox } from '../../li-components'

export default defineComponent({
  name: 'BookTable',
  components: { LiButton, LiCheckbox },
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
    renew: (book: Book) => !!book,
    reservation: (value: { id: string; hasReservation: boolean }) => !!value.id,
    edit: (book: Book) => !!book,
    delete: (book: Book) => !!book,
  },
  setup(props, { emit }) {
    const locationName = (id: string) => props.locations.find(place => place.id === id)?.name || '未指定地點'
    function locationDetail(id: string) {
      const place = props.locations.find(item => item.id === id)
      return place ? [place.floor, place.shelf].filter(Boolean).join(' · ') : ''
    }
    function changeReservation(book: Book, event: Event) {
      const input = event.target as HTMLInputElement
      emit('reservation', { id: book.id, hasReservation: input.checked })
      // Keep the checkbox at its saved value until the database confirms the change.
      input.checked = !!book.hasReservation
    }
    return { emit, locationName, locationDetail, daysUntil, dueLabel, renewalBlockReason, statusLabels, changeReservation }
  },
})
