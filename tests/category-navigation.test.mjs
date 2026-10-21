import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'
import { computed, createSSRApp, defineComponent, h, nextTick, onMounted, reactive, ref, resolveComponent } from 'vue'
import { compileScript, parse } from '@vue/compiler-sfc'
import { renderToString } from '@vue/server-renderer'

let moduleId = 0
async function load(file, exports = '') {
  let source = await readFile(new URL('../' + file, import.meta.url), 'utf8')
  if (file.endsWith('.vue')) source = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const code = ts.transpileModule(source + '\n' + exports, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  }).outputText
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64') + '#' + ++moduleId)
}
const { buildCategoryTree, getCategoryPath } = await load('app/composables/useCategoryTree.ts')
const category = (id, parentId = '', name = id) => ({ id, parentId, name, slug: id, imageUrl: '', createdAt: 0, updatedAt: 0 })
const nested = [category('root'), category('child', 'root'), category('grandchild', 'child'), category('level-4', 'grandchild'), category('leaf', 'level-4', 'ویتامین کودکان'), category('other')]

test('the category tree and ancestor paths preserve every level regardless of backend ordering', () => {
  const input = [...nested].reverse()
  const tree = buildCategoryTree(input)
  let node = tree.find(item => item.id === 'root')
  for (const id of ['child', 'grandchild', 'level-4', 'leaf']) {
    node = node.children[0]
    assert.equal(node.id, id)
  }
  assert.deepEqual(getCategoryPath(input, 'leaf').map(item => item.id), ['root', 'child', 'grandchild', 'level-4', 'leaf'])
  assert.ok(input.every(item => !('children' in item)), 'Canonical store records must not be mutated')
})

test('missing parents and cycles remain reachable and cannot hang ancestor lookup', () => {
  const items = [category('orphan', 'missing'), category('self', 'self'), category('a', 'b'), category('b', 'a'), category('descendant', 'a')]
  const tree = buildCategoryTree(items)
  const ids = []
  const visit = nodes => nodes.forEach(node => { ids.push(node.id); visit(node.children) })
  visit(tree)
  assert.deepEqual(ids.sort(), items.map(item => item.id).sort())
  assert.equal(new Set(getCategoryPath(items, 'descendant').map(item => item.id)).size, 3)
  assert.deepEqual(getCategoryPath(items, 'unknown'), [])
})

async function menu(items = nested) {
  const store = reactive({ items: structuredClone(items), error: '', isLoading: false, fetchCategories: async () => {} })
  Object.assign(globalThis, {
    ref, computed, nextTick, buildCategoryTree, getCategoryPath,
    useCategoryStore: () => store,
    useProductListStore: () => ({ fetchDiscountedAvailability: async () => {} }),
    onMounted() {}, defineEmits: () => () => {},
    resolveComponent: () => 'a',
  })
  const component = await load('app/components/nav/CategoriesDropdown.vue', 'export { tree, path, current, children, selectPath, openBranch, search, results, categoryLink };')
  return { ...component, store }
}

test('drilling down, jumping to an ancestor, and switching roots work at arbitrary depth', async () => {
  const m = await menu()
  for (const id of ['root', 'child', 'grandchild', 'level-4']) {
    m.openBranch(m.children.value.find(node => node.id === id))
    await nextTick()
    assert.equal(m.current.value.id, id)
    assert.equal(m.categoryLink(m.current.value.slug).query.category, id, 'Every parent has a product collection link')
  }
  assert.equal(m.children.value[0].id, 'leaf')
  assert.deepEqual(m.categoryLink('leaf'), { path: '/products', query: { category: 'leaf' } })
  await m.selectPath(m.path.value.slice(0, 2).map(node => node.id))
  assert.equal(m.current.value.id, 'child')
  assert.equal(m.children.value[0].id, 'grandchild')
  await m.selectPath([])
  assert.equal(m.current.value, undefined)
  assert.equal(m.children.value.length, 2)
})

test('search finds deep categories with Persian character variants and their ancestor context', async () => {
  const m = await menu()
  m.search.value = '  كودكان  '
  assert.equal(m.results.value.length, 1)
  assert.equal(m.results.value[0].id, 'leaf')
  assert.equal(m.results.value[0].ancestry, 'root / child / grandchild / level-4')
  m.search.value = 'missing category'
  assert.deepEqual(m.results.value, [])
  await m.selectPath(['root'])
  assert.equal(m.search.value, '')
})

test('refreshing category metadata cannot leave the browser on a removed branch', async () => {
  const m = await menu()
  await m.selectPath(['root', 'child', 'grandchild'])
  m.store.items = [category('root'), category('replacement', 'root')]
  assert.deepEqual(m.path.value.map(node => node.id), ['root'])
  assert.equal(m.children.value[0].id, 'replacement')
})

test('the rendered deep branch includes ancestor breadcrumbs and links for both parent and leaf products', async () => {
  Object.assign(globalThis, {
    ref, computed, nextTick, onMounted, resolveComponent, buildCategoryTree, getCategoryPath,
    useCategoryStore: () => ({ items: nested, isLoading: false, error: '' }),
    useProductListStore: () => ({ hasDiscountedProducts: true }),
  })
  const source = (await readFile(new URL('../app/components/nav/CategoriesDropdown.vue', import.meta.url), 'utf8'))
    .replace("ref<string[]>([])", 'ref<string[]>(["root", "child", "grandchild", "level-4"])')
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: 'category-menu', inlineTemplate: true }).content
  const code = ts.transpileModule(script, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  }).outputText.replace(/from ['"]vue['"]/g, `from '${import.meta.resolve('vue')}'`)
  const component = (await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))).default
  const app = createSSRApp(component)
  app.component('NuxtLink', defineComponent({
    props: ['to'], setup: (props, { slots }) => () => h('a', {
      href: typeof props.to === 'string' ? props.to : props.to.path + '?' + new URLSearchParams(props.to.query),
    }, slots.default?.()),
  }))
  app.component('UiInput', defineComponent({ render: () => h('input') }))
  app.component('UIcon', defineComponent({ render: () => h('span') }))
  const warnings = []
  app.config.warnHandler = warning => warnings.push(warning)
  const html = await renderToString(app)
  assert.match(html, /href="\/products\?category=level-4"/)
  assert.match(html, /href="\/products\?category=leaf"/)
  assert.match(html, /aria-label="مسیر دسته‌بندی"/)
  for (const id of ['root', 'child', 'grandchild', 'level-4']) assert.ok(html.includes(id))
  assert.match(html, /href="\/discounts\/products"/)
  assert.deepEqual(warnings, [])
})
