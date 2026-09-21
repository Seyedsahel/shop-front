export function mapProductListResponse(raw: any): ProductListResponse {
  return {
    items: (raw.items ?? []).map((product: any) => {
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
        description: product.description,
        basePrice: Number(product.base_price ?? originalPrice),
        price: {
          original: originalPrice,
          final: finalPrice,
          discount: Number(product.price?.discount ?? 0),
          discountPercent: Number(product.price?.discount_percent ?? 0),
        },
        stock: Number(product.stock ?? 0),
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      } satisfies Product
    }),
    total: Number(raw.total ?? 0),
    page: Number(raw.page ?? 1),
    limit: Number(raw.limit ?? 30),
  }
}
