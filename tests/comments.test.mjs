import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import * as h3 from 'h3'

Object.assign(globalThis, h3)
const source = await readFile(new URL('../server/api/comments.get.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
})
const handler = (await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))).default
const targetId = 'ff97af95-87da-518f-8fe9-4f85d01635a7'
const comment = {
  id: '9bcb02ab-d346-44dd-88eb-5b9a102f9cd6',
  user_data: { id: '96d12e58-e762-4c84-b3c6-eb4c87441542', name: '' },
  type: 'product', refrence: targetId, parent_id: null, body: 'test', created_at: 1791998407,
}

async function request(comments) {
  globalThis.backendFetch = async (path, options) => {
    assert.equal(path, '/comments')
    assert.deepEqual(options.query, { comment_type: 'product', reference_id: targetId })
    return comments
  }
  const app = h3.createApp().use(handler)
  const response = await h3.toWebHandler(app)(new Request(`http://shop.test/api/comments?targetType=product&targetId=${targetId}`))
  assert.equal(response.status, 200)
  return (await response.json()).items
}

test('comments and replies prefer user_data.name over legacy author fields', async () => {
  const items = await request([
    { ...comment, user_data: { name: '  سارا  ' }, author_name: 'Old name' },
    { ...comment, id: 'reply', parent_id: comment.id, user_data: { name: 'علی' }, user_name: 'Old name' },
  ])
  assert.deepEqual(items.map(item => item.authorName), ['سارا', 'علی'])
  assert.equal(items[1].parentId, items[0].id)
  assert.equal(items[0].content, 'test')
})

test('live backend response with an empty name and missing name variants use the fallback', async () => {
  const items = await request([
    comment,
    ...[undefined, null, {}, { name: null }, { name: '  ' }, { name: 123 }].map(user_data => ({ ...comment, user_data })),
  ])
  assert.ok(items.every(item => item.authorName === 'کاربر'))
})

test('legacy author fields remain supported when the nested name is unavailable', async () => {
  const items = await request([
    { ...comment, author_name: '  سارا  ', user_name: 'علی' },
    { ...comment, author_name: '  ', user_name: 'علی' },
  ])
  assert.deepEqual(items.map(item => item.authorName), ['سارا', 'علی'])
})
