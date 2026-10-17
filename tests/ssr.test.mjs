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
    assert.equal((shopPage.html.match(/src="\/api\/images\/shops\/logo.png"/g) ?? []).length, 2, 'Header and footer render the proxied shop logo')
    assert.ok(shopPage.html.includes('src="/api/images/shops/enamad.png"'), 'Footer renders the proxied trust badge')
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
    for (const [endpoint, title, status] of [
      ['brands', 'برندها', 502], ['brands', 'برندها', 503], ['brands', 'برندها', 504],
      ['banners', 'بنرها', 502], ['stories', 'استوری‌ها', 502],
      ['categories', 'دسته‌بندی‌ها', 502], ['blogs', 'مقالات', 502],
      ['products/list', 'محصولات ویژه', 502], ['discounts/products', 'تخفیف‌ها', 502],
      ['discounts/home', 'پیشنهاد شگفت‌انگیز', 502],
    ]) {
      await fetch(new URL('/__control', backend.url), { method: 'POST', body: JSON.stringify({ failures: { ['/tbt/' + endpoint]: status } }) })
      const page = await read('/')
      assert.ok(!page.html.includes(`aria-label="${title}" role="status"`), `${endpoint}: failure stays silent`)
      assert.ok(!page.html.includes('تلاش دوباره'), `${endpoint}: no optional error banner`)
      if (endpoint === 'brands') assert.ok(!page.html.includes('محبوب‌ترین برندها'), 'Failed brands are hidden')
      assert.ok(page.html.includes('سلامت و زیبایی شما'), `${endpoint}: hero survives`)
      assert.ok(page.html.includes('<header') && page.html.includes('<footer'), `${endpoint}: navigation survives`)
      if (endpoint !== 'blogs') assert.ok(page.html.includes('SSR Article A'), `${endpoint}: blog survives`)
      if (endpoint !== 'products/list') assert.ok(page.html.includes('All Product 1-0'), `${endpoint}: products survive`)
      if (endpoint !== 'stories') assert.ok(page.html.includes('SSR Story A'), `${endpoint}: stories survive`)
    }
    await fetch(new URL('/__control', backend.url), { method: 'POST', body: JSON.stringify({ failures: {}, malformedBrands: true }) })
    const malformedBrands = await read('/')
    assert.ok(!malformedBrands.html.includes('محبوب‌ترین برندها'))
    assert.ok(malformedBrands.html.includes('SSR Article A') && malformedBrands.html.includes('All Product 1-0'))
    await fetch(new URL('/__control', backend.url), { method: 'POST', body: JSON.stringify({ malformedBrands: false }) })
    const recoveredHome = await read('/')
    assert.ok(recoveredHome.html.includes('محبوب‌ترین برندها'))
    assert.ok(!recoveredHome.html.includes('aria-label="برندها" role="status"'))
    for (const endpoint of ['brands', 'categories', 'products/filters']) {
      await fetch(new URL('/__control', backend.url), { method: 'POST', body: JSON.stringify({ failures: { ['/tbt/' + endpoint]: 502 } }) })
      for (const path of ['/products', '/discounts/products', '/products?search=vitamins&priceMin=100']) {
        const page = await read(path)
        assert.ok(page.html.includes(path.includes('search=') ? 'vitamins Product' : 'All Product'), `${endpoint}: browsing survives`)
        assert.ok(!page.html.includes('تلاش دوباره'), `${endpoint}: optional filter failure stays silent`)
      }
    }
    const scopedProducts = await read('/products?category=medicine&brand=canonical-brand&priceMin=100&filters=%7B%22size%22%3A%22large%22%7D')
    assert.ok(scopedProducts.html.includes('All Product'))
    const scopedCall = backend.calls.filter(call => call.path === '/tbt/products/list').at(-1)
    assert.deepEqual(scopedCall.body.category_ids, ['parent', 'leaf'])
    assert.deepEqual(scopedCall.body.brand_ids, ['brand'])
    assert.equal(scopedCall.body.price_min, 100)
    assert.deepEqual(scopedCall.body.attribute_fields, { size: ['large'] })
    await fetch(new URL('/__control', backend.url), { method: 'POST', body: JSON.stringify({ failures: { '/tbt/comments': 502, '/tbt/products/list': 502 } }) })
    const productWithFailedExtras = await read('/products/product-a')
    assert.ok(productWithFailedExtras.html.includes('SSR product-a'))
    assert.ok(!productWithFailedExtras.html.includes('نظرات کاربران') && !productWithFailedExtras.html.includes('محصولات مرتبط'))
    const articleWithFailedComments = await read('/blog/article-a')
    assert.ok(articleWithFailedComments.html.includes('SSR Article Body'))
    assert.ok(!articleWithFailedComments.html.includes('نظرات کاربران'))
    await fetch(new URL('/__control', backend.url), { method: 'POST', body: JSON.stringify({ failures: { '/tbt/shop': 502 } }) })
    const fallbackShop = await read('/')
    assert.ok(fallbackShop.html.includes('SSR Article A') && fallbackShop.html.includes('All Product'))
    assert.ok(!fallbackShop.html.includes('تلاش دوباره'))
    await fetch(new URL('/__control', backend.url), { method: 'POST', body: JSON.stringify({ failures: {}, empty: true }) })
    for (const path of ['/', '/products', '/discounts/products', '/blog', '/stories', '/cart', '/wishlist', '/profile']) {
      const page = await read(path, 'auth_token=fixture-a')
      assert.ok(!page.html.includes('SSR Article A') && !page.html.includes('All Product') && !page.html.includes('Cart visitor-a'), path)
    }
    const emptyProducts = await read('/products')
    assert.ok(emptyProducts.html.includes('محصولی با این فیلترها پیدا نشد.'))
    for (const path of ['/products/product-a', '/blog/article-a', '/stories/story-a']) await read(path, '', 404)
  } finally {
    app.kill('SIGTERM')
    await new Promise(resolve => { if (app.exitCode !== null) resolve(); else app.once('exit', resolve) })
    backend.server.closeAllConnections()
    await new Promise(resolve => backend.server.close(resolve))
  }
})
