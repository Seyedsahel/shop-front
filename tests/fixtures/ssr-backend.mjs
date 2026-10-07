import http from 'node:http';
export async function startSsrBackend() {
    let controls = { fail: false, append: false }, calls = [];
    const categories = [{ id: 'parent', parent_id: '', slug: 'medicine', name: 'Medicine' }, { id: 'leaf', parent_id: 'parent', slug: 'vitamins', name: 'Vitamins' }];
    const server = http.createServer(async (req, res) => {
        let raw = '';
        for await (const chunk of req)
            raw += chunk;
        const body = raw ? JSON.parse(raw) : {};
        const path = new URL(req.url, 'http://local').pathname;
        const reply = (value, status = 200) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(value)); };
        if (path === '/__control') {
            Object.assign(controls, body);
            if (body.reset)
                calls = [];
            return reply(controls);
        }
        if (path === '/__calls')
            return reply(calls);
        calls.push({ path, body, method: req.method, identity: req.headers.authorization?.replace('Bearer ', '') });
        const credential = req.headers.authorization?.replace('Bearer ', '') || 'anonymous';
        const identity = credential.replace(/^fixture-/, 'visitor-').replace(/^guest-/, 'guest-visitor-');
        if (path === '/tbt/shop')
            return reply({ shop_name: 'SSR Shop', shop_description: 'SSR shop description', address: 'SSR shop address', phone_number: '02112345678', email: 'shop@example.test', instagram_id: 'ssr_shop', telegram_id: '', logo_image_id: null, enamad_image_id: null });
        if (path === '/tbt/auth/validate')
            return reply({ valid: true, user_id: 'user-' + identity, role: identity.startsWith('guest') ? 'guest' : 'user' });
        if (path === '/tbt/cart')
            return reply({ id: 'cart-' + identity, products: { item: { id: 'item', product_id: 'p', name: 'Cart ' + identity, stock: 9, slug: 'product-a', pricing: { total: 200, unit_price: 100, original_price: 100, discount: 0 }, quantity: 2, price: 100, unit_price: 100, total: 200, max_per_order: 9 } }, pricing: { subtotal_original: 200, subtotal: 200, discount: 0, total: 200 } });
        if (path === '/tbt/wishlist')
            return reply({ id: 'wish-' + identity, products: { item: { id: 'item', product_id: 'p', name: 'Wish ' + identity, slug: 'product-a', stock: 9, price: { final: 100, original: 100, discount: 0, discount_percent: 0 } } } });
        if (path === '/tbt/addresses' || path === '/tbt/shipping/locations' || path === '/tbt/shipping/methods' || path === '/tbt/payment-methods')
            return reply([]);
        if (path === '/tbt/orders')
            return reply({ items: [], total: 0, page: 1, limit: 20 });
        if (path.startsWith('/tbt/orders/'))
            return reply({ id: path.split('/').at(-1), order_number: 'Order ' + identity, status: 'pending_payment', total_amount: 100, products: [], items: [], pricing: {}, shipping_address: {}, created_at: 1700000000 });
        if (path === '/tbt/banners' || path === '/tbt/comments')
            return reply([]);
        if (path === '/tbt/discounts/home')
            return reply(null);
        const story = { id: 'story-a', title: 'SSR Story A', thumbnail_url: null, media_url: null, media_type: 'image', is_active: true, expires_at: 2100000000, created_at: 1700000000 };
        if (path === '/tbt/stories')
            return reply([story]);
        if (path.startsWith('/tbt/stories/'))
            return path.endsWith('story-a') ? reply(story) : reply({ error: 'Missing' }, 404);
        const article = { id: 'article', slug: 'article-a', title: 'SSR Article A', summary: 'SSR article summary', published_at: 1700000000, blocks: [{ type: 'text', body: 'SSR Article Body', sort_order: 0 }] };
        if (path === '/tbt/blogs')
            return reply({ items: [article], total: 1, page: 1, limit: 20 });
        if (path.startsWith('/tbt/blogs/'))
            return path.endsWith('article-a') ? reply(article) : reply({ error: 'Missing' }, 404);
        if (path.startsWith('/tbt/products/') && path.endsWith('/detail')) {
            const slug = path.split('/')[3];
            if (slug === 'missing')
                return reply({ error: 'Missing' }, 404);
            if (slug === 'service')
                return reply({ error: 'Unavailable' }, 503);
            return reply({ id: slug, slug, name: 'SSR ' + slug, description: 'SSR Product Description', base_price: 100, base_stock: 9, max_per_order: 9, categories: [{ id: 'leaf', name: 'Vitamins', slug: 'vitamins' }], images: [], specifications: [], purchase_variants: [] });
        }
        if (path === '/tbt/categories')
            return reply(categories);
        if (path === '/tbt/brands')
            return reply([{ id: 'brand', slug: 'canonical-brand', name: 'Brand' }]);
        if (path === '/tbt/products/filters')
            return reply({ attributes: [{ slug: 'size', name: 'Size', data_type: 'select', available_values: ['small', 'large'] }], brands: [], categories: categories, min_price: 0, max_price: 1000, total: 60, page: 1, limit: 20 });
        if (path === '/tbt/products/list' || path === '/tbt/discounts/products') {
            if (body.search === 'slow')
                return;
            if (body.search === 'slow-fail') {
                setTimeout(() => reply({ error: 'obsolete failure' }, 503), 400);
                return;
            }
            if (body.search?.startsWith('status'))
                return reply({ error: 'Catalog validation message' }, Number(body.search.slice(6)));
            if (controls.fail && body.search === 'fail')
                return reply({ error: 'Service unavailable' }, 503);
            if (controls.append && body.page === 2)
                return reply({ error: 'Append unavailable' }, 503);
            const page = body.page ?? 1, limit = body.limit ?? 30, total = body.search === 'empty' ? 0 : 60;
            return reply({ items: Array.from({ length: Math.min(limit, Math.max(0, total - (page - 1) * limit)) }, (_, i) => ({ id: `${body.search || 'all'}-${page}-${i}`, slug: `product-${page}-${i}`, name: `${body.search || 'All'} Product ${page}-${i}`, base_price: 100, stock: 9, max_per_order: 9, thumbnail_url: null })), total, page, limit });
        }
        reply({ error: 'fixture not implemented' }, 404);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return { server, url: `http://127.0.0.1:${server.address().port}`, calls };
}
