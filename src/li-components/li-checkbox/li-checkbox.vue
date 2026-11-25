<script setup lang="ts">
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: boolean
  label?: string
}>(), {
  modelValue: false,
  label: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [event: Event]
}>()

const attrs = useAttrs()

/** class 與 style 套在外層 label，其餘原生屬性傳給 checkbox。 */
function inputAttrs() {
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style'))
}

function change(event: Event) {
  const input = event.target as HTMLInputElement
  emit('update:modelValue', input.checked)
  emit('change', event)
  // 實際儲存值由父元件管理；非同步儲存失敗時維持原值。
  input.checked = props.modelValue
}
</script>

<template>
  <label class="li-checkbox inline-flex items-center gap-2 text-xs" :class="$attrs.class" :style="$attrs.style">
    <input v-bind="inputAttrs()" type="checkbox" class="m-0 size-4 accent-indigo-500" :checked="modelValue" @change="change">
    <slot>{{ label }}</slot>
  </label>
</template>
