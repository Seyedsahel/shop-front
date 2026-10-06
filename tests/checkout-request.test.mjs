import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import * as h3 from 'h3'

const source = await readFile(new URL('../server/utils/checkoutRequest.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } })
const { readCheckoutInput } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))

Object.assign(globalThis, h3)
const deadlineSource = await readFile(new URL('../shared/utils/requestDeadline.ts', import.meta.url), 'utf8')
const deadlineCode = ts.transpileModule(deadlineSource, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText
Object.assign(globalThis, await import('data:text/javascript;base64,' + Buffer.from(deadlineCode).toString('base64')))

async function request(body) {
  const app = h3.createApp({ onError() {} }).use(h3.defineEventHandler(readCheckoutInput))
  const response = await h3.toWebHandler(app)(new Request('http://shop.test/checkout', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }))
  return { status: response.status, body: await response.json() }
}

test('checkout accepts backend string IDs and trims an optional coupon', async () => {
  const response = await request({ address_id: 'address-1', cart_id: 'cart-1', shipping_method_id: 'method-1', coupon_code: ' SAVE ', recipient_name: 'ignored', city_code: 331 })
  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { address_id: 'address-1', cart_id: 'cart-1', shipping_method_id: 'method-1', coupon_code: 'SAVE' })
})

test('checkout request requires an address ID or inline details', async () => {
  const response = await request({ cart_id: 'cart-1', shipping_method_id: 'pickup' })
  assert.equal(response.status, 400)
})

test('checkout forwards inline pickup and delivery details at the top level', async () => {
  for (const address of [
    { first_name: 'Ali', last_name: 'Ahmadi', phone: '09130744909' },
    { first_name: 'Ali', last_name: 'Ahmadi', phone: '09130744909', address: 'Street', province_code: 1, city_code: 11, postal_code: '1234567890' },
  ]) {
    const input = { cart_id: 'cart-1', shipping_method_id: 'method-1', address, torob_clid: 'click-1' }
    const response = await request(input)
    assert.equal(response.status, 200)
    assert.deepEqual(response.body, input)
  }
})

test('checkout rejects ambiguous address sources and malformed inline values', async () => {
  for (const extra of [
    { address_id: 'saved-1', address: { first_name: 'Ali' } },
    { address: null }, { address: [] }, { address: {} },
    { address: { phone: 123 } }, { address: { city_code: '11' } },
    { address: { province_code: -1 } }, { address_id: '' },
  ]) {
    const response = await request({ cart_id: 'cart-1', shipping_method_id: 'method-1', ...extra })
    assert.equal(response.status, 400)
  }
})

test('checkout rejects empty required IDs', async () => {
  const response = await request({ cart_id: '', shipping_method_id: 'pickup' })
  assert.equal(response.status, 400)
})

test('backend validation text is preserved instead of exposing the fetch URL', async () => {
  const backendSource = (await readFile(new URL('../server/utils/backendFetch.ts', import.meta.url), 'utf8'))
    .replace(/^import .* from ['"]\.\/session['"]\n/m, '')
  const { outputText: backendCode } = ts.transpileModule(backendSource, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } })
  const { backendFetch } = await import('data:text/javascript;base64,' + Buffer.from(backendCode).toString('base64'))
  globalThis.useRuntimeConfig = () => ({ backendUrl: 'http://backend.test' })
  globalThis.resolveCredential = () => null
  globalThis.$fetch = async () => {
    throw { response: { status: 400 }, data: { error: 'Shipping method unavailable for this address' } }
  }
  await assert.rejects(
    backendFetch('/api/checkout/preview', { authorization: 'none' }),
    error => error.statusCode === 400 && error.message === 'Shipping method unavailable for this address',
  )
})
