import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'
import { compileScript, parse } from '@vue/compiler-sfc'
import { computed, createRenderer, defineComponent, effectScope, h, nextTick, reactive, ref, shallowRef, Suspense, watch } from 'vue'
import { createPinia, defineStore, setActivePinia } from 'pinia'

async function loadApp() {
  const source = (await readFile(new URL('../app/app.vue', import.meta.url), 'utf8'))
    .replace("import { Toaster } from 'vue-sonner'", "const Toaster = defineComponent({ render: () => h('div') })")
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: 'navigation-app', inlineTemplate: true }).content
  const code = ts.transpileModule(script, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  }).outputText.replace(/from ['"]vue['"]/g, `from '${import.meta.resolve('vue')}'`)
  return (await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))).default
}

const node = (type, text = '') => ({ type, text, children: [], parent: null, style: {}, props: {} })
const renderer = createRenderer({
  createElement: type => node(type), createText: text => node('text', text), createComment: () => node('comment'),
  setText: (target, text) => { target.text = text }, setElementText: (target, text) => { target.text = text; target.children = [] },
  parentNode: target => target.parent, nextSibling: target => target.parent?.children[target.parent.children.indexOf(target) + 1],
  patchProp: (target, key, _old, value) => { target.props[key] = value },
  insert(target, parent, anchor) {
    if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1)
    target.parent = parent
    const index = anchor ? parent.children.indexOf(anchor) : -1
    parent.children.splice(index < 0 ? parent.children.length : index, 0, target)
  },
  remove(target) { target.parent?.children.splice(target.parent.children.indexOf(target), 1); target.parent = null },
})
const visibleText = target => target.style.display === 'none' ? '' : target.text + target.children.map(visibleText).join('')
const tick = async () => { await new Promise(resolve => setTimeout(resolve, 5)); await nextTick() }

test('navigation hides outgoing loaders, keeps destination setup mounted, and restores pages after failure', async () => {
  const hooks = new Map()
  const nuxt = {
    isHydrating: false,
    hook(name, callback) {
      if (!hooks.has(name)) hooks.set(name, new Set())
      hooks.get(name).add(callback)
      return () => hooks.get(name).delete(callback)
    },
  }
  const emit = name => hooks.get(name)?.forEach(callback => callback())
  Object.assign(globalThis, {
    defineComponent, h, useNuxtApp: () => nuxt,
    useShopStore: () => ({ name: 'Shop', fetchShop: async () => {} }),
    callOnce: async (_key, run) => run(), useHead() {}, useSeoMeta() {},
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  })
  // Exercise the installed Nuxt loading lifecycle, including its error handling.
  const indicatorSource = (await readFile(new URL('../node_modules/nuxt/dist/app/composables/loading-indicator.js', import.meta.url), 'utf8'))
    .replace('import { useNuxtApp } from "../nuxt.js";', 'const useNuxtApp = globalThis.useNuxtApp;')
    .replaceAll('import.meta.client', 'true')
    .replace(/from ['"]vue['"]/g, `from '${import.meta.resolve('vue')}'`)
  const { useLoadingIndicator } = await import('data:text/javascript;base64,' + Buffer.from(indicatorSource).toString('base64'))
  globalThis.useLoadingIndicator = useLoadingIndicator
  const App = await loadApp()
  const outgoingLoading = ref(false)
  const page = shallowRef(defineComponent({ render: () => h('section', outgoingLoading.value ? 'Outgoing product list loading' : 'Products') }))
  const root = node('root')
  const app = renderer.createApp({ render: () => h(Suspense, null, { default: () => h(App) }) })
  const passthrough = defineComponent({ setup: (_props, { slots }) => () => h('div', slots.default?.()) })
  for (const name of ['UApp', 'NuxtLayout']) app.component(name, passthrough)
  for (const name of ['NuxtRouteAnnouncer', 'UiConfirmDialog']) app.component(name, defineComponent({ render: () => h('div') }))
  app.component('NuxtPage', defineComponent({ render: () => h(Suspense, null, { default: () => h(page.value) }) }))
  const errors = []
  app.config.errorHandler = error => errors.push(error)
  app.mount(root)
  await tick()
  assert.ok(visibleText(root).includes('Products'), 'Initial content renders without a navigation loader')
  for (const label of ['Product detail', 'Home', 'Article', 'Story', 'Order detail', 'Payment result']) {
    emit('page:loading:start')
    outgoingLoading.value = true
    let resolve, started = false
    const pending = new Promise(done => { resolve = done })
    page.value = defineComponent({ async setup() { started = true; await pending; return () => h('section', label) } })
    await tick()
    assert.equal(started, true, 'Hiding outgoing content must not unmount the destination')
    assert.ok(visibleText(root).includes('در حال بارگذاری صفحه...'))
    assert.ok(!visibleText(root).includes('Outgoing product list loading'))
    assert.ok(!visibleText(root).includes(label))
    resolve()
    await tick()
    emit('page:loading:end')
    await tick()
    assert.ok(visibleText(root).includes(label))
    assert.ok(!visibleText(root).includes('در حال بارگذاری صفحه...'))
  }
  for (const end of ['page:loading:end', 'vue:error']) {
    emit('page:loading:start')
    await tick()
    assert.ok(visibleText(root).includes('در حال بارگذاری صفحه...'))
    emit(end)
    await tick()
    assert.ok(visibleText(root).includes('Payment result'), 'Cancelled or failed navigation must not leave a stuck loader')
  }
  assert.deepEqual(errors, [])
  app.unmount()
})

test('leaving an article preserves its content until the outgoing page unmounts', async () => {
  async function script(path, exports = '') {
    let source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
    if (path.endsWith('.vue')) source = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
    const code = ts.transpileModule(source + '\n' + exports, {
      compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
    }).outputText
    return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
  }
  setActivePinia(createPinia())
  Object.assign(globalThis, { computed, ref, defineStore, useApi: () => ({ get: async () => ({ slug: 'article', publishedAt: 1 }) }) })
  const { useBlogStore } = await script('app/stores/blog.store.ts')
  const store = useBlogStore()
  const route = reactive({ path: '/blog/article', params: { slug: 'article' } })
  const currentRoute = ref(route)
  const hooks = new Set(), cleanup = [], scope = effectScope()
  Object.assign(globalThis, {
    useBlogStore: () => store, useRoute: () => route,
    useRouter: () => ({ currentRoute, afterEach(callback) { hooks.add(callback); return () => hooks.delete(callback) } }),
    onBeforeUnmount: callback => cleanup.push(callback),
    watch: (...args) => scope.run(() => watch(...args)),
    usePageResponse: () => () => {}, usePageSeo() {}, callOnce: async (_key, run) => run(),
  })
  try {
    const article = await script('app/pages/blog/[slug].vue', 'export { post };')
    assert.equal(article.post.value.slug, 'article')
    const home = { path: '/', params: {} }
    currentRoute.value = home
    hooks.forEach(callback => callback(home, route))
    await nextTick()
    assert.equal(article.post.value?.slug, 'article', 'Navigation must not flash the article-not-found fallback')
    cleanup.forEach(callback => callback())
    assert.equal(store.current, null)
  } finally { scope.stop() }
})
