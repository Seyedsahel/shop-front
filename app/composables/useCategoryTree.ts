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