import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import * as h3 from 'h3'
import { ref, computed, watch, reactive, nextTick } from 'vue'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}

const { normalizeCheckoutAddress, checkoutAddressErrors, checkoutAddressPayload, checkoutInlineAddressPayload } = await load('app/utils/checkoutAddress.ts')
Object.assign(globalThis, h3)
const { readAddressInput } = await load('server/utils/addressRequest.ts')
const pickup = { first_name: true, last_name: true, phone: true }
const courier = { address: true, city_code: true, phone: true, province_code: true, recipient_name: true }
const post = { ...courier, first_name: true, last_name: true, postal_code: true, recipient_name: false }
const provinces = [{ code: 1, cities: [{ code: 11 }] }]
const draft = { name: '', first_name: ' Ali ', last_name: ' Ahmadi ', phone: '۰۹۱۳۰۷۴۴۹۰۹', province_code: 0, city_code: 0, postal_code: '', address: '' }

test('pickup inline details contain only first name, last name and phone', () => {
  const input = normalizeCheckoutAddress({ ...draft, name: 'Home', address: 'Street', province_code: 1, city_code: 11, postal_code: '1234567890' })
  assert.deepEqual(checkoutAddressErrors(input, pickup, []), {})
  assert.deepEqual(checkoutInlineAddressPayload(input, true), { first_name: 'Ali', last_name: 'Ahmadi', phone: '09130744909' })
})

test('a pickup address requires completion after changing to courier or post', () => {
  const input = normalizeCheckoutAddress(draft)
  assert.deepEqual(Object.keys(checkoutAddressErrors(input, courier, provinces)).sort(), ['address', 'city_code', 'province_code'])
  assert.deepEqual(Object.keys(checkoutAddressErrors(input, post, provinces)).sort(), ['address', 'city_code', 'postal_code', 'province_code'])
})

test('first and last name requirements apply even when recipient_name is false', () => {
  const input = normalizeCheckoutAddress({ ...draft, first_name: '', last_name: '', province_code: 1, city_code: 11, address: 'Street', postal_code: '۱۲۳۴۵۶۷۸۹۰' })
  assert.deepEqual(Object.keys(checkoutAddressErrors(input, post, provinces)).sort(), ['first_name', 'last_name'])
})

test('courier does not require postal code; post validates it and the selected city', () => {
  const input = normalizeCheckoutAddress({ ...draft, province_code: 1, city_code: 11, address: 'Street' })
  assert.deepEqual(checkoutAddressErrors(input, courier, provinces), {})
  assert.deepEqual(Object.keys(checkoutAddressErrors(input, post, provinces)), ['postal_code'])
  assert.deepEqual(Object.keys(checkoutAddressErrors({ ...input, city_code: 22, postal_code: '1234567890' }, post, provinces)), ['city_code'])
})

test('editing pickup recipient details preserves an existing saved delivery address', () => {
  const input = normalizeCheckoutAddress({ ...draft, name: 'Home', province_code: 1, city_code: 11, address: 'Street', postal_code: '1234567890' })
  assert.deepEqual(checkoutAddressPayload(input, input.name), input)
})

test('address proxy rejects malformed supplied fields instead of requiring absent ones', async () => {
  for (const body of [{ phone: 123 }, { province_code: 0 }, {}, { city_code: '11' }]) {
    const app = h3.createApp({ onError() {} }).use(h3.defineEventHandler(readAddressInput))
    const response = await h3.toWebHandler(app)(new Request('http://shop.test/addresses', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    }))
    assert.equal(response.status, 400)
  }
})

async function setupCheckout() {
  const calls = []
  const addresses = reactive({ items: [], mutating: false, async create(input) {
    calls.push(input)
    const address = { id: 'address-' + calls.length, ...input, phone_number: input.phone }
    this.items.push(address)
    return address
  } })
  const checkout = reactive({ methods: [
    { id: 'pickup', code: 'local_pickup', address_requirements: pickup },
    { id: 'courier', code: 'bike_courier', address_requirements: courier },
    { id: 'post', code: 'tapin_post', address_requirements: post },
  ], couponCode: '', clearPreview() {}, async fetchPreview() {} })
  const locations = reactive({ loaded: true, provinces })
  const dependencies = {
    ref, computed, watch, definePageMeta() {}, onMounted() {},
    useCartStore: () => reactive({ cart: { id: 'cart-1' } }),
    useAddressStore: () => addresses,
    useShippingLocationsStore: () => locations,
    useCheckoutStore: () => checkout, useAuthStore: () => ({ isAuthenticated: true }),
    usePaymentStore: () => ({}), useOrderStore: () => ({}),
    useAppToast: () => ({ success() {}, error(message) { assert.fail(message) } }),
    normalizeCheckoutAddress, checkoutAddressErrors, checkoutAddressPayload, checkoutInlineAddressPayload,
  }
  const page = await readFile(new URL('../app/pages/checkout.vue', import.meta.url), 'utf8')
  const source = page.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
    + '\nreturn { draft, selectedMethodId, submitAddress, selectAddress, addAddress, currentInput, errors, saveToAccount };'
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext } })
  const state = new Function(...Object.keys(dependencies), outputText)(...Object.values(dependencies))
  return { state, calls, addresses, locations }
}

const deliveryDraft = { ...draft, province_code: 1, city_code: 11, address: 'Street', postal_code: '1234567890' }

test('pickup never creates an address, even with save toggled or saved delivery details selected', async () => {
  const { state, calls, addresses, locations } = await setupCheckout()
  state.selectedMethodId.value = 'pickup'
  locations.loaded = false
  state.draft.value = { ...deliveryDraft }
  state.saveToAccount.value = true
  await state.submitAddress()
  assert.equal(calls.length, 0)
  assert.deepEqual(state.currentInput.value, { cart_id: 'cart-1', address: { first_name: 'Ali', last_name: 'Ahmadi', phone: '09130744909' }, shipping_method_id: 'pickup' })
  const saved = { id: 'saved-1', ...deliveryDraft, phone_number: '09130744909' }
  addresses.items.push(saved)
  state.selectAddress(saved)
  assert.equal(state.currentInput.value.address_id, undefined)
  assert.deepEqual(Object.keys(state.currentInput.value.address).sort(), ['first_name', 'last_name', 'phone'])
})

test('delivery confirmation sends inline details without saving, while the toggle saves and uses an ID', async () => {
  const { state, calls } = await setupCheckout()
  state.selectedMethodId.value = 'post'
  state.draft.value = { ...deliveryDraft }
  await state.submitAddress()
  assert.equal(calls.length, 0)
  assert.equal(state.currentInput.value.address_id, undefined)
  assert.equal(state.currentInput.value.address.address, 'Street')
  assert.equal(state.currentInput.value.address.name, undefined)
  state.saveToAccount.value = true
  assert.equal(state.currentInput.value, null)
  await state.submitAddress()
  assert.equal(calls.length, 1)
  assert.equal(state.currentInput.value.address_id, 'address-1')
  assert.equal(state.currentInput.value.address, undefined)
})

test('saved addresses are validated for the method, and missing fields can be completed inline without modifying the record', async () => {
  const { state, calls, addresses } = await setupCheckout()
  const saved = { id: 'saved-1', ...deliveryDraft, postal_code: '', phone_number: '09130744909' }
  addresses.items.push(saved)
  state.selectedMethodId.value = 'courier'
  state.selectAddress(saved)
  assert.equal(state.currentInput.value.address_id, 'saved-1')
  state.selectedMethodId.value = 'post'
  await nextTick()
  assert.equal(state.currentInput.value, null)
  assert.ok(state.errors.value.postal_code)
  state.draft.value.postal_code = '۱۲۳۴۵۶۷۸۹۰'
  await state.submitAddress()
  assert.equal(calls.length, 0)
  assert.equal(saved.postal_code, '')
  assert.equal(state.currentInput.value.address.postal_code, '1234567890')
  state.draft.value.phone = 'invalid'
  assert.equal(state.currentInput.value, null)
})
