<script setup lang="ts">
import LiButton from '../li-button/li-button.vue'
/** 只有圖示的按鈕，圖示放 slot；aria-label、title、@click 會直接落到 <li-button variant="plain"> 上。 */
defineProps<{ danger?: boolean }>()
</script>

<template>
  <li-button variant="plain" type="button" class="grid size-10 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
    :class="danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-gray-100 hover:text-gray-900'"><slot /></li-button>
</template>
