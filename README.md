# 閱讀之間｜圖書管理

Vue 3 + TypeScript + Tailwind CSS 個人圖書管理工具。

- 全部圖書：書名、作者、索書號、館藏地點與閱讀狀態。
- 已預約清單：記錄預約日期，可登記借出。
- 已借書與到期日：記錄借書日與到期日，依到期日排序，標示今天到期、三天內到期與逾期，可標記歸還。
- 實際館藏地點：新增、編輯及刪除地點，記錄地址、樓層、書架與備註。已被圖書使用的地點不能刪除。

資料保存在同一來源、同一瀏覽器的 IndexedDB 資料庫 `library-manager`，重新整理或關閉網站後仍保留。這是本機資料庫，不會跨裝置同步；清除網站資料或使用無痕模式可能失去紀錄。可使用「匯出備份」下載完整 JSON 資料。

首次開啟會將原本 `collection-register-vue-v1` localStorage 中的館藏與地點遷移到新資料庫，舊資料保留作為復原來源。舊館藏狀態為「館藏中」，沒有地點的舊資料會顯示「未指定地點」，編輯時需補選地點。新增圖書前，請先建立館藏地點。

儲存會等待資料庫交易完成才更新清單；若儲存失敗會顯示錯誤並保留表單內容。

執行 `npm run dev` 開發、`npm run build` 建置正式版本。

既有 `#share=` 分享連結仍可開啟唯讀快照，不會讀取或覆寫收件人的本機資料庫。

「分享目前清單」會分享目前篩選結果中的書名、館藏地點名稱與索書號，分享內容為唯讀快照。從本機產生分享連結時，可在 `.env.local` 設定 `VITE_PUBLIC_SITE_URL` 為正式網站網址。

執行 `npm test` 檢查舊資料遷移、日期邊界、篩選、借還書、地點保護與元件渲染。

## 程式結構

`src/App.vue` 只載入主應用，頁面組裝放在 `src/app/app.vue`。每個新元件各有自己的資料夾，例如：

```text
src/
  app/
    app.vue                 # 主畫面組裝
    app.ts                  # 組合各功能與元件
    app.css                 # 主畫面與共用視覺規則
    app.interface.ts        # 頁面介面
    app.navigation.ts       # 分頁與篩選狀態
  components/
    appbutton/
      appbutton.vue         # HTML template
      appbutton.ts          # props、事件與元件邏輯
      appbutton.css         # 元件 scoped CSS
      appbutton.interface.ts
    library-sidebar/
    library-stats/
    book-form/
    location-form/
    book-table/
    location-list/
    records-panel/
  composables/
    useLibraryStore.ts      # 資料讀取與儲存狀態
    useLibraryCatalog.ts    # 清單篩選與統計
    useLibraryEditor.ts     # 新增、編輯、借還書與刪除
    useLibrarySharing.ts    # 分享與匯出
  models/
    library.interface.ts    # 圖書與館藏地點資料型別
  services/
    library-db.ts           # IndexedDB 存取
```

各元件透過 `<script lang="ts" src="./元件.ts">` 和 `<style scoped src="./元件.css">` 載入同資料夾檔案。表單使用本機草稿，送出後由應用層驗證並儲存，不直接修改館藏紀錄。原有的分享及舊版登記元件沿用原本結構，`AppButton` 已移到 `components/appbutton/`。

推送到 `main` 會由 GitHub Actions 部署到 https://zheeejun.github.io/collection-register/ （需先在 repo 的 Settings → Pages 將 Source 設為 GitHub Actions）。

`src/collection-register-standalone.html` 是舊版獨立登記工具；新版圖書管理請使用 Vite 網站。舊版獨立 HTML 的 Tailwind 樣式可用 `npm run build:standalone` 重新編譯。
