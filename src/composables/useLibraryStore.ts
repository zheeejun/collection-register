import { onBeforeUnmount, onMounted, ref, toRaw } from 'vue'
import { loadLibrary, saveLibrary } from '../services/library-db'
import { localDate } from '../library'
import type { LibraryData } from '../library'
import { supabase } from '../services/supabase'
import { createCloudLibrary, LibraryConflictError } from '../services/cloud-library'
import { parseLibraryData } from '../services/library-backup'

/** Owns persistent data; forms receive drafts and only commit after validation. */
export function useLibraryStore(active: boolean, userId?: string) {
  const data = ref<LibraryData>({ version: 1, books: [], locations: [] })
  const loading = ref(true)
  const saving = ref(false)
  const fatalError = ref('')
  const error = ref('')
  const notice = ref('')
  const today = ref(localDate())
  const importCandidate = ref<LibraryData | null>(null)
  const importWarning = ref('')
  const conflict = ref(false)
  const cloud = userId && supabase ? createCloudLibrary(supabase, userId) : null
  let alive = true
  let backupRequest = 0
  let clockTimer: ReturnType<typeof setInterval> | undefined

  async function reload() {
    if (saving.value) return
    loading.value = true
    fatalError.value = ''
    error.value = ''
    notice.value = ''
    try {
      const next = cloud ? await cloud.load() : await loadLibrary()
      if (!alive) return
      data.value = next
      conflict.value = false
    } catch (cause) {
      if (alive) fatalError.value = cause instanceof Error ? cause.message : '無法讀取館藏，請重新讀取後再試。'
    } finally {
      if (alive) loading.value = false
    }
  }

  onMounted(async () => {
    if (!active) return
    clockTimer = setInterval(() => { today.value = localDate() }, 60000)
    await reload()
    if (!cloud || !alive || fatalError.value) return
    // Never upload a browser's existing data without confirming account ownership.
    try {
      const local = parseLibraryData(await loadLibrary())
      if (alive && (local.books.length || local.locations.length)) importCandidate.value = local
    } catch {
      if (alive) importWarning.value = '無法讀取此瀏覽器的舊資料。雲端館藏仍可使用，也可選擇先前匯出的 JSON 備份。'
    }
  })
  onBeforeUnmount(() => { alive = false; clearInterval(clockTimer) })

  async function commit(next: LibraryData, message: string) {
    if (!alive || saving.value || loading.value || fatalError.value || conflict.value) return false
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      if (cloud) await cloud.save(next)
      else await saveLibrary(next)
      if (!alive) return false
      data.value = next
      notice.value = message
      return true
    } catch (cause) {
      if (!alive) return false
      conflict.value = cause instanceof LibraryConflictError
      error.value = cloud && cause instanceof Error ? cause.message : '儲存失敗，變更尚未寫入。請確認瀏覽器儲存空間後重試；表單內容仍保留。'
      return false
    } finally {
      saving.value = false
    }
  }

  async function selectBackup(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file || saving.value || loading.value) return
    const request = ++backupRequest
    importWarning.value = ''
    importCandidate.value = null
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('備份檔超過 20 MB，請選擇較小的檔案。')
      const candidate = parseLibraryData(JSON.parse(await file.text()))
      if (alive && request === backupRequest) importCandidate.value = candidate
    } catch (cause) {
      if (alive && request === backupRequest) importWarning.value = cause instanceof SyntaxError ? '無法解析 JSON 備份，請確認檔案完整。' : cause instanceof Error ? cause.message : '無法讀取備份。'
    }
  }

  function dismissImport() { backupRequest++; importCandidate.value = null; importWarning.value = '' }

  async function importLibrary() {
    if (!cloud || !importCandidate.value || data.value.books.length || data.value.locations.length) return
    if (await commit(structuredClone(toRaw(importCandidate.value)), '已將舊館藏搬入目前帳號，原始本機資料仍保留。')) dismissImport()
  }

  const snapshot = (): LibraryData => structuredClone(toRaw(data.value))
  return { data, today, loading, saving, fatalError, error, notice, conflict, commit, snapshot, reload, importCandidate, importWarning, selectBackup, dismissImport, importLibrary }
}

export type LibraryStore = ReturnType<typeof useLibraryStore>
