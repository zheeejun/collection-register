<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'quiet'
  /**「已進入待確認狀態」，用來防止誤觸危險操作。 */
  armed?: boolean
}>()
</script>

<template>
  <button type="button" class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border py-2 px-2 text-sm leading-normal font-medium disabled:cursor-not-allowed disabled:opacity-50"
    :class="variant === 'quiet'
      ? armed
        ? 'border-transparent bg-danger text-on-danger hover:bg-danger hover:text-on-danger'
        : 'border-transparent bg-transparent text-muted hover:bg-surface hover:text-danger'
      : variant === 'primary'
        ? 'bg-indigo-500 text-indigo-50 hover:brightness-110'
        : 'bg-gray-200 text-ink hover:border-muted hover:bg-field'"><slot /></button>
</template>
