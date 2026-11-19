<script setup lang="ts">
import LibraryApp from './app/app.vue'
import AuthPanel from './components/auth-panel/auth-panel.vue'
import { cloudConfigured, cloudConfigurationIncomplete, supabase } from './services/supabase'
import { useAuth } from './composables/useAuth'

const isSharedView = window.location.hash.startsWith('#share=')
const { session, ready, recovery, authError, signOut } = useAuth(isSharedView ? null : supabase)
</script>

<template>
  <LibraryApp v-if="isSharedView" />
  <main v-else-if="cloudConfigurationIncomplete" class="auth-status" role="alert">雲端設定不完整，請設定 Supabase 專案網址與公開金鑰後重新建置。原有本機資料仍保留。</main>
  <main v-else-if="!ready" class="auth-status" role="status">正在確認登入狀態…</main>
  <template v-else>
    <p v-if="authError" class="auth-alert" role="alert">{{ authError }}</p>
    <AuthPanel v-if="cloudConfigured && (!session || recovery)" :key="recovery ? 'recovery' : 'login'" :recovery="recovery" @recovered="recovery = false" @cancel-recovery="signOut" />
    <LibraryApp v-else :key="session?.user.id || 'local'" :user-id="session?.user.id" :email="session?.user.email" @sign-out="signOut" />
  </template>
</template>

<style scoped>
.auth-status { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f6f7fb; color: #222640; }
.auth-alert { margin: 0; padding: 16px; background: #fcecef; color: #a53342; }
</style>
