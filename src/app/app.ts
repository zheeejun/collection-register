import { LiButton } from '../li-components'
import { defineComponent, watch } from 'vue'
import LibrarySidebar from '../components/library-sidebar/library-sidebar.vue'
import LibraryStats from '../components/library-stats/library-stats.vue'
import BookForm from '../components/book-form/book-form.vue'
import LocationForm from '../components/location-form/location-form.vue'
import RecordsPanel from '../components/records-panel/records-panel.vue'
import SharedCollection from '../components/shared-collection/shared-collection.vue'
import ShareLinkDialog from '../components/share-link-dialog/share-link-dialog.vue'
import { useLibraryNavigation } from './app.navigation'
import { useLibraryStore } from '../composables/useLibraryStore'
import { useLibraryCatalog } from '../composables/useLibraryCatalog'
import { useLibraryEditor } from '../composables/useLibraryEditor'
import { useLibrarySharing } from '../composables/useLibrarySharing'

export default defineComponent({
  name: 'LibraryApp',
  props: { userId: String, email: String },
  emits: ['sign-out'],
  components: { LiButton, LibrarySidebar, LibraryStats, BookForm, LocationForm, RecordsPanel, SharedCollection, ShareLinkDialog },
  setup(props, { emit }) {
    const isSharedView = window.location.hash.startsWith('#share=')
    const navigation = useLibraryNavigation(!isSharedView)
    const store = useLibraryStore(!isSharedView, props.userId)
    const catalog = useLibraryCatalog(store, navigation)
    const editor = useLibraryEditor(store, navigation.page)
    const sharing = useLibrarySharing(store, catalog.filteredBooks, isSharedView)
    watch(navigation.page, editor.closeEditor)

    async function refreshLibrary() {
      if (store.saving.value || store.loading.value) return
      if ((editor.editor.value || editor.pendingDelete.value) && !window.confirm('重新讀取會關閉目前表單，尚未儲存的內容將捨棄。確定繼續？')) return
      editor.closeEditor()
      editor.pendingDelete.value = null
      await store.reload()
    }

    function signOut() {
      if (store.saving.value) return
      if (editor.editor.value && !window.confirm('登出會捨棄尚未儲存的表單內容。確定登出？')) return
      emit('sign-out')
    }

    return { isSharedView, ...navigation, ...store, ...catalog, ...editor, ...sharing, refreshLibrary, signOut }
  },
})
