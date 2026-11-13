<script lang="ts" src="./book-table.ts"></script>

<template>
  <div class="table-scroll">
    <table>
      <thead>
        <tr>
          <th scope="col">圖書資訊</th>
          <th scope="col">實際館藏地點</th>
          <th scope="col">
            {{ page === 'reserved' ? '預約日期' : page === 'borrowed' ? '借書日 → 到期日' : '閱讀狀態' }}
          </th>
          <th scope="col">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="book in books" :key="book.id">
          <td>
            <div class="book-cell">
              <span class="book-spine" :class="book.status" aria-hidden="true">冊</span>
              <div>
                <strong>{{ book.title || '未命名圖書' }}</strong>
                <p>
                  {{ book.author || '未填寫作者' }}
                  <span v-if="book.sn">
                    ·
                    {{ book.sn }}
                  </span>
                </p>
                <p v-if="book.notes" class="record-note">{{ book.notes }}</p>
              </div>
            </div>
          </td>
          <td>
            <span class="place-label">{{ locationName(book.locationId) }}</span>
            <p class="table-muted">{{ locationDetail(book.locationId) }}</p>
          </td>
          <td>
            <template v-if="page === 'borrowed'">
              <p class="date-range">
                {{ book.borrowedOn }}
                →
                <br>
                <strong>{{ book.dueOn }}</strong>
              </p>
              <span
                class="status-pill"
                :class="{ overdue: daysUntil(book.dueOn, today) < 0, soon: daysUntil(book.dueOn, today) >= 0 && daysUntil(book.dueOn, today) <= 3 }"
              >
                {{ dueLabel(book.dueOn, today) }}
              </span>
            </template>
            <template v-else-if="page === 'reserved'">
              <span class="table-date">{{ book.reservedOn || '未設定' }}</span>
              <br>
              <span class="status-pill reserved">已預約</span>
            </template>
            <span v-else class="status-pill" :class="book.status">{{ statusLabels[book.status] }}</span>
          </td>
          <td>
            <div class="row-actions">
              <button
                v-if="book.status !== 'borrowed'"
                class="text-button"
                :disabled="saving"
                @click="emit('borrow', book)"
              >
                登記借出
              </button>
              <button v-else class="text-button" :disabled="saving" @click="emit('return', book)">標記歸還</button>
              <button class="text-button" :disabled="saving" @click="emit('edit', book)">編輯</button>
              <button
                class="text-button danger-text"
                :disabled="saving"
                :aria-label="`刪除 ${book.title}`"
                @click="emit('delete', book)"
              >
                刪除
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped src="./book-table.css"></style>
