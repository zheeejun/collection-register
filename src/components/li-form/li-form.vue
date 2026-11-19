<script lang="ts" src="./li-form.ts"></script>

<template>
  <section class="editor-panel" :aria-label="label">
    <div class="section-title">
      <h2>{{ title }}</h2>
      <button type="button" class="text-button" :disabled="saving" @click="emit('cancel')">取消</button>
    </div>
    <form class="form-grid" :aria-busy="saving" @submit.prevent="emit('submit')">
      <slot />
      <div class="form-actions full-width">
        <button type="submit" class="primary-button" :disabled="saving || submitDisabled">{{ saving ? '儲存中…' : submitLabel }}</button>
        <button type="button" class="secondary-button" :disabled="saving" @click="emit('cancel')">取消</button>
      </div>
    </form>
  </section>
</template>

<style scoped src="./li-form.css"></style>
