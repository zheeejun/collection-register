import { defineComponent, useAttrs } from 'vue'

export default defineComponent({
  name: 'LiCheckbox',
  inheritAttrs: false,
  props: { modelValue: Boolean, label: { type: String, default: '' } },
  emits: { 'update:modelValue': (value: boolean) => typeof value === 'boolean', change: (event: Event) => !!event },
  setup(props, { emit }) {
    const attrs = useAttrs()
    function inputAttrs() { return Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')) }
    function change(event: Event) {
      const input = event.target as HTMLInputElement
      emit('update:modelValue', input.checked)
      emit('change', event)
      // The parent owns the saved value, including failed asynchronous saves.
      input.checked = props.modelValue
    }
    return { inputAttrs, change }
  },
})
