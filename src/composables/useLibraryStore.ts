import { onBeforeUnmount, onMounted, ref, toRaw } from 'vue'
import { loadLibrary, saveLibrary } from '../services/library-db'
import { localDate } from '../library'
import type { LibraryData } from '../library'

/** Owns persistent data; forms receive drafts and only commit after validation. */
export function useLibraryStore(active: boolean) {
  const data = ref<LibraryData>({ version: 1, books: [], locations: [] })
  const loading = ref(true)
  const saving = ref(false)
  const fatalError = ref('')
  const error = ref('')
  const notice = ref('')
  const today = ref(localDate())
  let clockTimer: ReturnType<typeof setInterval> | undefined

  onMounted(async () => {
    if (!active) return
    clockTimer = setInterval(() => { today.value = localDate() }, 60000)
    try {
      data.value = await loadLibrary()
    } catch (cause) {
      fatalError.value = `無法開啟資料庫。${cause instanceof Error ? cause.message : '請確認瀏覽器允許儲存資料，再重新載入。'}`
    } finally {
      loading.value = false
    }
  })
  onBeforeUnmount(() => clearInterval(clockTimer))

  async function commit(next: LibraryData, message: string) {
    if (saving.value || loading.value || fatalError.value) return false
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      await saveLibrary(next)
      data.value = next
      notice.value = message
      return true
    } catch {
      error.value = '儲存失敗，變更尚未寫入。請確認瀏覽器儲存空間後重試；表單內容仍保留。'
      return false
    } finally {
      saving.value = false
    }
  }

  const snapshot = (): LibraryData => structuredClone(toRaw(data.value))
  return { data, today, loading, saving, fatalError, error, notice, commit, snapshot }
}

export type LibraryStore = ReturnType<typeof useLibraryStore>
