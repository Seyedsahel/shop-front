export default defineEventHandler(async (event): Promise<BrandsResponse> => {
  const config = useRuntimeConfig()

  const raw = await backendFetch<any[]>('/api/brands')

  return {
    items: raw.map(brand => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      imageUrl: brand.image_url ? `${config.public.imageBaseUrl}/${brand.image_url}` : '',
      description: brand.description ?? '',
      createdAt: brand.created_at,
      updatedAt: brand.updated_at,
    })),
  }
})
