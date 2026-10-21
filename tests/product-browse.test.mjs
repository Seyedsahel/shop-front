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
  source = source.replace("from '@vueuse/core'", `from '${import.meta.resolve('@vueuse/core')}'`)
  const { outputText } = ts.transpileModule(source + exports + '\n// test instance ' + (++moduleId), {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}

Object.assign(globalThis, { computed, reactive, ref, watch, nextTick, defineStore, useState: (_key, initial) => ref(initial()), usePageResponse: () => () => {}, usePageSeo: () => {}, callOnce: async () => {} })
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

test('search bar sends an accepted semantic sort key through the product store', async () => {
  reset()
  globalThis.defineProps = () => ({ query: '  vitamins  ', limit: 12 })
  globalThis.withDefaults = (props, defaults) => ({ ...defaults, ...props })
  globalThis.defineEmits = () => () => {}
  globalThis.onBeforeUnmount = () => {}
  const originalWatch = globalThis.watch
  globalThis.watch = () => {}
  try {
    const component = await load('app/components/product/SearchResultsPanel.vue', '\nexport { runSearch }')
    await component.runSearch('vitamins')
    await tick()
    assert.deepEqual(calls, [{ path: '/products/list', body: {
      search: 'vitamins', page: 1, limit: 12, sortBy: 'price', sortDir: 'desc',
    } }])
    assert.equal(useProductListStore().searchError, '')
    assert.equal(useProductListStore().searchItems.length, 1)
  } finally { globalThis.watch = originalWatch }
})

async function page(query = {}, kind = 'catalog') {
  const route = reactive({ path: kind === 'catalog' ? '/products' : '/discounts/products', query, fullPath: '' })
  const fullPath = target => target.path + '?' + new URLSearchParams(Object.entries(target.query).filter(([, v]) => v !== undefined)).toString()
  route.fullPath = fullPath(route)
  const history = []
  const navigationHooks = new Set()
  const confirmed = ref(route)
  const router = {
    currentRoute: confirmed,
    afterEach(callback) { navigationHooks.add(callback); return () => navigationHooks.delete(callback) },
    resolve: target => ({ fullPath: fullPath(target) }), async push(target) {
    history.push({ path: route.path, query: { ...route.query }, fullPath: route.fullPath })
    const next = { ...target, fullPath: fullPath(target) }
    const previous = { path: route.path, query: { ...route.query }, fullPath: route.fullPath }
    confirmed.value = next
    navigationHooks.forEach(callback => callback(next, previous))
    Object.assign(route, next)
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
  return { component, route, router, history, navigationHooks, confirmed, close() { unmount.forEach(callback => callback()); scope.stop() } }
}

test('client setup exposes loading before an empty collection request finishes', { timeout: 2000 }, async () => {
  const originalCallOnce = globalThis.callOnce
  try {
    for (const kind of ['catalog', 'discounted']) {
      reset()
      const normal = respond
      const held = deferred()
      respond = (path, body) => path === '/products/list' || path === '/discounts/products' ? held.promise : normal(path, body)
      let pending
      globalThis.callOnce = (_key, callback) => (pending = callback())
      const p = await page({}, kind)
      try {
        await tick()
        assert.equal(p.component.isResolving.value, true)
        assert.equal(useProductListStore().isLoading, true)
        assert.equal(useProductListStore().loaded, false)
        held.resolve({ items: [], total: 0, page: 1, limit: 30 })
        await pending
        assert.equal(p.component.isResolving.value, false)
        assert.equal(useProductListStore().isLoading, false)
        assert.equal(useProductListStore().loaded, true)
        assert.deepEqual(useProductListStore().items, [])
      } finally { p.close() }
    }
  } finally { globalThis.callOnce = originalCallOnce }
})

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
    await p.router.push(p.history[0])
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
  const params = { context: { collection: { kind: 'catalog' }, categoryIds: ['parent'] }, request: { brandIds: ['brand'], attributeFields: { size: ['small'] }, page: 1, limit: 1 }, sort: 'relevant' }
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

test('optional brand, category and filter outages do not block unfiltered browsing or search', async () => {
  for (const kind of ['catalog', 'discounted']) {
    for (const unavailable of ['/brands', '/categories', '/products/filters']) {
      reset()
      const normal = respond
      respond = (path, body) => path === unavailable ? Promise.reject(new Error('Unavailable')) : normal(path, body)
      const p = await page({ search: 'vitamins', priceMin: '0', priceMax: '500', page: '2' }, kind)
      try {
        await p.component.loadProductsFromRoute()
        assert.equal(p.component.browseError.value, '', unavailable)
        assert.equal(useProductListStore().loaded, true)
        const list = calls.find(call => call.path === (kind === 'catalog' ? '/products/list' : '/discounts/products'))
        assert.equal(list.body.search, 'vitamins')
        assert.equal(list.body.priceMin, 0)
        assert.equal(list.body.priceMax, 500)
        assert.equal(list.body.page, 2)
        await p.component.applyFilters('cheapest')
        await tick()
        assert.equal(p.route.query.search, 'vitamins')
        assert.equal(p.route.query.priceMin, '0')
        assert.equal(p.route.query.priceMax, '500')
        assert.equal(calls.at(-1).body.sortBy, 'price')
      } finally { p.close() }
    }
  }
})

test('failed filter metadata preserves selected category, brand, attributes and price across sorting', async () => {
  reset()
  const normal = respond
  respond = (path, body) => path === '/products/filters' ? Promise.reject(new Error('Unavailable')) : normal(path, body)
  const p = await page({ category: 'medicine', brand: 'canonical-brand', priceMin: '100', filters: '{"size":"large","color":["red"]}' })
  try {
    await p.component.loadProductsFromRoute()
    assert.equal(p.component.browseError.value, '')
    assert.deepEqual(calls.at(-1).body.categoryIds, ['parent', 'leaf'])
    assert.deepEqual(calls.at(-1).body.brandIds, ['brand'])
    assert.deepEqual(calls.at(-1).body.attributeFields, { size: ['large'], color: ['red'] })
    await p.component.applyFilters('newest')
    await tick()
    assert.equal(p.route.query.category, 'medicine')
    assert.equal(p.route.query.brand, 'canonical-brand')
    assert.deepEqual(calls.at(-1).body.attributeFields, { size: ['large'], color: ['red'] })
    assert.equal(calls.at(-1).body.priceMin, 100)
  } finally { p.close() }
})

test('an unavailable selected brand cannot silently broaden a scoped request', async () => {
  reset()
  const normal = respond
  respond = (path, body) => path === '/brands' ? Promise.reject(new Error('Unavailable')) : normal(path, body)
  const p = await page({ brand: 'canonical-brand' })
  try {
    await p.component.loadProductsFromRoute()
    assert.ok(p.component.browseError.value)
    assert.equal(calls.some(call => call.path === '/products/list'), false)
    assert.equal(p.route.query.brand, 'canonical-brand')
  } finally { p.close() }
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
  Object.assign(globalThis, await load('server/utils/productRequest.ts'))
  const { default: handler } = await load('server/api/products/filters.post.ts')
  const response = await handler({})
  assert.deepEqual(upstream[0], { path: '/products/filters', body: { category_ids: ['parent'], discounted_only: undefined, discount_id: 'campaign', limit: 20 } })
  assert.deepEqual(response.priceRange, { min: 100, max: 500 })
  body = { collection: { kind: 'discounted' }, categoryIds: ['parent'] }
  await handler({})
  assert.equal(upstream.length, 2)
  assert.deepEqual(upstream[1].body, { category_ids: ['parent'], discounted_only: true, discount_id: undefined, limit: 20 })
})


test('normalized identity ignores query spelling, parameter order, tracking, and empty attributes', () => {
  const first = { category: 'vitamins,medicine', brand: ['b,a', 'b'], search: ' pill ', page: '01', sort: 'relevant', priceMin: '10.0', filters: '{"size":["large","small","large"],"empty":null}', utm_source: 'first' }
  const equivalent = { category: ['medicine', 'vitamins'], brand: 'a,b', search: 'pill', priceMin: '10', filters: '{"size":["small","large"]}', utm_source: 'second' }
  assert.equal(getProductBrowseQueryKey(first), getProductBrowseQueryKey(equivalent))
  assert.notEqual(getProductBrowseQueryKey({ page: '1' }), getProductBrowseQueryKey({ page: '2' }))
  assert.notEqual(getProductBrowseQueryKey({ priceMax: 'bad' }), getProductBrowseQueryKey({ priceMax: 'worse' }))
})

test('sort-only and page-only navigation synchronize state; unrelated URL changes do not reload', async () => {
  reset()
  const p = await page({ category: 'medicine' })
  try {
    await p.component.loadProductsFromRoute()
    await p.router.push({ path: '/products', query: { category: 'medicine', sort: 'cheapest' } })
    await tick()
    assert.equal(useProductListStore().sort, 'cheapest')
    assert.equal(calls.at(-1).body.sortBy, 'price')
    await p.router.push({ path: '/products', query: { ...p.route.query, page: '2' } })
    await tick()
    assert.equal(useProductListStore().page, 2)
    const count = calls.length
    await p.router.push({ path: '/products', query: { ...p.route.query, utm_source: 'newsletter' } })
    p.route.fullPath += '#products'
    await nextTick(); await tick()
    assert.equal(calls.length, count)
    assert.equal(useProductListStore().page, 2)
  } finally { p.close() }
})

test('every sort option reaches both collections with facets, page reset and sorted load-more', async () => {
  const options = [
    ['relevant', 'relevance', 'desc'], ['newest', 'created_at', 'desc'],
    ['cheapest', 'price', 'asc'], ['most-expensive', 'price', 'desc'],
  ]
  for (const kind of ['catalog', 'discounted']) {
    reset()
    const p = await page({ category: 'medicine', brand: 'canonical-brand', search: 'pill', discount: 'campaign', page: '2' }, kind)
    try {
      useProductListStore().limit = 1
      await p.component.loadProductsFromRoute()
      for (const [id, sortBy, sortDir] of options) {
        await p.component.applyFilters(id)
        await tick()
        const expectedPath = kind === 'catalog' ? '/products/list' : '/discounts/products'
        const request = calls.filter(call => call.path === expectedPath).at(-1).body
        assert.equal(request.sortBy, sortBy)
        assert.equal(request.sortDir, sortDir)
        assert.equal(request.page, 1)
        assert.equal(p.route.query.page, undefined)
        assert.equal(p.route.query.sort, id === 'relevant' ? undefined : id)
        assert.equal(p.route.query.search, 'pill')
        assert.equal(request.discountId, 'campaign')
        assert.deepEqual(request.categoryIds, ['parent', 'leaf'])
        assert.deepEqual(request.brandIds, ['brand'])
        await useProductListStore().loadMore()
        const appended = calls.at(-1).body
        assert.equal(appended.page, 2)
        assert.equal(appended.sortBy, sortBy)
        assert.equal(appended.sortDir, sortDir)
      }
    } finally { p.close() }
  }
})

test('confirmed navigation invalidates products before Nuxt updates its route or unmounts', async () => {
  reset()
  const original = respond
  const held = deferred()
  respond = (path, body) => path === '/products/list' ? held.promise : original(path, body)
  const p = await page({ category: 'medicine' })
  try {
    const loading = p.component.loadProductsFromRoute()
    await tick()
    assert.equal(useProductListStore().isLoading, true)
    const to = { path: '/blog', query: {}, fullPath: '/blog' }
    p.confirmed.value = to
    p.navigationHooks.forEach(callback => callback(to, p.route))
    // The old component's Nuxt route deliberately still says /products.
    held.resolve({ items: [{ id: 'obsolete' }], total: 1, page: 1, limit: 30 })
    await loading; await nextTick()
    assert.deepEqual(useProductListStore().items, [])
    assert.equal(useProductListStore().browseRequest, null)
    assert.equal(p.route.query.category, 'medicine')
    assert.equal(p.history.length, 0)
  } finally { p.close() }
  assert.equal(p.navigationHooks.size, 0)
})

test('leaving either product collection preserves content while Home or detail is pending and ignores late appends', async () => {
  for (const destination of ['/', '/products/product-1']) {
  for (const kind of ['catalog', 'discounted']) {
    reset()
    const p = await page({ category: 'medicine', search: 'pill' }, kind)
    try {
      const store = useProductListStore()
      store.limit = 1
      await p.component.loadProductsFromRoute()
      const items = [...store.items]
      const definitions = [...useFilterStore().definitions]
      const held = deferred()
      respond = () => held.promise
      const append = store.loadMore()
      assert.equal(store.isLoadingMore, true)
      const target = { path: destination, query: {}, fullPath: destination }
      p.confirmed.value = target
      p.navigationHooks.forEach(callback => callback(target, p.route))
      await nextTick()
      assert.equal(p.component.isResolving.value, false, 'Leaving must not activate the list loader')
      assert.equal(store.isLoading, false)
      assert.equal(store.isLoadingMore, false)
      assert.deepEqual(store.items, items)
      assert.equal(store.listSearch, 'pill')
      assert.equal(store.loaded, true)
      assert.equal(useFilterStore().scopedMetadataAvailable, true)
      assert.deepEqual(useFilterStore().definitions, definitions)
      held.resolve({ items: [{ id: 'obsolete' }], total: 3, page: 2, limit: 1 })
      await append
      assert.deepEqual(store.items, items, 'Late responses cannot change the outgoing list')
    } finally { p.close() }
    assert.deepEqual(useProductListStore().items, [], 'Clear list state only once unmounted')
  }
  }
})

test('returning before Nuxt commits another page resumes the unchanged browsing route', async () => {
  reset()
  const p = await page({ category: 'medicine' })
  try {
    await p.component.loadProductsFromRoute()
    const original = { path: p.route.path, query: { ...p.route.query }, fullPath: p.route.fullPath }
    const away = { path: '/blog', query: {}, fullPath: '/blog' }
    p.confirmed.value = away
    p.navigationHooks.forEach(callback => callback(away, original))
    p.confirmed.value = original
    p.navigationHooks.forEach(callback => callback(original, away))
    await nextTick(); await tick()
    assert.equal(p.component.isResolving.value, false)
    assert.equal(useProductListStore().items.length, 1)
    assert.deepEqual(useFilterStore().selectedCategoryIds, ['parent'])
    assert.equal(calls.filter(call => call.path === '/products/list').length, 2)
  } finally { p.close() }
})

test('failed navigation keeps the applied list and its pending work intact', async () => {
  reset()
  const p = await page({ category: 'medicine' })
  try {
    await p.component.loadProductsFromRoute()
    const count = calls.length
    p.navigationHooks.forEach(callback => callback({ path: '/blog', query: {} }, p.route, new Error('aborted')))
    await nextTick(); await tick()
    assert.equal(calls.length, count)
    assert.equal(useProductListStore().items.length, 1)
  } finally { p.close() }
})

test('late success and failure cannot replace a newer list or clear its loading flag', async () => {
  reset()
  const first = deferred(), second = deferred()
  respond = (path, body) => body.categoryIds[0] === 'parent' ? first.promise : second.promise
  const store = useProductListStore()
  const older = store.fetchList({ context: { collection: { kind: 'catalog' }, categoryIds: ['parent'] }, request: { page: 1 }, sort: 'relevant' })
  const newer = store.fetchList({ context: { collection: { kind: 'catalog' }, categoryIds: ['leaf'] }, request: { page: 2 }, sort: 'cheapest' })
  first.resolve({ items: [{ id: 'old' }], total: 90, page: 1, limit: 30 })
  await older
  assert.equal(store.isLoading, true)
  assert.deepEqual(store.items, [])
  second.resolve({ items: [{ id: 'new' }], total: 90, page: 2, limit: 30 })
  await newer
  assert.equal(store.items[0].id, 'new')
  assert.equal(store.page, 2)
  const failed = deferred()
  // Reject a superseded request after the newer successful replacement.
  respond = () => failed.promise
  const failing = store.fetchList({ context: { collection: { kind: 'catalog' } }, request: {}, sort: 'relevant' })
  respond = async () => ({ items: [{ id: 'latest' }], total: 1, page: 1, limit: 30 })
  await store.fetchList({ context: { collection: { kind: 'catalog' } }, request: {}, sort: 'relevant' })
  failed.resolve(Promise.reject(new Error('obsolete 503')))
  await failing
  assert.equal(store.items[0].id, 'latest')
  assert.deepEqual(errors, [])
})

test('direct later pages stop at the backend boundary, including an unexpectedly empty append', async () => {
  reset()
  const store = useProductListStore()
  respond = async () => ({ items: [{ id: 'last-page' }], total: 60, page: 2, limit: 30 })
  await store.fetchList({ context: { collection: { kind: 'catalog' } }, request: { page: 2 }, sort: 'relevant' })
  assert.equal(store.hasMore, false)
  await store.loadMore()
  assert.equal(calls.length, 1)
  respond = async (path, body) => ({ items: body.page === 2 ? [{ id: 'page-2' }] : [], total: 100, page: body.page, limit: 30 })
  await store.fetchList({ context: { collection: { kind: 'catalog' } }, request: { page: 2 }, sort: 'relevant' })
  assert.equal(store.hasMore, true)
  await store.loadMore()
  assert.equal(store.page, 3)
  assert.equal(store.hasMore, false)
  const count = calls.length
  await store.loadMore()
  assert.equal(calls.length, count)
})

test('reload discards accumulated pages and restarts from the URL entry page', async () => {
  reset()
  const p = await page({ category: 'medicine' })
  try {
    useProductListStore().limit = 1
    await p.component.loadProductsFromRoute()
    await useProductListStore().loadMore()
    assert.equal(useProductListStore().page, 2)
    assert.equal(useProductListStore().items.length, 2)
    assert.equal(p.route.query.page, undefined)
    await p.component.loadProductsFromRoute()
    assert.equal(useProductListStore().page, 1)
    assert.deepEqual(useProductListStore().items.map(item => item.id), ['product-1'])
    assert.equal(p.history.length, 0)
  } finally { p.close() }
})

test('an old Suspense controller cannot cancel or clear its replacement', async () => {
  reset()
  const original = respond
  const held = deferred()
  respond = (path, body) => path === '/products/list' ? held.promise : original(path, body)
  const older = await page({ category: 'medicine' })
  const oldLoad = older.component.loadProductsFromRoute()
  await tick()
  respond = original
  const newer = await page({ category: 'vitamins' }, 'discounted')
  try {
    await newer.component.loadProductsFromRoute()
    older.close()
    assert.equal(useProductListStore().loaded, true)
    assert.equal(useProductListStore().browseRequest.context.collection.kind, 'discounted')
    assert.equal(useFilterStore().selectedCategories[0].slug, 'vitamins')
    held.resolve({ items: [{ id: 'obsolete' }], total: 1, page: 1, limit: 30 })
    await oldLoad
    assert.equal(useProductListStore().items[0].id, 'product-1')
    assert.equal(useProductListStore().loaded, true)
  } finally { newer.close() }
})
