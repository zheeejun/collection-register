# 閱讀之間｜圖書管理

Vue 3 + TypeScript + Tailwind CSS 個人圖書管理工具。

- 全部圖書：書名、作者、索書號、館藏地點與閱讀狀態。
- 已預約清單：記錄預約日期，可登記借出。
- 已借書與到期日：記錄借書日與到期日，依到期日排序，標示今天到期、三天內到期與逾期，可標記歸還。
- 新借書的借期為 28 天，到期日自動計算。借閱清單可勾選「有人預約」並儲存，勾選後不能續借；無人預約時最多續借一次，從原到期日延長 28 天。歸還後重新借出會重設續借次數。舊紀錄保留原到期日，缺少的新欄位預設為無人預約、尚未續借。
- 實際館藏地點：新增、編輯及刪除地點，記錄地址、樓層、書架與備註。已被圖書使用的地點不能刪除。

設定 Supabase 後，每位使用者可用 Email／密碼註冊登入，管理自己獨立的雲端館藏。在其他裝置登入同一帳號即可讀取已儲存的內容。每次進入會讀取最新館藏；已開啟的其他裝置需按「重新讀取」更新清單，目前不提供即時推播或離線編輯。不同裝置同時修改時會阻擋過期版本儲存，保留表單並提示先重新讀取，避免覆寫他人的更新。

未設定 Supabase 時維持本機模式：資料保存在同一來源、同一瀏覽器的 IndexedDB 資料庫 `library-manager`，不會跨裝置同步。清除網站資料或使用無痕模式可能失去本機紀錄。兩種模式都可用「匯出備份」下載完整 JSON 資料。

首次開啟會將原本 `collection-register-vue-v1` localStorage 中的館藏與地點遷移到新資料庫，舊資料保留作為復原來源。舊館藏狀態為「館藏中」，沒有地點的舊資料會顯示「未指定地點」，編輯時需補選地點。新增圖書前，請先建立館藏地點。

儲存會等待資料庫交易完成才更新清單；若儲存失敗會顯示錯誤並保留表單內容。

執行 `npm run dev` 開發、`npm run build` 建置正式版本。

既有 `#share=` 分享連結仍可開啟唯讀快照，不會讀取或覆寫收件人的本機資料庫。

「分享目前清單」會分享目前篩選結果中的書名、館藏地點名稱與索書號，分享內容為唯讀快照。從本機產生分享連結時，可在 `.env.local` 設定 `VITE_PUBLIC_SITE_URL` 為正式網站網址。

執行 `npm test` 檢查舊資料遷移、日期邊界、篩選、借還書、地點保護與元件渲染。

## 設定帳號登入與跨裝置館藏

1. 在 [Supabase](https://supabase.com/dashboard) 建立專案。在 SQL Editor 執行 [`supabase/migrations/202611190001_libraries.sql`](supabase/migrations/202611190001_libraries.sql) 一次，建立館藏資料表、每人獨立的 RLS 權限與儲存版本檢查。
2. 在專案的 Connect／API Keys 找到 Project URL 與 **Publishable key**（舊版 anon key 也可）。不要使用 secret key 或 service_role key，也不要把資料庫密碼放進網站。
3. 本機開發：參照 `.env.example`，在既有 `.env.local` 加入 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`，保留原本的網站網址設定，再重啟 `npm run dev`。
4. 正式網站：GitHub Actions 已設定此專案的 Supabase 網址與公開金鑰。若要切換專案，可在 GitHub repository → Settings → Secrets and variables → Actions → **Variables** 加入 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`，覆寫預設值。它們會公開在前端程式中，資料隔離由 RLS 與使用者的登入憑證負責。修改設定後必須重新執行部署才會生效。
5. 在 Supabase Authentication → URL Configuration 將 Site URL 設為 `https://zheeejun.github.io/collection-register/`，並在 Redirect URLs 加入相同網址。本機測試再加入實際使用的開發網址，例如 `http://localhost:5173/`。
6. 在 Authentication 啟用 Email／密碼及 Email 驗證；密碼最小長度設為至少 8。要開放其他人註冊與收驗證／重設密碼信，請設定可寄給一般使用者的 **Custom SMTP**，Supabase 預設寄信服務限制收件者與寄信量，僅適合測試。
7. 推送程式到 `main` 後由 GitHub Actions 執行測試、建置及部署。只有一個雲端變數或網址格式錯誤時會顯示設定錯誤，避免誤以為正在同步。

現有館藏不會自動歸給第一個登入的人。請先在原本使用的瀏覽器匯出備份，再登入正確帳號，確認搬移區顯示的圖書數、地點數與目標 Email，按「確認這是我的資料，搬入此帳號」。本機資料會保留，搬移僅允許空白的雲端館藏，避免覆寫既有資料。如果原本的資料在本機開發網址或另一個瀏覽器，先匯出 JSON，再於正式網站的空白帳號選擇該備份。

驗收請建立 A、B 兩個帳號：A 在電腦新增地點與圖書，在手機登入 A 應讀到相同內容；B 應為獨立館藏。兩個裝置同時編輯同一帳號時，先儲存的一方成功，後儲存的一方應收到版本衝突提示。另測試驗證信、忘記密碼及登出後不再顯示前個帳號的資料。

自動測試包含本機 PostgreSQL（PGlite）的真實 SQL 權限檢查、跨帳號讀寫隔離與版本觸發器；不需要連線到正式 Supabase。正式環境的寄信、登入回跳與跨裝置流程仍需上述專案設定後實測。

參考：[Vue 與 Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-vue-3)、[RLS 權限](https://supabase.com/docs/guides/database/postgres/row-level-security)、[Email 寄信設定](https://supabase.com/docs/guides/auth/auth-smtp)。

## 程式結構

`src/App.vue` 負責登入門檻與帳號切換時重建主應用，頁面組裝放在 `src/app/app.vue`。每個新元件各有自己的資料夾，例如：

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

`src/collection-register-standalone/` 集中存放舊版獨立登記工具：`collection-register-standalone.html` 負責畫面結構，`collection-register-standalone.js` 包含儲存、圖書列操作、地點選單、拖曳排序、複製與復原，`collection-register-standalone.css` 為樣式來源，`icons/` 存放所需 SVG 圖示。HTML 以一般 script 載入 JS，可直接開啟 HTML；搬移或分享時請保留整個資料夾。可用 `npm run build:standalone` 重新編譯樣式並嵌入 HTML。新版圖書管理請使用 Vite 網站。
