<script lang="ts" src="./li-button.ts"></script>

<template>
  <button
    type="button"
    :class="{
      'inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-transparent p-2 font-medium disabled:cursor-not-allowed disabled:opacity-50': variant !== 'plain',
      'bg-[#e5e7eb] text-ink hover:border-muted hover:bg-field': !variant,
      'bg-[#6366f1] text-[#eef2ff] hover:brightness-110': variant === 'primary',
      'bg-transparent text-muted hover:bg-surface hover:text-danger': variant === 'quiet' && !armed,
      'bg-danger text-on-danger': variant === 'quiet' && armed,
    }"
  >
    <slot />
  </button>
</template>

