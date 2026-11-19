<script lang="ts" src="./li-form-field.ts"></script>

<template>
  <label class="li-form-field">
    {{ label }}
    <span v-if="required" class="required" aria-hidden="true">*</span>
    <slot />
  </label>
</template>

<style scoped src="./li-form-field.css"></style>
