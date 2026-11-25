<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string
  type?: string
  modelModifiers?: Record<string, boolean>
}>(), {
  modelValue: '',
  type: 'text',
  modelModifiers: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

/** 支援 v-model.trim，其餘原生 input 屬性會由 Vue 自動傳到根元素。 */
const model = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', props.modelModifiers.trim ? value.trim() : value),
})
</script>

<template>
  <input v-model="model" :type="type" class="min-h-10 w-full min-w-0 rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-xs placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
</template>
