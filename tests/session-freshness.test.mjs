import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { ref, computed, watch, reactive } from 'vue'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source.replaceAll('import.meta.client', 'true').replaceAll('import.meta.server', 'false'), {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}
Object.assign(globalThis, { ref, computed, watch, defineStore, defineNuxtPlugin: fn => fn })
Object.assign(globalThis, await load('app/utils/api-error.ts'))
Object.assign(globalThis, await load('app/composables/useResourceRefresh.ts'))
Object.assign(globalThis, await load('app/composables/useSessionSync.ts'))
const { useAuthStore } = await load('app/stores/auth.store.ts')
const { useCartStore } = await load('app/stores/cart.store.ts')
const { useWishlistStore } = await load('app/stores/wishlist.store.ts')
const { useAddressStore } = await load('app/stores/address.store.ts')
const { useOrderStore } = await load('app/stores/order.store.ts')
const plugin = (await load('app/plugins/auth-init.ts')).default
const tick = () => new Promise(resolve => setImmediate(resolve))
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }

async function setup(path = '/profile', fallback = false) {
  setActivePinia(createPinia())
  const listeners = {}, hooks = new Map(), sent = [], calls = [], redirects = []
  let cleanup, timer, channel
  const document = { visibilityState: 'visible', addEventListener: (key, fn) => { listeners[key] = fn }, removeEventListener: key => { delete listeners[key] } }
  const app = { isHydrating: true, hook(key, fn) { hooks.set(key, fn); return () => hooks.delete(key) }, async callHook(key, value) { hooks.get(key)?.(value) }, vueApp: { onUnmount(fn) { cleanup = fn } } }
  const router = { currentRoute: ref({ path, fullPath: path, params: path.includes('/orders/') ? { id: 'order-1' } : {}, query: path.startsWith('/pay/') ? { order_id: 'order-1', status: 'OK', ref_id: 'untrusted-hint' } : {} }), replace: async value => { redirects.push(value) } }
  const backend = { session: { identity: 'token-1', scope: 'account-1', isAuthenticated: true, hasGuestSession: false, user: { id: 'user-1', first_name: 'Before' } }, quantity: 1, wish: ['p1'], addresses: [{ id: 'a1' }], orders: [{ id: 'order-1', status: 'before' }] }
  const checkout = reactive({ submitting: false })
  const api = { async get(path) {
    calls.push(['get', path])
    if (path === '/auth/me') return structuredClone(backend.session)
    if (path === '/cart') return { products: { item: { id: 'item', product_id: 'p1', quantity: backend.quantity, max_per_order: 9 } }, pricing: { total: 0 } }
    if (path === '/wishlist') return { products: Object.fromEntries(backend.wish.map(id => [id, { id, product_id: id }])) }
    if (path === '/addresses') return structuredClone(backend.addresses)
    if (path.startsWith('/orders?')) return { items: structuredClone(backend.orders), total: backend.orders.length, page: 1, limit: 20 }
    if (path === '/orders/order-1') return structuredClone(backend.orders[0])
    throw new Error(path)
  }, async post(path) { calls.push(['post', path]); return {} }, async patch(path, input) { calls.push(['patch', path]); backend.quantity = input.quantity }, async delete(path) { calls.push(['delete', path]); backend.wish = [] } }
  Object.assign(globalThis, {
    document, window: { setInterval(fn) { timer = fn; return 1 }, clearInterval() {}, addEventListener: (key, fn) => { listeners[key] = fn }, removeEventListener: key => { delete listeners[key] } },
    localStorage: { setItem: (key, value) => sent.push(JSON.parse(value)) },
    BroadcastChannel: fallback ? undefined : class { constructor() { channel = this } postMessage(value) { sent.push(value) } close() { this.closed = true } },
    useNuxtApp: () => app, useRouter: () => router, useApi: () => api,
    useAppToast: () => ({ success() {}, error() {} }),
  })
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} })
  const auth = useAuthStore()
  Object.assign(globalThis, { useAuthStore: () => auth, useCartStore, useWishlistStore, useAddressStore, useOrderStore, useCheckoutStore: () => checkout, usePaymentStore: () => ({ starting: false }) })
  await auth.fetchSession()
  const cart = useCartStore(), wishlist = useWishlistStore(), addresses = useAddressStore(), orders = useOrderStore()
  await Promise.all([cart.fetchCart(), wishlist.fetchWishlist(), addresses.fetchAll(), orders.fetchAll()])
  await plugin(app)
  async function settle() { for (let n = 0; n < 8; n++) await tick() }
  return { auth, cart, wishlist, addresses, orders, checkout, backend, api, calls, sent, redirects, router, cleanup: () => cleanup(), timer: () => timer(), async visible() { document.visibilityState = 'visible'; listeners.visibilitychange(); await settle() }, hidden() { document.visibilityState = 'hidden' }, async receive(resource) { const data = { version: 1, resource }; if (channel) channel.onmessage({ data }); else listeners.storage({ key: 'shop:session-invalidation:v1', newValue: JSON.stringify(data) }); await settle() }, settle, app }
}

test('saved addresses allow five entries, block further saves, and free a slot after deletion', async () => {
  const f = await setup()
  try {
    f.backend.addresses = Array.from({ length: 4 }, (_, index) => ({ id: `a${index + 1}` }))
    await f.addresses.fetchAll()
    const writes = []
    f.api.post = async (path, input) => {
      writes.push(['post', path])
      const address = { ...input, id: 'new-address' }
      f.backend.addresses.unshift(address)
      return address
    }
    f.api.put = async (path, input) => {
      writes.push(['put', path])
      return { ...input, id: 'a1' }
    }
    f.api.delete = async path => {
      writes.push(['delete', path])
      f.backend.addresses = f.backend.addresses.filter(item => path !== `/addresses/${item.id}`)
    }
    assert.equal(f.addresses.limitReached, false)
    await f.addresses.create({ name: 'Fifth' })
    assert.equal(f.addresses.items.length, 5)
    assert.equal(f.addresses.maxSavedAddresses, 5)
    assert.equal(f.addresses.limitReached, true)
    const message = 'حداکثر تعداد آدرس ذخیره شده 5 عدد می باشد، برای ثبت آدرس جدید میتوانید یکی از قدیمی تر هارا حذف کنید'
    await assert.rejects(f.addresses.create({ name: 'Sixth' }), { message })
    assert.equal(writes.filter(([method]) => method === 'post').length, 1)
    await f.addresses.update('a1', { name: 'Edited' })
    assert.equal(f.addresses.items.length, 5)
    await f.addresses.remove('new-address')
    assert.equal(f.addresses.items.length, 4)
    assert.equal(f.addresses.limitReached, false)
    await f.addresses.create({ name: 'Replacement' })
    assert.equal(f.addresses.items.length, 5)
    f.backend.addresses.push({ id: 'legacy-extra' })
    await f.addresses.fetchAll()
    await assert.rejects(f.addresses.create({}), { message })
    assert.equal(writes.filter(([method]) => method === 'post').length, 2)
  } finally {
    f.cleanup()
  }
})

test('same-scope visibility return refreshes profile, cart, wishlist, addresses and orders', async () => {
  const f = await setup()
  assert.equal(f.cart.items[0].quantity, 1)
  f.backend.quantity = 2
  f.backend.wish = ['p2']
  f.backend.addresses = [{ id: 'a2' }]
  f.backend.orders[0].status = 'paid'
  f.backend.session.user.first_name = 'After'
  await f.visible()
  assert.equal(f.cart.items[0].quantity, 2)
  assert.equal(f.wishlist.items[0].product_id, 'p2')
  assert.equal(f.addresses.items[0].id, 'a2')
  assert.equal(f.orders.items[0].status, 'paid')
  assert.equal(f.auth.user.first_name, 'After')
  assert.equal(f.calls.some(([method, path]) => method === 'post' && path === '/auth/refresh'), false)
  f.cleanup()
})

test('timer validates shared cookies before refresh; logout clears resources and redirects a private page', async () => {
  const f = await setup()
  f.backend.session = { identity: null, scope: null, isAuthenticated: false, hasGuestSession: false }
  f.timer()
  await f.settle()
  assert.equal(f.calls.some(([, path]) => path === '/auth/refresh'), false)
  assert.equal(f.cart.items.length, 0)
  assert.equal(f.wishlist.items.length, 0)
  assert.equal(f.addresses.items.length, 0)
  assert.equal(f.orders.items.length, 0)
  assert.equal(f.auth.user, null)
  assert.equal(f.redirects[0].path, '/auth')
  f.cleanup()
})

test('cross-tab invalidations are deferred while hidden; storage fallback also refreshes and contains no private data', async () => {
  for (const fallback of [false, true]) {
    const f = await setup('/cart', fallback)
    f.hidden()
    f.backend.quantity = 3
    await f.receive('cart')
    assert.equal(f.cart.items[0].quantity, 1)
    await f.visible()
    assert.equal(f.cart.items[0].quantity, 3)
    await f.cart.updateQuantity('item', 4)
    assert.equal(f.sent.length, 1)
    assert.equal(f.sent[0].resource, 'cart')
    assert.deepEqual(Object.keys(f.sent[0]).sort(), fallback ? ['nonce', 'resource', 'version'] : ['resource', 'version'])
    f.cleanup()
  }
})

test('fresh reads deduplicate and wait behind active mutations without replaying writes', async () => {
  const f = await setup('/cart')
  const gate = deferred(), patch = f.api.patch
  f.api.patch = async (...args) => { await gate.promise; return patch(...args) }
  const before = f.calls.filter(([, path]) => path === '/cart').length
  const write = f.cart.updateQuantity('item', 2)
  await tick()
  const read = f.cart.revalidateCart()
  const duplicate = f.cart.revalidateCart()
  await tick()
  assert.equal(f.calls.filter(([, path]) => path === '/cart').length, before)
  gate.resolve()
  await Promise.all([write, read, duplicate])
  assert.equal(f.cart.items[0].quantity, 2)
  assert.equal(f.calls.filter(([method]) => method === 'patch').length, 1)
  assert.equal(f.calls.filter(([, path]) => path === '/cart').length, before + 2)
  f.cleanup()
})

test('an invalidation during a read performs one trailing read and retains the newer truth', async () => {
  const gate = deferred()
  let count = 0, value = 1, result
  const refresh = useResourceRefresh(async () => { const snapshot = value; if (++count === 1) await gate.promise; result = snapshot })
  const first = refresh.request()
  await tick()
  value = 2
  const fresh = refresh.request(true)
  assert.equal(fresh, refresh.request(true))
  gate.resolve()
  await Promise.all([first, fresh])
  assert.equal(count, 2)
  assert.equal(result, 2)
})

test('old-scope read errors cannot dirty the next account; loaded stores reload for login', async () => {
  const f = await setup()
  const gate = deferred(), get = f.api.get
  let first = true
  f.api.get = async path => { if (path === '/cart' && first) { first = false; return gate.promise } return get(path) }
  const old = f.cart.fetchCart()
  const rejection = assert.rejects(old)
  await tick()
  f.backend.session = { ...f.backend.session, identity: 'token-2', scope: 'account-2', user: { id: 'user-2' } }
  f.backend.quantity = 5
  // The real session lock serializes normal validation behind shopping reads.
  // Force a scope transition here to exercise expiry/late-response guards.
  f.auth.identity = 'token-2'
  f.auth.sessionScope = 'account-2'
  gate.reject(new ApiError('old account failed'))
  await rejection
  await f.settle()
  assert.equal(f.cart.items[0].quantity, 5)
  assert.equal(f.cart.error, '')
  assert.equal(f.cart.stale, false)
  assert.equal(f.addresses.loaded, true)
  assert.equal(f.orders.loaded, true)
  f.cleanup()
})

test('token rotation preserves scope and deduplicates refresh; order detail is refreshed when visible', async () => {
  const f = await setup('/profile/orders/order-1')
  await f.orders.fetchOne('order-1')
  f.backend.orders[0].status = 'paid'
  const post = f.api.post
  f.api.post = async path => { await post(path); if (path === '/auth/refresh') f.backend.session.identity = 'rotated' }
  const first = f.auth.refreshSession()
  await Promise.all([first, f.auth.refreshSession()])
  assert.equal(f.auth.sessionScope, 'account-1')
  assert.equal(f.cart.loaded, true)
  await f.visible()
  assert.equal(f.orders.current.status, 'paid')
  assert.equal(f.calls.filter(([, path]) => path === '/auth/refresh').length, 1)
  f.cleanup()
})

test('address reads queued during mutation reload truth; logout clears loading despite a delayed response', async () => {
  const f = await setup()
  const gate = deferred()
  f.api.post = async () => { await gate.promise; f.backend.addresses.push({ id: 'a2' }); return { id: 'a2' } }
  const write = f.addresses.create({})
  await assert.rejects(f.addresses.create({}))
  const read = f.addresses.revalidate()
  const duplicate = f.addresses.revalidate()
  gate.resolve()
  await Promise.all([write, read, duplicate])
  assert.deepEqual(f.addresses.items.map(item => item.id), ['a1', 'a2'])
  const delayed = deferred(), get = f.api.get
  f.api.get = path => path === '/addresses' ? delayed.promise : get(path)
  const old = f.addresses.fetchAll()
  await tick()
  f.backend.session = { identity: null, scope: null, isAuthenticated: false, hasGuestSession: false }
  await f.auth.fetchSession()
  delayed.resolve([{ id: 'old-private-address' }])
  await old
  await f.settle()
  assert.deepEqual(f.addresses.items, [])
  assert.equal(f.addresses.loading, false)
  f.cleanup()
})

test('visibility and local checkout invalidation queue cart/orders until checkout finishes', async () => {
  const f = await setup('/checkout')
  f.checkout.submitting = true
  const before = f.calls.filter(([, path]) => path === '/cart' || path.startsWith('/orders?')).length
  await f.visible()
  assert.equal(f.calls.filter(([, path]) => path === '/cart' || path.startsWith('/orders?')).length, before)
  f.backend.quantity = 7
  f.backend.orders[0].status = 'created'
  await f.app.callHook('session:invalidate', 'orders')
  f.checkout.submitting = false
  await f.settle()
  assert.equal(f.cart.items[0].quantity, 7)
  assert.equal(f.orders.items[0].status, 'created')
  f.cleanup()
})

test('both payment return routes revalidate the backend order on return without creating payments or clearing cart', async () => {
  for (const path of ['/pay/success', '/pay/failure']) {
    const f = await setup(path)
    await f.orders.fetchOne('order-1')
    assert.equal(f.orders.current.status, 'before')
    f.backend.orders[0].status = 'paid'
    await f.visible()
    assert.equal(f.orders.current.status, 'paid')
    assert.equal(f.calls.some(([method]) => method !== 'get'), false)
    f.cleanup()
  }
})

test('same detail ID requested after an account change queues a new read and discards the old detail', async () => {
  const f = await setup('/profile/orders/order-1')
  const gate = deferred(), get = f.api.get
  let first = true
  f.api.get = path => {
    if (path === '/orders/order-1' && first) { first = false; return gate.promise }
    return get(path)
  }
  const old = f.orders.fetchOne('order-1')
  await tick()
  f.backend.session = { ...f.backend.session, scope: 'account-2', identity: 'token-2' }
  f.backend.orders[0].status = 'new-account-order'
  await f.auth.fetchSession()
  const next = f.orders.fetchOne('order-1')
  gate.resolve({ id: 'order-1', status: 'old-account-order' })
  await Promise.all([old, next])
  assert.equal(f.orders.current.status, 'new-account-order')
  f.cleanup()
})
