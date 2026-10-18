import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import * as h3 from 'h3'
import { computed, reactive, ref, watch } from 'vue'
import { createPinia, defineStore, setActivePinia } from 'pinia'

let instance = 0
async function load(path) {
  let source = (await readFile(new URL('../' + path, import.meta.url), 'utf8')).replaceAll('import.meta.client', 'false')
  if (path.endsWith('.vue')) source = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64') + '#' + (++instance))
}
Object.assign(globalThis, h3, { computed, reactive, ref, watch, defineStore, toBackendImageUrl: value => value ?? '' })
Object.assign(globalThis, await load('app/utils/api-error.ts'), await load('app/composables/useResourceRefresh.ts'))
const tick = () => new Promise(resolve => setImmediate(resolve))
function deferred() { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }

test('catalog list and detail preserve purchase eligibility and price_from', async () => {
  const { mapProductListResponse } = await load('server/utils/productList.ts')
  const { mapProductDetail } = await load('server/utils/productDetail.ts')
  const raw = { id: 'p', name: 'Product', slug: 'p', price_from: 125, stock: 10, is_purchasable: false }
  const product = mapProductListResponse({ items: [raw], total: 1, page: 1, limit: 20 }).items[0]
  assert.equal(product.price.final, 125)
  assert.equal(product.basePrice, 125)
  assert.equal(product.isPurchasable, false)
  assert.equal(mapProductDetail(raw).isPurchasable, false)
})

test('concurrent shipping location callers both await the shared response', async () => {
  setActivePinia(createPinia())
  const gate = deferred()
  let calls = 0
  globalThis.useApi = () => ({ get: () => { calls++; return gate.promise } })
  const { useShippingLocationsStore } = await load('app/stores/shippingLocations.store.ts')
  const store = useShippingLocationsStore()
  const first = store.fetchAll()
  let secondFinished = false
  const second = Promise.resolve(store.fetchAll()).then(() => { secondFinished = true })
  await tick()
  assert.equal(secondFinished, false)
  gate.resolve([{ id: 'province', cities: [] }])
  await Promise.all([first, second])
  assert.equal(calls, 1)
  assert.equal(store.provinces[0].id, 'province')
})

test('changing inbox page does not discard an independent notification preview', async () => {
  setActivePinia(createPinia())
  globalThis.useAuthStore = () => reactive({ isAuthenticated: true, sessionScope: 'a' })
  const gate = deferred()
  globalThis.useApi = () => ({ get: path => path.endsWith('limit=3') ? gate.promise : Promise.resolve({ items: [{ id: 'inbox' }], total: 40, page: 2, limit: 20 }) })
  const { useNotificationStore } = await load('app/stores/notification.store.ts')
  const store = useNotificationStore()
  const preview = store.fetchLatest()
  await tick()
  await store.fetchAll(2)
  gate.resolve({ items: [{ id: 'preview', created_at: '2026-10-18T00:00:00Z' }] })
  await preview
  assert.equal(store.latest[0]?.id, 'preview')
  assert.equal(store.items[0].id, 'inbox')
})

test('a comment submission completing after account change cannot repopulate private pending comments', async () => {
  setActivePinia(createPinia())
  const auth = reactive({ isAuthenticated: true, sessionScope: 'a', user: { id: 'a', name: 'Alice' } })
  globalThis.useAuthStore = () => auth
  const gate = deferred()
  globalThis.useApi = () => ({ post: () => gate.promise })
  globalThis.useAppToast = () => ({ success() {}, error() {} })
  const { useCommentStore } = await load('app/stores/comment.store.ts')
  const store = useCommentStore()
  const pending = store.submitComment('product', 'p', 'Private pending text')
  auth.sessionScope = 'b'
  auth.user = { id: 'b', name: 'Bob' }
  await tick()
  gate.resolve({ id: 'c', body: 'Private pending text', created_at: 1792310400, is_confirmed: false })
  assert.equal(await pending, false)
  assert.deepEqual(store.pendingByTarget, {})
})

test('shipping endpoints never make upstream errors publicly cacheable', async () => {
  for (const path of ['shipping/locations.get.ts', 'shipping/methods.get.ts']) {
    const handler = (await load('server/api/' + path)).default
    globalThis.backendFetch = async () => { throw h3.createError({ statusCode: 503, message: 'Unavailable' }) }
    const app = h3.createApp({ onError() {} }).use(handler)
    const response = await h3.toWebHandler(app)(new Request('http://shop.test/api/shipping'))
    assert.equal(response.status, 503)
    assert.equal(response.headers.get('cache-control'), 'no-store', path)
  }
})

test('blog and story list page revisits refresh successful caches while store calls can still reuse them', async () => {
  Object.assign(globalThis, { callOnce: (_key, run) => run(), usePageResponse: () => () => {}, usePageSeo() {}, onMounted() {} })
  for (const [storePath, name, action, pagePath] of [
    ['app/stores/blog.store.ts', 'useBlogStore', 'fetchPosts', 'app/pages/blog/index.vue'],
    ['app/stores/story.store.ts', 'useStoryStore', 'fetchStories', 'app/pages/stories/index.vue'],
  ]) {
    setActivePinia(createPinia())
    let revision = 1, reads = 0
    globalThis.useApi = () => ({ get: async () => { reads++; return { items: [{ id: String(revision) }] } } })
    const store = (await load(storePath))[name]()
    globalThis[name] = () => store
    await load(pagePath)
    revision = 2
    await store[action]()
    assert.equal(reads, 1, 'Child consumers can reuse the current snapshot')
    await load(pagePath)
    assert.equal(reads, 2, 'Revisiting the collection refreshes its snapshot')
    assert.equal(store.items[0].id, '2')
  }
})
