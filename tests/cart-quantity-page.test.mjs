import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { ref, computed, watch, reactive } from 'vue'

const source = (await readFile(new URL('../app/pages/cart.vue', import.meta.url), 'utf8'))
  .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const { outputText: pageCode } = ts.transpileModule(source + '\nexport { changeQuantity, lineLimits, limitsReady, loadProductLimit }', {
  compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
})
const utility = await readFile(new URL('../app/utils/productQuantity.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(utility, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } })
Object.assign(globalThis, await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64')))
Object.assign(globalThis, { ref, computed, watch, callOnce: (_key, fn) => fn(), useSeoMeta() {} })

async function setup(fail = false) {
  const calls = []
  const cart = reactive({ cart: { id: 'cart' }, items: [
    { id: 'blue', product_id: 'p', slug: 'p', variant_id: 'blue', quantity: 1, stock: 10, max_per_order: 2, pricing: { total: 1 } },
    { id: 'red', product_id: 'p', slug: 'p', variant_id: 'red', quantity: 3, stock: 10, max_per_order: 4, pricing: { total: 3 } },
  ], async fetchCart() {}, async updateQuantity(...args) { calls.push(['update', ...args]) } })
  const details = reactive({ bySlug: {}, async loadBySlug(slug) {
    calls.push(['detail', slug])
    if (fail) throw new Error('offline')
    const detail = { id: 'p', maxPerOrder: 5 }
    this.bySlug[slug] = detail
    return detail
  } })
  Object.assign(globalThis, {
    useCartStore: () => cart,
    useProductDetailStore: () => details,
    useWishlistStore: () => ({}), useAuthStore: () => ({ sessionScope: 'user' }),
    useAddressStore: () => ({}), useCheckoutStore: () => ({}),
    useAppToast: () => ({ success() {}, warning() {}, error(message) { throw new Error(message) } }),
  })
  const page = await import('data:text/javascript;base64,' + Buffer.from(pageCode).toString('base64') + '#' + (fail ? 'failure' : 'success'))
  return { page, cart, calls, recover: () => { fail = false } }
}

test('cart page fetches one product detail for multiple variants and respects aggregate limits', async () => {
  const { page, cart, calls } = await setup()
  assert.deepEqual(calls, [['detail', 'p']])
  assert.equal(page.limitsReady(cart.items[0]), true)
  assert.equal(page.lineLimits(cart.items[0]).maxQuantity, 2)
  await page.changeQuantity(cart.items[0], 1)
  assert.deepEqual(calls[1], ['update', 'blue', 2, 5])
  cart.items[0].quantity = 2
  await page.changeQuantity(cart.items[1], 1)
  assert.equal(calls.length, 2)
  await page.changeQuantity(cart.items[1], -1)
  assert.deepEqual(calls[2], ['update', 'red', 2, 5])
})

test('failed limit lookup blocks only increases and can be retried', async () => {
  const { page, cart, calls, recover } = await setup(true)
  assert.equal(page.limitsReady(cart.items[1]), false)
  await page.changeQuantity(cart.items[1], 1)
  assert.equal(calls.length, 1)
  await page.changeQuantity(cart.items[1], -1)
  assert.deepEqual(calls[1], ['update', 'red', 2, 0])
  recover()
  await page.loadProductLimit('p')
  assert.equal(page.limitsReady(cart.items[1]), true)
  await page.changeQuantity(cart.items[1], 1)
  assert.deepEqual(calls.at(-1), ['update', 'red', 4, 5])
})
