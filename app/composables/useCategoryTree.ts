export interface CategoryTreeNode extends ProductCategory {
  children: CategoryTreeNode[]
}

export function buildCategoryTree(items: ProductCategory[]): CategoryTreeNode[] {
  const byId = new Map<string, CategoryTreeNode>(
    items.map(c => [c.id, { ...c, children: [] }])
  )
  const roots: CategoryTreeNode[] = []

  for (const category of byId.values()) {
    if (category.parentId) {
      byId.get(category.parentId)?.children.push(category)
    } else {
      roots.push(category)
    }
  }

  return roots
}

export function getCategoryPath(items: ProductCategory[], slug: string): ProductCategory[] {
  const bySlug = items.find(c => c.slug === slug)
  if (!bySlug) return []

  const byId = new Map(items.map(c => [c.id, c]))
  const path: ProductCategory[] = [bySlug]

  let current = bySlug
  while (current.parentId) {
    const parent = byId.get(current.parentId)
    if (!parent) break
    path.unshift(parent)
    current = parent
  }

  return path
}