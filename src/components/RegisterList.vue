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
  <div class="[--cols:32px_44px_minmax(0,1.15fr)_minmax(0,1fr)_minmax(140px,190px)_84px]">
    <p class="mb-2.5 text-[13px] text-muted">拖曳左側握把可調整順序，握把上按 ↑ ↓ 鍵也可以移動。資料會自動存在這個瀏覽器。</p>
    <div class="grid grid-cols-(--cols) items-center gap-2.5 px-[13px] pb-1.5 text-xs tracking-[0.08em] text-muted max-[720px]:hidden" aria-hidden="true">
      <span /><span>#</span><span>書名</span><span>館藏地點</span><span>序號</span><span />
    </div>

    <draggable v-model="rows" tag="ol" class="m-0 grid list-none gap-2 p-0" item-key="id" handle=".handle" :animation="150" ghost-class="ghost" chosen-class="chosen">
      <template #item="{ element: row, index }">
        <li class="row grid grid-cols-(--cols) items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 max-[720px]:grid-cols-[auto_1fr_auto] max-[720px]:gap-y-2 max-[720px]:[grid-template-areas:'h_i_a'_'t_t_t'_'l_l_l'_'s_s_s']" :class="{ flash: row.id === flashId }">
          <button
            :id="`handle-${row.id}`"
            type="button"
            class="handle grid h-11 w-8 cursor-grab touch-none place-items-center rounded-md border-0 bg-transparent p-0 text-muted select-none [-webkit-touch-callout:none] hover:bg-bg hover:text-ink max-[720px]:h-10 max-[720px]:[grid-area:h]"
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

          <div class="font-mono text-[13px] leading-[1.2] text-muted tabular-nums max-[720px]:[grid-area:i]">{{ String(index + 1).padStart(2, '0') }}</div>

          <div class="block min-w-0 max-[720px]:[grid-area:t]">
            <label class="mb-1 hidden text-xs tracking-[0.04em] text-muted max-[720px]:block" :for="`title-${row.id}`">書名</label>
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

          <div class="block min-w-0 max-[720px]:[grid-area:l]">
            <label class="mb-1 hidden text-xs tracking-[0.04em] text-muted max-[720px]:block" :for="`loc-${row.id}`">館藏地點</label>
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

          <div class="block min-w-0 max-[720px]:[grid-area:s]">
            <label class="mb-1 hidden text-xs tracking-[0.04em] text-muted max-[720px]:block" :for="`sn-${row.id}`">序號</label>
            <input
              :id="`sn-${row.id}`"
              class="border-accent-line bg-accent-soft font-mono font-medium tracking-[0.04em] focus:border-accent"
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

          <div class="flex gap-0.5 max-[720px]:[grid-area:a]">
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
.row.flash {
  animation: flash 1s ease-out;
}
@keyframes flash {
  from {
    background: var(--accent-soft);
    border-color: var(--accent);
  }
}
/* SortableJS adds these classes during dragging. */
.ghost {
  opacity: 0.45;
  border-color: var(--accent);
  background: var(--accent-soft);
}
.chosen {
  border-color: var(--accent);
  box-shadow: var(--shadow);
}
@media (prefers-reduced-motion: reduce) {
  .row.flash {
    animation: none;
  }
}
</style>
