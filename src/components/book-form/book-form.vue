<script lang="ts" src="./book-form.ts"></script>

<template>
  <section class="editor-panel" aria-label="編輯圖書">
    <div class="section-title">
      <h2>{{ form.id ? '編輯圖書' : '新增圖書' }}</h2>
      <button class="text-button" :disabled="saving" @click="emit('cancel')">取消</button>
    </div>
    <form class="form-grid" @submit.prevent="submit">
      <label>
        書名
        <span class="required">*</span>
        <input v-model="form.title" required maxlength="300" placeholder="輸入書名" autofocus>
      </label>
      <label>
        借閱人
        <select class="cursor-pointer" v-model="form.author">
          <option value="">請選擇借閱人</option>
          <option value="Js">Jessie</option>
          <option value="Yang">Yang</option>
          <option value="Fong">Fong</option>
        </select>
      </label>
      <label>
        索書號／序號
        <input v-model="form.sn" maxlength="100" placeholder="例如 861.57 / 1234">
      </label>
      <label>
        閱讀狀態
        <select class="cursor-pointer" v-model="form.status">
          <option v-for="(label, value) in statusLabels" :key="value" :value="value">{{ label }}</option>
        </select>
      </label>
      <label>
        實際館藏地點
        <span class="required">*</span>
        <select class="cursor-pointer" v-model="form.locationId" required>
          <option disabled value="">請選擇已建立的館藏地點</option>
          <option v-for="place in locations" :key="place.id" :value="place.id">
            {{ place.name }}
            {{ [place.floor, place.shelf].filter(Boolean).length ? ` · ${[place.floor, place.shelf].filter(Boolean).join(' / ')}` : '' }}
          </option>
        </select>
      </label>
      <p v-if="!locations.length" class="form-help">請先到「實際館藏地點」新增地點，之後即可選用。</p>
      <label v-if="form.status === 'reserved'">
        預約日期
        <span class="required">*</span>
        <input v-model="form.reservedOn" type="date" required>
      </label>
      <template v-if="form.status === 'borrowed'">
        <label>
          借書日期
          <span class="required">*</span>
          <input v-model="form.borrowedOn" type="date" required :max="form.dueOn || undefined">
        </label>
        <label>
          到期日
          <span class="required">*</span>
          <input v-model="form.dueOn" type="date" required :min="form.borrowedOn || undefined">
        </label>
      </template>
      <label class="full-width">
        備註
        <textarea v-model="form.notes" maxlength="2000" rows="2" placeholder="留下閱讀筆記或取書資訊"></textarea>
      </label>
      <div class="form-actions full-width">
        <button type="submit" class="primary-button" :disabled="saving || !locations.length">
          {{ saving ? '儲存中…' : '儲存圖書' }}
        </button>
        <button type="button" class="secondary-button" :disabled="saving" @click="emit('cancel')">取消</button>
      </div>
    </form>
  </section>
</template>

<style scoped src="./book-form.css"></style>
