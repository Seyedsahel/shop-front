import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { startSsrBackend } from './fixtures/ssr-backend.mjs'

// Run after npm run build. No live credentials, orders, or payments are used.
test('production SSR renders content, statuses and isolated read-only sessions', async () => {
  const backend = await startSsrBackend()
  const reservation = createServer()
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve))
  const port = reservation.address().port
  await new Promise(resolve => reservation.close(resolve))
  let log = ''
  const app = spawn(process.execPath, ['.output/server/index.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, NITRO_PORT: String(port), NITRO_HOST: '127.0.0.1',
      NUXT_BACKEND_URL: backend.url, NUXT_PUBLIC_SITE_URL: 'https://shop.example' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  app.stdout.on('data', data => { log += data })
  app.stderr.on('data', data => { log += data })
  const root = `http://127.0.0.1:${port}`
  const read = async (path, cookie = '', status = 200) => {
    const response = await fetch(root + path, { headers: { cookie, accept: 'text/html' }, redirect: 'manual' })
    assert.equal(response.status, status, `${path}: ${log.slice(-1500)}`)
    assert.match(response.headers.get('cache-control'), /private.*no-store/)
    const full = await response.text()
    // Check the rendered body, not data merely embedded in the Nuxt payload.
    const html = full.split('<script type="application/json"')[0]
    return { html, full, response }
  }
  try {
    for (let i = 0; i < 100; i++) {
      try { await fetch(root + '/api/auth/me'); break } catch {
        if (app.exitCode !== null) throw new Error(log)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    for (const [path, content] of [
      ['/', 'SSR Article A'], ['/products', 'All Product 1-0'],
      ['/discounts/products', 'All Product 1-0'], ['/products/product-a', 'SSR product-a'],
      ['/blog', 'SSR Article A'], ['/blog/article-a', 'SSR Article Body'],
      ['/stories', 'SSR Story A'], ['/stories/story-a', 'SSR Story A'],
      ['/products?page=2', 'All Product 2-0'],
    ]) assert.ok((await read(path)).html.includes(content), path)
    const shopPage = await read('/')
    for (const content of ['SSR Shop', 'SSR shop description', 'SSR shop address', 'tel:02112345678', 'mailto:shop@example.test', 'https://www.instagram.com/ssr_shop']) {
      assert.ok(shopPage.html.includes(content), content)
    }
    assert.ok(!shopPage.html.includes('https://t.me/'))
    assert.ok(shopPage.html.includes('<title>SSR Shop</title>'))
    assert.ok((await read('/auth')).html.includes('ورود امن به SSR Shop'))
    for (const path of ['/products/missing', '/blog/missing', '/stories/missing']) await read(path, '', 404)
    await read('/products/service', '', 503)
    await read('/products?search=status422', '', 422)
    await read('/products?priceMin=invalid', '', 400)
    const empty = await read('/products?search=empty')
    assert.ok(empty.html.includes('محصولی با این فیلترها پیدا نشد.'))
    assert.ok(!empty.html.includes('All Product'))
    const canonical = await read('/products?category=medicine&utm_source=tracking')
    assert.ok(canonical.html.includes('https://shop.example/products?category=medicine'))
    assert.ok(canonical.html.includes('noindex, follow'))
    const beforeAnonymous = backend.calls.length
    await read('/cart'); await read('/wishlist')
    assert.ok(!backend.calls.slice(beforeAnonymous).some(call => ['/tbt/cart', '/tbt/wishlist', '/tbt/auth/guest'].includes(call.path)))
    const [a, b] = await Promise.all([read('/cart', 'auth_token=fixture-a'), read('/cart', 'auth_token=fixture-b')])
    assert.ok(a.html.includes('Cart visitor-a') && !a.full.includes('Cart visitor-b'))
    assert.ok(b.html.includes('Cart visitor-b') && !b.full.includes('Cart visitor-a'))
    assert.ok(!a.full.includes('fixture-a') && !b.full.includes('fixture-b'), 'Raw credentials must not enter HTML or Nuxt payloads')
    const orderId = '11111111-1111-1111-1111-111111111111'
    for (const path of ['/wishlist', '/profile', '/checkout', `/profile/orders/${orderId}`,
      `/pay/success?order_id=${orderId}&status=OK`, `/pay/failure?order_id=${orderId}`]) {
      const page = await read(path, 'auth_token=fixture-a')
      assert.ok(page.html.includes('noindex, nofollow'), path)
      if (path === '/checkout') assert.ok(page.html.includes('در حال بررسی سفارش ذخیره‌شده'))
    }
    const guest = await read('/cart', 'guest_token=guest-fixture')
    assert.ok(guest.html.includes('Cart guest-visitor-fixture'))
    const unsafe = backend.calls.filter(call => call.method !== 'GET' && ![
      '/tbt/products/list', '/tbt/products/filters', '/tbt/discounts/products',
    ].includes(call.path))
    assert.deepEqual(unsafe, [], 'SSR must not issue guests, previews, orders, payments or shopping writes')
    assert.ok(!backend.calls.some(call => call.identity && [
      '/tbt/products/list', '/tbt/products/filters', '/tbt/discounts/products', '/tbt/blogs', '/tbt/stories', '/tbt/shop',
    ].includes(call.path)), 'Public backend reads must be unauthenticated')
  } finally {
    app.kill('SIGTERM')
    await new Promise(resolve => { if (app.exitCode !== null) resolve(); else app.once('exit', resolve) })
    backend.server.closeAllConnections()
    await new Promise(resolve => backend.server.close(resolve))
  }
})
