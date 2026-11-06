# 圖書館藏

Vue 3 + TypeScript + Tailwind CSS 館藏登記工具。資料自動儲存在使用者的瀏覽器。

執行 `npm run dev` 開發、`npm run build` 建置正式版本。

「分享網址」會將目前有內容的館藏列壓縮成連結，開啟後顯示唯讀快照，之後的編輯不會同步。分享資料不會覆寫收件人的本機館藏。網址過長時會提示減少筆數。

若要從本機產生已部署網站的分享連結，在 `.env.local` 設定 `VITE_PUBLIC_SITE_URL=https://你的公開網站網址`。未設定時會使用目前網站網址；本機網址無法作為公開分享網址。

推送到 `main` 會由 GitHub Actions 部署到 https://zheeejun.github.io/collection-register/ （需先在 repo 的 Settings → Pages 將 Source 設為 GitHub Actions）。

獨立 HTML 的 Tailwind 樣式可用 `npm run build:standalone` 重新編譯。
