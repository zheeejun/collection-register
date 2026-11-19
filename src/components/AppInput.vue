<script setup lang="ts">
import { LiInput } from './index'

const model = defineModel<string>({ required: true })
</script>

<template>
  <LiInput v-model="model" />
</template>
