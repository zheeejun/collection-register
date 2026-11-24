<script lang="ts" src="./app.ts"></script>

<template>
  <SharedCollection v-if="isSharedView" :collection="sharedCollection" :error="sharedError" />
  <div v-else class="library-app">
    <LibrarySidebar :page="page" :counts="counts" :loading="loading" :saving="saving" :fatal-error="fatalError" :cloud="!!userId" />
    <main class="library-main">
      <div class="topline">
        <span>
          個人閱讀管理 /
          {{ currentPage.label }}
        </span>
        <div class="account-actions">
          <span v-if="userId">{{ email }}</span>
          <span v-else>本機模式 · 尚未啟用跨裝置同步</span>
          <li-button variant="plain" v-if="userId" class="text-button" :disabled="saving" @click="signOut">登出</li-button>
          <time :datetime="today">{{ today.replaceAll('-', ' / ') }}</time>
        </div>
      </div>
      <header class="page-heading">
        <div>
          <p class="eyebrow">YOUR READING SPACE</p>
          <h1>{{ currentPage.label }}</h1>
          <p>{{ currentPage.description }}</p>
        </div>
        <div class="library-actions">
          <li-button variant="plain" class="secondary-button" :disabled="loading || saving" @click="refreshLibrary">重新讀取</li-button>
          <li-button variant="plain" class="secondary-button" :disabled="loading || !!fatalError" @click="exportData">匯出備份 ↗</li-button>
        </div>
      </header>
      <LibraryStats :counts="counts" :overdue="overdue.length" :soon="soon.length" />
      <p v-if="fatalError" class="message error" role="alert">{{ fatalError }}</p>
      <p v-if="error" class="message error" role="alert">{{ error }}</p>
      <p v-if="notice" class="message success" role="status">{{ notice }}</p>
      <section v-if="userId && !loading && !fatalError && (!data.books.length && !data.locations.length || importCandidate || importWarning)" class="import-panel" aria-label="搬移舊館藏">
        <h2>搬移舊館藏到你的帳號</h2>
        <p>只有你確認後才會上傳。為避免覆寫既有館藏，目前僅能匯入空白帳號。</p>
        <p v-if="importCandidate">待匯入：{{ importCandidate.books.length }} 本圖書、{{ importCandidate.locations.length }} 個地點。目標帳號：{{ email }}</p>
        <p v-if="importWarning" role="alert">{{ importWarning }}</p>
        <p v-if="data.books.length || data.locations.length">此帳號已有館藏，無法匯入。原始資料仍保留。</p>
        <div class="library-actions">
          <li-button variant="plain" v-if="importCandidate" class="primary-button" :disabled="saving || conflict || !!data.books.length || !!data.locations.length" @click="importLibrary">確認這是我的資料，搬入此帳號</li-button>
          <label v-if="!data.books.length && !data.locations.length" class="backup-label">選擇 JSON 備份
            <input type="file" accept=".json,application/json" :disabled="saving" @change="selectBackup" />
          </label>
          <li-button variant="plain" v-if="importCandidate || importWarning" class="secondary-button" :disabled="saving" @click="dismissImport">暫不搬移</li-button>
        </div>
      </section>
      <div v-if="pendingDelete" class="delete-confirm" role="alert">
        <p>
          確定刪除「
          {{ pendingDelete.label || '未命名圖書' }}
          」？
        </p>
        <li-button variant="plain" class="danger-button" :disabled="saving" @click="confirmDelete">確認刪除</li-button>
        <li-button variant="plain" class="secondary-button" :disabled="saving" @click="pendingDelete = null">取消</li-button>
      </div>
      <BookForm
        v-if="editor === 'book'"
        :initial="bookForm"
        :locations="data.locations"
        :saving="saving"
        @submit="submitBook"
        @cancel="closeEditor"
      />
      <LocationForm
        v-if="editor === 'location'"
        :initial="placeForm"
        :saving="saving"
        @submit="submitPlace"
        @cancel="closeEditor"
      />
      <RecordsPanel
        v-model:query="query"
        v-model:location-filter="locationFilter"
        v-model:due-filter="dueFilter"
        :page="page"
        :filtered-books="filteredBooks"
        :filtered-locations="filteredLocations"
        :all-books="data.books"
        :all-locations="data.locations"
        :total="counts[page]"
        :today="today"
        :loading="loading"
        :saving="saving"
        :sharing="sharing"
        :fatal-error="fatalError"
        @add-book="editBook()"
        @add-location="editPlace()"
        @edit-book="editBook"
        @edit-location="editPlace"
        @borrow="prepareBorrow"
        @return="returnBook"
        @renew="renewBook"
        @reservation="setReservation"
        @share="shareBooks"
        @delete-book="requestDelete('book', $event.id, $event.title)"
        @delete-location="requestDelete('location', $event.id, $event.name)"
      />
      <footer class="page-footer">
        閱讀之間
        <span>・</span>
        YOUR BOOKS, YOUR PACE.
      </footer>
    </main>
  </div>
  <ShareLinkDialog v-if="shareUrl" :url="shareUrl" @close="shareUrl = ''" />
</template>

<style scoped src="./app.css"></style>
