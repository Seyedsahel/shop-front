import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}
const { captureTorobClick, getTorobClick } = await load('app/utils/torobAttribution.ts')

function browser() {
  let now = 0
  let cookie = ''
  let expires = 0
  const writes = []
  globalThis.location = { protocol: 'https:' }
  globalThis.document = {
    get cookie() { return now < expires ? cookie : '' },
    set cookie(value) {
      writes.push(value)
      cookie = value.split(';')[0]
      expires = now + Number(value.match(/Max-Age=(\d+)/)[1])
    },
  }
  return { writes, advance(seconds) { now += seconds } }
}

test('capture encodes a trimmed click in a host-only seven-day cookie; reads do not renew it', () => {
  const { writes, advance } = browser()
  captureTorobClick('?torob_clid=%20test%2F123%3B%3D%20')
  assert.equal(writes[0], 'torob_clid=test%2F123%3B%3D; Max-Age=604800; Path=/; SameSite=Lax; Secure')
  assert.equal(getTorobClick(), 'test/123;=')
  advance(604799)
  assert.equal(getTorobClick(), 'test/123;=')
  captureTorobClick('?search=vitamin')
  advance(1)
  assert.equal(getTorobClick(), '')
  assert.equal(writes.length, 1)
})

test('invalid and absent parameters preserve attribution; a new click replaces it', () => {
  const { writes } = browser()
  captureTorobClick('?torob_clid=first')
  for (const search of ['', '?torob_clid=', '?torob_clid=%20', '?torob_clid=' + 'x'.repeat(201)]) {
    captureTorobClick(search)
    assert.equal(getTorobClick(), 'first')
  }
  assert.equal(writes.length, 1)
  captureTorobClick('?torob_clid=second')
  assert.equal(getTorobClick(), 'second')
  location.protocol = 'http:'
  captureTorobClick('?torob_clid=' + 'x'.repeat(200))
  assert.equal(getTorobClick().length, 200)
  assert.equal(writes.at(-1).includes('Secure'), false)
})

test('missing, malformed and blocked cookies safely return no attribution', () => {
  delete globalThis.document
  assert.equal(getTorobClick(), '')
  for (const cookie of ['', 'other=value', 'torob_clid=%E0%A4%A', 'torob_clid=' + 'x'.repeat(201)]) {
    globalThis.document = { cookie }
    assert.equal(getTorobClick(), '')
  }
  globalThis.document = { cookie: 'other=1;torob_clid=valid%2Fid' }
  assert.equal(getTorobClick(), 'valid/id')
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    get cookie() { throw new Error('Blocked') }, set cookie(_) { throw new Error('Blocked') },
  } })
  assert.doesNotThrow(() => captureTorobClick('?torob_clid=valid'))
  assert.equal(getTorobClick(), '')
})

test('shared initialization captures before redirects and captures SPA clicks without renewing retained parameters', async () => {
  const { writes } = browser()
  let guard
  globalThis.window = { location: { search: '?torob_clid=arrival', origin: 'https://shop.test' } }
  globalThis.captureTorobClick = captureTorobClick
  globalThis.defineNuxtPlugin = value => value
  globalThis.addRouteMiddleware = (name, callback, options) => {
    assert.equal(name, 'torob-attribution')
    assert.deepEqual(options, { global: true })
    guard = callback
  }
  const plugin = (await load('app/plugins/torob-attribution.client.ts')).default
  assert.equal(plugin.enforce, 'pre')
  assert.deepEqual(plugin.dependsOn, ['nuxt:router'])
  plugin.setup()
  assert.equal(getTorobClick(), 'arrival')
  guard({ fullPath: '/products/example/?torob_clid=arrival' })
  guard({ fullPath: '/cart?torob_clid=arrival&search=next' })
  assert.equal(writes.length, 1)
  for (const fullPath of ['/cart', '/auth', '/checkout', '/pay/success?order_id=order']) guard({ fullPath })
  assert.equal(getTorobClick(), 'arrival')
  assert.equal(writes.length, 1)
  guard({ fullPath: '/products/example/?torob_clid=spa-click' })
  assert.equal(getTorobClick(), 'spa-click')
  assert.equal(writes.length, 2)
})
