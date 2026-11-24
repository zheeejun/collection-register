import { defineComponent, reactive, toRaw, watch } from 'vue'
import type { PropType } from 'vue'
import { addLoanDays, LOAN_DAYS, statusLabels } from '../../library'
import type { Book } from '../../library'
import type { BookFormProps } from './book-form.interface'
import { LiCheckbox, LiForm, LiFormField, LiInput, LiSelect, LiTextarea } from '../../li-components'

export default defineComponent({
  name: 'BookForm',
  components: { LiCheckbox, LiForm, LiFormField, LiInput, LiSelect, LiTextarea },
  props: {
    initial: { type: Object as PropType<BookFormProps['initial']>, required: true },
    locations: { type: Array as PropType<BookFormProps['locations']>, required: true },
    saving: Boolean,
  },
  emits: { submit: (value: Book) => !!value, cancel: () => true },
  setup(props, { emit }) {
    const form = reactive({ ...props.initial })
    watch(() => props.initial, value => Object.assign(form, value), { deep: true })
    watch(() => [form.borrowedOn, form.status], () => {
      if (form.status !== 'borrowed') return
      form.dueOn = props.initial.status === 'borrowed' && form.borrowedOn === props.initial.borrowedOn
        ? props.initial.dueOn
        : addLoanDays(form.borrowedOn, LOAN_DAYS * ((props.initial.status === 'borrowed' ? props.initial.renewalCount ?? 0 : 0) + 1))
    })
    function submit() { emit('submit', { ...toRaw(form) }) }
    return { form, submit, emit, statusLabels }
  },
})
