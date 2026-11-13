import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'
import BookTable from '../book-table/book-table.vue'
import LocationList from '../location-list/location-list.vue'
import { pages } from '../../app/app.navigation'
import type { Book, LibraryLocation } from '../../library'
import type { RecordsPanelProps } from './records-panel.interface'

export default defineComponent({
  name: 'RecordsPanel',
  components: { BookTable, LocationList },
  props: {
    page: { type: String as PropType<RecordsPanelProps['page']>, required: true },
    filteredBooks: { type: Array as PropType<Book[]>, required: true },
    filteredLocations: { type: Array as PropType<LibraryLocation[]>, required: true },
    allBooks: { type: Array as PropType<Book[]>, required: true },
    allLocations: { type: Array as PropType<LibraryLocation[]>, required: true },
    total: { type: Number, required: true },
    today: { type: String, required: true },
    query: { type: String, required: true },
    locationFilter: { type: String, required: true },
    dueFilter: { type: String, required: true },
    loading: Boolean,
    saving: Boolean,
    sharing: Boolean,
    fatalError: { type: String, default: '' },
  },
  emits: {
    'update:query': (value: string) => typeof value === 'string',
    'update:locationFilter': (value: string) => typeof value === 'string',
    'update:dueFilter': (value: string) => typeof value === 'string',
    'add-book': () => true, 'add-location': () => true, share: () => true,
    borrow: (book: Book) => !!book, return: (book: Book) => !!book,
    'edit-book': (book: Book) => !!book, 'delete-book': (book: Book) => !!book,
    'edit-location': (place: LibraryLocation) => !!place, 'delete-location': (place: LibraryLocation) => !!place,
  },
  setup(props, { emit }) {
    const currentPage = computed(() => pages.find(item => item.id === props.page)!)
    const query = computed({ get: () => props.query, set: value => emit('update:query', value) })
    const locationFilter = computed({ get: () => props.locationFilter, set: value => emit('update:locationFilter', value) })
    const dueFilter = computed({ get: () => props.dueFilter, set: value => emit('update:dueFilter', value) })
    return { emit, currentPage, query, locationFilter, dueFilter }
  },
})
