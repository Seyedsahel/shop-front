import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { ref, computed, watch, reactive } from 'vue'
import * as h3 from 'h3'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source.replace(/^import .* from ['"]\.\/.*['"]\n/gm, '')
    .replaceAll('import.meta.client', 'true').replaceAll('import.meta.server', 'false'), {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}
Object.assign(globalThis, h3, { ref, computed, watch, defineStore })
globalThis.ApiError = (await load('app/utils/api-error.ts')).ApiError
const { useWishlistStore } = await load('app/stores/wishlist.store.ts')
const fixture = () => ({
  id: 'list', guest_id: 'guest', user_id: '',
  products: { item: { id: 'item', product_id: 'product', variant_id: 'variant', variant_name: '10 Tablets', name: 'Product', slug: 'product', stock: 2, image_url: null,
    price: { original: 20, final: 15, discount: 5, discount_percent: 25 } } },
})

function setup(identity = 'guest') {
  setActivePinia(createPinia())
  const calls = []
  let response = fixture()
  const auth = reactive({ identity, async withShoppingSession(create, action) {
    calls.push(['session', create])
    if (create && !this.identity) this.identity = 'new-guest'
    return action({ identity: this.identity })
  } })
  const api = {
    async get(path) { calls.push(['get', path]); return structuredClone(response) },
    async post(path, body) { calls.push(['post', path, body]) },
    async delete(path) { calls.push(['delete', path]) },
  }
  globalThis.useAuthStore = () => auth
  globalThis.useApi = () => api
  return { store: useWishlistStore(), calls, auth, api, respond: value => { response = value } }
}

test('wishlist uses the shopping session and preserves distinct variant entries', async () => {
  const { store, calls, respond } = setup()
  const list = fixture()
  list.products.other = { ...list.products.item, id: 'other', variant_id: '' }
  respond(list)
  await store.fetchWishlist()
  assert.equal(store.itemCount, 2)
  assert.equal(store.findItem('product', 'variant').id, 'item')
  assert.equal(store.findItem('product', 'variant').variant_name, '10 Tablets')
  assert.equal(store.findItem('product', null).id, 'other')
  assert.deepEqual(calls, [['session', false], ['get', '/wishlist']])
})

test('anonymous fetch does not create a guest; add does and omits absent variant', async () => {
  const { store, calls } = setup(null)
  await store.fetchWishlist()
  assert.deepEqual(calls, [['session', false]])
  await store.addItem('product')
  assert.deepEqual(calls.slice(-3), [['session', true], ['post', '/wishlist/items', { product_id: 'product' }], ['get', '/wishlist']])
  await store.addItem('product', 'variant')
  assert.deepEqual(calls.findLast(call => call[0] === 'post'), ['post', '/wishlist/items', { product_id: 'product', variant_id: 'variant' }])
})

test('remove and clear use backend item IDs and reconcile state', async () => {
  const { store, calls, respond } = setup()
  await store.fetchWishlist()
  respond({ ...fixture(), products: {} })
  await store.remove('item')
  await store.clear()
  assert.deepEqual(calls.filter(call => call[0] === 'delete'), [['delete', '/wishlist/items/item'], ['delete', '/wishlist']])
  assert.equal(store.itemCount, 0)
})

Object.assign(globalThis, await load('server/utils/session.ts'))
Object.assign(globalThis, await load('server/utils/wishlistRequest.ts'))
Object.assign(globalThis, await load('server/utils/backendFetch.ts'))
globalThis.useRuntimeConfig = () => ({ backendUrl: 'https://backend.test' })
globalThis.toBackendImageUrl = value => value

async function request(handler, method, body, cookie = 'guest_token=guest') {
  const app = h3.createApp({ onError() {} }).use(h3.defineEventHandler(event => {
    event.context.params = { itemId: 'item' }
    return handler(event)
  }))
  return h3.toWebHandler(app)(new Request('http://shop.test/wishlist', {
    method, headers: { cookie, 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }))
}

test('POST sends text/plain JSON and uses guest or auth bearer from shared session', async () => {
  const handler = (await load('server/api/wishlist/items/index.post.ts')).default
  for (const cookie of ['guest_token=guest', 'auth_token=user; guest_token=guest']) {
    globalThis.$fetch = async (path, options) => {
      assert.equal(path, '/wishlist/items')
      assert.equal(options.headers.get('Authorization'), cookie.startsWith('auth') ? 'Bearer user' : 'Bearer guest')
      assert.equal(options.headers.get('Content-Type'), 'text/plain')
      assert.deepEqual(JSON.parse(options.body), { product_id: 'product' })
    }
    assert.equal((await request(handler, 'POST', { product_id: 'product' }, cookie)).status, 201)
  }
})

test('wishlist proxies reject missing session and invalid payload before writing', async () => {
  const handler = (await load('server/api/wishlist/items/index.post.ts')).default
  globalThis.$fetch = () => { throw new Error('Backend must not be called') }
  assert.equal((await request(handler, 'POST', { product_id: 'product' }, '')).status, 401)
  assert.equal((await request(handler, 'POST', { product_id: 'product', variant_id: '' })).status, 400)
})

test('GET keeps keyed items and delete routes address the item or whole wishlist', async () => {
  const get = (await load('server/api/wishlist/index.get.ts')).default
  const remove = (await load('server/api/wishlist/items/[itemId].delete.ts')).default
  const clear = (await load('server/api/wishlist/index.delete.ts')).default
  const paths = []
  globalThis.$fetch = async (path, options) => {
    paths.push([options?.method ?? 'GET', path])
    assert.equal(options.headers.get('Authorization'), 'Bearer guest')
    return path === '/wishlist' && !options.method ? fixture() : undefined
  }
  const response = await request(get, 'GET')
  const body = await response.json()
  assert.equal(body.products.item.price.final, 15)
  assert.equal(body.products.item.variant_name, '10 Tablets')
  assert.equal(response.headers.get('cache-control'), 'no-store')
  await request(remove, 'DELETE')
  await request(clear, 'DELETE')
  assert.deepEqual(paths, [['GET', '/wishlist'], ['DELETE', '/wishlist/items/item'], ['DELETE', '/wishlist']])
})
