import { defineComponent, reactive, toRaw, watch } from 'vue'
import type { PropType } from 'vue'

import type { LibraryLocation } from '../../library'
import type { LocationFormProps } from './location-form.interface'

export default defineComponent({
  name: 'LocationForm',
  props: {
    initial: { type: Object as PropType<LocationFormProps['initial']>, required: true },
    
    saving: Boolean,
  },
  emits: { submit: (value: LibraryLocation) => !!value, cancel: () => true },
  setup(props, { emit }) {
    const form = reactive({ ...props.initial })
    watch(() => props.initial, value => Object.assign(form, value), { deep: true })
    function submit() { emit('submit', { ...toRaw(form) }) }
    return { form, submit, emit }
  },
})
