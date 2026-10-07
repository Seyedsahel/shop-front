export default defineEventHandler(async (event): Promise<ProductListResponse> => {
  const body = await readProductListRequest(event)

  try {
    const raw = await backendFetch<any>('/products/list', {
      method: 'POST',
      authorization: 'none',
      body: {
        discount_id: body.discountId,
        search: body.search,
        category_ids: body.categoryIds,
        brand_ids: body.brandIds,
        price_min: body.priceMin,
        price_max: body.priceMax,
        attribute_fields: body.attributeFields,
        page: body.page ?? 1,
        limit: body.limit ?? 30,
        sort_by: body.sortBy,
        sort_dir: body.sortDir,
      },
    }, event)

    return mapProductListResponse(raw)
  } catch (e: any) {
    console.error('Backend product-list error:', e.data ?? e.message)
    throw e
  }
})
