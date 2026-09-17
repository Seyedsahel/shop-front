// server/api/catalog/product-detail/[slug].get.ts
export default defineEventHandler(async (event): Promise<ProductDetail> => {
  const slug = getRouterParam(event, 'slug')

  const raw = await backendFetch<any>(`/api/products/${slug}/detail`)

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    basePrice: Number(raw.base_price ?? 0),
    baseStock: Number(raw.base_stock ?? 0),
    price: {
      original: Number(raw.price?.original ?? raw.base_price ?? 0),
      final: Number(raw.price?.final ?? raw.base_price ?? 0),
      discount: Number(raw.price?.discount ?? 0),
      discountPercent: Number(raw.price?.discount_percent ?? 0),
    },
    brand: raw.brand ? {
      id: raw.brand.id,
      name: raw.brand.name,
      slug: raw.brand.slug,
      fileId: raw.brand.file_id ?? null,
      description: raw.brand.description ?? '',
    } : null,
    images: (raw.images ?? []).map((img: any) => ({
      imageUrl: toBackendImageUrl(img.image_url),
      sortOrder: img.sort_order,
      isThumbnail: img.is_thumbnail,
    })),
    categories: (raw.categories ?? []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })),
    specifications: (raw.specifications ?? []).map((s: any) => ({
      attributeId: s.attribute_id, slug: s.slug, name: s.name, dataType: s.data_type, unit: s.unit, value: s.value,
    })),
    purchaseVariants: (raw.purchase_variants ?? []).map((v: any) => ({
      variantId: v.variant_id, attributeId: v.attribute_id, slug: v.slug, name: v.name, value: v.value,
      priceAdjustment: v.price_adjustment, finalPrice: v.final_price, stock: v.stock,
    })),
  }
})
