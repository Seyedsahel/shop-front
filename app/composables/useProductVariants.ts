export interface VariantAttribute {
  slug: string
  name: string
  options: { value: string; available: boolean }[]
  disabled: boolean
}

export function useProductVariants(getVariants: () => ProductVariant[]) {
  const selectedOptions = ref<Record<string, string>>({})

  function matches(variant: ProductVariant, selection: Record<string, string>) {
    return Object.entries(selection).every(([slug, value]) =>
      variant.options.some(option => option.slug === slug && option.value === value),
    )
  }

  const matchingVariants = computed(() => getVariants().filter(variant => matches(variant, selectedOptions.value)))

  const attributes = computed<VariantAttribute[]>(() => {
    const grouped = new Map<string, { name: string; values: Set<string> }>()
    for (const variant of getVariants()) {
      for (const option of variant.options) {
        if (!grouped.has(option.slug)) grouped.set(option.slug, { name: option.name, values: new Set() })
        grouped.get(option.slug)!.values.add(option.value)
      }
    }

    return [...grouped].map(([slug, group]) => {
      const otherSelections = Object.fromEntries(
        Object.entries(selectedOptions.value).filter(([selectedSlug]) => selectedSlug !== slug),
      )
      const compatible = getVariants().filter(variant => matches(variant, otherSelections))
      const options = [...group.values]
        .filter(value => compatible.some(variant => variant.options.some(option => option.slug === slug && option.value === value)))
        .map(value => ({
          value,
          available: compatible.some(variant => variant.stock > 0
            && variant.options.some(option => option.slug === slug && option.value === value)),
        }))
      return { slug, name: group.name, options, disabled: !options.some(option => option.available) }
    })
  })

  const selectedVariant = computed(() => {
    if (matchingVariants.value.length !== 1) return null
    const variant = matchingVariants.value[0]!
    return variant.options.every(option => selectedOptions.value[option.slug] === option.value) ? variant : null
  })

  function select(slug: string, value: string) {
    const next: Record<string, string> = {}
    if (value) {
      if (!getVariants().some(variant => variant.options.some(option => option.slug === slug && option.value === value))) return
      next[slug] = value
    }
    for (const [otherSlug, otherValue] of Object.entries(selectedOptions.value)) {
      if (otherSlug === slug) continue
      const candidate = { ...next, [otherSlug]: otherValue }
      if (getVariants().some(variant => matches(variant, candidate))) next[otherSlug] = otherValue
    }
    selectedOptions.value = next
  }

  function reset() {
    const variant = getVariants().find(item => item.stock > 0) ?? getVariants()[0]
    selectedOptions.value = variant
      ? Object.fromEntries(variant.options.map(option => [option.slug, option.value]))
      : {}
  }

  return { selectedOptions, attributes, matchingVariants, selectedVariant, select, reset }
}
