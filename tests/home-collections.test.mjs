import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import * as h3 from 'h3'
import { computed, ref } from 'vue'
import { createPinia, defineStore, setActivePinia } from 'pinia'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  }).outputText
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
}
Object.assign(globalThis, h3, { computed, ref, defineStore, toBackendImageUrl: value => value ? '/api/images/' + value : '' })
Object.assign(globalThis, await load('app/utils/api-error.ts'), await load('server/utils/catalogCollections.ts'), await load('server/utils/productList.ts'))

const resources = [
  ['brands', 'brand', 'useBrandStore', 'fetchHomeBrands'],
  ['categories', 'category', 'useCategoryStore', 'fetchHomeCategories'],
  ['products', 'productList', 'useProductListStore', 'fetchHomeProducts'],
]

test('home proxies forward public GETs and preserve image, price and collection mapping', async () => {
  for (const [plural] of resources) {
    const handler = (await load('server/api/home/' + plural + '.get.ts')).default
    const raw = { id: 'curated', name: 'Home selection', slug: 'curated', image_url: plural + '/image.png', thumbnail_url: 'products/image.png', price: { original: 100, final: 80, discount: 20, discount_percent: 20 } }
    globalThis.backendFetch = async (path, options) => {
      assert.equal(path, '/home/' + plural)
      assert.equal(options.authorization, 'none')
      assert.ok(!options.method || options.method === 'GET')
      return plural === 'products' ? { items: [raw], total: 1, page: 1, limit: 20 } : [raw]
    }
    const result = await handler({})
    assert.equal(result.items[0].id, 'curated')
    assert.equal(result.items[0].imageUrl, '/api/images/' + plural + '/image.png')
    if (plural === 'products') {
      assert.equal(result.items[0].price.final, 80)
      assert.equal(result.items[0].price.discountPercent, 20)
    }
    globalThis.backendFetch = async () => []
    assert.deepEqual((await handler({})).items, [])
    globalThis.backendFetch = async () => ({ unexpected: true })
    await assert.rejects(handler({}), error => error.statusCode === 502)
    globalThis.backendFetch = async () => { throw h3.createError({ statusCode: 503 }) }
    await assert.rejects(handler({}), error => error.statusCode === 503)
  }
})

test('home collections deduplicate reads, cache empty results, recover failures and leave catalog state intact', async () => {
  for (const [plural, file, name, action] of resources) {
    setActivePinia(createPinia())
    let resolve, fail = false, calls = 0
    globalThis.useApi = () => ({ get: async path => {
      calls++
      assert.equal(path, '/home/' + plural)
      if (fail) throw new Error('Unavailable')
      return new Promise(done => { resolve = done })
    } })
    const store = (await load('app/stores/' + file + '.store.ts'))[name]()
    store.items = [{ id: 'catalog-item' }]
    const first = store[action]()
    const second = store[action]()
    assert.equal(calls, 1)
    assert.equal(store.homeLoading, true)
    resolve({ items: [{ id: 'home-item' }] })
    assert.deepEqual(await Promise.all([first, second]), [true, true])
    assert.equal(store.homeItems[0].id, 'home-item')
    assert.equal(store.items[0].id, 'catalog-item')
    assert.equal(store.loaded, false)
    await store[action]()
    assert.equal(calls, 1)
    fail = true
    assert.equal(await store[action](true), false)
    assert.ok(store.homeError)
    assert.equal(store.homeLoading, false)
    assert.equal(store.error, '')
    fail = false
    const recovery = store[action]()
    resolve({ items: [] })
    assert.equal(await recovery, true)
    assert.equal(store.homeError, '')
    assert.equal(store.homeLoaded, true)
    const count = calls
    await store[action]()
    assert.equal(calls, count, 'An empty home selection is a valid cached result')
    assert.equal(store.items[0].id, 'catalog-item')
  }
})
