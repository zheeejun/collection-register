<script setup lang="ts">
import LiButton from '../li-button/li-button.vue'

defineProps<{
  title: string
  label: string
  submitLabel: string
  saving?: boolean
  submitDisabled?: boolean
}>()

const emit = defineEmits<{
  submit: []
  cancel: []
}>()
</script>

<template>
  <section class="mb-6 overflow-hidden rounded-xl border border-violet-200 bg-white pb-6" :aria-label="label">
    <div class="flex items-center justify-between gap-4 p-6 max-[520px]:gap-2 max-[520px]:px-4 max-[520px]:py-[18px]">
      <h2 class="m-0 flex items-center gap-2.5 text-base font-semibold max-[520px]:text-sm">{{ title }}</h2>
      <li-button variant="plain" type="button" class="cursor-pointer whitespace-nowrap border-0 bg-transparent px-0 py-1 text-xs text-indigo-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50" :disabled="saving" @click="emit('cancel')">取消</li-button>
    </div>
    <form class="grid grid-cols-2 gap-[18px] px-6 max-[520px]:grid-cols-1 max-[520px]:px-[15px] [&_.form-help]:self-end [&_.form-help]:text-xs [&_.form-help]:text-amber-700 [&_.full-width]:col-span-full" :aria-busy="saving" @submit.prevent="emit('submit')">
      <slot />
      <div class="full-width flex gap-2.5">
        <li-button variant="plain" type="submit" class="cursor-pointer whitespace-nowrap rounded-lg border border-transparent bg-indigo-700 px-4 py-2.5 text-xs leading-snug text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50" :disabled="saving || submitDisabled">{{ saving ? '儲存中…' : submitLabel }}</li-button>
        <li-button variant="plain" type="button" class="cursor-pointer whitespace-nowrap rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs leading-snug text-gray-600 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50" :disabled="saving" @click="emit('cancel')">取消</li-button>
      </div>
    </form>
  </section>
</template>
