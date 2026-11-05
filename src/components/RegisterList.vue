<script setup lang="ts">
/**
 * 館藏清單：v-model 是所有列，欄位直接改 row 物件（資料由 App 保存）。
 * 拖曳使用 vuedraggable（SortableJS），只有左側握把可以拖。
 * 焦點移動靠 id（handle-、title-、loc-、sn- 加 row.id），由 App 處理。
 */
import draggable from 'vuedraggable'
import IconButton from './IconButton.vue'
import LocationInput from './LocationInput.vue'
import type { Field, Row } from '../types'

defineProps<{ locs: string[]; flashId: string }>()
const emit = defineEmits<{
  (e: 'dup', index: number): void
  (e: 'del', index: number): void
  (e: 'move', index: number, delta: -1 | 1): void
  (e: 'enter', event: KeyboardEvent, index: number, field: Field): void
  (e: 'next', index: number): void
  (e: 'add-loc', value: string): void
  (e: 'remove-loc', value: string): void
}>()
const rows = defineModel<Row[]>({ required: true })
</script>

<template>
  <div class="register">
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
            @keydown.up.prevent="emit('move', index, -1)"
            @keydown.down.prevent="emit('move', index, 1)"
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
              @keydown.enter="emit('enter', $event, index, 'title')"
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
              @add="emit('add-loc', $event)"
              @remove="emit('remove-loc', $event)"
              @next="emit('next', index)"
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
              @keydown.enter="emit('enter', $event, index, 'sn')"
            />
          </div>

          <div class="acts">
            <IconButton :aria-label="`複製第 ${index + 1} 列`" title="複製這一列" @click="emit('dup', index)">
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="7" y="7" width="9" height="9" rx="1.5" />
                <path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7" />
              </svg>
            </IconButton>
            <IconButton danger :aria-label="`刪除第 ${index + 1} 列`" title="刪除這一列" @click="emit('del', index)">
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4.5 6h11M8 6V4.5h4V6M6 6l.6 9a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L14 6" />
              </svg>
            </IconButton>
          </div>
        </li>
      </template>
    </draggable>
  </div>
</template>

<style scoped>
.register {
  /* 欄寬：握把 / 列號 / 書名 / 館藏地點 / 序號 / 操作鈕，要調整改這一行 */
  --cols: 32px 44px minmax(0, 1.15fr) minmax(0, 1fr) minmax(140px, 190px) 84px;
}
.hint {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--muted);
}
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
}
@media (prefers-reduced-motion: reduce) {
  .row.flash {
    animation: none;
  }
}
</style>
