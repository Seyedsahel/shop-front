import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { createError } from 'h3'
import { computed, nextTick, reactive, ref, watch } from 'vue'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}

Object.assign(globalThis, { createError, computed, ref, watch, toBackendImageUrl: value => value })
globalThis.ApiError = (await load('app/utils/api-error.ts')).ApiError
Object.assign(globalThis, await load('app/utils/productQuantity.ts'))
globalThis.onMounted = () => {}
const { useProductVariants } = await load('app/composables/useProductVariants.ts')
globalThis.useProductVariants = useProductVariants
const { mapProductDetail } = await load('server/utils/productDetail.ts')

function variant(variantId, stock, options) {
  return {
    variantId, sku: variantId, maxPerOrder: 0, finalPrice: 12, priceAdjustment: 0, stock,
    options: Object.entries(options).map(([slug, value]) => ({
      variantOptionId: variantId, attributeId: slug, slug, name: slug.toUpperCase(), value,
    })),
  }
}

test('detail mapper keeps purchase combination IDs, max order limit, and nested option fields', () => {
  const detail = mapProductDetail({ id: 'product', name: 'Product', slug: 'product', max_per_order: 3, price: { final: 12 }, purchase_variants: [{
    variant_id: 'purchase-id', sku: 'sku-1', max_per_order: 2, final_price: 15, price_adjustment: 3, stock: 2,
    options: [{ variant_option_id: 'option-id', attribute_id: 'attribute-id', slug: 'pack-size', name: 'Pack Size', value: '100 ml' }],
  }] })
  assert.deepEqual(detail.purchaseVariants[0], {
    variantId: 'purchase-id', sku: 'sku-1', maxPerOrder: 2, finalPrice: 15, priceAdjustment: 3, stock: 2,
    options: [{ variantOptionId: 'option-id', attributeId: 'attribute-id', slug: 'pack-size', name: 'Pack Size', value: '100 ml' }],
  })
  assert.equal(detail.maxPerOrder, 3)
})

test('selectors deduplicate values and constrain combinations in either order', () => {
  const variants = ref([
    variant('a', 5, { size: '100', color: 'red' }),
    variant('b', 4, { size: '100', color: 'blue' }),
    variant('c', 3, { size: '200', color: 'red' }),
  ])
  const selection = useProductVariants(() => variants.value)
  assert.deepEqual(selection.attributes.value.map(attribute => attribute.options.map(option => option.value)), [['100', '200'], ['red', 'blue']])

  selection.select('color', 'blue')
  assert.deepEqual(selection.attributes.value.find(attribute => attribute.slug === 'size').options.map(option => option.value), ['100'])
  assert.equal(selection.selectedVariant.value, null)
  selection.select('size', '100')
  assert.equal(selection.selectedVariant.value?.variantId, 'b')

  selection.select('size', '200')
  assert.deepEqual(selection.selectedOptions.value, { size: '200' })
  assert.deepEqual(selection.attributes.value.find(attribute => attribute.slug === 'color').options.map(option => option.value), ['red'])
  assert.equal(selection.selectedVariant.value, null)
  selection.select('color', 'red')
  assert.equal(selection.selectedVariant.value?.variantId, 'c')
})

test('missing dimension disables its selector and resolves the shorter combination', () => {
  const selection = useProductVariants(() => [
    variant('with-color', 2, { size: '100', color: 'red' }),
    variant('without-color', 2, { size: '500' }),
  ])
  selection.select('size', '500')
  assert.equal(selection.attributes.value.find(attribute => attribute.slug === 'color').disabled, true)
  assert.equal(selection.selectedVariant.value?.variantId, 'without-color')
})

test('stock disables unavailable choices and reset prefers the first purchasable combination', () => {
  const selection = useProductVariants(() => [
    variant('sold-out', 0, { size: '100' }),
    variant('available', 3, { size: '200' }),
  ])
  selection.reset()
  assert.equal(selection.selectedVariant.value?.variantId, 'available')
  assert.deepEqual(selection.attributes.value[0].options.map(option => option.available), [false, true])
})

test('duplicate or incomplete combinations never resolve an arbitrary cart ID', () => {
  const selection = useProductVariants(() => [
    variant('one', 2, { size: '100', color: 'red' }),
    variant('two', 2, { size: '100', color: 'red' }),
  ])
  selection.select('size', '100')
  assert.equal(selection.selectedVariant.value, null)
  selection.select('color', 'red')
  assert.equal(selection.selectedVariant.value, null)
})

test('purchase panel hides stock until resolved and sends only the purchase variant ID', async () => {
  const props = reactive({ product: {
    id: 'product', baseStock: 100, maxPerOrder: 3, price: { final: 12, original: 12, discountPercent: 0 },
    purchaseVariants: [
      variant('purchase-blue', 5, { size: '100', color: 'blue' }),
      variant('purchase-red', 4, { size: '200', color: 'red' }),
    ],
  } })
  const calls = []
  const warnings = []
  globalThis.useCartStore = () => ({ loaded: true, busy: false, stale: false, itemsForProduct: () => [], async addItem(...args) { calls.push(args) } })
  globalThis.useWishlistStore = () => ({ findItem: () => undefined, fetchWishlist: async () => {} })
  globalThis.useAppToast = () => ({ success() {}, warning(message) { warnings.push(message) }, error(message) { throw new Error(message) } })
  globalThis.defineProps = () => props

  const source = (await readFile(new URL('../app/components/product/ProductPurchasePanel.vue', import.meta.url), 'utf8'))
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const { outputText } = ts.transpileModule(source + '\nexport { addToCart, increaseQuantity, quantity, select, selectedVariant, availableStock }', {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  const panel = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
  assert.equal(panel.selectedVariant.value?.variantId, 'purchase-blue')
  panel.quantity.value = 3
  panel.select('size', '200')
  await nextTick()
  assert.equal(panel.selectedVariant.value, null)
  assert.equal(panel.availableStock.value, null)
  await panel.addToCart()
  assert.deepEqual(calls, [])

  panel.select('color', 'red')
  await nextTick()
  assert.equal(panel.quantity.value, 1)
  await panel.addToCart()
  assert.deepEqual(calls, [['product', 1, 'purchase-red']])
  panel.increaseQuantity()
  panel.increaseQuantity()
  assert.deepEqual(warnings, ['شما به محدودیت تعداد انتخابی برای سفارش این محصول رسیدید.'])
})

test('quick add uses the same nested variant selection and cart ID', async () => {
  const open = ref(true)
  const props = reactive({ product: { id: 'quick-product', slug: 'quick-product', maxPerOrder: 3, price: { final: 12 } } })
  const detailStore = reactive({ bySlug: {}, async loadBySlug(slug) {
    const detail = { baseStock: 20, maxPerOrder: 3, price: { final: 12 }, purchaseVariants: [
      variant('sold-out', 0, { size: '100' }),
      variant('available-purchase-id', 4, { size: '200' }),
    ] }
    this.bySlug[slug] = detail
    return detail
  } })
  const calls = []
  const warnings = []
  globalThis.useProductDetailStore = () => detailStore
  globalThis.useCartStore = () => ({
    loaded: true, busy: false, stale: false, itemsForProduct: () => [],
    async addItem(...args) { calls.push(args) },
  })
  globalThis.useAppToast = () => ({ success() {}, warning(message) { warnings.push(message) }, error(message) { throw new Error(message) } })
  globalThis.defineProps = () => props
  globalThis.defineModel = () => open

  const source = (await readFile(new URL('../app/components/product/ProductQuickAdd.vue', import.meta.url), 'utf8'))
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const { outputText } = ts.transpileModule(source + '\nexport { add, increaseQuantity, quantity, selectedVariant, loading }', {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  const quickAdd = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(quickAdd.loading.value, false)
  assert.equal(quickAdd.selectedVariant.value?.variantId, 'available-purchase-id')
  quickAdd.quantity.value = 3
  await quickAdd.add()
  assert.deepEqual(calls, [['quick-product', 3, 'available-purchase-id']])
  assert.equal(open.value, false)
  quickAdd.quantity.value = 1
  quickAdd.increaseQuantity()
  quickAdd.increaseQuantity()
  assert.deepEqual(warnings, ['شما به محدودیت تعداد انتخابی برای سفارش این محصول رسیدید.'])
})

async function componentScript(file, exports, suffix) {
  const source = (await readFile(new URL('../app/components/product/' + file, import.meta.url), 'utf8'))
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const { outputText } = ts.transpileModule(source + '\nexport { ' + exports + ' }', {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64') + '#' + suffix)
}

test('purchase panel counts existing variants, blocks excess adds and reclamps after cart changes', async () => {
  const props = reactive({ product: {
    id: 'p', baseStock: 10, maxPerOrder: 5, price: { final: 12, original: 12, discountPercent: 0 },
    purchaseVariants: [{ ...variant('blue', 10, { color: 'blue' }), maxPerOrder: 2 }, variant('red', 10, { color: 'red' })],
  } })
  const cart = reactive({ loaded: true, busy: false, stale: false,
    lines: [{ variant_id: 'blue', quantity: 1 }, { variant_id: 'red', quantity: 3 }],
    itemsForProduct() { return this.lines }, async addItem(...args) { calls.push(args) },
  })
  const calls = []
  globalThis.useCartStore = () => cart
  globalThis.useWishlistStore = () => ({ findItem: () => undefined })
  globalThis.useAppToast = () => ({ success() {}, warning() {}, error(message) { throw new Error(message) } })
  globalThis.defineProps = () => props
  const panel = await componentScript('ProductPurchasePanel.vue', 'addToCart, increaseQuantity, quantity, quantityLimits, select', 'cart-limits')
  assert.equal(panel.quantityLimits.value.maxAdditional, 1)
  panel.increaseQuantity()
  assert.equal(panel.quantity.value, 1)
  panel.quantity.value = 2
  await panel.addToCart()
  assert.equal(calls.length, 0)
  panel.quantity.value = 1
  await panel.addToCart()
  assert.deepEqual(calls, [['p', 1, 'blue']])
  cart.lines[0].quantity = 2
  await nextTick()
  assert.equal(panel.quantityLimits.value.maxAdditional, 0)
  await panel.addToCart()
  assert.equal(calls.length, 1)
  cart.lines[1].quantity = 0
  panel.select('color', 'red')
  await nextTick()
  panel.quantity.value = 3
  cart.lines[1].quantity = 2
  await nextTick()
  assert.equal(panel.quantity.value, 1)
  cart.loaded = false
  await panel.addToCart()
  assert.equal(calls.length, 1)
})

test('quick add uses remaining capacity for additions and total capacity for existing cart lines', async () => {
  const props = reactive({ product: { id: 'p', slug: 'p', maxPerOrder: 5, price: { final: 12 } } })
  const product = { id: 'p', baseStock: 10, maxPerOrder: 5, price: { final: 12 },
    purchaseVariants: [{ ...variant('blue', 10, { color: 'blue' }), maxPerOrder: 2 }] }
  const details = reactive({ bySlug: { p: product }, async loadBySlug() { return product } })
  const calls = []
  const cart = reactive({ loaded: true, busy: false, stale: false,
    lines: [
      { id: 'blue-line', product_id: 'p', variant_id: 'blue', quantity: 1, stock: 10, max_per_order: 2 },
      { id: 'red-line', product_id: 'p', variant_id: 'red', quantity: 3, stock: 10, max_per_order: 4 },
    ], itemsForProduct() { return this.lines },
    async addItem(...args) { calls.push(['add', ...args]) },
    async updateQuantity(...args) { calls.push(['update', ...args]) },
  })
  globalThis.useProductDetailStore = () => details
  globalThis.useCartStore = () => cart
  globalThis.useAppToast = () => ({ success() {}, warning() {} })
  globalThis.defineProps = () => props
  globalThis.defineModel = () => ref(true)
  const quick = await componentScript('ProductQuickAdd.vue', 'add, increaseQuantity, quantity, quantityLimits, changeCartLineQuantity', 'cart-limits')
  await new Promise(resolve => setImmediate(resolve))
  quick.increaseQuantity()
  assert.equal(quick.quantity.value, 1)
  quick.quantity.value = 2
  await quick.add()
  assert.equal(calls.length, 0)
  quick.quantity.value = 1
  await quick.add()
  assert.deepEqual(calls[0], ['add', 'p', 1, 'blue'])
  await quick.changeCartLineQuantity(cart.lines[0], 1)
  assert.deepEqual(calls[1], ['update', 'blue-line', 2, 5])
  cart.lines[0].quantity = 2
  await nextTick()
  await quick.changeCartLineQuantity(cart.lines[1], 1)
  assert.equal(calls.length, 2)
  await quick.changeCartLineQuantity(cart.lines[1], -1)
  assert.deepEqual(calls[2], ['update', 'red-line', 2, 5])
})

test('detail mapper rejects incomplete backend products with a controlled error', () => {
  assert.throws(() => mapProductDetail({ purchase_variants: [] }), error => error.statusCode === 502)
})
