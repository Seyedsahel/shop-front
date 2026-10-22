import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { ref } from 'vue'

async function loadHome(stores, { server = true } = {}) {
  const mounted = []
  for (const [name, store] of Object.entries(stores)) globalThis['use' + name + 'Store'] = () => store
  Object.assign(globalThis, {
    ref, useState: (_key, initial) => ref(initial()),
    callOnce: (_key, load) => load(), usePageSeo: () => {},
    onMounted: callback => mounted.push(callback),
  })
  const source = (await readFile(new URL('../app/pages/index.vue', import.meta.url), 'utf8'))
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
    .replaceAll('import.meta.server', String(server))
  const code = ts.transpileModule(source + '\nexport { loadSection, sectionError, pending };', {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  }).outputText
  const page = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64') + '#' + Math.random())
  return { ...page, mount: () => mounted.forEach(callback => callback()) }
}

function deferred() {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}

test('client Home waits only for Hero banners and starts other sections after mount', async () => {
  const { calls, stores } = fixtures()
  const hero = deferred(), heroStarted = deferred(), articles = deferred(), products = deferred()
  stores.Banner.fetchBanners = () => { calls.push('banners'); heroStarted.resolve(); return hero.promise }
  stores.Blog.fetchPosts = () => { calls.push('blog'); return articles.promise }
  stores.ProductList.fetchHomeProducts = () => { calls.push('products'); return products.promise }
  let ready = false
  const setup = loadHome(stores, { server: false }).then(page => { ready = true; return page })
  await heroStarted.promise
  assert.equal(ready, false)
  assert.deepEqual(calls, ['banners'], 'Outgoing pages must not see optional shared-store refreshes')
  hero.resolve()
  const page = await setup
  assert.equal(ready, true, 'Home setup resolves with optional requests still unavailable')
  assert.deepEqual(calls, ['banners'])
  page.mount()
  assert.equal(calls.length, 8)
  assert.equal(page.pending.value.blog, true)
  assert.equal(page.pending.value.products, true)
  articles.resolve()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(page.pending.value.blog, false, 'Articles settle independently')
  assert.equal(page.pending.value.products, true, 'Slow products do not block other sections')
  products.resolve()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(page.pending.value.products, false)
})

test('Hero failure still allows client Home and the other sections to load', async () => {
  const { calls, stores } = fixtures()
  stores.Banner.fetchBanners = async () => { throw new Error('Banner unavailable') }
  const page = await loadHome(stores, { server: false })
  assert.ok(page.sectionError('banners'))
  assert.deepEqual(calls, [])
  page.mount()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(calls.length, 7)
  assert.equal(page.pending.value.blog, false)
})

function fixtures() {
  const calls = []
  const action = name => async () => { calls.push(name) }
  return { calls, stores: {
    Banner: { fetchBanners: action('banners') }, Story: { fetchStories: action('stories') },
    Category: { fetchHomeCategories: action('categories') }, Brand: { fetchHomeBrands: action('brands') },
    ProductList: { fetchHomeProducts: action('products'), fetchDiscountedAvailability: action('discounts') },
    Offer: { fetchOffer: action('offer') }, Blog: { fetchPosts: action('blog') }, Shop: {},
  } }
}

test('a brand failure stays local and retry only reloads brands', async () => {
  const { calls, stores } = fixtures()
  let failed = true
  stores.Brand.fetchHomeBrands = async () => {
    calls.push('brands')
    stores.Brand.homeError = failed ? 'Brand service unavailable' : ''
    return !failed
  }
  const page = await loadHome(stores)
  assert.equal(calls.length, 8, 'All independent sections load even when brands fail')
  assert.equal(page.sectionError('brands'), 'Brand service unavailable')
  for (const key of ['banners', 'stories', 'categories', 'products', 'discounts', 'offer', 'blog']) assert.ok(!page.sectionError(key), key)
  failed = false
  const beforeRetry = [...calls]
  await page.loadSection('brands')
  assert.deepEqual(calls, [...beforeRetry, 'brands'])
  assert.equal(page.sectionError('brands'), '')
  assert.equal(page.pending.value.brands, false)
})

test('unexpected synchronous exceptions and rejected promises cannot stop other homepage sections', async () => {
  const { calls, stores } = fixtures()
  stores.Brand.fetchHomeBrands = () => { throw new Error('Unexpected failure') }
  stores.Blog.fetchPosts = async () => { throw new Error('Unexpected rejection') }
  const page = await loadHome(stores)
  assert.deepEqual(calls.sort(), ['banners', 'categories', 'discounts', 'offer', 'products', 'stories'])
  assert.ok(page.sectionError('brands'))
  assert.ok(page.sectionError('blog'))
  assert.ok(!page.sectionError('products'))
  stores.Brand.fetchHomeBrands = async () => true
  await page.loadSection('brands')
  assert.equal(page.sectionError('brands'), undefined)
  assert.ok(page.sectionError('blog'), 'An unrelated failed section remains independently retryable')
})

test('repeated retry clicks do not start concurrent requests for the same section', async () => {
  const { stores } = fixtures()
  const page = await loadHome(stores)
  let resolve, count = 0
  stores.Brand.fetchHomeBrands = () => { count++; return new Promise(done => { resolve = done }) }
  const first = page.loadSection('brands')
  await page.loadSection('brands')
  assert.equal(count, 1)
  assert.equal(page.pending.value.brands, true)
  resolve()
  await first
  assert.equal(page.pending.value.brands, false)
})
