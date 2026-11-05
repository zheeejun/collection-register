<script setup lang="ts">
import AppButton from './AppButton.vue'

const emit = defineEmits<{ (e: 'add'): void }>()
</script>

<template>
  <div class="empty">
    <h2>還沒有館藏紀錄</h2>
    <p>每一列記錄一本館藏的書名、館藏地點和序號。新增後可以複製、刪除，或拖曳調整順序。</p>
    <AppButton variant="primary" @click="emit('add')">新增第一列</AppButton>
  </div>
</template>

<style scoped>
.empty {
  display: grid;
  justify-items: start;
  gap: 12px;
  padding: 28px 20px;
  border: 1px dashed var(--line-strong);
  border-radius: 8px;
  color: var(--muted);
}
h2 {
  margin: 0;
  font: 700 17px var(--f-body);
  color: var(--ink);
}
p {
  margin: 0;
  max-width: 46ch;
}
</style>
