<script setup lang="ts">
/**
 * 館藏登記：書名、館藏地點、序號。可新增、複製、刪除、拖曳排序。
 * 資料自動存在瀏覽器的 localStorage（STORAGE_KEY）。
 * 拖曳使用 vuedraggable（SortableJS），只有左側握把可以拖。
 */
import { computed, nextTick, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import LocationInput from './components/LocationInput.vue'

interface Row {
  id: string
  title: string // 書名
  loc: string // 館藏地點
  sn: string // 序號
}
type Field = 'title' | 'loc' | 'sn'

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

const clearArmed = ref(false)
let armTimer = 0
function clearAll() {
  if (!rows.value.length) return
  if (!clearArmed.value) {
    clearArmed.value = true
    armTimer = window.setTimeout(() => (clearArmed.value = false), 4000)
    return
  }
  clearTimeout(armTimer)
  clearArmed.value = false
  const snap = snapshot()
  rows.value = []
  showToast(`已清空 ${snap.length} 列`, snap)
}
</script>

<template>
  <main class="wrap">
    <header class="top">
      <h1>館藏登記</h1>
      <p class="sub">{{ summary }}</p>
    </header>

    <div class="bar">
      <button type="button" class="btn primary" @click="addRow">＋ 新增一列</button>
      <button type="button" class="btn" title="以 Tab 分隔（書名、館藏地點、序號），可直接貼到 Excel" @click="copyAll">複製全部</button>
      <label class="opt"><input v-model="incSerial" type="checkbox" /> 複製列時，序號自動 +1</label>
      <span class="spacer" />
      <button type="button" class="btn quiet" :class="{ armed: clearArmed }" @click="clearAll">
        {{ clearArmed ? '再按一次清空全部' : '全部清空' }}
      </button>
    </div>

    <template v-if="rows.length">
      <p class="hint">拖曳左側握把可調整順序，握把上按 ↑ ↓ 鍵也可以移動。資料會自動存在這個瀏覽器。</p>
      <div class="cols-head" aria-hidden="true">
        <span /><span>#</span><span>書名</span><span>館藏地點</span><span>序號</span><span />
      </div>

      <draggable v-model="rows" tag="ol" class="list" item-key="id" handle=".handle" :animation="150" ghost-class="ghost" chosen-class="chosen">
        <template #item="{ element: row, index }">
          <li class="row" :class="{ flash: row.id === flashId }">
            <button
              :id="`handle-${row.id}`"
              type="button"
              class="handle"
              :aria-label="`拖曳排序：第 ${index + 1} 列`"
              title="拖曳排序（也可按 ↑ ↓ 鍵）"
              @keydown.up.prevent="moveRow(index, -1)"
              @keydown.down.prevent="moveRow(index, 1)"
            >
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
                <g fill="currentColor">
                  <circle cx="7" cy="5" r="1.5" /><circle cx="13" cy="5" r="1.5" />
                  <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
                  <circle cx="7" cy="15" r="1.5" /><circle cx="13" cy="15" r="1.5" />
                </g>
              </svg>
            </button>

            <div class="idx">{{ String(index + 1).padStart(2, '0') }}</div>

            <div class="f ttl">
              <label class="lbl" :for="`title-${row.id}`">書名</label>
              <input
                :id="`title-${row.id}`"
                v-model="row.title"
                type="text"
                autocomplete="off"
                maxlength="300"
                placeholder="例：書名"
                :aria-label="`第 ${index + 1} 列 書名`"
                @keydown.enter="onEnter($event, index, 'title')"
              />
            </div>

            <div class="f loc">
              <label class="lbl" :for="`loc-${row.id}`">館藏地點</label>
              <LocationInput
                v-model="row.loc"
                :input-id="`loc-${row.id}`"
                :options="locs"
                placeholder="例：總館 3F 中文圖書區"
                :aria-label="`第 ${index + 1} 列 館藏地點`"
                @add="addLoc"
                @remove="removeLoc"
                @next="focusField(index, 'sn')"
              />
            </div>

            <div class="f sn">
              <label class="lbl" :for="`sn-${row.id}`">序號</label>
              <input
                :id="`sn-${row.id}`"
                v-model="row.sn"
                type="text"
                autocomplete="off"
                spellcheck="false"
                maxlength="100"
                placeholder="例：884.157 3460"
                :aria-label="`第 ${index + 1} 列 序號`"
                @keydown.enter="onEnter($event, index, 'sn')"
              />
            </div>

            <div class="acts">
              <button type="button" class="icon" :aria-label="`複製第 ${index + 1} 列`" title="複製這一列" @click="dupRow(index)">
                <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="7" y="7" width="9" height="9" rx="1.5" />
                  <path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7" />
                </svg>
              </button>
              <button type="button" class="icon del" :aria-label="`刪除第 ${index + 1} 列`" title="刪除這一列" @click="delRow(index)">
                <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4.5 6h11M8 6V4.5h4V6M6 6l.6 9a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L14 6" />
                </svg>
              </button>
            </div>
          </li>
        </template>
      </draggable>
    </template>

    <div v-else class="empty">
      <h2>還沒有館藏紀錄</h2>
      <p>每一列記錄一本館藏的書名、館藏地點和序號。新增後可以複製、刪除，或拖曳調整順序。</p>
      <button type="button" class="btn primary" @click="addRow">新增第一列</button>
    </div>
  </main>

  <Transition name="toast">
    <div v-if="toast" class="toast">
      <div class="in" role="status">
        <span>{{ toast.msg }}</span>
        <button v-if="toast.undo" type="button" class="undo" @click="undo">復原</button>
      </div>
    </div>
  </Transition>
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
  /* 欄寬：握把 / 列號 / 書名 / 館藏地點 / 序號 / 操作鈕，要調整改這一行 */
  --cols: 32px 44px minmax(0, 1.15fr) minmax(0, 1fr) minmax(140px, 190px) 84px;
  max-width: 1000px;
  margin: 0 auto;
  padding: 28px max(16px, env(safe-area-inset-right, 0px)) 120px max(16px, env(safe-area-inset-left, 0px));
}

/* 標題 */
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

/* 工具列 */
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 20px 0 12px;
}
.spacer {
  flex: 1 1 0;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink);
  font: 500 14px var(--f-body);
  cursor: pointer;
}
.btn:hover {
  background: var(--field);
  border-color: var(--muted);
}
.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}
.btn.primary:hover {
  background: var(--accent);
  filter: brightness(1.1);
}
.btn.quiet {
  border-color: transparent;
  background: transparent;
  color: var(--muted);
}
.btn.quiet:hover {
  background: var(--surface);
  color: var(--danger);
}
.btn.quiet.armed,
.btn.quiet.armed:hover {
  background: var(--danger);
  color: var(--on-danger);
}
.opt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--muted);
  cursor: pointer;
}
.opt input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--accent);
}
.hint {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--muted);
}

/* 清單 */
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.cols-head,
.row {
  display: grid;
  grid-template-columns: var(--cols);
  align-items: center;
  gap: 10px;
}
.cols-head {
  padding: 0 13px 6px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--muted);
}
.row {
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.row.flash {
  animation: flash 1s ease-out;
}
@keyframes flash {
  from {
    background: var(--accent-soft);
    border-color: var(--accent);
  }
}
/* 拖曳中的樣式（SortableJS 會加上這些 class） */
.ghost {
  opacity: 0.45;
  border-color: var(--accent);
  background: var(--accent-soft);
}
.chosen {
  border-color: var(--accent);
  box-shadow: var(--shadow);
}

.handle {
  width: 32px;
  height: 44px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  cursor: grab;
  touch-action: none;
  -webkit-touch-callout: none;
  user-select: none;
}
.handle:hover {
  background: var(--bg);
  color: var(--ink);
}
.idx {
  font: 13px/1.2 var(--f-mono);
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.f {
  display: block;
  min-width: 0;
}
.lbl {
  display: none;
  margin-bottom: 4px;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--muted);
}
/* 序號欄：像索書號標籤 */
.sn input {
  font-family: var(--f-mono);
  font-weight: 500;
  letter-spacing: 0.04em;
  background: var(--accent-soft);
  border-color: var(--accent-line);
}
.acts {
  display: flex;
  gap: 2px;
}
.icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.icon:hover {
  background: var(--bg);
  color: var(--ink);
}
.icon.del:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

.empty {
  display: grid;
  justify-items: start;
  gap: 12px;
  padding: 28px 20px;
  border: 1px dashed var(--line-strong);
  border-radius: 8px;
  color: var(--muted);
}
.empty h2 {
  margin: 0;
  font: 700 17px var(--f-body);
  color: var(--ink);
}
.empty p {
  margin: 0;
  max-width: 46ch;
}

/* 提示（含復原） */
.toast {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  justify-content: center;
  padding: 12px max(16px, env(safe-area-inset-right, 0px)) calc(12px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
  pointer-events: none;
}
.toast .in {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 560px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--ink);
  color: var(--bg);
  box-shadow: var(--shadow);
  font-size: 14px;
}
.toast .undo {
  padding: 4px 2px;
  border: 0;
  background: transparent;
  color: var(--toast-link);
  font: 700 14px var(--f-body);
  text-decoration: underline;
  cursor: pointer;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.18s, transform 0.18s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* 手機：每列改成上下堆疊 */
@media (max-width: 720px) {
  .cols-head {
    display: none;
  }
  .row {
    grid-template-columns: auto 1fr auto;
    grid-template-areas: 'h i a' 't t t' 'l l l' 's s s';
    row-gap: 8px;
  }
  .handle {
    grid-area: h;
    height: 40px;
  }
  .idx {
    grid-area: i;
  }
  .ttl {
    grid-area: t;
  }
  .loc {
    grid-area: l;
  }
  .sn {
    grid-area: s;
  }
  .acts {
    grid-area: a;
  }
  .lbl {
    display: block;
  }
  .opt {
    flex-basis: 100%;
    order: 5;
  }
  .spacer {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .row.flash {
    animation: none;
  }
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
