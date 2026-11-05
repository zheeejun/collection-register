<script setup lang="ts">
/** 文字按鈕。title、@click 等屬性會直接落到 <button> 上。 */
defineProps<{
  variant?: 'primary' | 'quiet'
  armed?: boolean // 危險動作待確認
}>()
</script>

<template>
  <button type="button" class="btn" :class="[variant, { armed }]"><slot /></button>
</template>

<style scoped>
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
</style>
