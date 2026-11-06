import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { build } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const htmlPath = new URL('../src/collection-register-standalone.html', import.meta.url)
const html = await readFile(htmlPath, 'utf8')
const stylePattern = /<style id="standalone-tailwind">[\s\S]*?<\/style>/
if (!stylePattern.test(html)) throw new Error('Missing standalone Tailwind style block')

const result = await build({
  configFile: false,
  root,
  plugins: [tailwindcss()],
  build: {
    write: false,
    rollupOptions: {
      input: fileURLToPath(new URL('../src/collection-register-standalone.css', import.meta.url)),
    },
  },
})
const outputs = Array.isArray(result) ? result : [result]
const css = outputs.flatMap(output => output.output)
  .filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css'))
  .map(asset => asset.source)
  .join('\n')
if (!css) throw new Error('No standalone CSS was generated')

await writeFile(htmlPath, html.replace(stylePattern, () => `<style id="standalone-tailwind">\n${css}\n</style>`))
console.log('Embedded Tailwind CSS in collection-register-standalone.html')
