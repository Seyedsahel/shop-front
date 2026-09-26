export function mapProductListResponse(raw: any): ProductListResponse {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) {
    throw createError({ statusCode: 502, message: 'Invalid product list response from backend' })
  }
  return {
    items: raw.items.map((product: any) => {
      if (!product || typeof product !== 'object' || typeof product.id !== 'string' || typeof product.name !== 'string' || typeof product.slug !== 'string') {
        throw createError({ statusCode: 502, message: 'Invalid product in backend response' })
      }
      const originalPrice = Number(product.price?.original ?? product.base_price ?? 0)
      const finalPrice = Number(product.price?.final ?? product.base_price ?? originalPrice)

      return {
        id: product.id,
        productTypeId: product.product_type_id ?? null,
        name: product.name,
        slug: product.slug,
        brandId: product.brand_id ?? '',
        thumbnailUrl: product.thumbnail_url,
        imageUrl: toBackendImageUrl(product.thumbnail_url),
        description: typeof product.description === 'string' ? product.description : '',
        basePrice: Number(product.base_price ?? originalPrice),
        price: {
          original: originalPrice,
          final: finalPrice,
          discount: Number(product.price?.discount ?? 0),
          discountPercent: Number(product.price?.discount_percent ?? 0),
        },
        stock: Number(product.stock ?? 0),
        maxPerOrder: Number(product.max_per_order ?? 0),
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      } satisfies Product
    }),
    total: Number(raw.total ?? 0),
    page: Number(raw.page ?? 1),
    limit: Number(raw.limit ?? 30),
  }
}
