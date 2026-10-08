import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../app/utils/productQuantity.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } })
const { productQuantityLimits, cartLineQuantityLimits } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))

test('additional quantity respects product total, selected variant and stock independently', () => {
  const input = { stock: 10, productMaxPerOrder: 5, variantMaxPerOrder: 2, productQuantity: 4, variantQuantity: 1 }
  assert.deepEqual(productQuantityLimits(input), { maxAdditional: 1, orderRemaining: 1 })
  assert.equal(productQuantityLimits({ ...input, productQuantity: 5 }).maxAdditional, 0)
  assert.equal(productQuantityLimits({ ...input, productMaxPerOrder: 0, variantQuantity: 2 }).maxAdditional, 0)
  assert.deepEqual(productQuantityLimits({ ...input, stock: 1, variantMaxPerOrder: 0 }), { maxAdditional: 0, orderRemaining: 1 })
})

test('zero/omitted caps are unlimited and quantities never become negative', () => {
  const input = { stock: 8, productMaxPerOrder: 0, productQuantity: 20, variantQuantity: 3 }
  assert.deepEqual(productQuantityLimits(input), { maxAdditional: 5, orderRemaining: Infinity })
  assert.equal(productQuantityLimits({ ...input, stock: 2 }).maxAdditional, 0)
  assert.equal(productQuantityLimits({ ...input, productMaxPerOrder: 2 }).maxAdditional, 0)
})

test('line replacement excludes its own quantity but counts every other variant of the same product', () => {
  const item = { id: 'blue', product_id: 'p', quantity: 1, stock: 10, max_per_order: 2 }
  const other = { ...item, id: 'red', quantity: 3, max_per_order: 4 }
  const unrelated = { ...item, id: 'unrelated', product_id: 'q', quantity: 100 }
  assert.deepEqual(cartLineQuantityLimits(item, [item, other, unrelated], 5), { maxQuantity: 2, orderMaximum: 2 })
  assert.deepEqual(cartLineQuantityLimits(other, [item, other], 3), { maxQuantity: 2, orderMaximum: 2 })
  assert.equal(cartLineQuantityLimits(item, [item, { ...other, quantity: 6 }], 5).maxQuantity, 0)
})

test('line caps and stock stay meaningful when the product has no cap', () => {
  const item = { id: 'line', product_id: 'p', quantity: 2, stock: 8, max_per_order: 0 }
  assert.deepEqual(cartLineQuantityLimits(item, [item], 0), { maxQuantity: 8, orderMaximum: Infinity })
  assert.deepEqual(cartLineQuantityLimits({ ...item, max_per_order: 3 }, [item], 0), { maxQuantity: 3, orderMaximum: 3 })
})
