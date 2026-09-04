
// const sleep = (ms: number): Promise<void> => {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// server/api/catalog/filters.post.ts  (delete the old filters.get.ts)
export default defineEventHandler(async (event): Promise<FiltersResponse> => {
  const body = await readBody<{ category_ids?: string[] }>(event)
  const config = useRuntimeConfig()

  if (config.useMockData) {
    return {
      items: [
        { slug: 'brand', name: 'برند', dataType: 'string', availableValues: ['BabyBloom', 'PureSkin', 'SmileCare'] },
        { slug: 'requires-prescription', name: 'نیاز به نسخه', dataType: 'boolean', availableValues: ['false', 'true'] },
      ],
      total: 2, page: 1, limit: 12,
    }
  }

  const raw = await backendFetch<any>('/api/products/filters', {
    method: 'POST',
    body: { category_ids: body.category_ids, page: 1, limit: 50 },
  })

  return {
    items: raw.items.map((f: any) => ({
      slug: f.slug,
      name: f.name,
      dataType: f.data_type,
      availableValues: f.available_values,
    })),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
  }
})