import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import * as h3 from 'h3'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}

Object.assign(globalThis, h3, {
  useRuntimeConfig: () => ({
    backendUrl: 'http://backend.test/',
    public: { imageBaseUrl: 'http://backend.test:80/images/' },
  }),
})
const { toBackendImageUrl, resolveBackendMediaUrl } = await load('server/utils/imageProxy.ts')
globalThis.resolveBackendMediaUrl = resolveBackendMediaUrl
const { default: mediaHandler } = await load('server/api/images/[...path].get.ts')

test('uploads and catalog images resolve to their distinct backend collections', () => {
  assert.equal(resolveBackendMediaUrl('uploads/blogs/photo.png'), 'http://backend.test/tbt/uploads/blogs/photo.png')
  assert.equal(resolveBackendMediaUrl('brands/photo.jpg'), 'http://backend.test/images/brands/photo.jpg')
  assert.equal(resolveBackendMediaUrl('uploads/blogs/my%20video.MP4', '?v=1'), 'http://backend.test/tbt/uploads/blogs/my%20video.MP4?v=1')
})

test('relative, absolute, encoded and already proxied media retain the same URL', () => {
  for (const path of ['/uploads/blogs/my video.MP4?v=1', 'http://backend.test/tbt/uploads/blogs/my%20video.MP4?v=1']) {
    assert.equal(toBackendImageUrl(path), '/api/images/uploads/blogs/my%20video.MP4?v=1')
  }
  assert.equal(toBackendImageUrl('http://backend.test/images/brands/photo.jpg'), '/api/images/brands/photo.jpg')
  assert.equal(toBackendImageUrl('/api/images/brands/photo.jpg'), '/api/images/brands/photo.jpg')
  assert.equal(toBackendImageUrl('https://cdn.test/photo.jpg'), 'https://cdn.test/photo.jpg')
  assert.equal(toBackendImageUrl(null), '')
})

test('media resolution rejects traversal, encoded separators and malformed encoding', () => {
  for (const path of ['../secret', '%2e%2e/secret', './secret', 'uploads/a%2fb', 'uploads/a%5cb', 'uploads/%00', 'uploads/%zz']) {
    assert.throws(() => resolveBackendMediaUrl(path), error => error.statusCode === 400)
  }
})

test('HTTP proxy preserves video ranges, cache validation and upstream errors', async () => {
  const requests = []
  globalThis.sendProxy = (event, target, options) => h3.sendProxy(event, target, {
    ...options,
    fetch: async (url, init) => {
      const headers = new Headers(init.headers)
      requests.push({ url, headers })
      if (url.includes('missing')) return new Response('Missing', { status: 404 })
      if (headers.has('if-none-match')) return new Response(null, { status: 304, headers: { etag: 'media-v1' } })
      return new Response('0123', { status: 206, headers: {
        'content-type': 'video/mp4', 'content-range': 'bytes 0-3/100', 'accept-ranges': 'bytes',
      } })
    },
  })
  const app = h3.createApp().use(h3.defineEventHandler(event => {
    event.context.params = { path: h3.getRequestURL(event).pathname.slice('/api/images/'.length) }
    return mediaHandler(event)
  }))
  const request = h3.toWebHandler(app)
  const response = await request(new Request('http://frontend.test/api/images/uploads/blogs/movie.MP4?v=1', {
    headers: { range: 'bytes=0-3', 'if-range': 'media-v1', cookie: 'auth_token=private', authorization: 'Bearer private' },
  }))
  assert.equal(response.status, 206)
  assert.equal(await response.text(), '0123')
  assert.equal(response.headers.get('content-type'), 'video/mp4')
  assert.equal(response.headers.get('content-range'), 'bytes 0-3/100')
  assert.equal(response.headers.get('accept-ranges'), 'bytes')
  assert.equal(requests[0].url, 'http://backend.test/tbt/uploads/blogs/movie.MP4?v=1')
  assert.equal(requests[0].headers.get('range'), 'bytes=0-3')
  assert.equal(requests[0].headers.get('if-range'), 'media-v1')
  assert.equal(requests[0].headers.has('cookie'), false)
  assert.equal(requests[0].headers.has('authorization'), false)

  const cached = await request(new Request('http://frontend.test/api/images/uploads/blogs/movie.MP4', {
    headers: { 'if-none-match': 'media-v1' },
  }))
  assert.equal(cached.status, 304)
  assert.equal(await cached.text(), '')
  const missing = await request(new Request('http://frontend.test/api/images/uploads/blogs/missing.png'))
  assert.equal(missing.status, 404)
  assert.equal(missing.headers.has('cache-control'), false)
})
