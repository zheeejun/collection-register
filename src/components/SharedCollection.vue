<script setup lang="ts">
import type { SharedCollection } from '../share'

defineProps<{ collection: SharedCollection | null; error: string }>()
</script>

<template>
  <main class="mx-auto max-w-4xl px-4 py-7">
    <header class="mb-6 space-y-2">
      <h1 class="text-xl font-semibold">圖書館藏分享</h1>
      <p class="text-sm text-muted">唯讀資料快照</p>
    </header>
    <p v-if="error" role="alert" class="rounded-lg border border-danger bg-danger-soft p-4 text-danger">{{ error }}</p>
    <p v-else-if="!collection" role="status">正在讀取分享資料…</p>
    <template v-else>
      <p class="mb-4 text-sm text-muted">{{ collection.rows.length }} 筆館藏 · 匯出於 {{ new Date(collection.createdAt).toLocaleString('zh-TW') }}</p>
      <div class="overflow-x-auto rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-50">
        <table class="w-full border-collapse text-left text-sm">
          <caption class="sr-only">分享的館藏清單</caption>
          <thead class="bg-indigo-100 dark:bg-indigo-900">
            <tr><th scope="col" class="p-3">#</th><th scope="col" class="p-3">書名</th><th scope="col" class="p-3">館藏地點</th><th scope="col" class="p-3">序號</th></tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in collection.rows" :key="row.id" class="border-t border-indigo-200 dark:border-indigo-800">
              <td class="p-3 align-top tabular-nums">{{ index + 1 }}</td>
              <td class="min-w-40 p-3 align-top whitespace-pre-wrap wrap-anywhere">{{ row.title }}</td>
              <td class="min-w-32 p-3 align-top whitespace-pre-wrap wrap-anywhere">{{ row.loc }}</td>
              <td class="min-w-28 p-3 align-top whitespace-pre-wrap wrap-anywhere">{{ row.sn }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </main>
</template>
