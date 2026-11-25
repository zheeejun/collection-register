<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string
}>(), {
  modelValue: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const model = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})
</script>

<template>
  <select v-model="model" class="min-h-10 w-full min-w-0 cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900 hover:border-gray-300 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"><slot /></select>
</template>
