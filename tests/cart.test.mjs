import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { ref, computed, watch, reactive, nextTick } from 'vue'
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
const { useCartStore } = await load('app/stores/cart.store.ts')
const fixture = () => ({
  id: 'cart', guest_id: 'guest', user_id: '',
  products: { item: { id: 'item', product_id: 'product', variant_id: 'variant', quantity: 2,
    name: 'Real product', slug: 'real-product', stock: 4, image_url: '/photo',
    pricing: { original_unit: 200, final_unit: 150, original_total: 400, discount: 100, total: 300 } } },
  pricing: { subtotal_original: 400, discount: 100, subtotal: 300, total: 300 },
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
    async patch(path, body) { calls.push(['patch', path, body]) },
    async delete(path) { calls.push(['delete', path]) },
  }
  globalThis.useAuthStore = () => auth
  globalThis.useApi = () => api
  return { store: useCartStore(), auth, api, calls, respond: value => { response = value } }
}

test('anonymous cart stays empty without issuing a guest or GET cart', async () => {
  const { store, calls } = setup(null)
  await store.fetchCart()
  assert.deepEqual(calls, [['session', false]])
  assert.equal(store.loaded, true)
  assert.equal(store.itemCount, 0)
})

test('keyed items, variants and pricing remain backend authoritative', async () => {
  const { store } = setup()
  await store.fetchCart()
  assert.equal(store.items[0].id, 'item')
  assert.equal(store.items[0].stock, 4)
  assert.equal(store.items[0].variant_id, 'variant')
  assert.equal(store.itemCount, 1)
  assert.equal(store.total, 300)
  assert.equal(store.subtotalOriginal, 400)
  assert.equal(store.discount, 100)
})

test('product cart selector preserves every independently purchasable variant line', async () => {
  const { store, respond } = setup()
  const cart = fixture()
  cart.products.other = { ...cart.products.item, id: 'other', variant_id: 'other-variant' }
  respond(cart)
  await store.fetchCart()
  assert.deepEqual(store.itemsForProduct('product').map(item => item.id), ['item', 'other'])
})

test('add establishes identity, sends nullable variant and refetches canonical cart', async () => {
  const { store, calls } = setup(null)
  await store.addItem('product', 2, null)
  assert.deepEqual(calls, [['session', true], ['post', '/cart/items', { product_id: 'product', quantity: 2, variant_id: null }], ['get', '/cart']])
  assert.equal(store.itemCount, 1)
})

test('quantity updates, removal and clear use item IDs and refetch', async () => {
  const { store, calls, respond } = setup()
  await store.fetchCart()
  await store.updateQuantity('item', 3)
  assert.deepEqual(calls.find(call => call[0] === 'patch'), ['patch', '/cart/items/item', { product_id: 'product', quantity: 3, variant_id: 'variant' }])
  await store.remove('item')
  respond({ ...fixture(), products: {}, pricing: { subtotal_original: 0, discount: 0, subtotal: 0, total: 0 } })
  await store.clear()
  assert.deepEqual(calls.filter(call => call[0] === 'delete'), [['delete', '/cart/items/item'], ['delete', '/cart']])
  assert.equal(calls.filter(call => call[0] === 'get').length, 4)
  assert.equal(store.items.length, 0)
  assert.equal(store.total, 0)
})

test('duplicate actions are rejected while mutation and reconciliation are pending', async () => {
  const { store, api } = setup()
  let release
  let posts = 0
  api.post = () => { posts++; return new Promise(resolve => { release = resolve }) }
  const first = store.addItem('product', 1, 'variant')
  await assert.rejects(store.addItem('product', 1, 'variant'))
  assert.equal(store.isMutating, true)
  release()
  await first
  assert.equal(posts, 1)
  assert.equal(store.busy, false)
})

test('successful write plus failed refresh becomes stale and retries GET only', async () => {
  const { store, api } = setup()
  let writes = 0
  api.post = async () => { writes++ }
  api.get = async () => { throw new ApiError('offline') }
  await assert.rejects(store.addItem('product', 1, null), error => error.code === 'CART_REFRESH_FAILED')
  assert.equal(store.stale, true)
  await assert.rejects(store.addItem('product', 1, null))
  api.get = async () => fixture()
  await store.fetchCart()
  assert.equal(writes, 1)
  assert.equal(store.stale, false)
})

test('late cart response from old identity is discarded', async () => {
  const { store, api, auth } = setup()
  let release
  api.get = () => new Promise(resolve => { release = resolve })
  const pending = store.fetchCart()
  auth.identity = 'another-user'
  release(fixture())
  await assert.rejects(pending)
  assert.equal(store.cart, null)
})

test('same identity validation keeps cart; ownership change clears and reloads it', async () => {
  const { store, auth, calls } = setup()
  await store.fetchCart()
  auth.identity = 'guest'
  assert.equal(store.itemCount, 1)
  auth.identity = null
  await store.fetchCart()
  assert.equal(store.itemCount, 0)
  assert.equal(calls.filter(call => call[0] === 'get').length, 1)
})

test('cart lines retain the endpoint-supplied presentation fields', async () => {
  const { store, respond } = setup()
  respond(fixture())
  await store.fetchCart()
  assert.equal(store.itemCount, 1)
  assert.equal(store.items[0].name, 'Real product')
  assert.equal(store.items[0].image_url, '/photo')
})

test('money conversion defaults to tomans without modifying backend values', async () => {
  const { convertRials, formatMoney } = await load('app/utils/money.ts')
  assert.equal(convertRials(120), 12)
  assert.equal(convertRials(120, 'rial'), 120)
  assert.equal(convertRials(12), 1.2)
  assert.match(formatMoney(120), /تومان/)
  assert.match(formatMoney(120, 'rial'), /ریال/)
})

Object.assign(globalThis, await load('server/utils/session.ts'))
Object.assign(globalThis, await load('server/utils/cartRequest.ts'))
Object.assign(globalThis, await load('server/utils/backendFetch.ts'))
Object.assign(globalThis, await load('server/utils/productDetail.ts'))
globalThis.useRuntimeConfig = () => ({ backendUrl: 'https://backend.test' })
globalThis.toBackendImageUrl = value => value
async function request(handler, method, body, cookie = 'guest_token=guest') {
  const app = h3.createApp({ onError() {} }).use(h3.defineEventHandler(event => {
    event.context.params = { itemId: 'item' }
    return handler(event)
  }))
  return h3.toWebHandler(app)(new Request('http://shop.test/cart', {
    method, headers: { cookie, 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }))
}

test('all mutation proxies preserve methods/payloads and central guest/user precedence', async () => {
  const payload = { product_id: 'product', quantity: 2, variant_id: null }
  for (const [file, method, path, status] of [
    ['items/index.post', 'POST', '/api/cart/items', 201],
    ['items/[itemId].patch', 'PATCH', '/api/cart/items/item', 200],
    ['items/[itemId].delete', 'DELETE', '/api/cart/items/item', 200],
    ['index.delete', 'DELETE', '/api/cart', 200],
  ]) {
    const handler = (await load(`server/api/cart/${file}.ts`)).default
    for (const cookie of ['guest_token=guest', 'auth_token=user; guest_token=guest']) {
      globalThis.$fetch = async (url, options) => {
        assert.equal(url, path)
        assert.equal(options.method, method)
        assert.equal(options.retry, 0)
        assert.equal(options.headers.get('Authorization'), cookie.startsWith('auth') ? 'Bearer user' : 'Bearer guest')
        if (method !== 'DELETE') assert.deepEqual(options.body, payload)
      }
      const response = await request(handler, method, method === 'DELETE' ? null : payload, cookie)
      assert.equal(response.status, status)
    }
  }
})

test('GET proxy makes one cart request and normalizes only supplied image paths', async () => {
  const handler = (await load('server/api/cart/index.get.ts')).default
  const calls = []
  globalThis.$fetch = async url => {
    calls.push(url)
    if (url === '/api/cart') return fixture()
    throw new Error('Unexpected URL')
  }
  const response = await request(handler, 'GET')
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.pricing.total, 300)
  assert.equal(body.products.item.name, 'Real product')
  assert.equal(body.products.item.image_url, '/photo')
  assert.deepEqual(calls, ['/api/cart'])
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('cart proxies reject absent identity and invalid quantities before backend writes', async () => {
  const handler = (await load('server/api/cart/items/index.post.ts')).default
  globalThis.$fetch = () => { throw new Error('Backend must not be called') }
  assert.equal((await request(handler, 'POST', { product_id: 'p', quantity: 0, variant_id: null })).status, 400)
  assert.equal((await request(handler, 'POST', { product_id: 'p', quantity: 1, variant_id: null }, '')).status, 401)
})


test('Product Details passes selected variant and quantity to Cart and guards repeated clicks', async () => {
  const props = reactive({ product: { id: 'product', baseStock: 8, price: { final: 100, original: 100, discountPercent: 0 },
    purchaseVariants: [{ variantId: 'variant', stock: 6, finalPrice: 100 }] } })
  const calls = []
  const cartStore = reactive({ busy: false, stale: false, async addItem(...args) { calls.push(args) } })
  globalThis.useCartStore = () => cartStore
  globalThis.useAppToast = () => ({ success() {}, error(message) { throw new Error(message) } })
  globalThis.defineProps = () => props
  const source = (await readFile(new URL('../app/components/product/ProductPurchasePanel.vue', import.meta.url), 'utf8'))
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const { outputText } = ts.transpileModule(source + '\nexport { addToCart, quantity, selectedVariantId }', {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  const panel = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
  panel.quantity.value = 3
  await panel.addToCart()
  assert.deepEqual(calls, [['product', 3, 'variant']])
  cartStore.busy = true
  await panel.addToCart()
  assert.equal(calls.length, 1)
  cartStore.busy = false
  props.product = { ...props.product, id: 'base-product', purchaseVariants: [] }
  await nextTick()
  await panel.addToCart()
  assert.deepEqual(calls[1], ['base-product', 1, null])
})

test('GET proxy does not request product data when the cart includes a variant', async () => {
  const handler = (await load('server/api/cart/index.get.ts')).default
  globalThis.$fetch = async url => {
    assert.equal(url, '/api/cart')
    return fixture()
  }
  const response = await request(handler, 'GET')
  assert.equal(response.status, 200)
  assert.equal((await response.json()).products.item.variant_id, 'variant')
})


test('item count counts distinct cart entries independently of quantity', async () => {
  const { store, respond } = setup()
  const cart = fixture()
  cart.products.item.quantity = 3
  cart.products.other = { ...cart.products.item, id: 'other', variant_id: 'other-variant', quantity: 8 }
  respond(cart)
  await store.fetchCart()
  assert.equal(store.itemCount, 2)
})

test('PATCH normalizes omitted, empty and whitespace variant IDs to null', async () => {
  const handler = (await load('server/api/cart/items/[itemId].patch.ts')).default
  for (const variant of [undefined, '', '  ', null, 'variant']) {
    globalThis.$fetch = async (_, options) => {
      assert.equal(options.body.variant_id, variant === 'variant' ? 'variant' : null)
    }
    const response = await request(handler, 'PATCH', { product_id: 'product', quantity: 2, variant_id: variant })
    assert.equal(response.status, 200)
  }
  for (const variant of [123, {}, []]) {
    assert.equal((await request(handler, 'PATCH', { product_id: 'product', quantity: 2, variant_id: variant })).status, 400)
  }
})

test('store sends null for variantless backend cart entries', async () => {
  for (const variant of [undefined, '', null]) {
    const { store, respond, calls } = setup()
    const cart = fixture()
    cart.products.item.variant_id = variant
    respond(cart)
    await store.fetchCart()
    await store.updateQuantity('item', 3)
    assert.equal(calls.find(call => call[0] === 'patch')[2].variant_id, null)
  }
})

test('quick add selects variants in place, passes quantity, and closes after success', async () => {
  const open = ref(true)
  const props = reactive({ product: { id: 'quick-product', slug: 'quick-product', price: { final: 100 } } })
  const details = reactive({ bySlug: {}, async loadBySlug(slug) {
    const detail = { baseStock: 10, price: { final: 100 }, purchaseVariants: [
      { variantId: 'sold-out', stock: 0, finalPrice: 100 },
      { variantId: 'available', stock: 4, finalPrice: 120 },
    ] }
    this.bySlug[slug] = detail
    return detail
  } })
  const calls = []
  globalThis.useProductDetailStore = () => details
  globalThis.useCartStore = () => ({ busy: false, stale: false, addItem: async (...args) => { calls.push(args) } })
  globalThis.useAppToast = () => ({ success() {}, error() {} })
  globalThis.defineProps = () => props
  globalThis.defineModel = () => open
  globalThis.navigateTo = () => { throw new Error('Quick add must not navigate') }
  const source = (await readFile(new URL('../app/components/product/ProductQuickAdd.vue', import.meta.url), 'utf8'))
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const { outputText } = ts.transpileModule(source + '\nexport { add, quantity, selectedVariantId, loading }', {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  const panel = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(panel.loading.value, false)
  assert.equal(panel.selectedVariantId.value, 'available')
  panel.quantity.value = 3
  await panel.add()
  assert.deepEqual(calls, [['quick-product', 3, 'available']])
  assert.equal(open.value, false)
})
