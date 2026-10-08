import type { H3Event } from 'h3'

function invalidProductRequest(): never {
  throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'اطلاعات درخواست محصولات معتبر نیست.' })
}

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function validateProductFacets(body: Record<string, unknown>) {
  if (body.discountId !== undefined && (typeof body.discountId !== 'string' || !body.discountId.trim())) invalidProductRequest()
  if (body.sortBy !== undefined && (typeof body.sortBy !== 'string' || !['relevance', 'created_at', 'price'].includes(body.sortBy))) invalidProductRequest()
  if (body.search !== undefined && typeof body.search !== 'string') invalidProductRequest()
  for (const field of ['categoryIds', 'brandIds']) {
    if (body[field] !== undefined && (!Array.isArray(body[field]) || !(body[field] as unknown[]).every(value => typeof value === 'string' && !!value.trim()))) invalidProductRequest()
  }
  for (const field of ['page', 'limit']) {
    const value = body[field]
    if (value !== undefined && (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1)) invalidProductRequest()
  }
  for (const field of ['priceMin', 'priceMax']) {
    const value = body[field]
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) invalidProductRequest()
  }
  if (typeof body.priceMin === 'number' && typeof body.priceMax === 'number' && body.priceMin > body.priceMax) invalidProductRequest()
  if (body.sortDir !== undefined && body.sortDir !== 'asc' && body.sortDir !== 'desc') invalidProductRequest()
  if (body.attributeFields !== undefined) {
    if (!object(body.attributeFields)) invalidProductRequest()
    for (const [slug, values] of Object.entries(body.attributeFields)) {
      if (!slug.trim() || ['__proto__', 'constructor', 'prototype'].includes(slug)
        || !Array.isArray(values) || !values.every(value => typeof value === 'string' && !!value.trim())) invalidProductRequest()
    }
  }
}

export async function readProductListRequest(event: H3Event): Promise<ProductListRequest> {
  const body: unknown = await readBody(event)
  if (!object(body)) invalidProductRequest()
  validateProductFacets(body)
  return body as ProductListRequest
}

export async function readProductFiltersRequest(event: H3Event): Promise<ProductFiltersRequest> {
  const body: unknown = await readBody(event)
  if (!object(body)) invalidProductRequest()
  validateProductFacets(body)
  if (!object(body.collection) || typeof body.collection.kind !== 'string' || !['catalog', 'discounted'].includes(body.collection.kind)) invalidProductRequest()
  return body as unknown as ProductFiltersRequest
}
