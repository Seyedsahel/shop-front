import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'
import * as h3 from 'h3'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}

Object.assign(globalThis, h3)
globalThis.resolveCredential = event => h3.getCookie(event, 'auth_token') ? { kind: 'user' } : null
Object.assign(globalThis, await load('server/utils/orderRequest.ts'))
globalThis.useRuntimeConfig = () => ({ public: { imageBaseUrl: 'https://images.test' }, backendUrl: 'https://backend.test' })
Object.assign(globalThis, await load('server/utils/imageProxy.ts'))
const handler = (await load('server/api/orders/[orderId].get.ts')).default
const orderId = '00000000-0000-0000-0000-000000000001'

async function request(cookie = 'auth_token=user') {
  const app = h3.createApp({ onError() {} }).use(h3.defineEventHandler(event => {
    event.context.params = { orderId }
    return handler(event)
  }))
  return h3.toWebHandler(app)(new Request('http://shop.test/order', { headers: { cookie } }))
}

test('order thumbnails are proxied and looked up once per product without changing purchased values', async () => {
  const items = [
    { id: 'one', product_id: 'product', product_name: 'Purchased name', unit_price: 100, quantity: 2, total_amount: 180 },
    { id: 'two', product_id: 'product', product_name: 'Other variant', unit_price: 200, quantity: 1, total_amount: 200 },
  ]
  const calls = []
  globalThis.backendFetch = async (path, options) => {
    calls.push(path)
    if (path === `/orders/${orderId}`) {
      assert.equal(options.authorization, 'user')
      return { id: orderId, total_amount: 380, items }
    }
    assert.equal(path, '/products/product')
    assert.equal(options.authorization, 'none')
    assert.equal(options.timeout, 2500)
    return { name: 'Changed catalog name', thumbnail_url: 'products/photo.jpg' }
  }
  const response = await request()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual((await response.json()).items, items.map(item => ({ ...item, image_url: '/api/images/products/photo.jpg' })))
  assert.deepEqual(calls, [`/orders/${orderId}`, '/products/product'])
})

test('unavailable catalog products preserve order items and supplied images need no lookup', async () => {
  const items = [
    { id: 'deleted', product_id: 'deleted', product_name: 'Historical product', quantity: 1, total_amount: 10 },
    { id: 'image', product_id: 'existing', image_url: 'products/existing.jpg' },
  ]
  globalThis.backendFetch = async path => {
    if (path === `/orders/${orderId}`) return { id: orderId, items }
    assert.equal(path, '/products/deleted')
    throw h3.createError({ statusCode: 404 })
  }
  const response = await request()
  assert.equal(response.status, 200)
  assert.deepEqual((await response.json()).items, [
    { ...items[0], image_url: '' },
    { ...items[1], image_url: '/api/images/products/existing.jpg' },
  ])
})

test('anonymous requests are rejected before retrieving orders or product images', async () => {
  globalThis.backendFetch = () => { throw new Error('Unexpected backend request') }
  assert.equal((await request('')).status, 401)
})
