import { defineComponent } from 'vue'

export default defineComponent({
  name: 'LiFormField',
  props: { label: { type: String, required: true }, required: Boolean },
})
