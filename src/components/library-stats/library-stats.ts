import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { LibraryStatsProps } from './library-stats.interface'

export default defineComponent({
  name: 'LibraryStats',
  props: {
    counts: { type: Object as PropType<LibraryStatsProps['counts']>, required: true },
    overdue: { type: Number, required: true },
    soon: { type: Number, required: true },
  },
})
