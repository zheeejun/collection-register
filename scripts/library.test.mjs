import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/library.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { migrateLegacy, localDate, daysUntil, dueLabel } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('date labels handle overdue, today, month changes and leap years', () => {
  assert.equal(dueLabel('2026-11-12', '2026-11-13'), '逾期 1 天')
  assert.equal(dueLabel('2026-11-13', '2026-11-13'), '今天到期')
  assert.equal(dueLabel('2026-11-16', '2026-11-13'), '3 天後到期')
  assert.equal(daysUntil('2027-01-01', '2026-12-31'), 1)
  assert.equal(daysUntil('2028-03-01', '2028-02-28'), 2)
  assert.equal(dueLabel('', '2026-11-13'), '尚未設定到期日')
  assert.equal(localDate(new Date(2026, 0, 2, 0, 5)), '2026-01-02')
})

test('migration preserves books and serials and links deduplicated locations', () => {
  const original = { rows: [
    { id: 'old-1', title: '第一本書', loc: ' 總館 ', sn: '0001' },
    { id: 'old-2', title: '第二本書', loc: '總館', sn: '0002' },
    { title: '', loc: '', sn: '' },
  ], locs: ['總館', '分館', ' 分館 ', ''] }
  const data = migrateLegacy(JSON.stringify(original))
  assert.equal(data.books.length, 3)
  assert.deepEqual(data.locations.map(place => place.name), ['總館', '分館'])
  assert.equal(data.books[0].title, '第一本書')
  assert.equal(data.books[0].sn, '0001')
  assert.equal(data.books[0].locationId, data.books[1].locationId)
  assert.equal(data.books[2].locationId, '')
  assert.equal(new Set(data.books.map(book => book.id)).size, 3)
  assert.ok(data.books.every(book => book.status === 'available' && book.dueOn === ''))
  assert.equal(original.rows[0].loc, ' 總館 ')
})

test('migration handles first launch and refuses corrupted legacy data', () => {
  assert.deepEqual(migrateLegacy(null), { version: 1, books: [], locations: [] })
  assert.throws(() => migrateLegacy('{'))
  assert.throws(() => migrateLegacy('{"rows":false}'))
  const data = migrateLegacy('{"rows":[null,{"title":"保留館藏","loc":"新增分館"}]}')
  assert.equal(data.books.length, 1)
  assert.equal(data.locations[0].name, '新增分館')
})
