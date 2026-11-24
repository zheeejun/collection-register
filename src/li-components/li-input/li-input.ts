import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'

export default defineComponent({
  name: 'LiInput',
  props: {
    modelValue: { type: String, default: '' },
    type: { type: String, default: 'text' },
    modelModifiers: { type: Object as PropType<Record<string, boolean>>, default: () => ({}) },
  },
  emits: { 'update:modelValue': (value: string) => typeof value === 'string' },
  setup(props, { emit }) {
    const model = computed({ get: () => props.modelValue, set: (value: string) => emit('update:modelValue', props.modelModifiers.trim ? value.trim() : value) })
    return { model }
  },
})
