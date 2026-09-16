
// const sleep = (ms: number): Promise<void> => {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// server/api/catalog/filters.post.ts  (delete the old filters.get.ts)
export default defineEventHandler(async (event): Promise<FiltersResponse> => {
  const body = await readBody<{ category_ids?: string[] }>(event)
  const config = useRuntimeConfig()
  
  const raw = await backendFetch<any>('/api/products/filters', {
    method: 'POST',
    body: { category_ids: body.category_ids, page: 1, limit: 50 },
  })

  return {
    attributes: (raw.attributes ?? []).filter((f: any) => f.slug !== 'brand').map((f: any) => ({
      slug: f.slug,
      name: f.name,
      dataType: f.data_type,
      availableValues: f.available_values,
    })),
    brands: (raw.brands ?? []).map((brand: any) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      imageUrl: brand.image_url ? `${config.public.imageBaseUrl}/${brand.image_url}` : '',
    })),
    categories: (raw.categories ?? []).map((category: any) => ({
      id: category.id,
      parentId: category.parent_id ?? '',
      name: category.name,
      slug: category.slug,
      imageUrl: category.image_url ? `${config.public.imageBaseUrl}/${category.image_url}` : '',
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
