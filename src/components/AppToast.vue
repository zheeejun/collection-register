<script setup lang="ts">
/** 畫面底部的提示；canUndo 時顯示「復原」。msg 為空就不顯示。 */
defineProps<{ msg?: string; canUndo?: boolean }>()
const emit = defineEmits<{ (e: 'undo'): void }>()
</script>

<template>
  <Transition name="toast">
    <div v-if="msg" class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pt-3 pr-[max(16px,env(safe-area-inset-right,0px))] pb-[calc(12px+env(safe-area-inset-bottom,0px))] pl-[max(16px,env(safe-area-inset-left,0px))]">
      <div class="pointer-events-auto flex max-w-[560px] items-center gap-4 rounded-lg bg-ink px-3.5 py-2.5 text-sm text-bg shadow-panel" role="status">
        <span>{{ msg }}</span>
        <button v-if="canUndo" type="button" class="cursor-pointer border-0 bg-transparent px-0.5 py-1 font-body text-sm leading-normal font-bold text-toast-link underline" @click="emit('undo')">復原</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.18s, transform 0.18s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
