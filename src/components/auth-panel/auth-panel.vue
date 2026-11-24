<script lang="ts" src="./auth-panel.ts"></script>

<template>
  <main class="auth-page">
    <section class="auth-card" aria-labelledby="auth-title">
      <p class="eyebrow">YOUR READING SPACE</p>
      <h1 id="auth-title">{{ recovery ? '設定新密碼' : mode === 'signup' ? '建立你的閱讀帳號' : mode === 'reset' ? '重設密碼' : '歡迎回到閱讀之間' }}</h1>
      <p>登入同一帳號，在手機與電腦管理自己的圖書。</p>
      <form @submit.prevent="submit">
        <label v-if="!recovery">Email
          <LiInput v-model.trim="email" type="email" autocomplete="email" required :disabled="busy" />
        </label>
        <label v-if="recovery || mode !== 'reset'">{{ recovery ? '新密碼' : '密碼' }}
          <LiInput v-model="password" type="password" :autocomplete="recovery || mode === 'signup' ? 'new-password' : 'current-password'" :minlength="recovery || mode === 'signup' ? 8 : undefined" required :disabled="busy" />
          <small v-if="recovery || mode === 'signup'">請使用至少 8 個字元。</small>
        </label>
        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
        <p v-if="notice" class="auth-notice" role="status">{{ notice }}</p>
        <li-button variant="plain" class="auth-primary" type="submit" :disabled="busy">{{ busy ? '處理中…' : recovery ? '儲存新密碼' : mode === 'signup' ? '註冊' : mode === 'reset' ? '寄送重設密碼信' : '登入' }}</li-button>
      </form>
      <div v-if="!recovery" class="auth-links">
        <li-button variant="plain" type="button" :disabled="busy" @click="changeMode(mode === 'login' ? 'signup' : 'login')">{{ mode === 'login' ? '還沒有帳號？註冊' : '返回登入' }}</li-button>
        <li-button variant="plain" v-if="mode === 'login'" type="button" :disabled="busy" @click="changeMode('reset')">忘記密碼</li-button>
      </div>
      <li-button variant="plain" v-else type="button" :disabled="busy" @click="emit('cancel-recovery')">取消並登出</li-button>
      <small class="privacy-note">每位使用者的私人館藏分開儲存。請勿在共用裝置保持登入。</small>
    </section>
  </main>
</template>

<style scoped src="./auth-panel.css"></style>
