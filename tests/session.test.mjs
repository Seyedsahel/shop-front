import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import * as h3 from 'h3'
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { ref } from 'vue'

// Exercise real H3 cookies/handlers without a network listener or a live backend.
Object.assign(globalThis, h3, { useRuntimeConfig: () => ({ backendUrl: 'https://backend.test' }) })
async function load(path, server = false) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const { outputText: code } = ts.transpileModule(
    source.replace(/^import .* from ['"]\.\/.*['"]\n/gm, '')
      .replace("import('h3')", 'Promise.resolve(globalThis.__h3)')
      .replaceAll('import.meta.server', String(server))
      .replaceAll('import.meta.client', String(!server)),
    { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } },
  )
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
}
Object.assign(globalThis, await load('server/utils/session.ts'))
Object.assign(globalThis, await load('server/utils/backendFetch.ts'))
Object.assign(globalThis, await load('server/utils/readSession.ts'))
const guest = (await load('server/api/auth/guest.post.ts')).default
const login = (await load('server/api/auth/verify-otp.post.ts')).default
const refresh = (await load('server/api/auth/refresh.post.ts')).default
const logout = (await load('server/api/auth/logout.post.ts')).default
const me = (await load('server/api/auth/me.get.ts')).default

function request(handler, cookie = '', body) {
  const app = h3.createApp({ onError: () => {} }).use(handler)
  return h3.toWebHandler(app)(new Request('http://shop.test/api/test', {
    method: body === undefined ? 'GET' : 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }))
}
const expired = () => Object.assign(new Error('Expired'), { response: { status: 401 } })

test('central transport enforces precedence, absence, and explicit auth modes', async () => {
  for (const [cookie, mode, expected] of [
    ['', 'session', null], ['guest_token=guest', 'session', 'Bearer guest'],
    ['auth_token=user; guest_token=guest', 'session', 'Bearer user'],
    ['guest_token=guest', 'user', null], ['auth_token=user', 'none', null],
  ]) {
    globalThis.$fetch = async (_, options) => {
      assert.equal(options.headers.get('authorization'), expected)
      return { ok: true }
    }
    const res = await request(h3.defineEventHandler(event => backendFetch('/test', {
      authorization: mode, headers: { authorization: 'Bearer override' },
    }, event)), cookie)
    assert.equal(res.status, 200)
  }
})

test('guest creation persists a private 30-day cookie, then reuses it', async () => {
  let creations = 0
  globalThis.$fetch = async (url, options) => {
    if (url === '/api/auth/guest') {
      creations++
      assert.equal(options.headers.get('authorization'), null)
      return { token: 'guest-jwt' }
    }
    assert.equal(options.headers.get('authorization'), 'Bearer guest-jwt')
    return { valid: true, role: 'guest', user_id: 'guest-id' }
  }
  const response = await request(guest)
  assert.deepEqual(await response.json(), { identity: sessionIdentity('guest-jwt'), isAuthenticated: false, hasGuestSession: true })
  const cookie = response.headers.get('set-cookie')
  assert.match(cookie, /guest_token=guest-jwt/)
  assert.match(cookie, /Max-Age=2592000/)
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /SameSite=Lax/)
  await request(guest, 'guest_token=guest-jwt')
  const restored = await request(me, 'guest_token=guest-jwt')
  assert.equal((await restored.json()).hasGuestSession, true)
  assert.equal(creations, 1)
})

test('authenticated identity wins and guest issuance is skipped', async () => {
  globalThis.$fetch = async (url, options) => {
    assert.equal(url, '/api/auth/validate')
    assert.equal(options.headers.get('authorization'), 'Bearer user')
    return { valid: true, role: 'user', user_id: 'user-id' }
  }
  const response = await request(guest, 'auth_token=user; guest_token=guest')
  assert.equal((await response.json()).isAuthenticated, true)
  assert.match(response.headers.get('set-cookie'), /guest_token=; Max-Age=0/)
})

test('login forwards the guest bearer token, replaces guest identity, refresh replaces the token, and logout clears both cookies', async () => {
  globalThis.$fetch = async (_, options) => {
    assert.equal(options.headers.get('authorization'), 'Bearer guest')
    return { token: 'new-user' }
  }
  const response = await request(login, 'guest_token=guest', { phone: '123', code: '1234' })
  assert.deepEqual(await response.json(), { success: true })
  assert.match(response.headers.get('set-cookie'), /auth_token=new-user/)
  assert.match(response.headers.get('set-cookie'), /guest_token=; Max-Age=0/)
  globalThis.$fetch = async (_, options) => {
    assert.equal(options.headers.get('authorization'), 'Bearer new-user')
    return { token: 'refreshed-user' }
  }
  const refreshed = await request(refresh, 'auth_token=new-user')
  assert.deepEqual(await refreshed.json(), { success: true })
  assert.match(refreshed.headers.get('set-cookie'), /auth_token=refreshed-user/)
  globalThis.$fetch = async (url, options) => {
    assert.equal(url, '/api/auth/logout')
    assert.equal(options.headers.get('authorization'), 'Bearer new-user')
    assert.equal(options.body, undefined)
    return { status: 'logged_out' }
  }
  const out = await request(logout, 'auth_token=new-user; guest_token=guest')
  assert.match(out.headers.get('set-cookie'), /auth_token=; Max-Age=0/)
  assert.match(out.headers.get('set-cookie'), /guest_token=; Max-Age=0/)
})

test('expired guest can be replaced; expired user cannot silently become guest', async () => {
  let creations = 0
  globalThis.$fetch = async url => {
    if (url === '/api/auth/validate') throw expired()
    creations++
    return { token: 'fresh-guest' }
  }
  const fresh = await request(guest, 'guest_token=expired')
  assert.equal(fresh.status, 200)
  assert.match(fresh.headers.get('set-cookie'), /guest_token=fresh-guest/)
  const user = await request(guest, 'auth_token=expired; guest_token=old')
  assert.equal(user.status, 401)
  assert.equal((await user.json()).data.code, 'AUTH_SESSION_EXPIRED')
  assert.equal(creations, 1)
})

test('401 identifies the rejected credential, clears it, and never replays a mutation', async () => {
  for (const [cookie, code, name] of [
    ['guest_token=guest', 'GUEST_SESSION_EXPIRED', 'guest_token'],
    ['auth_token=user', 'AUTH_SESSION_EXPIRED', 'auth_token'],
  ]) {
    let calls = 0
    globalThis.$fetch = async () => { calls++; throw expired() }
    const response = await request(h3.defineEventHandler(event => backendFetch('/cart/items', { method: 'POST' }, event)), cookie)
    assert.equal(response.status, 401)
    assert.equal((await response.json()).data.code, code)
    assert.match(response.headers.get('set-cookie'), new RegExp(name + '=; Max-Age=0'))
    assert.equal(calls, 1)
  }
})

test('transient logout and validation failures preserve cookies', async () => {
  globalThis.$fetch = async () => { throw h3.createError({ statusCode: 503, message: 'Unavailable' }) }
  for (const handler of [logout, me]) {
    const response = await request(handler, 'auth_token=user')
    assert.equal(response.status, 503)
    assert.doesNotMatch(response.headers.get('set-cookie') ?? '', /auth_token=/)
  }
})


test('concurrent guest requests are deduplicated and login waits for cookie creation', async () => {
  Object.assign(globalThis, { ref, defineStore, useAppToast: () => ({ success() {}, error() {} }) })
  setActivePinia(createPinia())
  let completeGuest
  const calls = []
  globalThis.useApi = () => ({
    post: async path => {
      calls.push(path)
      if (path === '/auth/guest') return new Promise(resolve => { completeGuest = resolve })
      return { success: true }
    },
    get: async () => ({ identity: 'user', isAuthenticated: true, hasGuestSession: false, user: { id: 'user' } }),
  })
  const { useAuthStore } = await load('app/stores/auth.store.ts')
  const store = useAuthStore()
  const first = store.ensureShoppingSession()
  const second = store.ensureShoppingSession()
  const login = store.verifyOtp('1234')
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(calls, ['/auth/guest'])
  completeGuest({ identity: 'guest', isAuthenticated: false, hasGuestSession: true })
  await Promise.all([first, second, login])
  assert.deepEqual(calls, ['/auth/guest', '/auth/verify-otp'])
  assert.equal(store.isAuthenticated, true)
  assert.equal(store.hasGuestSession, false)
})

test('SSR forwards request cookies and relays response cookies on success and errors', async () => {
  globalThis.__h3 = h3
  globalThis.ApiError = (await load('app/utils/api-error.ts')).ApiError
  const { useApi } = await load('app/composables/useApi.ts', true)
  for (const failure of [false, true]) {
    globalThis.$fetch = async (_, options) => {
      assert.equal(options.headers.get('cookie'), 'guest_token=guest')
      assert.equal(options.headers.get('authorization'), null)
      const response = new Response('{}', { status: failure ? 401 : 200, headers: {
        'set-cookie': 'guest_token=; Max-Age=0; Path=/',
      } })
      await options.onResponse({ response })
      if (failure) throw { response, data: { message: 'Expired', data: { code: 'GUEST_SESSION_EXPIRED' } } }
      return { ok: true }
    }
    globalThis.useAuthStore = () => ({ sessionRevision: 0, handleSessionError() {} })
    const response = await request(h3.defineEventHandler(async event => {
      globalThis.useRequestEvent = () => event
      globalThis.useRequestHeaders = () => ({ cookie: h3.getHeader(event, 'cookie') })
      try { return await useApi().get('/auth/me') } catch { throw h3.createError({ statusCode: 401 }) }
    }), 'guest_token=guest')
    assert.equal(response.status, failure ? 401 : 200)
    assert.match(response.headers.get('set-cookie'), /guest_token=; Max-Age=0/)
  }
})


test('login waits until the shopping operation and refresh release the shared session lock', async () => {
  Object.assign(globalThis, { ref, defineStore, useAppToast: () => ({ success() {}, error() {} }) })
  setActivePinia(createPinia())
  const calls = []
  let release
  globalThis.useApi = () => ({
    get: async () => ({ identity: 'user', isAuthenticated: true, hasGuestSession: false, user: { id: 'user' } }),
    post: async path => { calls.push(path); return { success: true } },
  })
  const { useAuthStore } = await load('app/stores/auth.store.ts')
  const store = useAuthStore()
  const operation = store.withShoppingSession(false, async () => {
    calls.push('cart-write')
    await new Promise(resolve => { release = resolve })
    calls.push('cart-refresh')
  })
  const login = store.verifyOtp('1234')
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(calls, ['cart-write'])
  release()
  await Promise.all([operation, login])
  assert.deepEqual(calls, ['cart-write', 'cart-refresh', '/auth/verify-otp'])
})
