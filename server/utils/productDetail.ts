export function mapProductDetail(raw: any): ProductDetail {
  if (Array.isArray(raw) && raw.length === 0) throw createError({ statusCode: 404, message: 'Product not found' })
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || typeof raw.name !== 'string' || typeof raw.slug !== 'string') {
    throw createError({ statusCode: 502, message: 'Invalid product detail response from backend' })
  }
  const array = (value: unknown, field: string): any[] => {
    if (!Array.isArray(value)) throw createError({ statusCode: 502, message: `Invalid product ${field} from backend` })
    return value
  }
  const string = (value: unknown) => typeof value === 'string' ? value : ''
  const items = (value: unknown): ProductDescriptionKeyValueItem[] => Array.isArray(value)
    ? value.flatMap((item: any) => item && typeof item === 'object'
        ? [{ title: string(item.title), body: string(item.body) }]
        : [])
    : []
  const descriptionBlock = (block: any): ProductDescriptionBlock | null => {
    if (!block || typeof block !== 'object') return null

    const title = string(block.title)
    const sortOrder = Number(block.sort_order ?? block.sortOrder ?? 0)

    switch (block.type) {
      case 'text': return { type: 'text', title, body: string(block.body), sortOrder }
      case 'image': return { type: 'image', title, imageUrl: toBackendImageUrl(string(block.image_url ?? block.imageUrl)), sortOrder }
      case 'quote': return { type: 'quote', title, body: string(block.body), sortOrder }
      case 'video': return { type: 'video', title, body: string(block.body), videoUrl: toBackendImageUrl(string(block.video_url ?? block.videoUrl)), sortOrder }
      case 'faq': return { type: 'faq', title, items: items(block.items), sortOrder }
      case 'table': return { type: 'table', title, items: items(block.items), sortOrder }
      default: return null
    }
  }
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: typeof raw.description === 'string' ? raw.description : '',
    descriptionBlocks: array(raw.description_blocks ?? raw.descriptionBlocks ?? [], 'description blocks')
      .flatMap((block) => {
        const mapped = descriptionBlock(block)
        return mapped ? [mapped] : []
      })
      .sort((first: ProductDescriptionBlock, second: ProductDescriptionBlock) => first.sortOrder - second.sortOrder),
    basePrice: Number(raw.price_from ?? raw.base_price ?? 0),
    baseStock: Number(raw.stock ?? raw.base_stock ?? 0),
    isPurchasable: raw.is_purchasable !== false,
    maxPerOrder: Number(raw.max_per_order ?? 0),
    price: {
      original: Number(raw.price?.original ?? raw.price_from ?? raw.base_price ?? 0),
      final: Number(raw.price?.final ?? raw.price_from ?? raw.base_price ?? 0),
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
      variantId: v.variant_id, sku: v.sku, maxPerOrder: Number(v.max_per_order ?? 0),
      priceAdjustment: Number(v.price_adjustment ?? 0), finalPrice: Number(v.final_price ?? v.price ?? 0), stock: Number(v.stock ?? 0),
      options: array(v.attribute_values ?? v.options ?? [], 'variant options').map((option: any) => ({
        variantOptionId: option.variant_option_id,
        attributeId: option.attribute_id,
        slug: option.slug,
        name: option.name,
        value: option.value,
      })),
    })),
  }
}
