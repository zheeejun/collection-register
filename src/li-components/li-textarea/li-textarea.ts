import { computed, defineComponent } from 'vue'

export default defineComponent({
  name: 'LiTextarea',
  props: { modelValue: { type: String, default: '' } },
  emits: { 'update:modelValue': (value: string) => typeof value === 'string' },
  setup(props, { emit }) {
    const model = computed({ get: () => props.modelValue, set: (value: string) => emit('update:modelValue', value) })
    return { model }
  },
})
