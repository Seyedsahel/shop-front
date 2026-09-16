export default defineEventHandler(async (event): Promise<ProductListResponse> => {
  const body = await readBody<ProductListRequest>(event)

  try {
    const raw = await backendFetch<any>('/api/products/list', {
      method: 'POST',
      body: {
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

    return {
      items: raw.items.map((p: any) => {
        const originalPrice = Number(p.price?.original ?? p.base_price ?? 0)
        const finalPrice = Number(p.price?.final ?? p.base_price ?? originalPrice)

        return {
          id: p.id,
          productTypeId: p.product_type_id ?? null,
          name: p.name,
          slug: p.slug,
          brandId: p.brand_id ?? '',
          thumbnailUrl: p.thumbnail_url,
          imageUrl: toBackendImageUrl(p.thumbnail_url),
          description: p.description,
          basePrice: Number(p.base_price ?? originalPrice),
          price: {
            original: originalPrice,
            final: finalPrice,
            discount: Number(p.price?.discount ?? Math.max(originalPrice - finalPrice, 0)),
            discountPercent: Number(p.price?.discount_percent ?? 0),
          },
          stock: Number(p.stock ?? 0),
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }
      }),
      total: raw.total,
      page: raw.page,
      limit: raw.limit,
    }
  } catch (e: any) {
    console.error('Backend product-list error:', e.data ?? e.message)
    throw e
  }


})
