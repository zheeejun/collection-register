<script setup lang="ts">
/** 工具列。「全部清空」要按兩次，第二次才發出 clear。 */
import { ref } from 'vue'
import AppButton from './AppButton.vue'

const props = defineProps<{ empty: boolean }>()
const emit = defineEmits<{
  (e: 'add'): void
  (e: 'copy'): void
  (e: 'clear'): void
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
  <div class="bar">
    <AppButton variant="primary" @click="emit('add')">＋ 新增一列</AppButton>
    <AppButton title="以 Tab 分隔（書名、館藏地點、序號），可直接貼到 Excel" @click="emit('copy')">複製全部</AppButton>
    <label class="opt"><input v-model="inc" type="checkbox" /> 複製列時，序號自動 +1</label>
    <span class="spacer" />
    <AppButton variant="quiet" :armed="armed" @click="onClear">
      {{ armed ? '再按一次清空全部' : '全部清空' }}
    </AppButton>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 20px 0 12px;
}
.spacer {
  flex: 1 1 0;
}
.opt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--muted);
  cursor: pointer;
}
.opt input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--accent);
}
@media (max-width: 720px) {
  .opt {
    flex-basis: 100%;
    order: 5;
  }
  .spacer {
    display: none;
  }
}
</style>
