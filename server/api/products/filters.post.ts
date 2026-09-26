export default defineEventHandler(async (event): Promise<FiltersResponse> => {
  const body = await readBody<ProductFiltersRequest>(event)
  
  const raw = await backendFetch<any>('/products/filters', {
    method: 'POST',
    body: {
      category_ids: body.categoryIds,
      discount_id: body.discountId,
      limit: body.limit ?? 20,
    },
  })

  if (!raw || typeof raw !== 'object') throw createError({ statusCode: 502, message: 'Invalid filters response from backend' })
  const array = (value: unknown, field: string): any[] => {
    if (!Array.isArray(value)) throw createError({ statusCode: 502, message: `Invalid filters ${field} from backend` })
    return value
  }

  return {
    attributes: array(raw.attributes ?? [], 'attributes').filter((f: any) => f.slug !== 'brand').map((f: any) => ({
      slug: f.slug,
      name: f.name,
      dataType: f.data_type,
      availableValues: Array.isArray(f.available_values) ? f.available_values.filter((value: unknown): value is string => typeof value === 'string') : [],
    })),
    brands: array(raw.brands ?? [], 'brands').map((brand: any) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      imageUrl: toBackendImageUrl(brand.image_url),
    })),
    categories: array(raw.categories ?? [], 'categories').map((category: any) => ({
      id: category.id,
      parentId: category.parent_id ?? '',
      name: category.name,
      slug: category.slug,
      imageUrl: toBackendImageUrl(category.image_url),
    })),
    priceRange: {
      min: raw.min_price ?? 0,
      max: raw.max_price ?? 0,
    },
    total: raw.total ?? 0,
    page: raw.page ?? 1,
    limit: raw.limit ?? 50,
  }
})
