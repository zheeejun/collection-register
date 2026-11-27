# 閱讀之間｜圖書管理

「閱讀之間」是以 Vue 3、TypeScript 與 Tailwind CSS 開發的個人圖書管理網站，用來整理館藏、追蹤預約與借還書，並記錄圖書所在的分館、樓層與書架位置。支援瀏覽器本機儲存，也可串接 Supabase，透過帳號在不同裝置管理同一份個人館藏。

網站部署網址：[閱讀之間](https://zheeejun.github.io/collection-register/)。

## 主要功能

- 全部圖書：書名、作者、索書號、館藏地點與閱讀狀態。
- 已預約清單：記錄預約日期，可登記借出。
- 已借書與到期日：記錄借書日與到期日，依到期日排序，標示今天到期、三天內到期與逾期，可標記歸還。
- 新借書的借期為 28 天，到期日自動計算。借閱清單可勾選「有人預約」並儲存，勾選後不能續借；無人預約時最多續借一次，從原到期日延長 28 天。歸還後重新借出會重設續借次數。舊紀錄保留原到期日，缺少的新欄位預設為無人預約、尚未續借。
- 實際館藏地點：新增、編輯及刪除地點，記錄地址、樓層、書架與備註。已被圖書使用的地點不能刪除。
- 搜尋與篩選：依書名、作者、索書號、地點名稱或備註搜尋，並依地點與借閱到期狀態篩選。
- 分享與備份：分享目前篩選結果的唯讀清單，或匯出包含完整圖書與地點資料的 JSON 備份。

## 技術組成

| 項目 | 使用技術 |
| --- | --- |
| 前端介面 | Vue 3、TypeScript |
| 樣式 | Tailwind CSS 4、元件 scoped CSS |
| 開發與建置 | Vite、vue-tsc |
| 本機資料 | IndexedDB；舊版資料來源為 localStorage |
| 雲端服務 | Supabase Auth、PostgreSQL、Row Level Security（RLS） |
| 自動測試 | Node.js test runner、PGlite |
| 部署 | GitHub Actions、GitHub Pages |

## 快速開始

建議使用 Node.js 22 與 npm，與目前 GitHub Actions 環境一致。

```powershell
cd C:\Users\jessie.lin\collection-register
npm ci
npm run dev
```

開啟終端機顯示的開發網址，依下列流程開始使用：

1. 進入「實際館藏地點」，新增至少一個地點。
2. 回到「全部圖書」新增圖書，填入書名並選擇地點。
3. 依需求設定預約或登記借出，再於「已借書與到期日」管理續借及歸還。
4. 使用搜尋與篩選整理清單，按「分享目前清單」或「匯出備份」保存需要的內容。

未設定 Supabase 時使用本機模式；若現有 `.env.local` 已包含 Supabase 設定，啟動後會使用雲端模式。

### 可用指令

| 指令 | 用途 |
| --- | --- |
| `npm ci` | 依 lockfile 安裝依賴套件。 |
| `npm run dev` | 啟動 Vite 開發伺服器。 |
| `npm test` | 執行資料邏輯、元件、雲端資料與帳號驗證相關測試。 |
| `npm run build` | 執行 TypeScript 檢查並建置網站，輸出至 `dist/`。 |
| `npm run preview` | 在本機預覽已建置的網站。 |
| `npm run build:standalone` | 重新產生舊版獨立登記工具的 CSS。 |

### 環境變數

本機設定放在 `.env.local`，欄位可參考 [`.env.example`](.env.example)。修改後需重新啟動開發伺服器；正式網站需重新建置與部署。

| 變數 | 用途 |
| --- | --- |
| `VITE_PUBLIC_SITE_URL` | 分享連結使用的公開 HTTPS 網址，本機開發時可指向正式網站。 |
| `VITE_SUPABASE_URL` | Supabase 專案網址，須與公開金鑰一起設定。 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Publishable key，亦支援舊版 anon key。 |

只使用本機模式時，請同時省略或留空兩個 Supabase 變數，不要直接沿用範例中的佔位值。只設定其中一個或網址格式不正確時，網站會顯示設定錯誤。

## 資料儲存與分享

設定 Supabase 後，每位使用者可用 Email／密碼註冊登入，管理自己獨立的雲端館藏。在其他裝置登入同一帳號即可讀取已儲存的內容。每次進入會讀取最新館藏；已開啟的其他裝置需按「重新讀取」更新清單，目前不提供即時推播或離線編輯。不同裝置同時修改時會阻擋過期版本儲存，保留表單並提示先重新讀取，避免覆寫他人的更新。

未設定 Supabase 時維持本機模式：資料保存在同一來源、同一瀏覽器的 IndexedDB 資料庫 `library-manager`，不會跨裝置同步。清除網站資料或使用無痕模式可能失去本機紀錄。兩種模式都可用「匯出備份」下載完整 JSON 資料。

首次開啟會將原本 `collection-register-vue-v1` localStorage 中的館藏與地點遷移到新資料庫，舊資料保留作為復原來源。舊館藏狀態為「館藏中」，沒有地點的舊資料會顯示「未指定地點」，編輯時需補選地點。新增圖書前，請先建立館藏地點。

儲存會等待資料庫交易完成才更新清單；若儲存失敗會顯示錯誤並保留表單內容。

既有 `#share=` 分享連結仍可開啟唯讀快照，不會讀取或覆寫收件人的本機資料庫。

「分享目前清單」會分享目前篩選結果中的書名、館藏地點名稱與索書號，分享內容為唯讀快照。從本機產生分享連結時，可在 `.env.local` 設定 `VITE_PUBLIC_SITE_URL` 為正式網站網址。

分享連結保留產生當下的內容，後續編輯不會更新既有連結。JSON 備份包含完整圖書與地點資料；分享連結不能取代完整備份。

## 設定帳號登入與跨裝置館藏

1. 在 [Supabase](https://supabase.com/dashboard) 建立專案。在 SQL Editor 執行 [`supabase/migrations/202611190001_libraries.sql`](supabase/migrations/202611190001_libraries.sql) 一次，建立館藏資料表、每人獨立的 RLS 權限與儲存版本檢查。
2. 在專案的 Connect／API Keys 找到 Project URL 與 **Publishable key**（舊版 anon key 也可）。不要使用 secret key 或 service_role key，也不要把資料庫密碼放進網站。
3. 本機開發：參照 `.env.example`，在既有 `.env.local` 加入 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`，保留原本的網站網址設定，再重啟 `npm run dev`。
4. 正式網站：GitHub Actions 已設定此專案的 Supabase 網址與公開金鑰。若要切換專案，可在 GitHub repository → Settings → Secrets and variables → Actions → **Variables** 加入 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`，覆寫預設值。它們會公開在前端程式中，資料隔離由 RLS 與使用者的登入憑證負責。修改設定後必須重新執行部署才會生效。
5. 在 Supabase Authentication → URL Configuration 將 Site URL 設為 `https://zheeejun.github.io/collection-register/`，並在 Redirect URLs 加入相同網址。本機測試再加入實際使用的開發網址，例如 `http://localhost:5173/`。
6. 在 Authentication 啟用 Email／密碼及 Email 驗證；密碼最小長度設為至少 8。要開放其他人註冊與收驗證／重設密碼信，請設定可寄給一般使用者的 **Custom SMTP**，Supabase 預設寄信服務限制收件者與寄信量，僅適合測試。
7. 推送程式到 `main` 後由 GitHub Actions 執行測試、建置及部署。只有一個雲端變數或網址格式錯誤時會顯示設定錯誤，避免誤以為正在同步。

現有館藏不會自動歸給第一個登入的人。請先在原本使用的瀏覽器匯出備份，再登入正確帳號，確認搬移區顯示的圖書數、地點數與目標 Email，按「確認這是我的資料，搬入此帳號」。本機資料會保留，搬移僅允許空白的雲端館藏，避免覆寫既有資料。如果原本的資料在本機開發網址或另一個瀏覽器，先匯出 JSON，再於正式網站的空白帳號選擇該備份。

目前 JSON 匯入用於搬移至空白雲端帳號，不提供合併既有館藏，也不是本機模式的通用還原入口。

驗收請建立 A、B 兩個帳號：A 在電腦新增地點與圖書，在手機登入 A 應讀到相同內容；B 應為獨立館藏。兩個裝置同時編輯同一帳號時，先儲存的一方成功，後儲存的一方應收到版本衝突提示。另測試驗證信、忘記密碼及登出後不再顯示前個帳號的資料。

自動測試包含本機 PostgreSQL（PGlite）的真實 SQL 權限檢查、跨帳號讀寫隔離與版本觸發器；不需要連線到正式 Supabase。正式環境的寄信、登入回跳與跨裝置流程仍需上述專案設定後實測。

參考：[Vue 與 Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-vue-3)、[RLS 權限](https://supabase.com/docs/guides/database/postgres/row-level-security)、[Email 寄信設定](https://supabase.com/docs/guides/auth/auth-smtp)。

## 程式結構

`src/App.vue` 負責登入門檻、分享入口與帳號切換時重建主應用，頁面組裝放在 `src/app/app.vue`。多數功能元件依資料夾拆分畫面、邏輯、樣式與介面，部分較小或既有元件保留單檔結構：

```text
src/
  app/
    app.vue                 # 主畫面組裝
    app.ts                  # 組合各功能與元件
    app.css                 # 主畫面與共用視覺規則
    app.interface.ts        # 頁面介面
    app.navigation.ts       # 分頁與篩選狀態
  components/
    index.ts                # 功能元件 exports
    auth-panel/             # 登入、註冊與密碼重設
    book-form/
    location-form/
    book-table/
    location-list/
    library-sidebar/
    library-stats/
    records-panel/
    shared-collection/      # 唯讀分享畫面
    share-link-dialog/      # 分享連結對話框
  li-components/
    index.ts                # LiButton、LiForm、LiInput 等共用元件 exports
    li-form/                # 共用編輯表單外框、送出／取消與儲存狀態
    li-form-field/          # 欄位標籤與必填標記
    li-input/               # 文字、日期、Email、密碼輸入
    li-select/              # 單選下拉選單，選項由 slot 提供
    li-textarea/            # 多行文字
    li-checkbox/            # 布林值勾選與原生 input 屬性傳遞
    li-button/              # 共用按鈕
    li-icon-button/         # 圖示按鈕
    li-icons/               # Vue 圖示
    li-toast/               # 提示訊息
  composables/
    useAuth.ts              # 帳號驗證與登入狀態
    useLibraryStore.ts      # 資料讀取與儲存狀態
    useLibraryCatalog.ts    # 清單篩選與統計
    useLibraryEditor.ts     # 新增、編輯、借還書與刪除
    useLibrarySharing.ts    # 分享與匯出
  models/
    library.interface.ts    # 圖書與館藏地點資料型別
  services/
    library-db.ts           # IndexedDB 存取
    library-backup.ts       # JSON 備份格式驗證
    cloud-library.ts        # 雲端館藏讀寫與版本衝突處理
    supabase.ts             # Supabase 用戶端與設定檢查
  library.ts                # 日期、借閱規則與舊資料遷移
  share.ts                  # 分享資料驗證、壓縮與解碼
  collection-register-standalone/  # 舊版獨立登記工具
```

各元件透過 `<script lang="ts" src="./元件.ts">` 和 `<style scoped src="./元件.css">` 載入同資料夾檔案。表單使用本機草稿，送出後由應用層驗證並儲存，不直接修改館藏紀錄。原有的分享及舊版登記元件沿用原本結構。共用 `Li*` 元件位於 `src/li-components/`，透過 `src/li-components/index.ts` 匯出；`LiButton` 的樣式使用 template 中的 Tailwind classes。

共用表單控制項可從 `src/li-components/index.ts` 匯入，例如 `import { LiCheckbox, LiForm, LiInput } from '../../li-components'`。`LiInput`、`LiSelect`、`LiTextarea` 使用字串 `v-model`；`LiCheckbox` 使用布林值 `v-model`，並將 `disabled`、`required`、`name`、`id`、`aria-*` 等屬性傳給原生 input，`class` 與 `style` 則套用在外層 label。圖書與地點表單共用 `LiForm` 與 `LiFormField`，借閱規則與資料儲存仍由原有 composables 處理。

## 測試與驗收

```powershell
npm test
npm run build
```

自動測試涵蓋舊資料遷移、日期邊界、篩選、借還書、續借、地點保護、元件渲染、帳號驗證及雲端館藏。建置指令會先執行 TypeScript 檢查。正式服務的驗證信、登入回跳與跨裝置行為仍需依前述帳號設定流程人工驗收。

## 部署

推送到 `main` 或手動執行 [部署 workflow](.github/workflows/deploy.yml)，會由 GitHub Actions 安裝依賴、執行測試、建置並部署 `dist/` 到 [GitHub Pages 網站](https://zheeejun.github.io/collection-register/)。需先在 repository 的 Settings → Pages 將 Source 設為 GitHub Actions。

目前 workflow 內有 Supabase 網址與公開金鑰預設值；刪除 repository variables 會回到這些預設值。若要部署本機模式，需同步調整 workflow 中的雲端設定。更換部署網址時，也需更新 workflow 的 `VITE_PUBLIC_SITE_URL` 與 Supabase 登入回跳網址。

## 舊版獨立登記工具

`src/collection-register-standalone/` 集中存放舊版獨立登記工具：`collection-register-standalone.html` 負責畫面結構，`collection-register-standalone.js` 包含儲存、圖書列操作、地點選單、拖曳排序、複製與復原，`collection-register-standalone.css` 為樣式來源，`icons/` 存放所需 SVG 圖示。HTML 以一般 script 載入 JS，可直接開啟 HTML；搬移或分享時請保留整個資料夾，以及 HTML 引用的共用 JavaScript 檔案與相對路徑。直接開啟時使用 `collection-register-v1` localStorage，與新版館藏的資料來源不同。新版圖書管理請使用 Vite 網站。

獨立版的共用控制項樣式位於 `src/li-components/li-*/li-*.standalone.css`，由 `collection-register-standalone.css` 匯入。修改樣式來源或 HTML／JS 中的 Tailwind classes 後，執行 `npm run build:standalone`，產生 `collection-register-standalone.generated.css`，由 HTML 以外部樣式檔載入。Vue 元件則使用各自的 Tailwind classes 與 scoped styles。

目前獨立版 HTML 引用同層的 `li-button.js`，但來源檔位於 `src/li-components/li-button/li-button.js`。直接使用獨立版前，需將該檔案複製至 HTML 同層，或調整 script 路徑；`build:standalone` 只產生 CSS，不會複製 JavaScript。
