<script setup lang="ts">
/** label 是欄位名稱；required 只顯示必填記號，驗證仍由表單控制項負責。 */
defineProps<{
  label: string
  required?: boolean
}>()
</script>

<template>
  <label class="block text-xs [&_input]:mt-1.5 [&_input]:block [&_select]:mt-1.5 [&_select]:block [&_textarea]:mt-1.5 [&_textarea]:block">
    {{ label }}
    <span v-if="required" class="text-rose-700" aria-hidden="true">*</span>
    <slot />
  </label>
</template>
