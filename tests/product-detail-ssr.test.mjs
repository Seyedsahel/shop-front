import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { startSsrBackend } from './fixtures/ssr-backend.mjs'

// Run after npm run build. Uses an isolated backend; no live shopping writes.
test('product attributes render on SSR and every document reload requests fresh detail', async () => {
  const backend = await startSsrBackend()
  const reservation = createServer()
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve))
  const port = reservation.address().port
  await new Promise(resolve => reservation.close(resolve))
  let log = ''
  const app = spawn(process.execPath, ['.output/server/index.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, NITRO_PORT: String(port), NITRO_HOST: '127.0.0.1', NUXT_BACKEND_URL: backend.url },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  app.stdout.on('data', data => { log += data })
  app.stderr.on('data', data => { log += data })
  try {
    let root
    for (let i = 0; i < 100; i++) {
      root = log.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]
      if (root) break
      if (app.exitCode !== null) throw new Error(log)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.ok(root, log)
    for (let reload = 0; reload < 2; reload++) {
      const response = await fetch(root + '/products/testtest')
      assert.equal(response.status, 200)
      const html = (await response.text()).split('<script type="application/json"')[0]
      for (const text of ['hfggf', 'رنگ', 'قرمز', 'سایز', 'بیگ']) assert.ok(html.includes(text), text)
      assert.ok(!html.includes('پاک کردن انتخاب'), 'A single variant has specifications without dropdown selectors')
      assert.ok(html.indexOf('مشخصات محصول') < html.indexOf('نظرات کاربران'), 'Specifications precede tabs in mobile document order')
      const calls = backend.calls.filter(call => call.path === '/tbt/products/testtest/detail')
      assert.equal(calls.length, reload + 1, 'Each reload fetches detail on the server')
      assert.ok(calls.every(call => call.method === 'GET' && !call.identity))
    }
  } finally {
    app.kill('SIGTERM')
    await new Promise(resolve => { if (app.exitCode !== null) resolve(); else app.once('exit', resolve) })
    backend.server.closeAllConnections()
    await new Promise(resolve => backend.server.close(resolve))
  }
})
