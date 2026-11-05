export interface Row {
  id: string
  title: string // 書名
  loc: string // 館藏地點
  sn: string // 序號
}
export type Field = 'title' | 'loc' | 'sn'
