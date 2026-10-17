import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import * as h3 from 'h3'
import { ref, computed } from 'vue'
import { defineStore, createPinia, setActivePinia } from 'pinia'

async function load(path) {
  const source = (await readFile(new URL('../' + path, import.meta.url), 'utf8'))
    .replaceAll('import.meta.client', 'false')
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
}

Object.assign(globalThis, h3, { ref, computed, defineStore })
for (const path of ['server/utils/productRequest.ts', 'server/utils/productList.ts', 'server/utils/productDetail.ts', 'server/utils/blog.ts', 'server/utils/story.ts', 'app/utils/api-error.ts']) {
  Object.assign(globalThis, await load(path))
}
globalThis.toBackendImageUrl = value => value ?? ''
for (const resource of ['CartSession', 'WishlistSession', 'OrderUser', 'NotificationUser']) globalThis['require' + resource] = () => {}
globalThis.orderPath = () => '/orders/missing'

async function request(path, { method = 'GET', body, query = '' } = {}) {
  const handler = (await load('server/api/' + path + '.ts')).default
  const app = h3.createApp({ onError() {} }).use(h3.defineEventHandler(event => {
    event.context.params = { slug: 'missing', id: 'missing', orderId: 'missing' }
    return handler(event)
  }))
  return h3.toWebHandler(app)(new Request('http://shop.test/api' + query, {
    method, headers: { 'content-type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }))
}

test('bare empty product collections retain requested pagination and clear old list state', async () => {
  globalThis.backendFetch = async () => []
  for (const path of ['products/list.post', 'discounts/products.post']) {
    const res = await request(path, { method: 'POST', body: { page: 3, limit: 12 } })
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { items: [], total: 0, page: 3, limit: 12 })
  }
  setActivePinia(createPinia())
  globalThis.useApi = () => ({ post: async () => mapProductListResponse([]) })
  const { useProductListStore } = await load('app/stores/productList.store.ts')
  const store = useProductListStore()
  store.items = [{ id: 'old' }]
  await store.fetchList({ context: { collection: { kind: 'catalog' } }, request: {}, sort: 'relevant' })
  assert.deepEqual(store.items, [])
  assert.equal(store.total, 0)
  assert.equal(store.loaded, true)
  assert.equal(store.hasMore, false)
  assert.equal(store.error, '')
})

test('empty envelope collections normalize to usable items and pagination', async () => {
  globalThis.backendFetch = async () => []
  for (const [path, options, expected] of [
    ['blogs/index.get', {}, { items: [], total: 0, page: 1, limit: 20 }],
    ['orders/index.get', { query: '?page=4' }, { items: [], total: 0, page: 4, limit: 20 }],
    ['notifications/index.get', { query: '?page=2&limit=3' }, { items: [], total: 0, page: 2, limit: 3 }],
    ['booking/consultation-notice.get', {}, { items: [] }],
    ['booking/consultation-questions.get', {}, { items: [] }],
    ['products/filters.post', { method: 'POST', body: { limit: 12, collection: { kind: 'catalog' } } }, { attributes: [], brands: [], categories: [], priceRange: { min: 0, max: 0 }, total: 0, page: 1, limit: 12 }],
    ['notifications/counts.get', {}, { by_object_type: {}, unread_total: 0 }],
  ]) {
    const res = await request(path, options)
    assert.equal(res.status, 200, path)
    assert.deepEqual(await res.json(), expected, path)
  }
})

test('plain array endpoints already accept an empty backend collection', async () => {
  globalThis.backendFetch = async () => []
  for (const path of ['addresses/index.get', 'banners.get', 'brands.get', 'categories.get', 'comments.get', 'payment-methods.get', 'shipping/locations.get', 'shipping/methods.get', 'stories.get']) {
    globalThis.requireAddressUser = () => {}
    globalThis.requireCheckoutUser = () => {}
    const res = await request(path, path === 'comments.get' ? { query: '?targetType=product&targetId=product' } : {})
    assert.equal(res.status, 200, path)
    const expected = path === 'banners.get' ? { homeHero: [], homeTop: [], homeMiddle: [] }
      : ['brands.get', 'categories.get', 'comments.get', 'stories.get'].includes(path) ? { items: [] } : []
    assert.deepEqual(await res.json(), expected, path)
  }
})

test('empty carts and wishlists normalize both bare and nested empty arrays', async () => {
  const pricing = { subtotal_original: 0, discount: 0, subtotal: 0, total: 0 }
  for (const resource of ['cart', 'wishlist']) {
    const empty = { id: '', guest_id: '', user_id: '', products: {}, ...(resource === 'cart' ? { pricing } : {}) }
    for (const upstream of [[], { ...empty, products: [] }]) {
      globalThis.backendFetch = async () => upstream
      const res = await request(resource + '/index.get')
      assert.equal(res.status, 200)
      assert.deepEqual(await res.json(), empty)
    }
  }
  globalThis.backendFetch = async () => ({ unread_total: 0, by_object_type: [] })
  assert.deepEqual(await (await request('notifications/counts.get')).json(), { unread_total: 0, by_object_type: {} })
})

test('absent optional content uses null and missing detail resources use 404', async () => {
  globalThis.backendFetch = async () => []
  for (const path of ['discounts/home.get', 'shop.get']) {
    const res = await request(path)
    assert.equal(res.status, 204)
    assert.equal(await res.text(), '') // H3 serializes null as an empty body.
  }
  for (const path of ['products/[slug]/detail.get', 'blogs/[slug].get', 'orders/[orderId].get', 'stories/[id].get']) {
    assert.equal((await request(path)).status, 404, path)
  }
})

test('optional empty shop and discount content keeps defaults and avoids repeated requests', async () => {
  setActivePinia(createPinia())
  let reads = 0
  // H3 sends null as 204; ofetch therefore resolves with undefined.
  globalThis.useApi = () => ({ get: async () => { reads++; return undefined }, post: async () => { throw new Error('No discount products should be requested') } })
  const { useShopStore } = await load('app/stores/shop.store.ts')
  const shop = useShopStore()
  await shop.fetchShop()
  await shop.fetchShop()
  assert.equal(shop.info, null)
  assert.equal(shop.name, 'فروشگاه')
  assert.equal(shop.error, '')
  assert.equal(reads, 1)
  const { useOfferStore } = await load('app/stores/offer.store.ts')
  const offer = useOfferStore()
  offer.products = [{ id: 'old' }]
  await offer.fetchOffer()
  await offer.fetchOffer()
  assert.equal(offer.discount, null)
  assert.deepEqual(offer.products, [])
  assert.equal(offer.hasLoaded, true)
  assert.equal(reads, 2)
})

test('malformed payloads and upstream failures remain errors rather than empty successes', async () => {
  for (const upstream of [[{ unexpected: true }], 'invalid', {}]) {
    globalThis.backendFetch = async () => upstream
    for (const path of ['products/list.post', 'discounts/products.post', 'notifications/index.get', 'orders/index.get', 'blogs/index.get', 'cart/index.get', 'wishlist/index.get']) {
      const options = path.endsWith('.post') ? { method: 'POST', body: {} } : {}
      assert.equal((await request(path, options)).status, 502, path)
    }
  }
  globalThis.backendFetch = async () => { throw h3.createError({ statusCode: 503, message: 'Unavailable' }) }
  assert.equal((await request('products/list.post', { method: 'POST', body: {} })).status, 503)
})
