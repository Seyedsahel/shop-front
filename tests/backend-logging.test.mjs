import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import * as h3 from 'h3'

async function load(path) {
  const source = (await readFile(new URL('../' + path, import.meta.url), 'utf8'))
    .replace(/^import .* from ['"]\.\/.*['"]\n/gm, '')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}
Object.assign(globalThis, h3)
Object.assign(globalThis, await load('server/utils/session.ts'), await load('shared/utils/requestDeadline.ts'))
globalThis.useRuntimeConfig = () => ({ backendUrl: 'https://backend.test' })
const { backendFetch } = await load('server/utils/backendFetch.ts')

test('backend logs upstream diagnostics while preserving normalized client responses', async () => {
  const privateValue = 'CUSTOMER_PRIVATE_PHONE_ADDRESS_TOKEN'
  const logs = []
  const original = console.error
  console.error = (...args) => logs.push(args)
  try {
    globalThis.$fetch = async () => {
      throw { response: { status: 422, _data: { secret: privateValue } }, data: { error: privateValue }, message: privateValue }
    }
    await assert.rejects(backendFetch('/orders/' + privateValue + '?phone=' + privateValue,
      { authorization: 'none', method: 'POST', body: { phone: privateValue } }),
    error => error.statusCode === 422 && error.data.validationMessage === privateValue)
    assert.deepEqual(logs, [['backend_request_failed', {
      method: 'POST', status: 422, kind: 'http',
      message: privateValue, data: { error: privateValue }, stack: undefined,
    }]])

    globalThis.$fetch = async () => {
      throw { response: { status: 500, _data: { message: 'Database connection failed' } }, message: 'Internal Server Error' }
    }
    await assert.rejects(backendFetch('/orders', { authorization: 'none', method: 'POST' }),
      error => error.statusCode === 500 && error.message === 'درخواست به سرویس انجام نشد.' && !error.data?.message)
    assert.deepEqual(logs.at(-1), ['backend_request_failed', {
      method: 'POST', status: 500, kind: 'http',
      message: 'Internal Server Error', data: { message: 'Database connection failed' }, stack: undefined,
    }])

    const networkError = new Error(privateValue)
    globalThis.$fetch = async () => { throw networkError }
    await assert.rejects(backendFetch('/private', { authorization: 'none' }), error => error.statusCode === 502)
    assert.deepEqual(logs.at(-1), ['backend_request_failed', {
      method: 'GET', status: null, kind: 'network',
      message: privateValue, data: undefined, stack: networkError.stack,
    }])

    globalThis.$fetch = () => new Promise(() => {})
    await assert.rejects(backendFetch('/private', { authorization: 'none', timeout: 10 }), error => error.statusCode === 504)
    const timeoutLog = logs.at(-1)
    assert.equal(timeoutLog[0], 'backend_request_failed')
    assert.equal(timeoutLog[1].method, 'GET')
    assert.equal(timeoutLog[1].status, null)
    assert.equal(timeoutLog[1].kind, 'timeout')
  } finally {
    console.error = original
  }
})
