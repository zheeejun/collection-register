<script setup lang="ts">
import LiButton from '../li-button/li-button.vue'
/** 只有圖示的按鈕，圖示放 slot；aria-label、title、@click 會直接落到 <li-button variant="plain"> 上。 */
defineProps<{ danger?: boolean }>()
</script>

<template>
  <li-button variant="plain" type="button" class="grid size-10 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-muted"
    :class="danger ? 'hover:bg-danger-soft hover:text-danger' : 'hover:bg-bg hover:text-ink'"><slot /></li-button>
</template>
