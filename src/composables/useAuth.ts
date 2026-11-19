import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Session, SupabaseClient } from '@supabase/supabase-js'

export function useAuth(client: SupabaseClient | null) {
  const session = ref<Session | null>(null)
  const ready = ref(!client)
  const recovery = ref(false)
  const authError = ref('')
  let alive = true
  let authVersion = 0
  let unsubscribe: (() => void) | undefined

  onMounted(async () => {
    if (!client) return
    const { data } = client.auth.onAuthStateChange((event, next) => {
      if (!alive) return
      authVersion++
      // Keep this callback synchronous: SDK calls here can deadlock its auth lock.
      session.value = next
      if (event === 'PASSWORD_RECOVERY') recovery.value = true
      if (!next) recovery.value = false
      authError.value = ''
      ready.value = true
    })
    unsubscribe = () => data.subscription.unsubscribe()
    const initialVersion = authVersion
    try {
      const result = await client.auth.getSession()
      if (!alive || authVersion !== initialVersion) return
      if (result.error) throw result.error
      session.value = result.data.session
    } catch {
      if (alive && authVersion === initialVersion) authError.value = '無法確認登入狀態，請重新整理後再試。'
    } finally {
      if (alive) ready.value = true
    }
  })
  onBeforeUnmount(() => { alive = false; unsubscribe?.() })

  async function signOut() {
    if (!client) return
    authError.value = ''
    try {
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw error
      session.value = null
      recovery.value = false
    } catch { authError.value = '登出失敗，請確認網路後重試。' }
  }
  return { session, ready, recovery, authError, signOut }
}
