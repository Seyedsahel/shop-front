export default defineEventHandler(async (event): Promise<ProductListResponse> => {
  const body = await readBody<ProductListRequest>(event)

  const raw = await backendFetch<any>('/api/discounts/products', {
    method: 'POST',
    body: {
      discounted_only: true,
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
  })

  return mapProductListResponse(raw)
})
