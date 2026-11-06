<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppButton from './AppButton.vue'

const props = defineProps<{ url: string }>()
const emit = defineEmits<{ (event: 'close'): void }>()
const dialog = ref<HTMLDialogElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const message = ref('')

onMounted(() => {
  dialog.value?.showModal()
  input.value?.select()
})

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url)
    message.value = '已複製分享網址'
  } catch {
    input.value?.focus()
    input.value?.select()
    message.value = '請按 Ctrl / ⌘ + C 複製網址'
  }
}
</script>

<template>
  <dialog ref="dialog" aria-labelledby="share-title" class="fixed inset-0 m-auto w-[min(90vw,36rem)] space-y-4 rounded-xl border border-line bg-surface p-5 text-ink shadow-panel backdrop:bg-black/40" @close="emit('close')">
    <h2 id="share-title" class="text-lg font-semibold">館藏分享網址</h2>
    <p class="text-sm text-muted">任何取得連結的人都能查看這次匯出的資料。之後修改館藏不會同步到此連結。</p>
    <label for="share-url" class="block text-sm">公開網址</label>
    <input id="share-url" ref="input" type="text" :value="url" readonly @focus="input?.select()" />
    <p v-if="message" role="status" class="text-sm text-accent">{{ message }}</p>
    <div class="flex flex-wrap items-center gap-3">
      <AppButton variant="primary" @click="copy">複製網址</AppButton>
      <a :href="url" target="_blank" rel="noopener noreferrer" class="text-sm text-accent underline">開啟分享頁</a>
      <AppButton class="ml-auto" @click="dialog?.close()">關閉</AppButton>
    </div>
  </dialog>
</template>
