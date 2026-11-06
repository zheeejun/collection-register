<script setup lang="ts">
/**
 * 館藏地點輸入框 + 可自行增刪的下拉清單。
 *
 * - v-model：目前輸入的地點
 * - options：清單內容（由父層保存）
 * - 事件：add（把目前輸入加入清單）、remove（從清單移除）、next（選好或按 Enter，父層可跳到下一欄）
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  options: string[]
  inputId?: string
  placeholder?: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'add', value: string): void
  (e: 'remove', value: string): void
  (e: 'next'): void
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const chevEl = ref<HTMLButtonElement | null>(null)
const menuEl = ref<HTMLElement | null>(null)

const open = ref(false)
const filtering = ref(false) // 打字時依輸入內容篩選；按 ▾ 時顯示全部
const active = ref(-1) // 鍵盤目前選取的項目
const composing = ref(false) // 注音等輸入法組字中
const pos = ref({ left: 0, width: 0, top: 'auto', bottom: 'auto', maxHeight: 280 })

const typed = computed(() => props.modelValue.trim())
const shown = computed(() => {
  const q = filtering.value ? typed.value.toLowerCase() : ''
  return props.options.filter((o) => !q || o.toLowerCase().includes(q))
})
const addable = computed(() => !!typed.value && !props.options.includes(typed.value))
const navCount = computed(() => shown.value.length + (addable.value ? 1 : 0))

const menuStyle = computed(() => ({
  left: pos.value.left + 'px',
  width: pos.value.width + 'px',
  top: pos.value.top,
  bottom: pos.value.bottom,
  maxHeight: pos.value.maxHeight + 'px',
}))

function place() {
  const el = inputEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight
  const below = vh - r.bottom - 12
  const above = r.top - 12
  if (below < 200 && above > below) {
    // 下方空間不夠就往上開
    pos.value = { left: r.left, width: r.width, top: 'auto', bottom: vh - r.top + 4 + 'px', maxHeight: Math.min(280, above) }
  } else {
    pos.value = { left: r.left, width: r.width, top: r.bottom + 4 + 'px', bottom: 'auto', maxHeight: Math.min(280, Math.max(below, 120)) }
  }
}

function openMenu(filter: boolean) {
  filtering.value = filter
  active.value = -1
  if (filter && !shown.value.length && !addable.value) {
    close()
    return
  }
  place()
  open.value = true
}
function close() {
  open.value = false
  active.value = -1
}
function toggle() {
  if (open.value) close()
  else openMenu(false)
}

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
  if (!composing.value) nextTick(() => openMenu(true))
}
function onCompositionEnd() {
  composing.value = false
  nextTick(() => openMenu(true))
}

function step(d: number) {
  const n = navCount.value
  if (!n) return
  active.value = active.value < 0 ? (d > 0 ? 0 : n - 1) : (active.value + d + n) % n
  nextTick(() => menuEl.value?.querySelector('.on')?.scrollIntoView?.({ block: 'nearest' }))
}
function activate(i: number) {
  if (i < shown.value.length) pick(shown.value[i])
  else addCurrent()
}
function pick(v: string) {
  emit('update:modelValue', v)
  close()
  emit('next')
}
function addCurrent() {
  emit('add', typed.value)
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return
  if (e.key === 'Tab') return close()
  if (e.key === 'Escape') {
    if (open.value) {
      e.preventDefault()
      close()
    }
    return
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (!open.value) openMenu(false)
    step(e.key === 'ArrowDown' ? 1 : -1)
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    if (open.value && active.value >= 0) return activate(active.value)
    close()
    emit('next')
  }
}

/* 只在選單打開時才監聽全域事件，列數多時不會拖慢頁面 */
function onDocPointerDown(e: PointerEvent) {
  const t = e.target as Node
  if (menuEl.value?.contains(t) || inputEl.value?.contains(t) || chevEl.value?.contains(t)) return
  close()
}
function onScroll(e: Event) {
  if (!menuEl.value?.contains(e.target as Node)) close()
}
watch(open, (v) => {
  if (v) {
    document.addEventListener('pointerdown', onDocPointerDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
  } else {
    removeListeners()
  }
})
function removeListeners() {
  document.removeEventListener('pointerdown', onDocPointerDown)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', close)
}
onBeforeUnmount(removeListeners)
</script>

<template>
  <div class="relative">
    <input
      ref="inputEl"
      class="pr-[42px]"
      :id="inputId"
      type="text"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      autocomplete="off"
      maxlength="200"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      :value="modelValue"
      @input="onInput"
      @keydown="onKeydown"
      @compositionstart="composing = true"
      @compositionend="onCompositionEnd"
    />
    <button ref="chevEl" type="button" class="absolute right-0.5 bottom-0.5 grid size-10 cursor-pointer place-items-center rounded-[5px] border-0 bg-transparent p-0 text-muted hover:bg-bg hover:text-ink" tabindex="-1" aria-label="開啟地點清單" title="地點清單" @click="toggle">
      <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5.5 8l4.5 4.5L14.5 8" />
      </svg>
    </button>

    <!-- 放到 body，避免被列的邊界或拖曳動畫切到 -->
    <Teleport to="body">
      <div v-if="open" ref="menuEl" class="location-menu fixed z-30 overflow-y-auto rounded-lg border border-line-strong bg-surface p-1 shadow-panel" role="listbox" aria-label="館藏地點清單" :style="menuStyle" @mousedown.prevent>
        <div v-for="(o, i) in shown" :key="o" class="flex items-center">
          <button type="button" class="min-w-0 flex-1 cursor-pointer rounded-[5px] border-0 bg-transparent px-2.5 py-[9px] text-left font-body text-[15px] leading-[1.4] text-ink wrap-anywhere hover:bg-accent-soft [&.on]:bg-accent-soft" role="option" :aria-selected="o === typed" :class="{ on: active === i, 'text-accent! font-bold': o === typed }" @click="pick(o)">
            {{ o }}
          </button>
          <button type="button" class="size-8 flex-none cursor-pointer rounded-[5px] border-0 bg-transparent text-lg leading-none text-muted hover:bg-danger-soft hover:text-danger" :aria-label="`從清單移除 ${o}`" title="從清單移除" @click="emit('remove', o)">×</button>
        </div>
        <p v-if="!shown.length && !addable" class="m-0 p-2.5 text-[13px] text-muted">
          {{ options.length ? '沒有符合的地點' : '清單還是空的。在欄位輸入地點後，可以加入清單。' }}
        </p>
        <button v-if="addable" type="button" class="mt-1 block w-full cursor-pointer rounded-b-[5px] border-0 border-t border-line bg-transparent p-2.5 text-left font-body text-sm leading-[1.4] font-medium text-accent wrap-anywhere first:mt-0 first:rounded-[5px] first:border-t-0 hover:bg-accent-soft [&.on]:bg-accent-soft" :class="{ on: active === shown.length }" @click="addCurrent">
          ＋ 將「{{ typed }}」加入清單
        </button>
      </div>
    </Teleport>
  </div>
</template>
