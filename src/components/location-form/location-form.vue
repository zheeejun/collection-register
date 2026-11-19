<script lang="ts" src="./location-form.ts"></script>

<template>
  <LiForm
    :title="form.id ? '編輯館藏地點' : '新增館藏地點'"
    label="編輯館藏地點"
    submit-label="儲存館藏地點"
    :saving="saving"
    @submit="submit"
    @cancel="emit('cancel')"
  >
    <LiFormField label="地點名稱" required>
      <LiInput v-model="form.name" required maxlength="200" placeholder="例如：市立圖書館・總館" autofocus />
    </LiFormField>
    <LiFormField label="地址">
      <LiInput v-model="form.address" maxlength="300" placeholder="街道、門牌或館舍位置" />
    </LiFormField>
    <LiFormField label="樓層／區域">
      <LiInput v-model="form.floor" maxlength="100" placeholder="例如：3F 文學區" />
    </LiFormField>
    <LiFormField label="書架／櫃位">
      <LiInput v-model="form.shelf" maxlength="100" placeholder="例如：A 區第 12 架" />
    </LiFormField>
    <LiFormField label="備註" class="full-width">
      <LiTextarea v-model="form.notes" maxlength="2000" rows="2" placeholder="開放時間、取書方式等" />
    </LiFormField>
  </LiForm>
</template>
