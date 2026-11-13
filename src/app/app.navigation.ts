import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Page, PageDefinition } from './app.interface'

export const pages: PageDefinition[] = [
  { id: 'all', label: '全部圖書', description: '把想讀的、正在讀的，都好好收藏。' },
  { id: 'reserved', label: '已預約清單', description: '下一本好書，已經在等待清單裡。' },
  { id: 'borrowed', label: '已借書與到期日', description: '掌握閱讀進度，也記得準時歸還。' },
  { id: 'locations', label: '實際館藏地點', description: '記下分館、樓層與書架，讓每本書都有位置。' },
]

function readPage(): Page {
  const value = window.location.hash.slice(1)
  return pages.some(item => item.id === value) ? value as Page : 'all'
}

export function useLibraryNavigation(active: boolean) {
  const page = ref<Page>(readPage())
  const currentPage = computed(() => pages.find(item => item.id === page.value)!)
  const query = ref('')
  const locationFilter = ref('')
  const dueFilter = ref('all')

  function onHashChange() {
    page.value = readPage()
    query.value = ''
    locationFilter.value = ''
    dueFilter.value = 'all'
  }

  onMounted(() => { if (active) window.addEventListener('hashchange', onHashChange) })
  onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange))

  return { page, currentPage, query, locationFilter, dueFilter }
}

export type LibraryNavigation = ReturnType<typeof useLibraryNavigation>
