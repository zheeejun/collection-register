import { reactive, ref, toRaw } from 'vue'
import type { Ref } from 'vue'
import type { Book, LibraryLocation } from '../library'
import type { Page } from '../app/app.interface'
import type { LibraryStore } from './useLibraryStore'

export function useLibraryEditor(store: LibraryStore, page: Ref<Page>) {
  const { data, today, error, commit, snapshot } = store
  const locationCount = (id: string) => data.value.books.filter(book => book.locationId === id).length
  const editor = ref<'book' | 'location' | null>(null)
  const bookForm = reactive<Book>(emptyBook())
  const placeForm = reactive<LibraryLocation>(emptyPlace())
  const pendingDelete = ref<{ kind: 'book' | 'location'; id: string; label: string } | null>(null)
  function emptyBook(): Book {
    return { id: '', title: '', author: '', sn: '', locationId: '', status: 'available', reservedOn: '', borrowedOn: '', dueOn: '', notes: '' }
  }
  function emptyPlace(): LibraryLocation { return { id: '', name: '', address: '', floor: '', shelf: '', notes: '' } }
  function closeEditor() {
    editor.value = null
    error.value = ''
    pendingDelete.value = null
  }
  function editBook(book?: Book) {
    closeEditor()
    Object.assign(bookForm, book ?? {
      ...emptyBook(),
      status: page.value === 'reserved' ? 'reserved' : page.value === 'borrowed' ? 'borrowed' : 'available',
      reservedOn: page.value === 'reserved' ? today.value : '',
      borrowedOn: page.value === 'borrowed' ? today.value : '',
    })
    editor.value = 'book'
  }
  function editPlace(place?: LibraryLocation) {
    closeEditor()
    Object.assign(placeForm, place ?? emptyPlace())
    editor.value = 'location'
  }

  function prepareBorrow(book: Book) {
    editBook({ ...book, status: 'borrowed', borrowedOn: today.value, dueOn: '' })
  }
  async function submitBook(form: Book) {
    if (!form.title.trim()) {
      error.value = '請輸入書名。'
      return
    }
    if (!data.value.locations.some(place => place.id === form.locationId)) {
      error.value = '請先新增並選擇實際館藏地點。'
      return
    }
    if (form.status === 'borrowed' && (!form.borrowedOn || !form.dueOn || form.dueOn < form.borrowedOn)) {
      error.value = '請填寫借書日與到期日，到期日不能早於借書日。'
      return
    }
    if (form.status === 'reserved' && !form.reservedOn) {
      error.value = '請填寫預約日期。'
      return
    }
    const next = snapshot()
    const book = {
      ...toRaw(form),
      id: form.id || crypto.randomUUID(),
      title: form.title.trim(),
      author: form.author.trim(),
      sn: form.sn.trim(),
    }
    const index = next.books.findIndex(item => item.id === book.id)
    if (index < 0) next.books.unshift(book)
    else next.books[index] = book
    if (await commit(next, '圖書資料已儲存')) closeEditor()
  }
  async function submitPlace(form: LibraryLocation) {
    const name = form.name.trim()
    if (!name) {
      error.value = '請輸入館藏地點名稱。'
      return
    }
    if (data.value.locations.some(place => place.id !== form.id && place.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      error.value = '這個館藏地點已存在，請使用不同名稱。'
      return
    }
    const next = snapshot()
    const place = { ...toRaw(form), name, id: form.id || crypto.randomUUID() }
    const index = next.locations.findIndex(item => item.id === place.id)
    if (index < 0) next.locations.push(place)
    else next.locations[index] = place
    if (await commit(next, '館藏地點已存入資料庫，可在新增圖書時選用')) closeEditor()
  }
  async function returnBook(book: Book) {
    const next = snapshot()
    next.books.find(item => item.id === book.id)!.status = 'returned'
    await commit(next, `《${book.title}》已標記歸還`)
  }
  function requestDelete(kind: 'book' | 'location', id: string, label: string) {
    error.value = ''
    if (kind === 'location' && locationCount(id)) {
      error.value = '這個地點仍有圖書使用，請先修改圖書的館藏地點再刪除。'
      return
    }
    pendingDelete.value = { kind, id, label }
  }
  async function confirmDelete() {
    const target = pendingDelete.value
    if (!target) return
    if (target.kind === 'location' && locationCount(target.id)) return
    const next = snapshot()
    if (target.kind === 'book') next.books = next.books.filter(book => book.id !== target.id)
    else next.locations = next.locations.filter(place => place.id !== target.id)
    if (await commit(next, '資料已刪除')) pendingDelete.value = null
  }

  return { editor, bookForm, placeForm, pendingDelete, closeEditor, editBook, editPlace, prepareBorrow, submitBook, submitPlace, returnBook, requestDelete, confirmDelete }
}
