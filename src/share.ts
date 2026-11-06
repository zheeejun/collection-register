import type { Row } from './types'

const MAX_LINK_LENGTH = 64000
const MAX_CONTENT_BYTES = 4_000_000
const PREFIX = '#share='

export interface SharedCollection {
  rows: Row[]
  createdAt: string
}

function validate(value: unknown): SharedCollection {
  const data = value as { version?: unknown; rows?: unknown; createdAt?: unknown } | null
  if (data?.version !== 1 || !Array.isArray(data.rows) || !data.rows.length || data.rows.length > 1500
    || typeof data.createdAt !== 'string' || !Number.isFinite(Date.parse(data.createdAt))) {
    throw new Error('分享連結的資料格式不正確')
  }
  const rows = data.rows.map((row: unknown, index: number): Row => {
    if (!Array.isArray(row) || row.length !== 3
      || !row.every((field) => typeof field === 'string')
      || row[0].length > 300 || row[1].length > 200 || row[2].length > 100) {
      throw new Error('分享連結的館藏欄位不正確')
    }
    return { id: `shared-${index}`, title: row[0], loc: row[1], sn: row[2] }
  })
  return { rows, createdAt: data.createdAt }
}

async function readBounded(stream: ReadableStream<Uint8Array>, limit: number) {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      length += value.length
      if (length > limit) {
        await reader.cancel()
        throw new Error('分享資料過大，請減少館藏筆數後再試')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return bytes
}

function isPublicUrl(url: URL) {
  const host = url.hostname.toLowerCase()
  return url.protocol === 'https:' && host.includes('.')
    && !host.endsWith('.localhost') && !host.endsWith('.local')
    && !/^(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host)
}

export async function createShareUrl(rows: Row[], baseUrl: string) {
  const url = new URL(baseUrl)
  if (!isPublicUrl(url)) throw new Error('網站尚未部署，暫時無法產生公開網址')
  const selected = rows.filter(row => row.title || row.loc || row.sn)
  if (!selected.length) throw new Error('請先輸入館藏資料再分享')
  const data = { version: 1, createdAt: new Date().toISOString(), rows: selected.map(row => [row.title, row.loc, row.sn]) }
  validate(data)
  const content = new TextEncoder().encode(JSON.stringify(data))
  if (content.length > MAX_CONTENT_BYTES) throw new Error('分享資料過大，請減少館藏筆數後再試')
  const compressed = await readBounded(new Blob([content]).stream().pipeThrough(new CompressionStream('gzip')), MAX_LINK_LENGTH)
  let binary = ''
  for (const byte of compressed) binary += String.fromCharCode(byte)
  const encoded = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
  url.search = ''
  url.username = ''
  url.password = ''
  url.hash = PREFIX + encoded
  if (url.href.length > MAX_LINK_LENGTH) throw new Error('分享網址過長，請減少館藏筆數後再試')
  return url.href
}

export async function readShareHash(hash: string): Promise<SharedCollection> {
  if (!hash.startsWith(PREFIX) || hash.length > MAX_LINK_LENGTH) throw new Error('分享連結不正確或資料過大')
  const encoded = hash.slice(PREFIX.length)
  if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('分享連結不完整')
  try {
    const binary = atob(encoded.replaceAll('-', '+').replaceAll('_', '/'))
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
    const content = await readBounded(stream, MAX_CONTENT_BYTES)
    return validate(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(content)))
  } catch {
    throw new Error('無法讀取分享資料，連結可能不完整或已損壞')
  }
}
