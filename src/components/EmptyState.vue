<script setup lang="ts">
import AppButton from './AppButton.vue'

const emit = defineEmits<{ (e: 'add'): void }>()
</script>

<template>
  <div class="grid justify-items-start gap-3 rounded-lg border border-dashed border-line-strong px-5 py-7 text-muted">
    <h2 class="m-0 font-body text-[17px] leading-normal font-bold text-ink">還沒有館藏紀錄</h2>
    <p class="m-0 max-w-[46ch]">每一列記錄一本館藏的書名、館藏地點和序號。新增後可以複製、刪除，或拖曳調整順序。</p>
    <AppButton variant="primary" @click="emit('add')">新增第一列</AppButton>
  </div>
</template>
