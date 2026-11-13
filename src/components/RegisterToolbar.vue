<script setup lang="ts">
/** 工具列。「全部清空」要按兩次，第二次才發出 clear。 */
import { ref } from 'vue'
import AppButton from './appbutton/appbutton.vue'

const props = defineProps<{ empty: boolean; sharing?: boolean }>()
const emit = defineEmits<{
  (e: 'add'): void
  (e: 'copy'): void
  (e: 'clear'): void
  (e: 'share'): void
}>()
const inc = defineModel<boolean>('inc', { required: true }) // 複製列時序號 +1

const armed = ref(false)
let armTimer = 0
function onClear() {
  if (props.empty) return
  if (!armed.value) {
    armed.value = true
    armTimer = window.setTimeout(() => (armed.value = false), 4000)
    return
  }
  clearTimeout(armTimer)
  armed.value = false
  emit('clear')
}
</script>

<template>
  <div class="mt-5 mb-3 flex flex-wrap items-center gap-2">
    <AppButton variant="primary" @click="emit('add')">＋ 新增一列</AppButton>
    <AppButton title="以 Tab 分隔（書名、館藏地點、序號），可直接貼到 Excel" @click="emit('copy')">複製全部</AppButton>
    <AppButton :disabled="empty || sharing" title="產生目前館藏資料的唯讀分享網址" @click="emit('share')">{{ sharing ? '產生中…' : '分享網址' }}</AppButton>
    <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-muted max-[720px]:order-5 max-[720px]:basis-full"><input v-model="inc" type="checkbox" class="m-0 size-4 accent-accent" /> 複製列時，序號自動 +1</label>
    <span class="flex-1 max-[720px]:hidden" />
    <AppButton variant="quiet" :armed="armed" @click="onClear">
      {{ armed ? '再按一次清空全部' : '全部清空' }}
    </AppButton>
  </div>
</template>
