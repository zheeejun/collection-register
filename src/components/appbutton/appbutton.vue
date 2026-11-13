<script lang="ts" src="./appbutton.ts"></script>

<template>
  <button type="button" class="app-button" :class="buttonClasses">
    <slot />
  </button>
</template>

<style scoped src="./appbutton.css"></style>
