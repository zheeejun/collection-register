import LiButton from '../li-button/li-button.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  components: { LiButton },
  name: 'LiForm',
  props: {
    title: { type: String, required: true },
    label: { type: String, required: true },
    submitLabel: { type: String, required: true },
    saving: Boolean,
    submitDisabled: Boolean,
  },
  emits: { submit: () => true, cancel: () => true },
  setup(_props, { emit }) { return { emit } },
})
