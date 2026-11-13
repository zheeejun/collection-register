import { migrateLegacy } from '../library'
import type { LibraryData } from '../library'

let database: IDBDatabase | undefined
function openDatabase(): Promise<IDBDatabase> {
  if (database) return Promise.resolve(database)
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('library-manager', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('library', { keyPath: 'id' })
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('請關閉其他舊版網站分頁，再重新載入。'))
    request.onsuccess = () => {
      database = request.result
      database.onversionchange = () => { database?.close(); database = undefined }
      resolve(database)
    }
  })
}
export async function saveLibrary(data: LibraryData): Promise<void> {
  const db = await openDatabase()
  const snapshot = structuredClone(data)
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('library', 'readwrite')
    transaction.objectStore('library').put({ id: 'main', data: snapshot })
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error ?? new Error('資料儲存已中止'))
  })
}
export async function loadLibrary(): Promise<LibraryData> {
  const db = await openDatabase()
  const data = await new Promise<LibraryData | undefined>((resolve, reject) => {
    const transaction = db.transaction('library', 'readonly')
    const request = transaction.objectStore('library').get('main')
    transaction.oncomplete = () => resolve(request.result?.data)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
  if (data) return data
  const migrated = migrateLegacy(localStorage.getItem('collection-register-vue-v1'))
  await saveLibrary(migrated)
  return migrated
}
