import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { loadTypeScript } from './load-typescript.mjs'

const { createCloudLibrary, LibraryConflictError } = await import(await loadTypeScript(new URL('../src/services/cloud-library.ts', import.meta.url)))
const { parseLibraryData } = await import(await loadTypeScript(new URL('../src/services/library-backup.ts', import.meta.url)))
const migration = await readFile(new URL('../supabase/migrations/202611190001_libraries.sql', import.meta.url), 'utf8')
const accountA = '00000000-0000-4000-8000-000000000001'
const accountB = '00000000-0000-4000-8000-000000000002'
const empty = () => ({ version: 1, books: [], locations: [] })
const collection = () => ({
  version: 1,
  books: [{ id: 'book', title: '跨裝置閱讀', author: '', sn: '001', locationId: 'home', status: 'available', reservedOn: '', borrowedOn: '', dueOn: '', notes: '' }],
  locations: [{ id: 'home', name: '家中', address: '', floor: '', shelf: '', notes: '' }],
})

test('backup validation rejects invalid snapshots without discarding valid book fields', () => {
  const valid = collection()
  assert.deepEqual(parseLibraryData(valid), valid)
  valid.books[0].locationId = '' // Legacy books may have no assigned location.
  assert.deepEqual(parseLibraryData(valid), valid)
  for (const broken of [null, { ...empty(), version: 2 }, { ...empty(), books: [{}] }, { ...collection(), locations: [] }]) {
    assert.throws(() => parseLibraryData(broken), /資料格式不正確/)
  }
  const duplicate = collection()
  duplicate.books.push({ ...duplicate.books[0] })
  assert.throws(() => parseLibraryData(duplicate), /資料格式不正確/)
})

test('real PostgreSQL enforces account isolation, server-owned revisions and stale-write protection', async t => {
  const db = new PGlite()
  t.after(() => db.close())
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    insert into auth.users values ('${accountA}'), ('${accountB}');
  `)
  await db.exec(migration)
  await db.exec('set role anon')
  await assert.rejects(db.query('select * from public.libraries'), /permission denied/)
  await assert.rejects(db.query('insert into public.libraries (user_id, data) values ($1, $2)', [accountA, empty()]), /permission denied/)

  await db.exec('reset role; set role authenticated')
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [accountA])
  await assert.rejects(db.query('insert into public.libraries (user_id, data) values ($1, $2)', [accountB, empty()]), /row-level security/)
  await db.query('insert into public.libraries (user_id, data) values ($1, $2)', [accountA, collection()])
  assert.equal((await db.query('select revision from public.libraries')).rows[0].revision, 1)
  await assert.rejects(db.query('update public.libraries set revision = 99'), /permission denied/)
  await assert.rejects(db.query('update public.libraries set user_id = $1', [accountB]), /permission denied/)
  await assert.rejects(db.query('delete from public.libraries'), /permission denied/)
  await assert.rejects(db.query('update public.libraries set data = $1', [{ version: 1, books: [] }]), /check constraint/)

  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [accountB])
  assert.deepEqual((await db.query('select * from public.libraries')).rows, [])
  assert.equal((await db.query('update public.libraries set data = $1 where user_id = $2 returning revision', [empty(), accountA])).rows.length, 0)
  await db.query('insert into public.libraries (user_id, data) values ($1, $2)', [accountB, empty()])
  assert.equal((await db.query('select user_id from public.libraries')).rows[0].user_id, accountB)

  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [accountA])
  const updated = await db.query('update public.libraries set data = $1 where user_id = $2 and revision = $3 returning revision', [collection(), accountA, 1])
  assert.equal(updated.rows[0].revision, 2)
  const stale = await db.query('update public.libraries set data = $1 where user_id = $2 and revision = $3 returning revision', [empty(), accountA, 1])
  assert.equal(stale.rows.length, 0)
  assert.equal((await db.query('select data from public.libraries')).rows[0].data.books.length, 1)
})

// A PostgREST-shaped adapter exercises the repository's device-local revisions.
function memoryClient() {
  const rows = new Map()
  let failNext = false
  return {
    rows,
    failNext() { failNext = true },
    from(table) {
      assert.equal(table, 'libraries')
      let action = 'read'
      let payload
      const filters = {}
      const query = {
        select() { return query },
        eq(key, value) { filters[key] = value; return query },
        insert(value) { action = 'insert'; payload = value; return query },
        update(value) { action = 'update'; payload = value; return query },
        async maybeSingle() {
          if (failNext) { failNext = false; return { data: null, error: { code: 'NETWORK' } } }
          const id = payload?.user_id ?? filters.user_id
          const row = rows.get(id)
          if (action === 'read') return { data: row ? structuredClone(row) : null, error: null }
          if (action === 'insert' && row) return { data: null, error: { code: '23505' } }
          if (action === 'update' && (!row || row.revision !== filters.revision)) return { data: null, error: null }
          const next = { data: structuredClone(payload.data), revision: (row?.revision ?? 0) + 1 }
          rows.set(id, next)
          return { data: { revision: next.revision }, error: null }
        },
      }
      return query
    },
  }
}

test('two devices cannot overwrite each other; reloading and retrying uses latest revision', async () => {
  const client = memoryClient()
  const first = createCloudLibrary(client, accountA)
  const second = createCloudLibrary(client, accountA)
  await assert.rejects(first.save(empty()), /先讀取/)
  assert.deepEqual(await first.load(), empty())
  await second.load()
  await first.save(collection())
  await assert.rejects(second.save(empty()), LibraryConflictError)
  assert.deepEqual(await second.load(), collection())
  await first.load()
  await first.save(empty())
  await assert.rejects(second.save(collection()), LibraryConflictError)
  await second.load()
  await second.save(collection())
  assert.deepEqual(await first.load(), collection())
  assert.deepEqual(await createCloudLibrary(client, accountB).load(), empty())
})

test('network errors retain the saved version and permit a safe retry', async () => {
  const client = memoryClient()
  const repository = createCloudLibrary(client, accountA)
  await repository.load()
  client.failNext()
  await assert.rejects(repository.save(collection()), /雲端儲存失敗/)
  assert.equal(client.rows.size, 0)
  await repository.save(collection())
  client.failNext()
  await assert.rejects(repository.load(), /無法讀取雲端/)
  assert.deepEqual(await repository.load(), collection())
})
