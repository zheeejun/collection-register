import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { AppButtonProps } from './appbutton.interface'

export default defineComponent({
  name: 'AppButton',
  props: {
    variant: { type: String as PropType<AppButtonProps['variant']>, default: undefined },
    armed: Boolean,
  },
  setup(props) {
    const buttonClasses = computed(() => ({
      'app-button--primary': props.variant === 'primary',
      'app-button--quiet': props.variant === 'quiet',
      'app-button--armed': props.variant === 'quiet' && props.armed,
    }))

    return { buttonClasses }
  },
})
