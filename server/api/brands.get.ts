export default defineEventHandler(async (event): Promise<BrandsResponse> => {
  const raw = await backendFetch<unknown>('/brands')
  if (!Array.isArray(raw)) throw createError({ statusCode: 502, message: 'Invalid brands response from backend' })

  return {
    items: raw.map(brand => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      imageUrl: toBackendImageUrl(brand.image_url),
      description: brand.description ?? '',
      createdAt: brand.created_at,
      updatedAt: brand.updated_at,
    })),
  }
})
