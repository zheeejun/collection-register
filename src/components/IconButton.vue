<script setup lang="ts">
/** 只有圖示的按鈕，圖示放 slot；aria-label、title、@click 會直接落到 <button> 上。 */
defineProps<{ danger?: boolean }>()
</script>

<template>
  <button type="button" class="icon" :class="{ del: danger }"><slot /></button>
</template>

<style scoped>
.icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.icon:hover {
  background: var(--bg);
  color: var(--ink);
}
.icon.del:hover {
  background: var(--danger-soft);
  color: var(--danger);
}
</style>
