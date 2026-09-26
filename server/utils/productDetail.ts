export function mapProductDetail(raw: any): ProductDetail {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || typeof raw.name !== 'string' || typeof raw.slug !== 'string') {
    throw createError({ statusCode: 502, message: 'Invalid product detail response from backend' })
  }
  const array = (value: unknown, field: string): any[] => {
    if (!Array.isArray(value)) throw createError({ statusCode: 502, message: `Invalid product ${field} from backend` })
    return value
  }
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: typeof raw.description === 'string' ? raw.description : '',
    descriptionBlocks: array(raw.description_blocks ?? [], 'description blocks')
      .map((block: any) => ({
        type: block.type,
        title: block.title ?? '',
        body: block.body ?? '',
        sortOrder: Number(block.sort_order ?? 0),
      }))
      .sort((first: ProductDescriptionBlock, second: ProductDescriptionBlock) => first.sortOrder - second.sortOrder),
    basePrice: Number(raw.base_price ?? 0),
    baseStock: Number(raw.base_stock ?? 0),
    maxPerOrder: Number(raw.max_per_order ?? 0),
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
    images: array(raw.images ?? [], 'images').map((img: any) => ({
      imageUrl: toBackendImageUrl(img.image_url),
      sortOrder: img.sort_order,
      isThumbnail: img.is_thumbnail,
    })),
    categories: array(raw.categories ?? [], 'categories').map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })),
    specifications: array(raw.specifications ?? [], 'specifications').map((s: any) => ({
      attributeId: s.attribute_id, slug: s.slug, name: s.name, dataType: s.data_type, unit: s.unit, value: s.value,
    })),
    purchaseVariants: array(raw.purchase_variants ?? [], 'purchase variants').map((v: any) => ({
      variantId: v.variant_id, sku: v.sku,
      priceAdjustment: v.price_adjustment, finalPrice: v.final_price, stock: v.stock,
      options: array(v.options ?? [], 'variant options').map((option: any) => ({
        variantOptionId: option.variant_option_id,
        attributeId: option.attribute_id,
        slug: option.slug,
        name: option.name,
        value: option.value,
      })),
    })),
  }
}
