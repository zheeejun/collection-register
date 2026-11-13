import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { pages } from '../../app/app.navigation'
import type { LibrarySidebarProps } from './library-sidebar.interface'

export default defineComponent({
  name: 'LibrarySidebar',
  props: {
    page: { type: String as PropType<LibrarySidebarProps['page']>, required: true },
    counts: { type: Object as PropType<LibrarySidebarProps['counts']>, required: true },
    loading: Boolean,
    saving: Boolean,
    fatalError: { type: String, default: '' },
  },
  setup() { return { pages } },
})
