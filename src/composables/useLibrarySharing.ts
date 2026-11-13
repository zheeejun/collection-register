import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import { createShareUrl, readShareHash } from '../share'
import type { SharedCollection } from '../share'
import type { Book } from '../library'
import type { LibraryStore } from './useLibraryStore'

export function useLibrarySharing(store: LibraryStore, books: Ref<Book[]>, isSharedView: boolean) {
  const sharedCollection = ref<SharedCollection | null>(null)
  const sharedError = ref('')
  const shareUrl = ref('')
  const sharing = ref(false)

  onMounted(async () => {
    if (!isSharedView) return
    try { sharedCollection.value = await readShareHash(window.location.hash) }
    catch { sharedError.value = '無法讀取分享資料，請確認連結完整後再試。' }
  })

  async function shareBooks() {
    if (sharing.value) return
    sharing.value = true
    store.error.value = ''
    try {
      const rows = books.value.map(book => ({
        id: book.id, title: book.title, sn: book.sn,
        loc: store.data.value.locations.find(place => place.id === book.locationId)?.name || '未指定地點',
      }))
      shareUrl.value = await createShareUrl(rows, import.meta.env.VITE_PUBLIC_SITE_URL || window.location.href)
    } catch (cause) {
      store.error.value = cause instanceof Error ? cause.message : '無法產生分享連結，請稍後再試。'
    } finally {
      sharing.value = false
    }
  }

  function exportData() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(store.data.value, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `圖書管理-${store.today.value}.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return { sharedCollection, sharedError, shareUrl, sharing, shareBooks, exportData }
}
