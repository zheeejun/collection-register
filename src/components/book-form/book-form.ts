import { defineComponent, reactive, toRaw, watch } from 'vue'
import type { PropType } from 'vue'
import { statusLabels } from '../../library'
import type { Book } from '../../library'
import type { BookFormProps } from './book-form.interface'

export default defineComponent({
  name: 'BookForm',
  props: {
    initial: { type: Object as PropType<BookFormProps['initial']>, required: true },
    locations: { type: Array as PropType<BookFormProps['locations']>, required: true },
    saving: Boolean,
  },
  emits: { submit: (value: Book) => !!value, cancel: () => true },
  setup(props, { emit }) {
    const form = reactive({ ...props.initial })
    watch(() => props.initial, value => Object.assign(form, value), { deep: true })
    function submit() { emit('submit', { ...toRaw(form) }) }
    return { form, submit, emit, statusLabels }
  },
})
