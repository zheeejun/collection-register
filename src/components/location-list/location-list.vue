<script lang="ts" src="./location-list.ts"></script>

<template>
  <div class="location-grid">
    <article v-for="place in locations" :key="place.id" class="location-card">
      <div class="location-card-top">
        <span class="location-icon" aria-hidden="true">⌂</span>
        <span class="location-book-count">
          {{ locationCount(place.id) }}
          本圖書
        </span>
      </div>
      <h3>{{ place.name }}</h3>
      <p>{{ place.address || '尚未填寫地址' }}</p>
      <dl>
        <div>
          <dt>樓層／區域</dt>
          <dd>{{ place.floor || '—' }}</dd>
        </div>
        <div>
          <dt>書架／櫃位</dt>
          <dd>{{ place.shelf || '—' }}</dd>
        </div>
      </dl>
      <p v-if="place.notes" class="record-note">{{ place.notes }}</p>
      <div class="card-actions">
        <button class="text-button" :disabled="saving" @click="emit('edit', place)">編輯地點</button>
        <button class="text-button danger-text" :disabled="saving" @click="emit('delete', place)">刪除</button>
      </div>
    </article>
  </div>
</template>

<style scoped src="./location-list.css"></style>
