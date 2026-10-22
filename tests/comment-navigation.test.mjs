import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'
import { compileScript, parse } from '@vue/compiler-sfc'
import { computed, createRenderer, createSSRApp, defineComponent, h, nextTick, onServerPrefetch, reactive, ref, Suspense, watch } from 'vue'
import { renderToString } from '@vue/server-renderer'

const { descriptor } = parse(await readFile(new URL('../app/components/comment/CommentList.vue', import.meta.url), 'utf8'))
const compiled = compileScript(descriptor, { id: 'comment-navigation', inlineTemplate: true }).content
const code = ts.transpileModule(compiled, {
  compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
}).outputText.replace(/from ['"]vue['"]/g, `from '${import.meta.resolve('vue')}'`)
const CommentList = (await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))).default

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
const visibleText = target => target.text + target.children.map(visibleText).join('')
const tick = async () => { await new Promise(resolve => setTimeout(resolve, 0)); await nextTick() }

function setup() {
  const requests = []
  const store = reactive({
    byTarget: {}, pendingByTarget: {}, errors: {}, isLoading: false, isSubmitting: false,
    keyFor: (type, id) => `${type}:${id}`,
    fetchComments(type, id) {
      const key = this.keyFor(type, id)
      if (this.byTarget[key]) return Promise.resolve()
      this.isLoading = true
      return new Promise(resolve => requests.push({ id, resolve: () => {
        this.byTarget[key] = [{ id, authorName: 'Reader', content: `Comment for ${id}`, createdAt: 'Today' }]
        this.isLoading = false
        resolve()
      } }))
    },
  })
  Object.assign(globalThis, {
    computed, ref, watch, onServerPrefetch, useCommentStore: () => store,
  })
  return requests
}

function register(app) {
  const passthrough = defineComponent({ setup: (_props, { slots }) => () => h('div', slots.default?.()) })
  for (const name of ['UiOptionalSection', 'UiExpandableContent', 'UiBadge']) app.component(name, passthrough)
  for (const name of ['UIcon', 'UiTextarea']) app.component(name, defineComponent({ render: () => h('span') }))
  return app
}

test('comments render when product content mounts after the page suspense has resolved', async () => {
  const requests = setup()
  const targetId = ref(null)
  const root = node('root')
  const app = register(renderer.createApp({ render: () => h(Suspense, null, {
    default: () => h('main', targetId.value ? [h(CommentList, { targetType: 'product', targetId: targetId.value })] : 'Loading product'),
  }) }))
  app.mount(root)
  try {
    await tick()
    targetId.value = 'first'
    await tick()
    assert.equal(requests.length, 1)
    assert.ok(visibleText(root).includes('نظرات کاربران'), 'The section must render while comments are loading')
    requests[0].resolve()
    await tick()
    assert.ok(visibleText(root).includes('Comment for first'), 'Client navigation must render comments without a reload')

    targetId.value = 'second'
    await tick()
    assert.equal(requests.length, 2)
    assert.ok(!visibleText(root).includes('Comment for first'))
    requests[1].resolve()
    await tick()
    assert.ok(visibleText(root).includes('Comment for second'))

    targetId.value = 'slow'
    await tick()
    targetId.value = 'latest'
    await tick()
    assert.deepEqual(requests.slice(2).map(request => request.id), ['slow', 'latest'])
    requests[3].resolve()
    await tick()
    requests[2].resolve()
    await tick()
    assert.ok(visibleText(root).includes('Comment for latest'))
    assert.ok(!visibleText(root).includes('Comment for slow'), 'Late responses must not replace the active product comments')
  } finally { app.unmount() }
})

test('server rendering waits for comments', async () => {
  const requests = setup()
  const app = register(createSSRApp({ render: () => h(CommentList, { targetType: 'product', targetId: 'ssr' }) }))
  const rendering = renderToString(app)
  await tick()
  assert.equal(requests.length, 1)
  requests[0].resolve()
  assert.ok((await rendering).includes('Comment for ssr'))
})
