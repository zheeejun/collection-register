<script setup lang="ts">
/** 畫面底部的提示；canUndo 時顯示「復原」。msg 為空就不顯示。 */
defineProps<{ msg?: string; canUndo?: boolean }>()
const emit = defineEmits<{ (e: 'undo'): void }>()
</script>

<template>
  <Transition name="toast">
    <div v-if="msg" class="toast">
      <div class="in" role="status">
        <span>{{ msg }}</span>
        <button v-if="canUndo" type="button" class="undo" @click="emit('undo')">復原</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  justify-content: center;
  padding: 12px max(16px, env(safe-area-inset-right, 0px)) calc(12px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
  pointer-events: none;
}
.toast .in {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 560px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--ink);
  color: var(--bg);
  box-shadow: var(--shadow);
  font-size: 14px;
}
.toast .undo {
  padding: 4px 2px;
  border: 0;
  background: transparent;
  color: var(--toast-link);
  font: 700 14px var(--f-body);
  text-decoration: underline;
  cursor: pointer;
}
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
