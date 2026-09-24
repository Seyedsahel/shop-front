import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import * as h3 from 'h3'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source.replace(/^import .* from ['"]\.\/.*['"]\n/gm, ''), {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}

Object.assign(globalThis, h3)
Object.assign(globalThis, await load('server/utils/session.ts'))
Object.assign(globalThis, await load('server/utils/backendFetch.ts'))
Object.assign(globalThis, await load('server/utils/addressRequest.ts'))
globalThis.useRuntimeConfig = () => ({ backendUrl: 'https://backend.test' })

const id = '26be8bc1-eb37-4d54-b069-4d2a4a6a2466'
const input = { name: 'sahel', phone: '09137327400', province_code: 41, city_code: 2, postal_code: '7717933651', address: 'Example address' }

async function request(handler, method, body, cookie = 'auth_token=user') {
  const app = h3.createApp({ onError() {} }).use(h3.defineEventHandler(event => {
    event.context.params = { addressId: id }
    return handler(event)
  }))
  return h3.toWebHandler(app)(new Request('http://shop.test/addresses', {
    method, headers: { cookie, 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }))
}

test('address writes forward text/plain JSON with user bearer', async () => {
  const create = (await load('server/api/addresses/index.post.ts')).default
  const update = (await load('server/api/addresses/[addressId].put.ts')).default
  const calls = []
  globalThis.$fetch = async (path, options) => {
    calls.push({ path, method: options.method, body: options.body, authorization: options.headers.get('Authorization'), contentType: options.headers.get('Content-Type') })
    return { id, ...input, phone_number: '+989137327400' }
  }
  assert.equal((await request(create, 'POST', input)).status, 200)
  assert.equal((await request(update, 'PUT', input)).status, 200)
  assert.deepEqual(calls.map(call => [call.method, call.path]), [['POST', '/api/addresses'], ['PUT', `/api/addresses/${id}`]])
  for (const call of calls) {
    assert.equal(call.authorization, 'Bearer user')
    assert.equal(call.contentType, 'text/plain')
    assert.deepEqual(JSON.parse(call.body), input)
  }
})

test('address endpoints reject guest credentials and incomplete writes', async () => {
  const create = (await load('server/api/addresses/index.post.ts')).default
  const list = (await load('server/api/addresses/index.get.ts')).default
  globalThis.$fetch = () => { throw new Error('Backend must not be called') }
  assert.equal((await request(list, 'GET', null, 'guest_token=guest')).status, 401)
  assert.equal((await request(create, 'POST', input, 'guest_token=guest')).status, 401)
  assert.equal((await request(create, 'POST', { ...input, city_code: 0 })).status, 400)
})

test('address list and deletion use the authenticated backend routes', async () => {
  const list = (await load('server/api/addresses/index.get.ts')).default
  const remove = (await load('server/api/addresses/[addressId].delete.ts')).default
  const calls = []
  globalThis.$fetch = async (path, options) => {
    calls.push([options.method ?? 'GET', path, options.headers.get('Authorization')])
    return []
  }
  assert.equal((await request(list, 'GET')).status, 200)
  assert.equal((await request(remove, 'DELETE')).status, 200)
  assert.deepEqual(calls, [['GET', '/api/addresses', 'Bearer user'], ['DELETE', `/api/addresses/${id}`, 'Bearer user']])
})
