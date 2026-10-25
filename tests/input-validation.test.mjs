import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import * as h3 from 'h3'
import { ref, computed, watch, reactive } from 'vue'
import { createPinia, setActivePinia, defineStore } from 'pinia'

async function load(path, exports = '') {
  let source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
  if (path.endsWith('.vue')) source = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const { outputText } = ts.transpileModule(source + exports, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}
Object.assign(globalThis, h3, { ref, computed, watch })
Object.assign(globalThis, await load('shared/utils/authInput.ts'))
Object.assign(globalThis, await load('shared/utils/commentInput.ts'))
const requestOtp = (await load('server/api/auth/otp/request.post.ts')).default
const verifyOtp = (await load('server/api/auth/otp/verify.post.ts')).default
const comment = (await load('server/api/comments.post.ts')).default

function request(handler, body, raw = false) {
  const app = h3.createApp({ onError() {} }).use(handler)
  return h3.toWebHandler(app)(new Request('http://shop.test/api/test', {
    method: 'POST', headers: { 'content-type': 'application/json', cookie: 'guest_token=guest' },
    body: raw ? body : JSON.stringify(body),
  }))
}

test('OTP normalizes supported phone formats and localized digits without changing the backend format', () => {
  for (const phone of ['9123456789', '09123456789', '+989123456789', '00989123456789', '۰۹۱۲۳۴۵۶۷۸۹', '٩١٢٣٤٥٦٧٨٩', '+98 (912) 345-6789']) {
    assert.deepEqual(parseOtpRequestInput({ phone }), { phone: '9123456789' })
  }
  assert.deepEqual(parseOtpVerifyInput({ phone: '09123456789', code: ' ۰١۲٣۴٥ ' }), { phone: '9123456789', code: '012345' })
  for (const phone of [123, null, {}, [], '', 'abc9123456789', '91234567890', '+449123456789']) {
    assert.equal(parseOtpRequestInput({ phone }), null)
  }
})

test('OTP routes reject malformed bodies before making any backend request or changing cookies', async () => {
  globalThis.backendFetch = () => { throw new Error('Backend must not be called') }
  const invalidShapes = [null, [], true, 'text', 123, {}, { phone: 9123456789 }, { phone: '   ' }]
  for (const handler of [requestOtp, verifyOtp]) {
    for (const body of invalidShapes) {
      const response = await request(handler, body)
      assert.equal(response.status, 400, JSON.stringify(body))
      assert.equal(response.headers.get('set-cookie'), null)
      assert.equal(typeof (await response.json()).data.validationMessage, 'string')
    }
  }
  for (const code of [undefined, null, 123456, {}, [], '', '123', '1234', '12345', '1234567', '12ab45']) {
    assert.equal((await request(verifyOtp, { phone: '9123456789', code })).status, 400)
  }
  assert.equal((await request(requestOtp, '{broken', true)).status, 400)
})

test('valid OTP requests preserve text/plain JSON, credential modes and login cookies', async () => {
  const calls = []
  globalThis.backendFetch = async (path, options) => {
    calls.push([path, options])
    return path.endsWith('/verify') ? { token: 'user-token' } : { message: 'Sent' }
  }
  globalThis.sessionCookieOptions = { httpOnly: true, sameSite: 'lax', path: '/' }
  globalThis.clearCredential = (event, kind) => h3.deleteCookie(event, kind + '_token', { path: '/' })
  assert.equal((await request(requestOtp, { phone: '+989123456789' })).status, 200)
  const response = await request(verifyOtp, { phone: '۰۹۱۲۳۴۵۶۷۸۹', code: '٠١٢٣٤٥' })
  assert.equal(response.status, 200)
  assert.match(response.headers.get('set-cookie'), /auth_token=user-token/)
  assert.match(response.headers.get('set-cookie'), /guest_token=; Max-Age=0/)
  for (const [, options] of calls) {
    assert.equal(options.method, 'POST')
    assert.equal(options.headers['Content-Type'], 'text/plain')
  }
  assert.equal(calls[0][1].authorization, 'none')
  assert.equal(calls[0][1].body, JSON.stringify({ phone: '9123456789' }))
  assert.equal(calls[1][1].authorization, 'session')
  assert.equal(calls[1][1].body, JSON.stringify({ phone: '9123456789', code: '012345' }))
})

test('comment submission rejects incorrect types, empty text/IDs and invalid parent IDs before upstream writes', async () => {
  globalThis.backendFetch = () => { throw new Error('Backend must not be called') }
  const valid = { targetType: 'product', targetId: 'p', content: 'نظر' }
  const bodies = [null, [], true, 'text', 123, {},
    ...['invalid', null, 1].map(targetType => ({ ...valid, targetType })),
    ...[null, 123, {}, [], '', '   '].map(targetId => ({ ...valid, targetId })),
    ...[null, 123, {}, [], '', '\n '].map(content => ({ ...valid, content })),
    ...[null, 123, {}, [], '', '   '].map(parentId => ({ ...valid, parentId })),
  ]
  for (const body of bodies) assert.equal((await request(comment, body)).status, 400, JSON.stringify(body))
  assert.equal((await request(comment, '{broken', true)).status, 400)
})

test('valid product and blog comments preserve payload mapping and optional replies', async () => {
  for (const targetType of ['product', 'post']) {
    for (const parentId of [undefined, ' parent ']) {
      globalThis.backendFetch = async (path, options) => {
        assert.equal(path, '/comments')
        assert.equal(options.authorization, 'user')
        assert.equal(options.headers['Content-Type'], 'text/plain')
        assert.deepEqual(JSON.parse(options.body), {
          body: 'متن نظر', comment_type: targetType, reference_id: 'target',
          ...(parentId ? { parent_id: 'parent' } : {}),
        })
        return { id: 'comment', body: 'متن نظر' }
      }
      assert.equal((await request(comment, { targetType, targetId: ' target ', content: ' متن نظر ', parentId })).status, 200)
    }
  }
})

test('phone form blocks invalid input, normalizes pasted numbers and prevents duplicate submission', async () => {
  const calls = []
  const auth = { phone: '9123456789', isLoading: false, async requestOtp(phone) { calls.push(phone) } }
  globalThis.useAuthStore = () => auth
  globalThis.useShopStore = () => ({})
  const form = await load('app/components/auth/PhoneStep.vue', '\nexport { submit, phone, validationError }')
  assert.equal(form.phone.value, auth.phone)
  form.phone.value = '9133456789'
  assert.equal(auth.phone, '9123456789')
  form.phone.value = '123'
  await form.submit()
  assert.equal(calls.length, 0)
  assert.ok(form.validationError.value)
  form.phone.value = '+۹۸۹۱۲۳۴۵۶۷۸۹'
  await form.submit()
  assert.deepEqual(calls, ['9123456789'])
  auth.isLoading = true
  await form.submit()
  assert.equal(calls.length, 1)
})

test('returning with the same phone preserves the OTP cooldown without another request', async (t) => {
  let now = Date.parse('2026-10-24T12:00:00Z')
  t.mock.method(Date, 'now', () => now)
  setActivePinia(createPinia())
  const calls = [], errors = []
  let fail = false, finishRequest
  Object.assign(globalThis, {
    defineStore,
    useSessionSync: () => () => {},
    useApi: () => ({ async post(path, payload) {
      calls.push([path, payload])
      if (fail) throw new Error('Request failed')
      if (finishRequest) await finishRequest.promise
      return { message: 'Sent' }
    } }),
    useAppToast: () => ({ error: message => errors.push(message) }),
    getUserFriendlyApiErrorMessage: error => error.message,
  })
  const { useAuthStore } = await load('app/stores/auth.store.ts')
  const auth = useAuthStore()
  await auth.requestOtp('9123456789')
  const deadline = auth.otpResendAvailableAt
  now += 10_000
  auth.goBackToPhone()
  assert.equal(auth.step, 'phone')
  assert.equal(auth.otpResendAvailableAt, deadline)
  await auth.requestOtp('9123456789')
  assert.equal(auth.step, 'otp')
  assert.equal(calls.length, 1)
  assert.equal(auth.otpResendAvailableAt, deadline)
  await auth.resendOtp()
  assert.equal(calls.length, 1)

  auth.goBackToPhone()
  fail = true
  await auth.requestOtp('9133456789')
  assert.equal(auth.step, 'phone')
  assert.equal(auth.phone, '9123456789')
  assert.equal(auth.otpResendAvailableAt, deadline)
  assert.deepEqual(errors, ['Request failed'])
  fail = false
  await auth.requestOtp('9133456789')
  assert.equal(auth.phone, '9133456789')
  assert.equal(auth.step, 'otp')
  assert.equal(calls.length, 3)

  now = Date.parse(auth.otpResendAvailableAt)
  let resolve
  finishRequest = { promise: new Promise(done => { resolve = done }) }
  const resend = auth.resendOtp()
  await auth.resendOtp()
  assert.equal(calls.length, 4)
  resolve()
  await resend
  assert.equal(auth.isLoading, false)
  assert.equal(Date.parse(auth.otpResendAvailableAt), now + 60_000)
})

test('OTP form supports localized paste and rejects incomplete codes', async () => {
  const calls = []
  const auth = { isLoading: false, otpResendAvailableAt: 'resend-deadline', async verifyOtp(code) { calls.push(code) }, async resendOtp() { calls.push('resend') }, consumeReturnTo: () => '/' }
  globalThis.useAuthStore = () => auth
  const countdown = reactive({ expired: false })
  globalThis.useCountdown = deadline => { assert.equal(deadline.value, 'resend-deadline'); return countdown }
  globalThis.navigateTo = async () => {}
  globalThis.onMounted = () => {}
  const form = await load('app/components/auth/OtpStep.vue', '\nexport { submit, onPaste, onDigitInput, codeError, handleResend, digits }')
  assert.equal(form.digits.value.length, 6)
  await form.submit()
  assert.equal(calls.length, 0)
  assert.ok(form.codeError.value)
  form.onPaste({ clipboardData: { getData: () => '۰١۲٣' }, preventDefault() {} })
  await form.submit()
  assert.equal(calls.length, 0)
  assert.ok(form.codeError.value)
  form.onPaste({ clipboardData: { getData: () => '۰١۲٣۴٥' }, preventDefault() {} })
  await form.submit()
  assert.deepEqual(calls, ['012345'])
  form.onDigitInput({ target: { value: '۴' } }, 0)
  await form.submit()
  assert.deepEqual(calls, ['012345', '412345'])
  await form.handleResend()
  assert.deepEqual(calls, ['012345', '412345'])
  countdown.expired = true
  await form.submit() // Resend eligibility does not mean that the OTP has expired.
  assert.deepEqual(calls, ['012345', '412345', '412345'])
  await form.handleResend()
  assert.equal(calls.at(-1), 'resend')
  assert.deepEqual(form.digits.value, ['', '', '', '', '', ''])
  await form.submit()
  assert.equal(calls.at(-1), 'resend')
})

test('comment form shows an inline error, preserves failed drafts and sends normalized replies', async () => {
  const props = { targetType: 'post', targetId: ' article ' }
  const calls = []
  let succeeds = false
  const store = { isSubmitting: false, async fetchComments() {},
    async submitComment(...args) { calls.push(args); return succeeds },
  }
  globalThis.defineProps = () => props
  globalThis.useCommentStore = () => store
  globalThis.callOnce = (_key, fn) => fn()
  const form = await load('app/components/comment/CommentList.vue', '\nexport { submit, newComment, commentError, replyingTo }')
  form.newComment.value = '  \n '
  await form.submit()
  assert.equal(calls.length, 0)
  assert.ok(form.commentError.value)
  form.newComment.value = ' متن نظر '
  form.replyingTo.value = { id: ' parent ' }
  await form.submit()
  assert.deepEqual(calls[0], ['post', 'article', 'متن نظر', 'parent'])
  assert.equal(form.newComment.value, ' متن نظر ')
  store.isSubmitting = true
  await form.submit()
  assert.equal(calls.length, 1)
  store.isSubmitting = false
  succeeds = true
  await form.submit()
  assert.equal(form.newComment.value, '')
  assert.equal(form.replyingTo.value, null)
})
