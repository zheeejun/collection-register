<script lang="ts" src="./book-form.ts"></script>

<template>
  <LiForm
    :title="form.id ? '編輯圖書' : '新增圖書'"
    label="編輯圖書"
    submit-label="儲存圖書"
    :saving="saving"
    :submit-disabled="!locations.length"
    @submit="submit"
    @cancel="emit('cancel')"
  >
    <LiFormField label="書名" required>
      <LiInput v-model="form.title" required maxlength="300" placeholder="輸入書名" autofocus />
    </LiFormField>
    <LiFormField label="借閱人">
      <LiSelect v-model="form.author">
        <option value="">請選擇借閱人</option>
        <option value="Jessie">Jessie</option>
        <option value="Yang">Yang</option>
        <option value="Fong">Fong</option>
      </LiSelect>
    </LiFormField>
    <LiFormField label="索書號／序號">
      <LiInput v-model="form.sn" maxlength="100" placeholder="例如 861.57 / 1234" />
    </LiFormField>
    <LiFormField label="閱讀狀態">
      <LiSelect v-model="form.status">
        <option v-for="(label, value) in statusLabels" :key="value" :value="value">{{ label }}</option>
      </LiSelect>
    </LiFormField>
    <LiFormField label="實際館藏地點" required>
      <LiSelect v-model="form.locationId" required>
        <option disabled value="">請選擇已建立的館藏地點</option>
        <option v-for="place in locations" :key="place.id" :value="place.id">
          {{ place.name }}
          {{ [place.floor, place.shelf].filter(Boolean).length ? ` · ${[place.floor, place.shelf].filter(Boolean).join(' / ')}` : '' }}
        </option>
      </LiSelect>
    </LiFormField>
    <p v-if="!locations.length" class="form-help">請先到「實際館藏地點」新增地點，之後即可選用。</p>
    <LiFormField v-if="form.status === 'reserved'" label="預約日期" required>
      <LiInput v-model="form.reservedOn" type="date" required />
    </LiFormField>
    <template v-if="form.status === 'borrowed'">
      <LiFormField label="借書日期" required>
        <LiInput v-model="form.borrowedOn" type="date" required :max="form.dueOn || undefined" />
      </LiFormField>
      <LiFormField label="到期日" required>
        <LiInput v-model="form.dueOn" type="date" required readonly />
      </LiFormField>
      <LiCheckbox v-model="form.hasReservation" class="full-width" :disabled="saving" label="有人預約，不能續借" />
      <p class="form-help full-width">借期 28 天，最多續借一次；續借從原到期日延長 28 天。目前已續借 {{ form.renewalCount || 0 }} 次。</p>
    </template>
    <LiFormField label="備註" class="full-width">
      <LiTextarea v-model="form.notes" maxlength="2000" rows="2" placeholder="留下閱讀筆記或取書資訊" />
    </LiFormField>
  </LiForm>
</template>
