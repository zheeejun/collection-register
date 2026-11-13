import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const modules = new Map()

/** Load dependency-free TypeScript logic in Node without adding a test runner. */
export async function loadTypeScript(url) {
  if (modules.has(url.href)) return modules.get(url.href)
  const source = await readFile(url, 'utf8')
  let compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  for (const match of [...compiled.matchAll(/from\s+['"]([^'"]+)['"]/g)]) {
    const specifier = match[1]
    const dependency = specifier.startsWith('.')
      ? await loadTypeScript(new URL(specifier + '.ts', url))
      : import.meta.resolve(specifier)
    compiled = compiled.replace(match[0], `from '${dependency}'`)
  }
  const result = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
  modules.set(url.href, result)
  return result
}
