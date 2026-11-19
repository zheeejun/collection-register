import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRenderer, h } from 'vue'
import { loadTypeScript } from './load-typescript.mjs'

const { useAuth } = await import(await loadTypeScript(new URL('../src/composables/useAuth.ts', import.meta.url)))
const renderer = createRenderer({
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null,
})
function mount(client) {
  let state
  const app = renderer.createApp({ setup() { state = useAuth(client); return () => h('div') } })
  app.mount({})
  return { state, unmount: () => app.unmount() }
}
const tick = () => new Promise(resolve => setImmediate(resolve))

test('auth restores sessions, handles recovery, account switching and logout, then unsubscribes', async () => {
  let notify
  let unsubscribed = false
  const first = { user: { id: 'A', email: 'a@example.com' } }
  const client = { auth: {
    onAuthStateChange(callback) {
      notify = callback
      return { data: { subscription: { unsubscribe() { unsubscribed = true } } } }
    },
    async getSession() { return { data: { session: first }, error: null } },
    async signOut(options) {
      assert.equal(options.scope, 'local')
      notify('SIGNED_OUT', null)
      return { error: null }
    },
  } }
  const { state, unmount } = mount(client)
  assert.equal(state.ready.value, false)
  await tick()
  assert.equal(state.session.value.user.id, 'A')
  assert.equal(state.ready.value, true)
  notify('PASSWORD_RECOVERY', first)
  assert.equal(state.recovery.value, true)
  await state.signOut()
  assert.equal(state.session.value, null)
  assert.equal(state.recovery.value, false)
  notify('SIGNED_IN', { user: { id: 'B' } })
  assert.equal(state.session.value.user.id, 'B')
  unmount()
  assert.equal(unsubscribed, true)
  notify('SIGNED_IN', first)
  assert.equal(state.session.value.user.id, 'B')
})

test('failed logout keeps the account visible and reports an error', async () => {
  const { state, unmount } = mount({ auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    getSession: async () => ({ data: { session: { user: { id: 'A' } } }, error: null }),
    signOut: async () => ({ error: new Error('offline') }),
  } })
  await tick()
  await state.signOut()
  assert.equal(state.session.value.user.id, 'A')
  assert.match(state.authError.value, /登出失敗/)
  unmount()
})

test('a late initial session response cannot restore an account that already signed out', async () => {
  let notify
  let finish
  const { state, unmount } = mount({ auth: {
    onAuthStateChange(callback) { notify = callback; return { data: { subscription: { unsubscribe() {} } } } },
    getSession: () => new Promise(resolve => { finish = resolve }),
  } })
  notify('SIGNED_OUT', null)
  finish({ data: { session: { user: { id: 'old-account' } } }, error: null })
  await tick()
  assert.equal(state.session.value, null)
  assert.equal(state.ready.value, true)
  unmount()
})
