<script setup lang="ts">
import type { LiButtonProps } from './li-button.interface'

/** variant 控制按鈕外觀；armed 表示 quiet 按鈕已進入危險操作確認狀態。 */
defineProps<LiButtonProps>()
</script>

<template>
  <!-- plain 不套用元件預設外觀，讓使用端以 Tailwind classes 完整控制樣式。 -->
  <button
    type="button"
    :class="{
      'inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-transparent p-2 font-medium disabled:cursor-not-allowed disabled:opacity-50': variant !== 'plain',
      'bg-gray-200 text-gray-900 hover:border-gray-500 hover:bg-white': !variant,
      'bg-indigo-500 text-indigo-50 hover:brightness-110': variant === 'primary',
      'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-red-600': variant === 'quiet' && !armed,
      'bg-red-600 text-white': variant === 'quiet' && armed,
    }"
  >
    <!-- 顯示使用端放入的文字、圖示或其他按鈕內容。 -->
    <slot />
  </button>
</template>

