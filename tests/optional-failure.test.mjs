import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { compileScript, parse } from '@vue/compiler-sfc'
import { computed, createRenderer, defineComponent, h, nextTick, reactive, ref, watch } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia, defineStore, setActivePinia } from 'pinia'

async function load(path) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  return import('data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  }).outputText).toString('base64'))
}

async function component(path, client = false) {
  let source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  source = source.replace('import.meta.client', String(client))
    .replace('import { useNuxtApp } from "../nuxt";', 'const useNuxtApp = () => ({ isHydrating: false, hooks: { callHook() {} } });')
    .replace('import { onNuxtReady } from "../composables/ready";', 'const onNuxtReady = callback => callback();')
  const { descriptor } = parse(source)
  const compiled = compileScript(descriptor, { id: 'optional-section', inlineTemplate: true }).content
  const code = ts.transpileModule(compiled, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText
    .replace(/from ['"]vue['"]/g, `from '${import.meta.resolve('vue')}'`)
  return (await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))).default
}

const optional = await component('app/components/ui/OptionalSection.vue')
const boundary = await component('node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue', true)

test('failed optional sections never render their slot and healthy siblings remain visible', async () => {
  const { createSSRApp } = await import('vue')
  for (const failed of [true, false]) {
    const app = createSSRApp({ render: () => h('main', [
      h(optional, { failed }, () => h('section', 'Optional content')),
      h('section', 'Healthy content'),
    ]) })
    app.component('NuxtErrorBoundary', boundary)
    const html = await renderToString(app)
    assert.equal(html.includes('Optional content'), !failed)
    assert.ok(html.includes('Healthy content'))
    assert.ok(!html.includes('role="alert"'))
  }
  const app = createSSRApp({ render: () => h(optional, { failed: true }, () => { throw new Error('Failed content must not execute') }) })
  app.component('NuxtErrorBoundary', boundary)
  await renderToString(app)
})

test('a client rendering exception inside an optional section cannot reach the app error handler', async () => {
  const node = (type, text = '') => ({ type, text, children: [], parent: null })
  const renderer = createRenderer({
    createElement: type => node(type), createText: text => node('text', text), createComment: () => node('comment'),
    setText: (target, text) => { target.text = text }, setElementText: (target, text) => { target.text = text; target.children = [] },
    parentNode: target => target.parent, nextSibling: target => target.parent?.children[target.parent.children.indexOf(target) + 1],
    patchProp() {},
    insert(target, parent, anchor) {
      if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1)
      target.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      parent.children.splice(index < 0 ? parent.children.length : index, 0, target)
    },
    remove(target) { target.parent?.children.splice(target.parent.children.indexOf(target), 1); target.parent = null },
  })
  const broken = defineComponent({ render() { throw new Error('Broken optional widget') } })
  const root = node('root')
  const app = renderer.createApp({ render: () => h('main', [h(optional, null, () => h(broken)), h('section', 'Healthy content')]) })
  app.component('NuxtErrorBoundary', boundary)
  const errors = []
  app.config.errorHandler = error => errors.push(error)
  app.mount(root)
  await nextTick()
  const text = target => target.text + target.children.map(text).join('')
  assert.equal(text(root), 'Healthy content')
  assert.deepEqual(errors, [])
  app.unmount()
})

Object.assign(globalThis, { defineStore, ref, reactive, computed, watch })
Object.assign(globalThis, await load('app/utils/api-error.ts'))
const { useConsultationStore } = await load('app/stores/consultation.store.ts')

test('consultation read failures settle independently and missing questions cannot bypass validation', async () => {
  setActivePinia(createPinia())
  let unavailable = true, writes = 0
  globalThis.useAuthStore = () => ({ isAuthenticated: true })
  globalThis.useAppToast = () => ({ error() {}, success() {} })
  globalThis.useApi = () => ({
    get: async () => { if (unavailable) throw new Error('Unavailable'); return { items: [] } },
    post: async () => { writes++ },
  })
  const store = useConsultationStore()
  await Promise.all([store.fetchNotice(), store.fetchQuestions()])
  assert.ok(store.noticeError)
  assert.ok(store.questionsError)
  assert.equal(store.isLoading, false)
  store.description = 'Please advise'
  assert.equal(await store.submit(), false)
  assert.equal(writes, 0)
  unavailable = false
  await store.fetchQuestions()
  assert.equal(store.questionsLoaded, true)
  assert.equal(store.questionsError, '')
  assert.ok(store.noticeError, 'Independent notice failure does not block the form')
  assert.equal(await store.submit(), true)
  assert.equal(writes, 1)
})

test('cached optional content can recover on a later load after a failed refresh', async () => {
  setActivePinia(createPinia())
  let unavailable = false
  globalThis.useAuthStore = () => reactive({ isAuthenticated: true, user: { id: 'user' } })
  globalThis.useApi = () => ({
    get: async path => {
      if (unavailable) throw new Error('Unavailable')
      return path === '/discounts/home' ? null : { items: [] }
    },
    post: async () => { if (unavailable) throw new Error('Unavailable'); return { items: [] } },
  })
  const { useProductListStore } = await load('app/stores/productList.store.ts')
  const { useBlogStore } = await load('app/stores/blog.store.ts')
  const { useStoryStore } = await load('app/stores/story.store.ts')
  const { useOfferStore } = await load('app/stores/offer.store.ts')
  const { useCommentStore } = await load('app/stores/comment.store.ts')
  const products = useProductListStore(), blog = useBlogStore(), stories = useStoryStore(), offer = useOfferStore(), comments = useCommentStore()
  for (const [loadResource, error] of [
    [force => products.fetchPreview('category', force), () => products.previewError.category],
    [force => blog.fetchPosts(force), () => blog.error],
    [force => stories.fetchStories(force), () => stories.error],
    [force => offer.fetchOffer(force), () => offer.error],
    [force => comments.fetchComments('product', 'product', force), () => comments.errors['product:product']],
  ]) {
    unavailable = false
    await loadResource(false)
    assert.ok(!error())
    unavailable = true
    await loadResource(true)
    assert.ok(error())
    unavailable = false
    await loadResource(false)
    assert.ok(!error(), 'An old successful cache must not leave a failed section permanently hidden')
  }
})
