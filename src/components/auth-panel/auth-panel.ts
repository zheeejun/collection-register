import { defineComponent, ref } from 'vue'
import { authRedirectUrl, supabase } from '../../services/supabase'
import { LiInput } from '../index'

type AuthMode = 'login' | 'signup' | 'reset'

export default defineComponent({
  components: { LiInput },
  props: { recovery: Boolean },
  emits: ['recovered', 'cancel-recovery'],
  setup(props, { emit }) {
    const mode = ref<AuthMode>('login')
    const email = ref('')
    const password = ref('')
    const busy = ref(false)
    const error = ref('')
    const notice = ref('')

    function changeMode(next: AuthMode) {
      mode.value = next
      password.value = ''
      error.value = ''
      notice.value = ''
    }
    async function submit() {
      if (!supabase || busy.value) return
      busy.value = true
      error.value = ''
      notice.value = ''
      try {
        if (props.recovery) {
          const result = await supabase.auth.updateUser({ password: password.value })
          if (result.error) throw result.error
          password.value = ''
          emit('recovered')
        } else if (mode.value === 'reset') {
          const result = await supabase.auth.resetPasswordForEmail(email.value, { redirectTo: authRedirectUrl() })
          if (result.error) throw result.error
          notice.value = '若此信箱有註冊帳號，將收到重設密碼信。請檢查收件匣與垃圾郵件。'
        } else if (mode.value === 'signup') {
          const result = await supabase.auth.signUp({ email: email.value, password: password.value, options: { emailRedirectTo: authRedirectUrl() } })
          if (result.error) throw result.error
          password.value = ''
          notice.value = '請至信箱點選驗證連結，完成後即可登入。若已註冊，請直接登入或重設密碼。'
        } else {
          const result = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
          if (result.error) throw result.error
          password.value = ''
        }
      } catch (cause) {
        const code = (cause as { code?: string })?.code
        error.value = code === 'invalid_credentials' ? 'Email 或密碼不正確。'
          : code === 'email_not_confirmed' ? '請先至信箱完成 Email 驗證。'
          : code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' ? '操作太頻繁，請稍後再試。'
          : code === 'weak_password' ? '密碼不符合要求，請改用更長且包含不同字元的密碼。'
          : code === 'same_password' ? '請使用與原本不同的新密碼。'
          : '無法完成操作，請確認網路、輸入內容及連結是否過期，再重試。'
      } finally { busy.value = false }
    }
    return { mode, email, password, busy, error, notice, changeMode, submit, emit }
  },
})
