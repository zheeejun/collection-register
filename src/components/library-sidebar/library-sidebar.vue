<script lang="ts" src="./library-sidebar.ts"></script>

<template>
  <aside class="library-sidebar">
    <a class="library-brand" href="#all">
      <span class="brand-symbol" aria-hidden="true">冊</span>
      <span>
        閱讀之間
        <small>MY LITTLE LIBRARY</small>
      </span>
    </a>
    <p class="nav-caption text-xl">我的圖書管理</p>
    <nav aria-label="主要頁面">
      <a
        v-for="(item, index) in pages"
        :key="item.id"
        :href="`#${item.id}`"
        :class="{ active: page === item.id }"
        :aria-current="page === item.id ? 'page' : undefined"
      >
        <span class="nav-number" aria-hidden="true">
          0
          {{ index + 1 }}
        </span>
        {{ item.label }}
        <span class="nav-count">{{ counts[item.id] }}</span>
      </a>
    </nav>
    <div class="sidebar-note">
      <span aria-hidden="true">✦</span>
      <p>
        在書頁之間，
        <br>
        留一點時間給自己。
      </p>
      <small>每一本書，都是一段新的旅程。</small>
    </div>
    <div class="storage-note">
      <span class="storage-dot"></span>
      本機資料庫 ·
      {{ saving ? '儲存中' : loading ? '讀取中' : fatalError ? '無法連線' : '已就緒' }}
      <small>資料保存在此瀏覽器，請定期匯出備份。</small>
    </div>
  </aside>
</template>

<style scoped src="./library-sidebar.css"></style>
