import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { ref, reactive, watch } from 'vue'
import * as h3 from 'h3'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source.replaceAll('import.meta.client', 'true'), {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}

Object.assign(globalThis, h3, { ref, watch, defineStore })
Object.assign(globalThis, await load('app/composables/useResourceRefresh.ts'))
Object.assign(globalThis, await load('app/utils/api-error.ts'))
const { useNotificationStore } = await load('app/stores/notification.store.ts')

test('notifications discard delayed private data and counts on logout', async () => {
  setActivePinia(createPinia())
  const auth = reactive({ isAuthenticated: true, identity: 'user', sessionScope: 'account' })
  let resolveList, resolveCounts
  globalThis.useAuthStore = () => auth
  globalThis.useApi = () => ({ get: path => new Promise(resolve => {
    if (path.startsWith('/notifications?')) resolveList = resolve
    else resolveCounts = resolve
  }) })
  const store = useNotificationStore()
  const reads = [store.fetchAll(), store.fetchCounts()]
  await new Promise(resolve => setImmediate(resolve))
  auth.isAuthenticated = false
  auth.sessionScope = null
  auth.identity = null
  resolveList({ items: [{ id: 'private' }], total: 1 })
  resolveCounts({ unread_total: 5, by_object_type: { order: 5 } })
  await Promise.all(reads)
  assert.deepEqual(store.items, [])
  assert.equal(store.counts.unread_total, 0)
  assert.equal(store.loading, false)
  assert.equal(store.countsLoading, false)
})

test('notification endpoints reject guests and forward authenticated reads without caching', async () => {
  globalThis.resolveCredential = (event, mode) => mode === 'user' && h3.getCookie(event, 'auth_token') ? { token: 'user' } : null
  Object.assign(globalThis, await load('server/utils/notificationRequest.ts'))
  const list = (await load('server/api/notifications/index.get.ts')).default
  const counts = (await load('server/api/notifications/counts.get.ts')).default
  const calls = []
  globalThis.backendFetch = async (path, options) => { calls.push([path, options.authorization]); return {} }
  async function request(handler, cookie) {
    const app = h3.createApp({ onError() {} }).use(handler)
    return h3.toWebHandler(app)(new Request('http://shop.test/api/notifications', { headers: { cookie } }))
  }
  assert.equal((await request(list, 'guest_token=guest')).status, 401)
  assert.equal((await request(counts, 'guest_token=guest')).status, 401)
  assert.equal(calls.length, 0)
  for (const handler of [list, counts]) {
    const response = await request(handler, 'auth_token=user')
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
  }
  assert.deepEqual(calls, [['/notifications?page=1&limit=20', 'user'], ['/notifications/counts', 'user']])
})

test('read actions use POST, preserve 204, and reject guests and invalid pagination', async () => {
  const read = (await load('server/api/notifications/[id]/read.post.ts')).default
  const all = (await load('server/api/notifications/read-all.post.ts')).default
  const list = (await load('server/api/notifications/index.get.ts')).default
  const calls = []
  globalThis.backendFetch = async (path, options) => { calls.push([path, options.method, options.authorization]) }
  async function request(handler, method, query = '', cookie = 'auth_token=user') {
    const app = h3.createApp({ onError() {} }).use(h3.defineEventHandler(event => {
      event.context.params = { id: 'notification/1' }
      return handler(event)
    }))
    return h3.toWebHandler(app)(new Request('http://shop.test/api/notifications' + query, { method, headers: { cookie } }))
  }
  for (const handler of [read, all]) {
    assert.equal((await request(handler, 'POST', '', 'guest_token=guest')).status, 401)
    const response = await request(handler, 'POST')
    assert.equal(response.status, 204)
    assert.equal(await response.text(), '')
  }
  assert.deepEqual(calls, [['/notifications/notification%2F1/read', 'POST', 'user'], ['/notifications/read-all', 'POST', 'user']])
  for (const query of ['?page=0', '?page=1.5', '?limit=101', '?limit=0']) {
    assert.equal((await request(list, 'GET', query)).status, 400)
  }
  assert.equal(calls.length, 2)
})

test('read mutations handle null and empty read_at, update badge, and retain state on failure', async () => {
  setActivePinia(createPinia())
  globalThis.useAuthStore = () => reactive({ isAuthenticated: true, identity: 'user', sessionScope: 'account' })
  const posts = []
  let fail = false
  globalThis.useApi = () => ({
    get: async () => ({ unread_total: 1, by_object_type: { order: 1 } }),
    post: async path => { if (fail) throw new Error('offline'); posts.push(path) },
  })
  const store = useNotificationStore()
  store.items = [{ id: 'a', object_type: 'order', read_at: null }, { id: 'b', object_type: 'order', read_at: '' }]
  store.counts = { unread_total: 2, by_object_type: { order: 2 } }
  await store.markRead('a')
  assert.ok(store.items[0].read_at)
  assert.equal(store.items[1].read_at, '')
  assert.equal(store.counts.unread_total, 1)
  fail = true
  await assert.rejects(store.markRead('b'))
  assert.equal(store.items[1].read_at, '')
  fail = false
  await store.markRead()
  assert.ok(store.items.every(item => item.read_at))
  assert.deepEqual(posts, ['/notifications/a/read', '/notifications/read-all'])
})

test('latest preview fetches three records without replacing the paginated inbox', async () => {
  setActivePinia(createPinia())
  const auth = reactive({ isAuthenticated: true, identity: 'user', sessionScope: 'account' })
  globalThis.useAuthStore = () => auth
  const paths = []
  globalThis.useApi = () => ({ get: async path => {
    paths.push(path)
    if (path === '/notifications?page=1&limit=3') return { items: [
      { id: 'older', created_at: '2026-10-01T00:00:00Z', read_at: null },
      { id: 'newest', created_at: '2026-10-08T00:00:00Z', read_at: '' },
      { id: 'middle', created_at: '2026-10-05T00:00:00Z', read_at: null },
    ], total: 45, page: 1, limit: 3 }
    return { items: [{ id: 'inbox' }], total: 45, page: 2, limit: 20 }
  } })
  const store = useNotificationStore()
  await store.fetchAll(2)
  await store.fetchLatest()
  assert.deepEqual(paths, ['/notifications?page=2&limit=20', '/notifications?page=1&limit=3'])
  assert.deepEqual(store.latest.map(item => item.id), ['newest', 'middle', 'older'])
  assert.equal(store.page, 2)
  assert.equal(store.limit, 20)
  assert.equal(store.items[0].id, 'inbox')
  auth.isAuthenticated = false
  auth.sessionScope = null
  auth.identity = null
  assert.deepEqual(store.latest, [])
})
