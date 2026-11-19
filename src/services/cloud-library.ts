import type { SupabaseClient } from '@supabase/supabase-js'
import type { LibraryData } from '../library'
import { parseLibraryData } from './library-backup'

export class LibraryConflictError extends Error {
  constructor() { super('另一個裝置已更新館藏。請先匯出目前資料或保留草稿，再按「重新讀取」取得最新版本後重試。') }
}

/** One instance per mounted account. The server also checks ownership with RLS. */
export function createCloudLibrary(client: SupabaseClient, userId: string) {
  let revision: number | null = null
  let loaded = false

  return {
    async load(): Promise<LibraryData> {
      const { data, error } = await client.from('libraries').select('data, revision').eq('user_id', userId).maybeSingle()
      if (error) throw new Error('無法讀取雲端館藏，請確認網路及資料庫設定後重試。')
      const library = data ? parseLibraryData(data.data) : { version: 1 as const, books: [], locations: [] }
      revision = data?.revision ?? null
      loaded = true
      return library
    },
    async save(library: LibraryData): Promise<void> {
      if (!loaded) throw new Error('請先讀取館藏後再儲存。')
      const query = revision === null
        ? client.from('libraries').insert({ user_id: userId, data: library })
        : client.from('libraries').update({ data: library }).eq('user_id', userId).eq('revision', revision)
      const { data, error } = await query.select('revision').maybeSingle()
      if (error?.code === '23505' || (!error && !data)) throw new LibraryConflictError()
      if (error) throw new Error('雲端儲存失敗。請確認網路及登入狀態後重試；表單內容仍保留。')
      revision = data!.revision
    },
  }
}
