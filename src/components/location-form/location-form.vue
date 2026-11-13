<script lang="ts" src="./location-form.ts"></script>

<template>
  <section class="editor-panel" aria-label="編輯館藏地點">
    <div class="section-title">
      <h2>{{ form.id ? '編輯館藏地點' : '新增館藏地點' }}</h2>
      <button class="text-button" :disabled="saving" @click="emit('cancel')">取消</button>
    </div>
    <form class="form-grid" @submit.prevent="submit">
      <label>
        地點名稱
        <span class="required">*</span>
        <input v-model="form.name" required maxlength="200" placeholder="例如：市立圖書館・總館" autofocus>
      </label>
      <label>
        地址
        <input v-model="form.address" maxlength="300" placeholder="街道、門牌或館舍位置">
      </label>
      <label>
        樓層／區域
        <input v-model="form.floor" maxlength="100" placeholder="例如：3F 文學區">
      </label>
      <label>
        書架／櫃位
        <input v-model="form.shelf" maxlength="100" placeholder="例如：A 區第 12 架">
      </label>
      <label class="full-width">
        備註
        <textarea v-model="form.notes" maxlength="2000" rows="2" placeholder="開放時間、取書方式等"></textarea>
      </label>
      <div class="form-actions full-width">
        <button type="submit" class="primary-button" :disabled="saving">
          {{ saving ? '儲存中…' : '儲存館藏地點' }}
        </button>
        <button type="button" class="secondary-button" :disabled="saving" @click="emit('cancel')">取消</button>
      </div>
    </form>
  </section>
</template>

<style scoped src="./location-form.css"></style>
