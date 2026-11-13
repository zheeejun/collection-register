import { defineComponent, watch } from 'vue'
import LibrarySidebar from '../components/library-sidebar/library-sidebar.vue'
import LibraryStats from '../components/library-stats/library-stats.vue'
import BookForm from '../components/book-form/book-form.vue'
import LocationForm from '../components/location-form/location-form.vue'
import RecordsPanel from '../components/records-panel/records-panel.vue'
import SharedCollection from '../components/SharedCollection.vue'
import ShareLinkDialog from '../components/ShareLinkDialog.vue'
import { useLibraryNavigation } from './app.navigation'
import { useLibraryStore } from '../composables/useLibraryStore'
import { useLibraryCatalog } from '../composables/useLibraryCatalog'
import { useLibraryEditor } from '../composables/useLibraryEditor'
import { useLibrarySharing } from '../composables/useLibrarySharing'

export default defineComponent({
  name: 'LibraryApp',
  components: { LibrarySidebar, LibraryStats, BookForm, LocationForm, RecordsPanel, SharedCollection, ShareLinkDialog },
  setup() {
    const isSharedView = window.location.hash.startsWith('#share=')
    const navigation = useLibraryNavigation(!isSharedView)
    const store = useLibraryStore(!isSharedView)
    const catalog = useLibraryCatalog(store, navigation)
    const editor = useLibraryEditor(store, navigation.page)
    const sharing = useLibrarySharing(store, catalog.filteredBooks, isSharedView)
    watch(navigation.page, editor.closeEditor)

    return { isSharedView, ...navigation, ...store, ...catalog, ...editor, ...sharing }
  },
})
