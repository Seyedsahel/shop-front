import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { computed, effectScope, nextTick, reactive, ref, watch } from 'vue'
import { createPinia, defineStore, setActivePinia } from 'pinia'

let moduleId = 0
async function load(path, exports = '') {
  let source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  if (path.endsWith('.vue')) source = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const { outputText } = ts.transpileModule(source + exports + '\n// test instance ' + (++moduleId), {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}

Object.assign(globalThis, { computed, reactive, ref, watch, defineStore })
globalThis.ApiError = class extends Error {}
const errors = []
globalThis.useAppToast = () => ({ error: message => errors.push(message) })
Object.assign(globalThis, await load('app/utils/productBrowse.ts'), await load('app/utils/sortOptions.ts'))
Object.assign(globalThis, await load('app/stores/category.store.ts'), await load('app/stores/brand.store.ts'))
Object.assign(globalThis, await load('app/stores/filter.store.ts'), await load('app/stores/productList.store.ts'))

const categories = [
  { id: 'parent', slug: 'medicine', name: 'Medicine', parentId: '', imageUrl: '' },
  { id: 'leaf', slug: 'vitamins', name: 'Vitamins', parentId: 'parent', imageUrl: '' },
]
const brands = [{ id: 'brand', slug: 'canonical-brand', name: 'Brand', imageUrl: '' }]
const metadata = { attributes: [{ slug: 'size', name: 'Size', dataType: 'select', availableValues: ['small', 'large'] }], categories: [categories[1]], brands: [], priceRange: { min: 10, max: 1000 } }
const calls = []
let respond
function reset() {
  setActivePinia(createPinia())
  calls.length = 0
  errors.length = 0
  respond = async (path, body) => {
    if (path === '/categories') return { items: categories }
    if (path === '/brands') return { items: brands }
    if (path === '/products/filters') return metadata
    return { items: [{ id: 'product-' + (body.page ?? 1) }], total: 3, page: body.page ?? 1, limit: body.limit ?? 30 }
  }
  globalThis.useApi = () => ({
    get(path) { calls.push({ path }); return respond(path) },
    post(path, body) { calls.push({ path, body: JSON.parse(JSON.stringify(body)) }); return respond(path, body) },
  })
}
const tick = () => new Promise(resolve => setImmediate(resolve))
function deferred() { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }

async function page(query = {}, kind = 'catalog') {
  const route = reactive({ path: kind === 'catalog' ? '/products' : '/discounts/products', query, fullPath: '' })
  const fullPath = target => target.path + '?' + new URLSearchParams(Object.entries(target.query).filter(([, v]) => v !== undefined)).toString()
  route.fullPath = fullPath(route)
  const history = []
  const router = { resolve: target => ({ fullPath: fullPath(target) }), async push(target) {
    history.push({ path: route.path, query: { ...route.query }, fullPath: route.fullPath })
    Object.assign(route, target, { fullPath: fullPath(target) })
    await nextTick()
  } }
  const unmount = []
  const scope = effectScope()
  globalThis.useRoute = () => route
  globalThis.useRouter = () => router
  globalThis.defineProps = () => ({ collection: { kind } })
  globalThis.onMounted = () => {}
  globalThis.onBeforeUnmount = callback => unmount.push(callback)
  globalThis.useInfiniteScroll = () => {}
  globalThis.watch = (...args) => scope.run(() => watch(...args))
  const component = await load('app/components/product/ProductListPage.vue', '\nexport { loadProductsFromRoute, applyFilters, browseError, isResolving }')
  return { component, route, router, history, close() { unmount.forEach(callback => callback()); scope.stop() } }
}

test('query parsing preserves repeated facets and zero prices; invalid input never becomes an unfiltered query', () => {
  assert.deepEqual(getProductQueryList(['medicine,vitamins', 'medicine']), ['medicine', 'vitamins'])
  assert.equal(parseProductBrowseQuery({ priceMin: '0', priceMax: '10', page: '2' }).priceMin, 0)
  assert.throws(() => parseProductBrowseQuery({ priceMin: 'oops' }))
  assert.throws(() => parseProductBrowseQuery({ priceMin: '20', priceMax: '10' }))
  assert.throws(() => parseProductBrowseQuery({ filters: '[]' }))
  assert.throws(() => resolveProductFacetIds(['missing'], categories))
  assert.deepEqual(expandProductCategoryIds(['parent', 'leaf'], [
    ...categories,
    { id: 'grandchild', parentId: 'leaf' },
    { id: 'parent', parentId: 'grandchild' },
  ]), ['parent', 'leaf', 'grandchild'])
  assert.deepEqual(expandProductCategoryIds(['leaf'], categories), ['leaf'])
})

test('parent and omitted brand resolve canonically; list and metadata share category and discount scope', async () => {
  reset()
  const p = await page({ category: 'medicine', brand: 'canonical-brand', discount: 'campaign', search: 'pill', priceMin: '100', priceMax: '500', filters: '{"size":"large"}', page: '2' })
  try {
    await p.component.loadProductsFromRoute()
    assert.equal(p.component.browseError.value, '')
    const filter = calls.find(call => call.path === '/products/filters').body
    const list = calls.find(call => call.path === '/products/list').body
    assert.deepEqual(filter.categoryIds, ['parent', 'leaf'])
    assert.deepEqual(list.categoryIds, filter.categoryIds)
    assert.equal(filter.discountId, 'campaign')
    assert.equal(list.discountId, filter.discountId)
    assert.deepEqual(list.brandIds, ['brand'])
    assert.equal(list.search, 'pill')
    assert.equal(list.priceMin, 100)
    assert.equal(list.priceMax, 500)
    assert.equal(list.page, 2)
    assert.deepEqual(list.attributeFields, { size: ['large'] })
    assert.equal(useFilterStore().selectedCategories[0].slug, 'medicine')
    assert.equal(useFilterStore().selectedBrands[0].slug, 'canonical-brand')
    assert.equal(p.route.query.category, 'medicine')
    assert.equal(p.history.length, 0)
  } finally { p.close() }
})

test('Apply writes canonical slugs; changing only price/attributes/page and Back restores complete state', async () => {
  reset()
  const p = await page({ category: 'medicine', brand: 'canonical-brand' })
  try {
    await p.component.loadProductsFromRoute()
    const filters = useFilterStore()
    filters.setPriceRange(100, 500)
    filters.setValue('size', 'large')
    await p.component.applyFilters()
    await tick()
    assert.equal(p.route.query.category, 'medicine')
    assert.equal(p.route.query.priceMax, '500')
    assert.equal(p.history.length, 1)
    assert.equal(calls.at(-1).body.priceMax, 500)
    await p.router.push({ path: '/products', query: { ...p.route.query, priceMax: '400', filters: '{"size":"small"}', page: '2' } })
    await tick()
    assert.equal(calls.at(-1).body.priceMax, 400)
    assert.equal(calls.at(-1).body.page, 2)
    assert.deepEqual(calls.at(-1).body.attributeFields, { size: ['small'] })
    Object.assign(p.route, p.history[0])
    await nextTick(); await tick()
    assert.deepEqual(filters.selectedCategoryIds, ['parent'])
    assert.equal(filters.selectedPriceMax, 1000)
    assert.equal(filters.values.size, null)
    assert.equal(calls.at(-1).body.priceMax, undefined)
  } finally { p.close() }
})

test('an older filter request cannot overwrite a newer leaf scope', async () => {
  reset()
  const original = respond
  const held = deferred()
  respond = (path, body) => path === '/products/filters' && body.categoryIds?.[0] === 'parent' ? held.promise : original(path, body)
  const p = await page({ category: 'medicine' })
  try {
    const older = p.component.loadProductsFromRoute()
    await tick()
    await p.router.push({ path: '/products', query: { category: 'vitamins' } })
    await tick()
    held.resolve({ ...metadata, priceRange: { min: 999, max: 9999 } })
    await older
    assert.deepEqual(useFilterStore().selectedCategoryIds, ['leaf'])
    assert.equal(useFilterStore().priceRange.max, 1000)
    const lists = calls.filter(call => call.path === '/products/list')
    assert.equal(lists.length, 1)
    assert.deepEqual(lists[0].body.categoryIds, ['leaf'])
  } finally { p.close() }
})

test('load-more uses applied snapshots and late products cannot change state or another route', async () => {
  reset()
  const store = useProductListStore()
  const params = { context: { collection: { kind: 'catalog' }, categoryIds: ['parent'] }, request: { brandIds: ['brand'], attributeFields: { size: ['small'] }, page: 1 }, sort: 'relevant' }
  await store.fetchList(params)
  params.context.categoryIds[0] = 'leaf'
  params.request.brandIds[0] = 'other-brand'
  params.request.attributeFields.size[0] = 'large'
  await store.loadMore()
  assert.deepEqual(calls.at(-1).body.categoryIds, ['parent'])
  assert.deepEqual(calls.at(-1).body.brandIds, ['brand'])
  assert.deepEqual(calls.at(-1).body.attributeFields, { size: ['small'] })
  const held = deferred()
  respond = () => held.promise
  const pending = store.fetchList(params)
  store.invalidateListRequests()
  held.resolve({ items: [{ id: 'stale' }], total: 1, page: 1, limit: 30 })
  await pending
  assert.deepEqual(store.items, [])
})

test('discounted collection requests metadata with the same expanded canonical scope', async () => {
  reset()
  const p = await page({ category: 'medicine', brand: 'canonical-brand', priceMin: '0', priceMax: '500' }, 'discounted')
  try {
    await p.component.loadProductsFromRoute()
    const filter = calls.find(call => call.path === '/products/filters').body
    assert.equal(filter.collection.kind, 'discounted')
    assert.deepEqual(filter.categoryIds, ['parent', 'leaf'])
    const list = calls.find(call => call.path === '/discounts/products').body
    assert.deepEqual(list.categoryIds, ['parent', 'leaf'])
    assert.deepEqual(list.brandIds, ['brand'])
    assert.equal(list.priceMin, 0)
    assert.equal(list.priceMax, 500)
    assert.equal(useFilterStore().scopedMetadataAvailable, true)
    assert.deepEqual(useFilterStore().definitions, metadata.attributes)
    assert.equal(useFilterStore().categories.length, 2)
  } finally { p.close() }
})

test('failed canonical collections or unknown slugs do not issue an unfiltered list request', async () => {
  reset()
  const p = await page({ category: 'missing' })
  try {
    await p.component.loadProductsFromRoute()
    assert.ok(p.component.browseError.value)
    assert.equal(calls.some(call => call.path === '/products/list'), false)
    assert.equal(p.route.query.category, 'missing')
  } finally { p.close() }
  reset()
  respond = async () => { throw new Error('backend unavailable') }
  const failed = await page({ category: 'medicine' })
  try {
    await failed.component.loadProductsFromRoute()
    assert.ok(failed.component.browseError.value)
    assert.equal(calls.some(call => call.path === '/products/list'), false)
  } finally { failed.close() }
})


test('filter proxy forwards the captured category, campaign, and verified global-discount flag', async () => {
  let body = { collection: { kind: 'catalog' }, categoryIds: ['parent'], discountId: 'campaign', limit: 20 }
  const upstream = []
  globalThis.defineEventHandler = handler => handler
  globalThis.readBody = async () => body
  globalThis.toBackendImageUrl = value => value ?? ''
  globalThis.createError = options => Object.assign(new Error(options.message), options)
  globalThis.backendFetch = async (path, options) => {
    upstream.push({ path, body: options.body })
    return { attributes: [], brands: [], categories: [], min_price: 100, max_price: 500 }
  }
  const { default: handler } = await load('server/api/products/filters.post.ts')
  const response = await handler({})
  assert.deepEqual(upstream[0], { path: '/products/filters', body: { category_ids: ['parent'], discounted_only: undefined, discount_id: 'campaign', limit: 20 } })
  assert.deepEqual(response.priceRange, { min: 100, max: 500 })
  body = { collection: { kind: 'discounted' }, categoryIds: ['parent'] }
  await handler({})
  assert.equal(upstream.length, 2)
  assert.deepEqual(upstream[1].body, { category_ids: ['parent'], discounted_only: true, discount_id: undefined, limit: 20 })
})
