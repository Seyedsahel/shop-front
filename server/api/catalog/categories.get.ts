export default defineEventHandler(async (event): Promise<CategoriesResponse> => {
  const config = useRuntimeConfig()
  
  const raw = await backendFetch<any[]>('/api/categories')

  return {
    items: raw.map(c => ({
      id: c.id,
      parentId: c.parent_id ?? '',
      imageUrl: c.image_url ? `${config.public.imageBaseUrl}/${c.image_url}` : '',
      name: c.name,
      slug: c.slug,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    } satisfies ProductCategory)),
  }
})