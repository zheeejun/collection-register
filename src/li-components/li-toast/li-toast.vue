<script setup lang="ts">
import LiButton from '../li-button/li-button.vue'
/** 畫面底部的提示；canUndo 時顯示「復原」。msg 為空就不顯示。 */
defineProps<{ msg?: string; canUndo?: boolean }>()
const emit = defineEmits<{ (e: 'undo'): void }>()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 motion-reduce:transition-none"
    enter-from-class="translate-y-2 opacity-0"
    leave-active-class="transition duration-200 motion-reduce:transition-none"
    leave-to-class="translate-y-2 opacity-0"
  >
    <div v-if="msg" class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pt-3 pr-[max(16px,env(safe-area-inset-right,0px))] pb-[calc(12px+env(safe-area-inset-bottom,0px))] pl-[max(16px,env(safe-area-inset-left,0px))]">
      <div class="pointer-events-auto flex max-w-[560px] items-center gap-4 rounded-lg bg-gray-900 px-3.5 py-2.5 text-sm text-gray-50 shadow-xl" role="status">
        <span>{{ msg }}</span>
        <li-button variant="plain" v-if="canUndo" type="button" class="cursor-pointer border-0 bg-transparent px-0.5 py-1 text-sm leading-normal font-bold text-indigo-300 underline disabled:cursor-not-allowed disabled:opacity-50" @click="emit('undo')">復原</li-button>
      </div>
    </div>
  </Transition>
</template>
