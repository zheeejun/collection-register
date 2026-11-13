import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createSSRApp, ref, toRaw } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createServer } from 'vite'
import { loadTypeScript } from './load-typescript.mjs'

const { useLibraryCatalog } = await import(await loadTypeScript(new URL('../src/composables/useLibraryCatalog.ts', import.meta.url)))
const { useLibraryEditor } = await import(await loadTypeScript(new URL('../src/composables/useLibraryEditor.ts', import.meta.url)))
const location = { id: 'main', name: '總館', address: '台北市', floor: '3F', shelf: 'A12', notes: '' }
const book = { id: 'book-1', title: '閱讀測試', author: '作者', sn: '0001', locationId: 'main', status: 'reserved', reservedOn: '2026-11-01', borrowedOn: '', dueOn: '', notes: '' }

function fixture() {
  const data = ref({ version: 1, books: [{ ...book }], locations: [{ ...location }] })
  return {
    data,
    today: ref('2026-11-13'),
    error: ref(''),
    snapshot: () => structuredClone(toRaw(data.value)),
    commit: async next => { data.value = next; return true },
  }
}

test('catalog reacts to page, location, search, and due filters without reordering stored books', () => {
  const store = fixture()
  store.data.value.books.push(
    { ...book, id: 'late', status: 'borrowed', dueOn: '2026-11-12' },
    { ...book, id: 'soon', status: 'borrowed', dueOn: '2026-11-15' },
  )
  const navigation = { page: ref('reserved'), query: ref(''), locationFilter: ref(''), dueFilter: ref('all') }
  const catalog = useLibraryCatalog(store, navigation)
  assert.equal(catalog.filteredBooks.value.length, 1)
  navigation.page.value = 'borrowed'
  assert.deepEqual(catalog.filteredBooks.value.map(item => item.id), ['late', 'soon'])
  assert.equal(catalog.overdue.value.length, 1)
  assert.equal(catalog.soon.value.length, 1)
  navigation.dueFilter.value = 'soon'
  assert.deepEqual(catalog.filteredBooks.value.map(item => item.id), ['soon'])
  navigation.query.value = '總館'
  assert.equal(catalog.filteredBooks.value.length, 1)
  navigation.locationFilter.value = 'other'
  assert.equal(catalog.filteredBooks.value.length, 0)
  assert.deepEqual(store.data.value.books.map(item => item.id), ['book-1', 'late', 'soon'])
})

test('editor validates dates, protects referenced locations, and supports borrowing and returning', async () => {
  const store = fixture()
  const editor = useLibraryEditor(store, ref('reserved'))
  editor.prepareBorrow(store.data.value.books[0])
  assert.equal(store.data.value.books[0].status, 'reserved')
  await editor.submitBook({ ...toRaw(editor.bookForm), dueOn: '2026-11-12' })
  assert.match(store.error.value, /到期日不能早於/)
  assert.equal(store.data.value.books[0].status, 'reserved')
  await editor.submitBook({ ...toRaw(editor.bookForm), dueOn: '2026-12-01' })
  assert.equal(store.data.value.books[0].status, 'borrowed')
  assert.equal(editor.editor.value, null)
  editor.requestDelete('location', location.id, location.name)
  assert.equal(editor.pendingDelete.value, null)
  assert.match(store.error.value, /仍有圖書使用/)
  await editor.returnBook(store.data.value.books[0])
  assert.equal(store.data.value.books[0].status, 'returned')
})

test('editor rejects duplicate locations and keeps the editor open after a failed save', async () => {
  const store = fixture()
  const editor = useLibraryEditor(store, ref('all'))
  editor.editPlace()
  await editor.submitPlace({ ...location, id: '', name: ' 總館 ' })
  assert.equal(store.data.value.locations.length, 1)
  assert.match(store.error.value, /已存在/)
  store.commit = async () => false
  const failedEditor = useLibraryEditor(store, ref('all'))
  failedEditor.editBook(book)
  await failedEditor.submitBook({ ...book, title: '尚未存入的修改' })
  assert.equal(failedEditor.editor.value, 'book')
  assert.equal(store.data.value.books[0].title, book.title)
})

// Middleware mode compiles the actual external script/style components without opening a port.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
after(() => server.close())

test('split components render real form values and due dates from their external scripts', async () => {
  const { default: BookForm } = await server.ssrLoadModule('/src/components/book-form/book-form.vue')
  const html = await renderToString(createSSRApp(BookForm, { initial: book, locations: [location] }))
  assert.match(html, /value="閱讀測試"/)
  assert.match(html, /總館/)
  assert.match(html, /預約日期/)

  const { default: BookTable } = await server.ssrLoadModule('/src/components/book-table/book-table.vue')
  const table = await renderToString(createSSRApp(BookTable, {
    books: [{ ...book, status: 'borrowed', borrowedOn: '2026-11-01', dueOn: '2026-11-12' }],
    locations: [location], page: 'borrowed', today: '2026-11-13',
  }))
  assert.match(table, /逾期 1 天/)
  assert.match(table, /3F · A12/)
  assert.match(table, /標記歸還/)
})
