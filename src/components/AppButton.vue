<script setup lang="ts">
/** 文字按鈕。title、@click 等屬性會直接落到 <button> 上。 */
defineProps<{
  variant?: 'primary' | 'quiet'
  armed?: boolean // 危險動作待確認
}>()
</script>

<template>
  <button type="button" class="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-md border px-3.5 font-body text-sm leading-normal font-medium"
    :class="variant === 'quiet'
      ? armed
        ? 'border-transparent bg-danger text-on-danger hover:bg-danger hover:text-on-danger'
        : 'border-transparent bg-transparent text-muted hover:bg-surface hover:text-danger'
      : variant === 'primary'
        ? 'border-accent bg-accent text-accent-ink hover:brightness-110'
        : 'border-line-strong bg-surface text-ink hover:border-muted hover:bg-field'"><slot /></button>
</template>
