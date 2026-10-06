import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { ref, watch, reactive } from 'vue'
import * as h3 from 'h3'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source.replace(/^import .* from ['"]\.\/.*['"]\n/gm, '')
    .replaceAll('import.meta.client', 'true'), {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}
Object.assign(globalThis, h3, { ref, watch, defineStore })
Object.assign(globalThis, await load('app/utils/api-error.ts'))
Object.assign(globalThis, await load('app/utils/checkoutAttempt.ts'))
globalThis.useSessionSync = () => () => {}
const { useCheckoutStore } = await load('app/stores/checkout.store.ts')
const input = { cart_id: 'cart-1', address_id: 'address-1', shipping_method_id: 'shipping-1' }
const order = { id: 'a4e39588-64b0-4eaf-b652-09b50f107094', order_number: 'ORD-1', status: 'pending_payment', total_amount: 10000, currency: 'IRR' }
const key = '17771cda-25fc-4cdb-81d8-a81ab1c13980'

test('inline checkout retry after reload preserves address details and its idempotency key', async () => {
  const { store, api, calls } = setup()
  const inline = { cart_id: 'cart-1', shipping_method_id: 'pickup', address: { first_name: 'Ali', last_name: 'Ahmadi', phone: '09130744909' } }
  const post = api.post
  api.post = async (...args) => { await post(...args); throw new ApiError('Network failure', undefined, undefined, 'transport', 'network') }
  await assert.rejects(store.createOrder(inline))
  const originalKey = calls[0].options.headers['Idempotency-Key']
  inline.address.phone = '09120000000'
  assert.equal(store.attempt.input.address.phone, '09130744909')
  setActivePinia(createPinia())
  const reloaded = useCheckoutStore()
  reloaded.restoreAttempt()
  await assert.rejects(reloaded.createOrder(inline))
  assert.equal(calls.length, 1)
  api.post = post
  await reloaded.createOrder({ shipping_method_id: 'pickup', cart_id: 'cart-1', address: { phone: '09130744909', last_name: 'Ahmadi', first_name: 'Ali' } })
  assert.equal(calls[1].options.headers['Idempotency-Key'], originalKey)
  assert.deepEqual(calls[1].body, calls[0].body)
})

function setup() {
  setActivePinia(createPinia())
  const saved = new Map()
  globalThis.localStorage = { getItem: name => saved.get(name) ?? null, setItem: (name, value) => saved.set(name, value), removeItem: name => saved.delete(name) }
  const auth = reactive({ identity: 'user-1', sessionScope: 'user-1' })
  const calls = []
  const api = { async post(path, body, options) { calls.push({ path, body: JSON.parse(JSON.stringify(body)), options }); return { ...order } } }
  globalThis.useAuthStore = () => auth
  globalThis.useApi = () => api
  return { store: useCheckoutStore(), auth, api, calls, saved }
}

test('uncertain checkout retry after reload keeps identical body and UUID', async () => {
  const { store, api, calls, saved } = setup()
  const post = api.post
  api.post = async (...args) => { await post(...args); throw new ApiError('Network failure', undefined, undefined, 'transport', 'network') }
  await assert.rejects(store.createOrder(input))
  const firstKey = calls[0].options.headers['Idempotency-Key']
  assert.match(firstKey, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  assert.equal(saved.size, 1)
  setActivePinia(createPinia())
  const reloaded = useCheckoutStore()
  reloaded.restoreAttempt()
  api.post = post
  await reloaded.createOrder(reloaded.attempt.input)
  assert.equal(calls[1].options.headers['Idempotency-Key'], firstKey)
  assert.deepEqual(calls[1].body, calls[0].body)
  assert.equal(JSON.parse([...saved.values()][0]).orderId, order.id)
  await assert.rejects(reloaded.createOrder(input))
  assert.equal(calls.length, 2)
})

test('uncertain checkout cannot reuse its key with changed selections', async () => {
  const { store, calls } = setup()
  store.saveAttempt({ key, input })
  await assert.rejects(store.createOrder({ ...input, address_id: 'other' }))
  assert.equal(calls.length, 0)
  assert.equal(store.attempt.key, key)
})

test('duplicate submits are blocked while order creation is pending', async () => {
  const { store, api, calls } = setup()
  const post = api.post
  let release
  api.post = async (...args) => { await new Promise(resolve => { release = resolve }); return post(...args) }
  const pending = store.createOrder(input)
  await assert.rejects(store.createOrder(input))
  release()
  await pending
  assert.equal(calls.length, 1)
})

test('storage failure prevents checkout writes and user changes isolate recovery', async () => {
  const { store, auth, calls } = setup()
  globalThis.localStorage.setItem = () => { throw new Error('Denied') }
  await assert.rejects(store.createOrder(input))
  assert.equal(calls.length, 0)
  store.attempt = { key, input }
  auth.sessionScope = 'user-2'
  assert.equal(store.attempt, null)
})

test('corrupted persisted attempts stop order creation rather than generating another key', async () => {
  const { store, saved, calls } = setup()
  saved.set(checkoutAttemptStorageKey('user-1'), JSON.stringify({ key: 'invalid', input }))
  await assert.rejects(store.createOrder(input))
  assert.equal(calls.length, 0)
  assert.equal(saved.size, 1)
})

test('definitive validation rejection permits corrected selections with a new key', async () => {
  const { store, api, calls } = setup()
  const post = api.post
  api.post = async (...args) => { await post(...args); throw new ApiError('Invalid address', 400) }
  await assert.rejects(store.createOrder(input))
  assert.equal(store.attempt.rejected, true)
  api.post = post
  await store.createOrder({ ...input, address_id: 'corrected' })
  assert.notEqual(calls[0].options.headers['Idempotency-Key'], calls[1].options.headers['Idempotency-Key'])
})

test('unchanged definite rejection retries with the same key and exact saved body after reload', async () => {
  const { store, api, calls } = setup()
  const post = api.post
  const body = { ...input, coupon_code: 'SAVE', torob_clid: 'click-1' }
  api.post = async (...args) => { await post(...args); throw new ApiError('Invalid address', 422) }
  await assert.rejects(store.createOrder(body))
  const originalKey = store.attempt.key
  setActivePinia(createPinia())
  const reloaded = useCheckoutStore()
  reloaded.restoreAttempt()
  assert.equal(reloaded.attempt.rejected, true)
  api.post = post
  await reloaded.createOrder({ torob_clid: 'click-1', coupon_code: 'SAVE', shipping_method_id: input.shipping_method_id, address_id: input.address_id, cart_id: input.cart_id })
  assert.equal(calls[1].options.headers['Idempotency-Key'], originalKey)
  assert.deepEqual(calls[1].body, calls[0].body)
})

test('all checkout request fields rotate the key after a definite rejection', async () => {
  for (const change of [{ address_id: 'other' }, { shipping_method_id: 'other' }, { coupon_code: 'SAVE' }, { cart_id: 'other' }, { torob_clid: 'click-2' }]) {
    const { store, calls } = setup()
    store.saveAttempt({ key, input, rejected: true })
    await store.createOrder({ ...input, ...change })
    assert.notEqual(calls[0].options.headers['Idempotency-Key'], key)
  }
})

test('an uncertain retry stays unresolved on a key/body conflict', async () => {
  const { store, api } = setup()
  store.saveAttempt({ key, input })
  api.post = async () => { throw createTransportApiError(400, undefined, 'http', 'idempotency key was used with a different request') }
  await assert.rejects(store.createOrder(input))
  assert.equal(store.attempt.key, key)
  assert.equal(store.attempt.rejected, false)
  await assert.rejects(store.createOrder({ ...input, cart_id: 'another' }))
})

test('a lost retry response revokes permission to change a previously rejected request', async () => {
  const { store, api } = setup()
  store.saveAttempt({ key, input, rejected: true })
  api.post = async () => { throw createTransportApiError(undefined, undefined, 'network') }
  await assert.rejects(store.createOrder(input))
  assert.equal(store.attempt.rejected, false)
  await assert.rejects(store.createOrder({ ...input, coupon_code: 'SAVE' }))
})

test('an intentionally new identical order receives a fresh key', async () => {
  const { store, calls } = setup()
  await store.createOrder(input)
  store.forgetAttempt()
  await store.createOrder(input)
  assert.notEqual(calls[0].options.headers['Idempotency-Key'], calls[1].options.headers['Idempotency-Key'])
})

test('payment retry checks server status and pays the existing order without checkout', async () => {
  const { store: checkout, auth, api, calls } = setup()
  auth.isAuthenticated = true
  const { usePaymentStore } = await load('app/stores/payment.store.ts')
  const payments = usePaymentStore()
  payments.methods = [{ id: 'gateway' }]
  const redirects = []
  const events = []
  const orders = { current: null, async fetchOne(id) { events.push(id); this.current = { ...order } } }
  api.post = async (path, body) => { calls.push({ path, body }); return { redirect_url: 'https://gateway.test/pay' } }
  const dependencies = {
    defineProps: () => ({ orderId: order.id }), ref, onMounted() {},
    usePaymentStore: () => payments, useOrderStore: () => orders,
    useCheckoutStore: () => checkout, useAuthStore: () => auth,
    ApiError, getUserFriendlyApiErrorMessage, window: { location: { assign: url => redirects.push(url) } },
  }
  const component = await readFile(new URL('../app/components/payment/PaymentOrderRetry.vue', import.meta.url), 'utf8')
  const source = component.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
    + '\nreturn { methodId, retryPayment, error };'
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext } })
  const state = new Function(...Object.keys(dependencies), outputText)(...Object.values(dependencies))
  state.methodId.value = 'gateway'
  await state.retryPayment()
  assert.deepEqual(events, [order.id])
  assert.deepEqual(calls, [{ path: `/orders/${order.id}/payments`, body: { method_id: 'gateway' } }])
  assert.equal(checkout.attempt, null)
  assert.equal(redirects.length, 1)
  orders.fetchOne = async () => { orders.current = { ...order, status: 'cancelled' } }
  await state.retryPayment()
  assert.equal(calls.length, 1)
  assert.ok(state.error.value)
})

test('payment conflict and original method survive refresh', () => {
  const { store } = setup()
  store.saveAttempt({ key, input, orderId: order.id, paymentMethodId: 'zarinpal' })
  store.recordPaymentFailure(new ApiError('Conflict', 409))
  setActivePinia(createPinia())
  const reloaded = useCheckoutStore()
  reloaded.restoreAttempt()
  assert.equal(reloaded.attempt.paymentBlocked, true)
  assert.equal(reloaded.attempt.paymentMethodId, 'zarinpal')
})

test('only the documented 400 expiry error permits a new checkout, and survives reload', () => {
  const { store } = setup()
  store.saveAttempt({ key, input, orderId: order.id })
  store.recordPaymentFailure(createTransportApiError(400, undefined, 'http', 'Shipping unavailable'))
  assert.equal(store.attempt.checkoutExpired, undefined)
  store.recordPaymentFailure(createTransportApiError(409, undefined, 'http', 'checkout has expired'))
  assert.equal(store.attempt.checkoutExpired, undefined)
  store.recordPaymentFailure(createTransportApiError(400, undefined, 'http', 'checkout has expired'))
  assert.equal(store.attempt.checkoutExpired, true)
  setActivePinia(createPinia())
  const reloaded = useCheckoutStore()
  reloaded.restoreAttempt()
  assert.equal(reloaded.attempt.checkoutExpired, true)
  reloaded.forgetAttempt()
  assert.equal(reloaded.attempt, null)
})

Object.assign(globalThis, await load('server/utils/session.ts'))
Object.assign(globalThis, await load('server/utils/checkoutRequest.ts'))
Object.assign(globalThis, await load('server/utils/orderRequest.ts'))
Object.assign(globalThis, await load('server/utils/backendFetch.ts'))
globalThis.useRuntimeConfig = () => ({ backendUrl: 'https://backend.test' })

async function request(handler, body, cookie = 'auth_token=user', headers = {}) {
  const app = h3.createApp({ onError() {} }).use(h3.defineEventHandler(event => {
    event.context.params = { orderId: order.id }
    return handler(event)
  }))
  return h3.toWebHandler(app)(new Request('http://shop.test/api', {
    method: 'POST', headers: { cookie, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  }))
}

test('checkout proxy forwards user bearer, JSON and idempotency key; accepts minimal order', async () => {
  const handler = (await load('server/api/checkout/index.post.ts')).default
  const trackedInput = { ...input, torob_clid: 'click-1' }
  globalThis.$fetch = async (path, options) => {
    assert.equal(path, '/checkout')
    assert.equal(options.headers.get('Authorization'), 'Bearer user')
    assert.equal(options.headers.get('Idempotency-Key'), key)
    assert.equal(options.headers.get('Content-Type'), 'application/json')
    assert.equal(options.retry, 0)
    assert.deepEqual(options.body, trackedInput)
    return order
  }
  assert.equal((await request(handler, trackedInput, undefined, { 'Idempotency-Key': key })).status, 201)
  globalThis.$fetch = () => { throw new Error('Backend must not be called') }
  assert.equal((await request(handler, input)).status, 400)
  assert.equal((await request(handler, input, 'guest_token=guest', { 'Idempotency-Key': key })).status, 401)
})

test('payment proxy sends only method_id with user bearer and prevents automatic retries', async () => {
  const handler = (await load('server/api/orders/[orderId]/payments.post.ts')).default
  globalThis.$fetch = async (path, options) => {
    assert.equal(path, `/orders/${order.id}/payments`)
    assert.equal(options.headers.get('Authorization'), 'Bearer user')
    assert.equal(options.headers.get('Content-Type'), 'application/json')
    assert.equal(options.retry, 0)
    assert.deepEqual(options.body, { method_id: 'method-1' })
    return { payment_id: 'payment-1', redirect_url: 'https://gateway.test/pay/1' }
  }
  const result = await request(handler, { method_id: 'method-1', amount: 5, provider: 'fake' })
  assert.equal(result.status, 201)
  assert.deepEqual(await result.json(), { payment_id: 'payment-1', redirect_url: 'https://gateway.test/pay/1' })
  globalThis.$fetch = () => { throw new Error('Backend must not be called') }
  assert.equal((await request(handler, { method_id: 'method-1' }, 'guest_token=guest')).status, 401)
  assert.equal((await request(handler, { method_id: '' })).status, 400)
})

test('payment proxy rejects non-navigation URLs and preserves backend conflict messages', async () => {
  const handler = (await load('server/api/orders/[orderId]/payments.post.ts')).default
  globalThis.$fetch = async () => ({ payment_id: 'payment-1', redirect_url: 'javascript:alert(1)' })
  assert.equal((await request(handler, { method_id: 'method-1' })).status, 502)
  globalThis.$fetch = async () => { throw { response: { status: 409 }, data: { error: 'Payment attempt requires review' } } }
  const response = await request(handler, { method_id: 'method-1' })
  assert.equal(response.status, 409)
  assert.equal((await response.json()).data.validationMessage, 'Payment attempt requires review')
})
