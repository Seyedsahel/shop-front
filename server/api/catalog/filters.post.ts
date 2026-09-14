
// const sleep = (ms: number): Promise<void> => {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// server/api/catalog/filters.post.ts  (delete the old filters.get.ts)
export default defineEventHandler(async (event): Promise<FiltersResponse> => {
  const body = await readBody<{ category_ids?: string[] }>(event)
  
  const raw = await backendFetch<any>('/api/products/filters', {
    method: 'POST',
    body: { category_ids: body.category_ids, page: 1, limit: 50 },
  })
  console.log('[filters]', body.category_ids, '→', raw.attributes.length, 'attrs:', raw.attributes.map((a: any) => a.slug))
  return {
    items: raw.attributes.map((f: any) => ({
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