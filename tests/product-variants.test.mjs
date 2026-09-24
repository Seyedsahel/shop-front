import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { computed, nextTick, reactive, ref, watch } from 'vue'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}

Object.assign(globalThis, { computed, ref, watch, toBackendImageUrl: value => value })
globalThis.ApiError = (await load('app/utils/api-error.ts')).ApiError
globalThis.onMounted = () => {}
const { useProductVariants } = await load('app/composables/useProductVariants.ts')
globalThis.useProductVariants = useProductVariants
const { mapProductDetail } = await load('server/utils/productDetail.ts')

function variant(variantId, stock, options) {
  return {
    variantId, sku: variantId, finalPrice: 12, priceAdjustment: 0, stock,
    options: Object.entries(options).map(([slug, value]) => ({
      variantOptionId: variantId, attributeId: slug, slug, name: slug.toUpperCase(), value,
    })),
  }
}

test('detail mapper keeps purchase combination IDs and nested option fields', () => {
  const detail = mapProductDetail({ id: 'product', price: { final: 12 }, purchase_variants: [{
    variant_id: 'purchase-id', sku: 'sku-1', final_price: 15, price_adjustment: 3, stock: 2,
    options: [{ variant_option_id: 'option-id', attribute_id: 'attribute-id', slug: 'pack-size', name: 'Pack Size', value: '100 ml' }],
  }] })
  assert.deepEqual(detail.purchaseVariants[0], {
    variantId: 'purchase-id', sku: 'sku-1', finalPrice: 15, priceAdjustment: 3, stock: 2,
    options: [{ variantOptionId: 'option-id', attributeId: 'attribute-id', slug: 'pack-size', name: 'Pack Size', value: '100 ml' }],
  })
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
    id: 'product', baseStock: 100, price: { final: 12, original: 12, discountPercent: 0 },
    purchaseVariants: [
      variant('purchase-blue', 5, { size: '100', color: 'blue' }),
      variant('purchase-red', 4, { size: '200', color: 'red' }),
    ],
  } })
  const calls = []
  globalThis.useCartStore = () => ({ busy: false, stale: false, async addItem(...args) { calls.push(args) } })
  globalThis.useWishlistStore = () => ({ findItem: () => undefined, fetchWishlist: async () => {} })
  globalThis.useAppToast = () => ({ success() {}, error(message) { throw new Error(message) } })
  globalThis.defineProps = () => props

  const source = (await readFile(new URL('../app/components/product/ProductPurchasePanel.vue', import.meta.url), 'utf8'))
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const { outputText } = ts.transpileModule(source + '\nexport { addToCart, quantity, select, selectedVariant, availableStock }', {
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
})

test('quick add uses the same nested variant selection and cart ID', async () => {
  const open = ref(true)
  const props = reactive({ product: { id: 'quick-product', slug: 'quick-product', price: { final: 12 } } })
  const detailStore = reactive({ bySlug: {}, async loadBySlug(slug) {
    const detail = { baseStock: 20, price: { final: 12 }, purchaseVariants: [
      variant('sold-out', 0, { size: '100' }),
      variant('available-purchase-id', 4, { size: '200' }),
    ] }
    this.bySlug[slug] = detail
    return detail
  } })
  const calls = []
  globalThis.useProductDetailStore = () => detailStore
  globalThis.useCartStore = () => ({
    busy: false, stale: false, itemsForProduct: () => [],
    async addItem(...args) { calls.push(args) },
  })
  globalThis.useAppToast = () => ({ success() {}, error(message) { throw new Error(message) } })
  globalThis.defineProps = () => props
  globalThis.defineModel = () => open

  const source = (await readFile(new URL('../app/components/product/ProductQuickAdd.vue', import.meta.url), 'utf8'))
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const { outputText } = ts.transpileModule(source + '\nexport { add, quantity, selectedVariant, loading }', {
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
})
