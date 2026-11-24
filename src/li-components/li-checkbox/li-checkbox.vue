<script lang="ts" src="./li-checkbox.ts"></script>

<template>
  <label class="li-checkbox" :class="$attrs.class" :style="$attrs.style">
    <input v-bind="inputAttrs()" type="checkbox" :checked="modelValue" @change="change">
    <slot>{{ label }}</slot>
  </label>
</template>

<style scoped src="./li-checkbox.css"></style>
