<script setup lang="ts">
/**
 * 館藏登記：書名、館藏地點、序號。可新增、複製、刪除、拖曳排序。
 * 資料自動存在瀏覽器的 localStorage（STORAGE_KEY）。
 * 這裡保存資料與操作邏輯，畫面在 components/ 底下。
 */
import { computed, nextTick, ref, watch } from 'vue'
import AppToast from './components/AppToast.vue'
import EmptyState from './components/EmptyState.vue'
import RegisterList from './components/RegisterList.vue'
import RegisterToolbar from './components/RegisterToolbar.vue'
import type { Field, Row } from './types'

const STORAGE_KEY = 'collection-register-vue-v1'
const MAX_ROWS = 1500
const MAX_LOCS = 200

const uid = () => Math.random().toString(36).slice(2, 9)
const newRow = (p: Partial<Row> = {}): Row => ({ id: uid(), title: '', loc: '', sn: '', ...p })
const snapshot = () => rows.value.map((r) => ({ ...r }))

/* ---------- 資料與儲存 ---------- */
function load() {
  let d: any = null
  try {
    d = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
  } catch {
    /* 資料壞掉就當作沒有 */
  }
  const rows: Row[] = (Array.isArray(d?.rows) ? d.rows : []).slice(0, MAX_ROWS).map((x: any) =>
    newRow({
      id: typeof x?.id === 'string' && x.id ? x.id : uid(),
      title: String(x?.title ?? ''),
      loc: String(x?.loc ?? ''),
      sn: String(x?.sn ?? ''),
    }),
  )
  const locs: string[] = [...new Set<string>((Array.isArray(d?.locs) ? d.locs : []).map((v: unknown) => String(v).trim()).filter(Boolean))].slice(0, MAX_LOCS)
  return { rows, locs, inc: !!d?.inc }
}

const saved = load()
const rows = ref<Row[]>(saved.rows)
const locs = ref<string[]>(saved.locs) // 館藏地點下拉清單
const incSerial = ref(saved.inc) // 複製列時序號 +1

watch(
  [rows, locs, incSerial],
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: rows.value, locs: locs.value, inc: incSerial.value }))
    } catch {
      /* 容量滿了或瀏覽器禁止儲存時略過 */
    }
  },
  { deep: true },
)

const summary = computed(() => {
  if (!rows.value.length) return '尚無資料'
  const places = new Set(rows.value.map((r) => r.loc.trim()).filter(Boolean))
  return `${rows.value.length} 筆 · ${places.size} 個地點`
})

/* ---------- 小工具 ---------- */
/** 序號尾端的數字 +1，保留前導 0 與後綴：'884.157 3460' → '884.157 3461' */
function bump(s: string) {
  const m = s.match(/^([\s\S]*?)(\d+)(\D*)$/)
  if (!m) return s
  return m[1] + (BigInt(m[2]) + 1n).toString().padStart(m[2].length, '0') + m[3]
}

function focusField(index: number, field: Field, select = false) {
  const row = rows.value[index]
  if (!row) return
  const el = document.getElementById(`${field}-${row.id}`) as HTMLInputElement | null
  el?.focus()
  if (select) el?.select()
}

/* ---------- 提示與復原 ---------- */
const toast = ref<{ msg: string; undo?: Row[] } | null>(null)
let toastTimer = 0
function showToast(msg: string, undo?: Row[]) {
  toast.value = { msg, undo }
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = null), undo ? 7000 : 2600)
}
function undo() {
  if (!toast.value?.undo) return
  rows.value = toast.value.undo
  toast.value = null
}

/* ---------- 列的操作 ---------- */
const flashId = ref('')
function flash(id: string) {
  flashId.value = id
  setTimeout(() => flashId.value === id && (flashId.value = ''), 1000)
}

async function addRow() {
  if (rows.value.length >= MAX_ROWS) return showToast(`最多可登記 ${MAX_ROWS} 列`)
  const row = newRow()
  rows.value.push(row)
  flash(row.id)
  await nextTick()
  focusField(rows.value.length - 1, 'title')
}

async function dupRow(i: number) {
  if (rows.value.length >= MAX_ROWS) return showToast(`最多可登記 ${MAX_ROWS} 列`)
  const s = rows.value[i]
  const row = newRow({ title: s.title, loc: s.loc, sn: incSerial.value ? bump(s.sn) : s.sn })
  rows.value.splice(i + 1, 0, row)
  flash(row.id)
  await nextTick()
  focusField(i + 1, 'sn', true)
}

async function delRow(i: number) {
  const snap = snapshot()
  rows.value.splice(i, 1)
  showToast(`已刪除第 ${i + 1} 列`, snap)
  await nextTick()
  const next = rows.value[i] ?? rows.value[i - 1]
  if (next) document.getElementById(`handle-${next.id}`)?.focus()
}

/** 鍵盤：握把上按 ↑ ↓ 移動 */
async function moveRow(i: number, d: -1 | 1) {
  const j = i + d
  const arr = rows.value
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
  await nextTick()
  document.getElementById(`handle-${arr[j].id}`)?.focus()
}

/** Enter：書名 → 地點 → 序號 → 下一列書名（最後一列則新增一列） */
function onEnter(e: KeyboardEvent, i: number, field: Field) {
  if (e.isComposing || e.keyCode === 229) return // 注音選字時的 Enter 不處理
  e.preventDefault()
  if (field === 'title') focusField(i, 'loc')
  else if (field === 'loc') focusField(i, 'sn')
  else if (i < rows.value.length - 1) focusField(i + 1, 'title')
  else addRow()
}

/* ---------- 地點清單 ---------- */
function addLoc(v: string) {
  v = v.trim()
  if (!v || locs.value.includes(v)) return
  if (locs.value.length >= MAX_LOCS) return showToast(`地點清單最多 ${MAX_LOCS} 筆`)
  locs.value.push(v)
  showToast('已加入地點清單')
}
function removeLoc(v: string) {
  locs.value = locs.value.filter((x) => x !== v)
}

/* ---------- 工具列 ---------- */
function legacyCopy(text: string) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  ta.remove()
}

/** 以 Tab 分隔（書名、館藏地點、序號），可直接貼到 Excel */
async function copyAll() {
  const clean = (s: string) => s.replace(/[\t\r\n]+/g, ' ')
  const lines = rows.value.filter((r) => r.title || r.loc || r.sn).map((r) => [r.title, r.loc, r.sn].map(clean).join('\t'))
  if (!lines.length) return showToast('沒有可複製的內容')
  const text = lines.join('\n')
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    legacyCopy(text)
  }
  showToast(`已複製 ${lines.length} 列，可直接貼到 Excel`)
}

function clearAll() {
  const snap = snapshot()
  rows.value = []
  showToast(`已清空 ${snap.length} 列`, snap)
}
</script>

<template>
  <main class="wrap">
    <header class="top">
      <h1>Collection Register</h1>
      <p class="sub">{{ summary }}</p>
    </header>

    <RegisterToolbar v-model:inc="incSerial" :empty="!rows.length" @add="addRow" @copy="copyAll" @clear="clearAll" />

    <RegisterList
      v-if="rows.length"
      v-model="rows"
      :locs="locs"
      :flash-id="flashId"
      @dup="dupRow"
      @del="delRow"
      @move="moveRow"
      @enter="onEnter"
      @next="focusField($event, 'sn')"
      @add-loc="addLoc"
      @remove-loc="removeLoc"
    />
    <EmptyState v-else @add="addRow" />
  </main>

  <AppToast :msg="toast?.msg" :can-undo="!!toast?.undo" @undo="undo" />
</template>

<!-- 全域：字體、色彩（Tailwind teal）、基本元件。要換顏色改這裡的 --accent 系列即可 -->
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@700&display=swap');

:root {
  --bg: #edf0ee;
  --surface: #fafbfa;
  --field: #ffffff;
  --line: #ccd5d1;
  --line-strong: #aebab5;
  --ink: #16211f;
  --muted: #586763;

  /* 主色：Tailwind teal（淺色用 700，深色用 400） */
  --accent: #0f766e; /* teal-700 */
  --accent-ink: #ffffff;
  --accent-soft: #f0fdfa; /* teal-50 */
  --accent-line: #99f6e4; /* teal-200 */
  --toast-link: #5eead4; /* teal-300 */

  --danger: #b3261e;
  --danger-soft: #fbe7e5;
  --on-danger: #ffffff;
  --shadow: 0 12px 30px -10px rgba(22, 33, 31, 0.35);

  --f-display: 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif;
  --f-body: 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif;
  --f-mono: 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0e1413;
    --surface: #162120;
    --field: #0f1918;
    --line: #2a3937;
    --line-strong: #3e504d;
    --ink: #e7efed;
    --muted: #98a9a5;

    --accent: #2dd4bf; /* teal-400 */
    --accent-ink: #042f2e; /* teal-950 */
    --accent-soft: #042f2e; /* teal-950 */
    --accent-line: #115e59; /* teal-800 */
    --toast-link: #0f766e; /* teal-700 */

    --danger: #ff8f86;
    --danger-soft: #3a1c1a;
    --on-danger: #3a0b08;
    --shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.7);
    color-scheme: dark;
  }
}

* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 15px/1.55 var(--f-body);
}
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
input[type='text'] {
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--field);
  color: var(--ink);
  font: 16px var(--f-body); /* 16px 以上，iOS 才不會自動放大 */
}
input[type='text']::placeholder {
  color: var(--muted);
  opacity: 0.7;
}
input[type='text']:hover {
  border-color: var(--line-strong);
}
input[type='text']:focus {
  outline: 2px solid var(--accent);
  outline-offset: 0;
  border-color: var(--accent);
}
</style>

<style scoped>
.wrap {
  max-width: 1000px;
  margin: 0 auto;
  padding: 28px max(16px, env(safe-area-inset-right, 0px)) 120px max(16px, env(safe-area-inset-left, 0px));
}
.top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 4px 16px;
}
h1 {
  margin: 0;
  font: 700 clamp(26px, 5vw, 34px) / 1.2 var(--f-display);
  letter-spacing: 0.02em;
  text-wrap: balance;
}
.sub {
  margin: 0 0 4px;
  color: var(--muted);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
</style>
