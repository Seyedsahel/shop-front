export function mapBrandsResponse(raw: unknown): BrandsResponse {
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
}

export function mapCategoriesResponse(raw: unknown): CategoriesResponse {
  if (!Array.isArray(raw)) throw createError({ statusCode: 502, message: 'Invalid categories response from backend' })

  return {
    items: raw.map(c => ({
      id: c.id,
      parentId: c.parent_id ?? '',
      imageUrl: toBackendImageUrl(c.image_url),
      name: c.name,
      slug: c.slug,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    } satisfies ProductCategory)),
  }
}
