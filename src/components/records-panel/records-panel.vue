<script lang="ts" src="./records-panel.ts"></script>

<template>
  <section class="records-panel" :aria-label="currentPage.label">
    <div class="section-title">
      <div>
        <h2>
          {{ page === 'locations' ? '館藏地點資料庫' : page === 'reserved' ? '我的預約清單' : page === 'borrowed' ? '我的借閱清單' : '我的圖書清單' }}
          <span class="record-count">{{ total }}</span>
        </h2>
        <p>
          {{ page === 'locations' ? '新增的地點會保存至資料庫，供所有圖書選用。' : page === 'borrowed' ? '依到期日排序，最先到期的圖書排在前面。' : '整理每一本書，也整理下一段閱讀時光。' }}
        </p>
      </div>
      <button
        class="primary-button"
        :disabled="loading || saving || !!fatalError"
        @click="page === 'locations' ? emit('add-location') : emit('add-book')"
      >
        ＋
        {{ page === 'locations' ? '新增地點' : page === 'reserved' ? '新增預約' : page === 'borrowed' ? '新增借書' : '新增圖書' }}
      </button>
    </div>
    <div class="filters">
      <label class="search-field">
        <span aria-hidden="true">⌕</span>
        <input
          v-model="query"
          type="search"
          :aria-label="page === 'locations' ? '搜尋館藏地點' : '搜尋圖書'"
          :placeholder="page === 'locations' ? '搜尋地點、地址或書架…' : '搜尋書名、作者或索書號…'"
        >
      </label>
      <select v-if="page !== 'locations'" v-model="locationFilter" aria-label="篩選館藏地點">
        <option value="">所有館藏地點</option>
        <option v-for="place in allLocations" :key="place.id" :value="place.id">{{ place.name }}</option>
      </select>
      <select v-if="page === 'borrowed'" v-model="dueFilter" aria-label="篩選到期狀態">
        <option value="all">所有到期狀態</option>
        <option value="overdue">已逾期</option>
        <option value="soon">三天內到期</option>
      </select>
    </div>
    <div v-if="loading" class="empty-library" role="status">正在讀取圖書資料庫…</div>
    <template v-else-if="!fatalError">
      <template v-if="page === 'locations'">
        <LocationList
          v-if="filteredLocations.length"
          :locations="filteredLocations"
          :books="allBooks"
          :saving="saving"
          @edit="emit('edit-location', $event)"
          @delete="emit('delete-location', $event)"
        />
        <div v-else class="empty-library">
          <span class="empty-symbol" aria-hidden="true">⌂</span>
          <h3>{{ query ? '找不到符合的地點' : '為你的圖書，建立第一個地點' }}</h3>
          <p>{{ query ? '試試其他關鍵字。' : '新增分館、樓層與書架位置，下次就能快速找到書。' }}</p>
          <button v-if="!query" class="secondary-button" @click="emit('add-location')">＋ 新增館藏地點</button>
        </div>
      </template>
      <template v-else>
        <BookTable
          v-if="filteredBooks.length"
          :books="filteredBooks"
          :locations="allLocations"
          :page="page"
          :today="today"
          :saving="saving"
          @borrow="emit('borrow', $event)"
          @return="emit('return', $event)"
          @edit="emit('edit-book', $event)"
          @delete="emit('delete-book', $event)"
        />
        <div v-else class="empty-library">
          <span class="empty-symbol" aria-hidden="true">冊</span>
          <h3>
            {{ query || locationFilter || dueFilter !== 'all' ? '沒有符合條件的圖書' : page === 'reserved' ? '下一本想讀的書，從這裡開始' : page === 'borrowed' ? '目前沒有借閱中的圖書' : '把第一本書，放進閱讀清單' }}
          </h3>
          <p>
            {{ query || locationFilter || dueFilter !== 'all' ? '調整搜尋或篩選條件，再試一次。' : '新增圖書，記錄館藏地點與閱讀狀態。' }}
          </p>
          <button
            v-if="!query && !locationFilter && dueFilter === 'all'"
            class="secondary-button"
            @click="emit('add-book')"
          >
            ＋
            {{ page === 'reserved' ? '新增預約' : page === 'borrowed' ? '新增借書' : '新增圖書' }}
          </button>
        </div>
      </template>
    </template>
    <footer class="records-footer">
      <span>
        {{ page === 'locations' ? filteredLocations.length : filteredBooks.length }}
        筆顯示結果
      </span>
      <button
        v-if="page !== 'locations'"
        class="text-button"
        :disabled="loading || sharing || !filteredBooks.length || !!fatalError"
        @click="emit('share')"
      >
        {{ sharing ? '產生連結中…' : '分享目前清單 ↗' }}
      </button>
      <span>一點整理，讓閱讀更自在。</span>
    </footer>
  </section>
</template>

<style scoped src="./records-panel.css"></style>
