import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // 部署在子路徑（GitHub Pages）也能載入資源
  plugins: [vue(), tailwindcss()],
})
