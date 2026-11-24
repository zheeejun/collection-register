import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { LiButtonProps } from './li-button.interface'

export default defineComponent({
  name: 'LiButton',
  props: {
    variant: { type: String as PropType<LiButtonProps['variant']>, default: undefined },
    armed: Boolean,
  },
})
