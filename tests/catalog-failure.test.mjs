import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import * as h3 from 'h3'
import { createFetch } from 'ofetch'
import { ref, computed } from 'vue'
import { defineStore, createPinia, setActivePinia } from 'pinia'

async function load(path) {
  const source = (await readFile(new URL('../' + path, import.meta.url), 'utf8'))
    .replace(/^import .* from ['"]\.\/.*['"]\n/gm, '')
    .replaceAll('import.meta.server', 'false').replaceAll('import.meta.client', 'true')
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
}
Object.assign(globalThis, h3, { ref, computed, defineStore })
Object.assign(globalThis, await load('shared/utils/requestDeadline.ts'), await load('app/utils/api-error.ts'))
Object.assign(globalThis, await load('server/utils/productRequest.ts'), await load('server/utils/productList.ts'))
globalThis.toBackendImageUrl = value => value ?? ''
const proxies = await Promise.all(['products/list', 'products/filters', 'discounts/products'].map(async path => [path, (await load('server/api/' + path + '.post.ts')).default]))
const backend = (await load('server/utils/backendFetch.ts')).backendFetch
const { useApi } = await load('app/composables/useApi.ts')
const { useProductListStore } = await load('app/stores/productList.store.ts')
const tick = () => new Promise(resolve => setImmediate(resolve))
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
const response = (id = 'product', page = 1) => ({ items: [{ id }], total: 3, page, limit: 1 })
const params = (kind = 'catalog') => ({ context: { collection: { kind }, categoryIds: ['parent'], discountId: 'campaign' }, request: { brandIds: ['brand'], attributeFields: { size: ['large'] }, page: 1, limit: 1, search: 'applied' }, sort: 'relevant' })

async function request(handler, raw) {
  const app = h3.createApp().use(handler)
  return h3.toWebHandler(app)(new Request('http://shop.test/api', { method: 'POST', headers: { 'content-type': 'application/json' }, ...(raw === undefined ? {} : { body: raw }) }))
}

test('catalog proxies reject missing, primitive, array, malformed JSON and invalid facets with 400 before calling upstream', async () => {
  let upstream = 0
  globalThis.backendFetch = async () => { upstream++; return {} }
  const invalid = [undefined, '', 'null', '[]', '"text"', '{bad', '{"categoryIds":"category"}', '{"brandIds":[null]}', '{"page":0}', '{"limit":1.5}', '{"priceMin":-1}', '{"priceMin":20,"priceMax":10}', '{"search":{}}', '{"discountId":true}', '{"sortDir":"sideways"}', '{"attributeFields":{"size":"large"}}']
  for (const [path, handler] of proxies) {
    for (const body of invalid) assert.equal((await request(handler, body)).status, 400, path + ': ' + body)
  }
  for (const collection of [undefined, {}, { kind: 'other' }, { kind: ['catalog'] }]) {
    assert.equal((await request(proxies[1][1], JSON.stringify({ collection }))).status, 400)
  }
  assert.equal(upstream, 0)
})

test('valid empty catalog request is distinct from no body; scoped filters and pagination forward correctly', async () => {
  const calls = []
  globalThis.backendFetch = async (path, opts) => { calls.push({ path, body: opts.body }); return path.endsWith('filters') ? { attributes: [], brands: [], categories: [], min_price: 0, max_price: 0 } : { items: [], total: 0, page: 1, limit: 30 } }
  assert.equal((await request(proxies[0][1], '{}')).status, 200)
  assert.equal((await request(proxies[2][1], '{}')).status, 200)
  assert.equal((await request(proxies[1][1], '{"collection":{"kind":"discounted"},"categoryIds":["parent"],"discountId":"campaign","limit":20}')).status, 200)
  assert.equal(calls[2].body.discounted_only, true)
  assert.equal(calls[2].body.discount_id, 'campaign')
  assert.deepEqual(calls[2].body.category_ids, ['parent'])
  assert.throws(() => mapProductListResponse({ items: [], page: 0, total: 0, limit: 30 }), error => error.statusCode === 502)
})

function transport(fetcher) {
  let handled = 0, attempts = 0
  globalThis.useRuntimeConfig = () => ({ backendUrl: 'https://upstream.test', backendRequestTimeoutMs: 20, public: { apiRequestTimeoutMs: 30 } })
  globalThis.useAuthStore = () => ({ sessionRevision: 1, handleSessionError() { handled++ } })
  globalThis.resolveCredential = () => null
  globalThis.$fetch = createFetch({ fetch: (...args) => { attempts++; return fetcher(...args) } })
  return { api: useApi(), attempts: () => attempts, handled: () => handled }
}
const stalled = (_, { signal }) => new Promise((resolve, reject) => {
  if (signal.aborted) reject(signal.reason)
  else signal.addEventListener('abort', () => reject(signal.reason), { once: true })
})

test('real ofetch wrapper times out despite a caller signal; cancellation stays distinct and neither POST is replayed', async () => {
  const t = transport(stalled)
  const external = new AbortController()
  await assert.rejects(t.api.post('/checkout', { immutable: 'draft' }, { signal: external.signal }), error => error instanceof ApiError && error.kind === 'timeout')
  assert.equal(t.attempts(), 1)
  assert.equal(external.signal.aborted, false)
  const cancelled = t.api.post('/checkout', {}, { signal: external.signal })
  external.abort()
  const handledBefore = t.handled()
  await assert.rejects(cancelled, error => error.kind === 'cancelled')
  assert.equal(t.handled(), handledBefore)
  assert.equal(t.attempts(), 2)
})

test('upstream deadline becomes 504, offline upstream becomes 502, and timeout codes survive the Nuxt boundary', async () => {
  transport(stalled)
  await assert.rejects(backend('/products/list', { method: 'POST', body: {} }), error => error.statusCode === 504 && error.data.code === 'UPSTREAM_TIMEOUT')
  const t = transport(async () => { throw new TypeError('offline') })
  await assert.rejects(backend('/products/list', { method: 'POST', body: {} }), error => error.statusCode === 502)
  assert.equal(t.attempts(), 1)
  transport(async () => new Response(JSON.stringify({ data: { code: 'UPSTREAM_TIMEOUT' } }), { status: 504, headers: { 'content-type': 'application/json' } }))
  await assert.rejects(useApi().post('/products/list', {}), error => error.status === 504 && error.kind === 'timeout')
})

test('transport preserves authorization/validation/service statuses and does not retry reads or writes', async () => {
  for (const status of [400, 401, 403, 422, 503]) {
    const t = transport(async () => new Response(JSON.stringify({ data: { validationMessage: status === 422 ? 'Invalid selection' : undefined } }), { status, headers: { 'content-type': 'application/json' } }))
    await assert.rejects(t.api.post('/products/list', {}), error => error.status === status && error.kind === 'http' && (status !== 422 || error.message === 'Invalid selection'))
    assert.equal(t.attempts(), 1)
  }
})

test('deadline also settles a non-abortable in-process fetch and ignores its late completion', async () => {
  const late = deferred()
  const t = transport(() => late.promise)
  await assert.rejects(t.api.get('/products/list'), error => error.kind === 'timeout')
  late.resolve(new Response('{}', { headers: { 'content-type': 'application/json' } }))
  await tick()
  assert.equal(t.attempts(), 1)
})

test('failed replacement clears old products; retry uses captured context for both catalog collections', async () => {
  for (const kind of ['catalog', 'discounted']) {
    setActivePinia(createPinia())
    let fail = false
    const calls = []
    globalThis.useApi = () => ({ async post(path, body) { calls.push({ path, body }); if (fail) throw createTransportApiError(503); return response() } })
    const store = useProductListStore()
    const input = params(kind)
    await store.fetchList(input)
    fail = true
    assert.equal(await store.fetchList(input), false)
    assert.deepEqual(store.items, [])
    assert.equal(store.loaded, false)
    assert.ok(store.error)
    input.context.categoryIds[0] = 'unapplied-category'
    input.request.attributeFields.size[0] = 'unapplied-size'
    fail = false
    assert.equal(await store.retryList(), true)
    assert.equal(calls.at(-1).path, kind === 'discounted' ? '/discounts/products' : '/products/list')
    assert.deepEqual(calls.at(-1).body.categoryIds, ['parent'])
    assert.deepEqual(calls.at(-1).body.attributeFields, { size: ['large'] })
    assert.equal(store.error, '')
    assert.equal(store.loaded, true)
  }
})

test('failed append preserves only current-scope pages, stops automatic loading, retries the same page once', async () => {
  setActivePinia(createPinia())
  let fail = false
  const calls = []
  globalThis.useApi = () => ({ async post(path, body) { calls.push(body); if (fail) throw createTransportApiError(undefined, undefined, 'network'); return response('product-' + body.page, body.page) } })
  const store = useProductListStore()
  await store.fetchList(params())
  fail = true
  await store.loadMore()
  assert.deepEqual(store.items.map(item => item.id), ['product-1'])
  assert.equal(store.page, 1)
  assert.ok(store.error)
  const count = calls.length
  await store.loadMore()
  assert.equal(calls.length, count)
  fail = false
  await store.retryList()
  assert.equal(calls.at(-1).page, 2)
  assert.deepEqual(store.items.map(item => item.id), ['product-1', 'product-2'])
})

test('obsolete failures/abort cannot dirty a newer success; empty success remains distinguishable from error', async () => {
  setActivePinia(createPinia())
  const held = deferred(), signals = []
  let first = true
  globalThis.useApi = () => ({ async post(path, body, options) { signals.push(options.signal); if (first) { first = false; return held.promise } return { items: [], total: 0, page: 1, limit: 30 } } })
  const store = useProductListStore()
  const old = store.fetchList(params())
  await tick()
  await store.fetchList(params())
  assert.equal(signals[0].aborted, true)
  held.resolve(Promise.reject(createTransportApiError(503)))
  await old
  assert.equal(store.error, '')
  assert.equal(store.loaded, true)
  assert.equal(store.isLoading, false)
  assert.deepEqual(store.items, [])
  store.invalidateListRequests()
  assert.equal(store.loaded, false)
  assert.equal(await store.retryList(), false)
})
