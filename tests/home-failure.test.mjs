import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { ref } from 'vue'

async function loadHome(stores) {
  for (const [name, store] of Object.entries(stores)) globalThis['use' + name + 'Store'] = () => store
  Object.assign(globalThis, {
    ref, useState: (_key, initial) => ref(initial()),
    callOnce: (_key, load) => load(), usePageSeo: () => {},
  })
  const source = (await readFile(new URL('../app/pages/index.vue', import.meta.url), 'utf8'))
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const code = ts.transpileModule(source + '\nexport { loadSection, sectionError, pending };', {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  }).outputText
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64') + '#' + Math.random())
}

function fixtures() {
  const calls = []
  const action = name => async () => { calls.push(name) }
  return { calls, stores: {
    Banner: { fetchBanners: action('banners') }, Story: { fetchStories: action('stories') },
    Category: { fetchCategories: action('categories') }, Brand: { fetchBrands: action('brands') },
    ProductList: { previewError: {}, fetchPreview: action('products'), fetchDiscountedAvailability: action('discounts') },
    Offer: { fetchOffer: action('offer') }, Blog: { fetchPosts: action('blog') }, Shop: {},
  } }
}

test('a brand failure stays local and retry only reloads brands', async () => {
  const { calls, stores } = fixtures()
  let failed = true
  stores.Brand.fetchBrands = async () => {
    calls.push('brands')
    stores.Brand.error = failed ? 'Brand service unavailable' : ''
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
  stores.Brand.fetchBrands = () => { throw new Error('Unexpected failure') }
  stores.Blog.fetchPosts = async () => { throw new Error('Unexpected rejection') }
  const page = await loadHome(stores)
  assert.deepEqual(calls.sort(), ['banners', 'categories', 'discounts', 'offer', 'products', 'stories'])
  assert.ok(page.sectionError('brands'))
  assert.ok(page.sectionError('blog'))
  assert.ok(!page.sectionError('products'))
  stores.Brand.fetchBrands = async () => true
  await page.loadSection('brands')
  assert.equal(page.sectionError('brands'), undefined)
  assert.ok(page.sectionError('blog'), 'An unrelated failed section remains independently retryable')
})

test('repeated retry clicks do not start concurrent requests for the same section', async () => {
  const { stores } = fixtures()
  const page = await loadHome(stores)
  let resolve, count = 0
  stores.Brand.fetchBrands = () => { count++; return new Promise(done => { resolve = done }) }
  const first = page.loadSection('brands')
  await page.loadSection('brands')
  assert.equal(count, 1)
  assert.equal(page.pending.value.brands, true)
  resolve()
  await first
  assert.equal(page.pending.value.brands, false)
})
