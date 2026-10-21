export interface CategoryTreeNode extends ProductCategory {
  children: CategoryTreeNode[]
}

export function buildCategoryTree(items: ProductCategory[]): CategoryTreeNode[] {
  const byId = new Map<string, CategoryTreeNode>(
    items.map(c => [c.id, { ...c, children: [] }])
  )
  const roots: CategoryTreeNode[] = []

  for (const category of byId.values()) {
    let parent = byId.get(category.parentId)
    let ancestor = parent
    const visited = new Set([category.id])
    while (ancestor) {
      if (visited.has(ancestor.id)) {
        parent = undefined
        break
      }
      visited.add(ancestor.id)
      ancestor = byId.get(ancestor.parentId)
    }
    // Keep orphaned or cyclic backend records reachable instead of hiding them.
    if (parent) parent.children.push(category)
    else roots.push(category)
  }

  return roots
}

export function getCategoryPath(items: ProductCategory[], slug: string): ProductCategory[] {
  const bySlug = items.find(c => c.slug === slug)
  if (!bySlug) return []

  const byId = new Map(items.map(c => [c.id, c]))
  const path: ProductCategory[] = [bySlug]

  let current = bySlug
  const visited = new Set([current.id])
  while (current.parentId) {
    const parent = byId.get(current.parentId)
    if (!parent || visited.has(parent.id)) break
    visited.add(parent.id)
    path.unshift(parent)
    current = parent
  }

  return path
}
