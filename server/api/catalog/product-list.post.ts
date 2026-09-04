export default defineEventHandler(async (event): Promise<ProductListResponse> => {
  const config = useRuntimeConfig()
  const body = await readBody<ProductListRequest>(event)

try{
  const raw = await backendFetch<any>('/api/products/list', {
    method: 'POST',
    body: {
      search: body.search,
      category_ids: body.categoryIds,
      price_min: body.priceMin,
      price_max: body.priceMax,
      attribute_fields: body.attributeFields,
      page: body.page ?? 1,
      limit: body.limit ?? 12,
      sort_by: body.sortBy,
      sort_dir: body.sortDir,
    },
  })

  return {
    items: raw.items.map((p: any) => ({
      id: p.id,
      productTypeId: p.product_type_id,
      name: p.name,
      slug: p.slug,
      thumbnailUrl: p.thumbnail_url,
      imageUrl: p.thumbnail_url ? `${config.public.imageBaseUrl}/${p.thumbnail_url}` : '',
      description: p.description,
      basePrice: p.base_price,
      stock: p.stock,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
  }
} catch (e: any) {
  console.error('Backend product-list error:', e.data ?? e.message)
  throw e
}


})