<script lang="ts" src="./app.ts"></script>

<template>
  <SharedCollection v-if="isSharedView" :collection="sharedCollection" :error="sharedError" />
  <div v-else class="library-app">
    <LibrarySidebar :page="page" :counts="counts" :loading="loading" :saving="saving" :fatal-error="fatalError" />
    <main class="library-main">
      <div class="topline">
        <span>
          個人閱讀管理 /
          {{ currentPage.label }}
        </span>
        <time :datetime="today">{{ today.replaceAll('-', ' / ') }}</time>
      </div>
      <header class="page-heading">
        <div>
          <p class="eyebrow">YOUR READING SPACE</p>
          <h1>{{ currentPage.label }}</h1>
          <p>{{ currentPage.description }}</p>
        </div>
        <button class="secondary-button" :disabled="loading || !!fatalError" @click="exportData">
          匯出備份 ↗
        </button>
      </header>
      <LibraryStats :counts="counts" :overdue="overdue.length" :soon="soon.length" />
      <p v-if="fatalError" class="message error" role="alert">{{ fatalError }}</p>
      <p v-if="error" class="message error" role="alert">{{ error }}</p>
      <p v-if="notice" class="message success" role="status">{{ notice }}</p>
      <div v-if="pendingDelete" class="delete-confirm" role="alert">
        <p>
          確定刪除「
          {{ pendingDelete.label || '未命名圖書' }}
          」？
        </p>
        <button class="danger-button" :disabled="saving" @click="confirmDelete">確認刪除</button>
        <button class="secondary-button" :disabled="saving" @click="pendingDelete = null">取消</button>
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
