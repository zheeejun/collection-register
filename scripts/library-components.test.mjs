import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import { compileScript, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { createRenderer, createSSRApp, h, nextTick, ref, toRaw } from 'vue'
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

test('checkout calculates 28 days and resets renewal state on a new loan', async () => {
  const store = fixture()
  const editor = useLibraryEditor(store, ref('borrowed'))
  editor.editBook()
  assert.equal(editor.bookForm.dueOn, '2026-12-11')
  editor.prepareBorrow({ ...book, status: 'returned', hasReservation: true, renewalCount: 1 })
  assert.equal(editor.bookForm.hasReservation, false)
  assert.equal(editor.bookForm.renewalCount, 0)
  assert.equal(editor.bookForm.dueOn, '2026-12-11')
  await editor.submitBook({ ...toRaw(editor.bookForm), dueOn: '2027-12-31' })
  assert.equal(store.data.value.books[0].dueOn, '2026-12-11')
  assert.equal(store.data.value.books[0].renewalCount, 0)
})

test('a reservation blocks renewal; clearing it permits exactly one 28-day extension', async () => {
  const store = fixture()
  store.data.value.books[0] = { ...book, status: 'borrowed', borrowedOn: '2026-11-01', dueOn: '2026-11-29', hasReservation: false, renewalCount: 0 }
  const editor = useLibraryEditor(store, ref('borrowed'))
  const staleBook = structuredClone(toRaw(store.data.value.books[0]))
  await editor.setReservation({ id: book.id, hasReservation: true })
  await editor.renewBook(staleBook)
  assert.match(store.error.value, /有人預約/)
  assert.equal(store.data.value.books[0].dueOn, '2026-11-29')
  await editor.setReservation({ id: book.id, hasReservation: false })
  await editor.renewBook(staleBook)
  assert.equal(store.data.value.books[0].dueOn, '2026-12-27')
  assert.equal(store.data.value.books[0].renewalCount, 1)
  await editor.renewBook(staleBook)
  assert.match(store.error.value, /已續借一次/)
  assert.equal(store.data.value.books[0].dueOn, '2026-12-27')
  // Editing metadata cannot clear the stored renewal count or extend a due date.
  await editor.submitBook({ ...toRaw(store.data.value.books[0]), renewalCount: 0, dueOn: '2028-01-01', title: '修改書名' })
  assert.equal(store.data.value.books[0].renewalCount, 1)
  assert.equal(store.data.value.books[0].dueOn, '2026-12-27')
})

test('failed saves retain reservation, renewal count and dates; returned books cannot renew', async () => {
  const store = fixture()
  store.data.value.books[0] = { ...book, status: 'borrowed', borrowedOn: '2026-11-01', dueOn: '2026-11-29', hasReservation: false, renewalCount: 0 }
  store.commit = async () => false
  const editor = useLibraryEditor(store, ref('borrowed'))
  await editor.setReservation({ id: book.id, hasReservation: true })
  assert.equal(store.data.value.books[0].hasReservation, false)
  await editor.renewBook(store.data.value.books[0])
  assert.equal(store.data.value.books[0].renewalCount, 0)
  assert.equal(store.data.value.books[0].dueOn, '2026-11-29')
  store.data.value.books[0].status = 'returned'
  await editor.renewBook(store.data.value.books[0])
  assert.match(store.error.value, /只有借閱中/)
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

test('auth forms render login and password recovery with appropriate browser autofill', async () => {
  const { default: AuthPanel } = await server.ssrLoadModule('/src/components/auth-panel/auth-panel.vue')
  const login = await renderToString(createSSRApp(AuthPanel))
  assert.match(login, /type="email"/)
  assert.match(login, /autocomplete="current-password"/)
  assert.match(login, /忘記密碼/)
  const recovery = await renderToString(createSSRApp(AuthPanel, { recovery: true }))
  assert.match(recovery, /設定新密碼/)
  assert.match(recovery, /autocomplete="new-password"/)
  assert.doesNotMatch(recovery, /type="email"/)
})

test('borrowed forms and lists expose the reservation checkbox and disable prohibited renewal', async () => {
  const { default: BookForm } = await server.ssrLoadModule('/src/components/book-form/book-form.vue')
  const borrowed = { ...book, status: 'borrowed', borrowedOn: '2026-11-01', dueOn: '2026-11-29', hasReservation: true, renewalCount: 0 }
  const form = await renderToString(createSSRApp(BookForm, { initial: borrowed, locations: [location] }))
  assert.match(form, /<input\b(?=[^>]*type="checkbox")(?=[^>]*\bchecked\b)[^>]*>/)
  assert.match(form, /type="date"[^>]*readonly/)
  const { default: BookTable } = await server.ssrLoadModule('/src/components/book-table/book-table.vue')
  const render = books => renderToString(createSSRApp(BookTable, { books, locations: [location], page: 'borrowed', today: '2026-11-13' }))
  const reserved = await render([borrowed])
  assert.match(reserved, /disabled[^>]*title="有人預約，不能續借"/)
  const renewed = await render([{ ...borrowed, hasReservation: false, renewalCount: 1 }])
  assert.match(renewed, /disabled[^>]*title="已續借一次，不能再次續借"/)
  const available = await render([{ ...borrowed, hasReservation: false }])
  const renewalButton = available.match(/<button\b[^>]*title="從原到期日延長 28 天"[^>]*>/)?.[0]
  assert.ok(renewalButton)
  assert.doesNotMatch(renewalButton, /\bdisabled\b/)
})

test('shared controls forward native form attributes and render through their public exports', async () => {
  const { LiCheckbox, LiForm, LiFormField, LiInput, LiSelect, LiTextarea } = await server.ssrLoadModule('/src/li-components/index.ts')
  const html = await renderToString(createSSRApp({ render: () => h(LiForm, { title: 'Shared form', label: 'Test form', submitLabel: 'Save', saving: true }, {
    default: () => [
      h(LiFormField, { label: 'Date', required: true }, { default: () => h(LiInput, { modelValue: '2026-11-19', type: 'date', required: true, readonly: true, name: 'date' }) }),
      h(LiSelect, { modelValue: 'one', name: 'place', required: true }, { default: () => h('option', { value: 'one' }, 'One') }),
      h(LiTextarea, { modelValue: 'Notes', rows: 2, maxlength: 2000, name: 'notes' }),
      h(LiCheckbox, { modelValue: true, class: 'full-width', id: 'reservation', name: 'reservation', disabled: true, 'aria-label': 'Reserved', label: 'Reserved' }),
    ],
  }) }))
  assert.match(html, /aria-busy="true"/)
  assert.match(html, /<input\b(?=[^>]*name="date")(?=[^>]*required)(?=[^>]*readonly)[^>]*>/)
  assert.match(html, /<select\b(?=[^>]*name="place")(?=[^>]*required)[^>]*>/)
  assert.match(html, /<textarea\b[^>]*name="notes"[^>]*>Notes<\/textarea>/)
  assert.match(html, /<label\b(?=[^>]*class="[^"]*\bli-checkbox\b)(?=[^>]*class="[^"]*\bfull-width\b)[^>]*>/)
  assert.match(html, /<input\b(?=[^>]*id="reservation")(?=[^>]*disabled)(?=[^>]*aria-label="Reserved")(?=[^>]*checked)[^>]*>/)
  assert.match(html, /<button type="submit"[^>]*disabled/)
})

test('shared feedback, icon buttons and icons render from the common entry point', async () => {
  const { LiToast, LiIconButton, DragHandleIcon, ChevronDownIcon } = await server.ssrLoadModule('/src/li-components/index.ts')
  const render = (component, props, slots) => renderToString(createSSRApp({ render: () => h(component, props, slots) }))
  const toast = await render(LiToast, { msg: '已儲存', canUndo: true })
  assert.match(toast, /role="status"/)
  assert.match(toast, /已儲存/)
  assert.match(toast.replace(/<!--[\s\S]*?-->/g, ''), /<button\b[^>]*>復原<\/button>/)
  assert.doesNotMatch(await render(LiToast, {}), /role="status"/)
  const iconButton = await render(LiIconButton, { disabled: true, 'aria-label': '刪除', title: '刪除這一列' }, { default: () => h(DragHandleIcon) })
  assert.match(iconButton, /<button\b(?=[^>]*disabled)(?=[^>]*aria-label="刪除")(?=[^>]*title="刪除這一列")[^>]*>/)
  assert.match(iconButton, /<svg\b/)
  assert.match(await render(ChevronDownIcon, {}), /<svg\b/)
})

test('shared checkbox follows parent updates and rolls back a change the parent does not accept', async () => {
  const source = await readFile(new URL('../src/li-components/li-checkbox/li-checkbox.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source, { filename: 'li-checkbox.vue' })
  const compiled = compileScript(descriptor, { id: 'li-checkbox-test', inlineTemplate: true }).content
  const { outputText } = ts.transpileModule(compiled, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ESNext },
    fileName: 'li-checkbox.vue.ts',
  })
  const componentModule = { exports: {} }
  new Function('require', 'module', 'exports', outputText)(createRequire(import.meta.url), componentModule, componentModule.exports)
  const LiCheckbox = componentModule.exports.default
  const host = createRenderer({
    createElement: tag => ({ tag, children: [], props: {} }),
    createText: text => ({ text }), createComment: text => ({ text }),
    insert(child, parent) { parent.children.push(child) }, remove() {},
    setText(node, text) { node.text = text }, setElementText(node, text) { node.text = text },
    patchProp(node, key, _old, value) { node.props[key] = value; node[key] = value },
    parentNode: () => null, nextSibling: () => null,
  })
  const value = ref(false)
  let accept = false
  const updates = []
  const app = host.createApp({ render: () => h(LiCheckbox, {
    modelValue: value.value,
    'onUpdate:modelValue': checked => { updates.push(checked); if (accept) value.value = checked },
  }) })
  const root = { children: [] }
  app.mount(root)
  const input = root.children[0].children.find(node => node.tag === 'input')
  input.checked = true
  input.props.onChange({ target: input })
  await nextTick()
  assert.deepEqual(updates, [true])
  assert.equal(input.checked, false)
  accept = true
  input.checked = true
  input.props.onChange({ target: input })
  await nextTick()
  assert.equal(value.value, true)
  assert.equal(input.checked, true)
  app.unmount()
})
