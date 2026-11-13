<script lang="ts" src="./library-stats.ts"></script>

<template>
  <div class="stats-grid">
    <a href="#reserved" class="stat-card">
      <span>已預約圖書</span>
      <strong>
        {{ counts.reserved }}
        <small>本</small>
      </strong>
      <span class="stat-foot">
        好書，值得等待
        <span aria-hidden="true">↗</span>
      </span>
    </a>
    <a href="#borrowed" class="stat-card">
      <span>正在借閱</span>
      <strong>
        {{ counts.borrowed }}
        <small>本</small>
      </strong>
      <span class="stat-foot">
        享受每一頁的時光
        <span aria-hidden="true">↗</span>
      </span>
    </a>
    <div class="stat-card" :class="{ 'stat-warning': overdue || soon }">
      <span>{{ overdue ? '已逾期圖書' : '三天內到期' }}</span>
      <strong>
        {{ overdue || soon }}
        <small>本</small>
      </strong>
      <span class="stat-foot">{{ overdue ? '記得安排還書時間' : '留意到期日，從容歸還' }}</span>
    </div>
    <a href="#locations" class="stat-card">
      <span>實際館藏地點</span>
      <strong>
        {{ counts.locations }}
        <small>處</small>
      </strong>
      <span class="stat-foot">
        每本書，都有它的位置
        <span aria-hidden="true">↗</span>
      </span>
    </a>
  </div>
</template>

<style scoped src="./library-stats.css"></style>
