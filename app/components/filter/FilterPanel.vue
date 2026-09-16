<script setup lang="ts">
const filterStore = useFilterStore()
const productListStore = useProductListStore()
const brandSearch = ref('')

const emit = defineEmits<{ applied: [] }>()

const filteredBrands = computed(() => {
  const query = brandSearch.value.trim().toLowerCase()
  if (!query) return filterStore.brands
  return filterStore.brands.filter(brand =>
    brand.name.toLowerCase().includes(query) || brand.slug.toLowerCase().includes(query)
  )
})

const activeChips = computed(() => {
  const chips: { key: string; label: string; remove: () => void }[] = []
  for (const category of filterStore.selectedCategories) {
    chips.push({ key: `category:${category.id}`, label: category.name, remove: () => filterStore.toggleCategory(category.id) })
  }
  for (const brand of filterStore.selectedBrands) {
    chips.push({ key: `brand:${brand.id}`, label: brand.name, remove: () => filterStore.toggleBrand(brand.id) })
  }
  for (const filter of filterStore.definitions) {
    const value = filterStore.values[filter.slug]
    if (Array.isArray(value)) {
      for (const option of value) {
        chips.push({ key: `${filter.slug}:${option}`, label: option, remove: () => filterStore.setValue(filter.slug, value.filter(item => item !== option)) })
      }
    } else if (typeof value === 'string' && value) {
      chips.push({ key: `${filter.slug}:${value}`, label: value, remove: () => filterStore.setValue(filter.slug, null) })
    }
  }
  if (filterStore.hasCustomPrice) {
    chips.push({
      key: 'price',
      label: `${filterStore.selectedPriceMin?.toLocaleString('fa-IR')} - ${filterStore.selectedPriceMax?.toLocaleString('fa-IR')}`,
      remove: () => filterStore.setPriceRange(filterStore.priceRange.min, filterStore.priceRange.max),
    })
  }
  return chips
})

function applyFilters() {
  productListStore.applyFilters()
  emit('applied')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between border-b border-divider pb-4">
      <div class="flex items-center gap-2">
        <UIcon name="solar:tuning-2-broken" class="size-5 text-text-primary" />
        <h2 class="text-lg font-bold text-text-primary">فیلترها</h2>
        <span v-if="filterStore.activeCount > 0" class="bg-primary text-white text-xs rounded-full size-5 flex items-center justify-center">
          {{ filterStore.activeCount }}
        </span>
      </div>
      <button v-if="filterStore.activeCount > 0" class="text-xs font-semibold text-danger" @click="filterStore.resetAll">
        حذف همه
      </button>
    </div>

    <div v-if="activeChips.length" class="flex flex-wrap gap-1.5">
      <span v-for="chip in activeChips" :key="chip.key" class="inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface-hover px-2.5 py-1 text-xs text-text-primary">
        {{ chip.label }}
        <button type="button" class="text-text-muted hover:text-danger" @click="chip.remove">×</button>
      </span>
    </div>

    <template v-if="filterStore.isLoading">
      <div v-for="n in 5" :key="n" class="h-12 my-2 rounded-lg bg-loading animate-pulse" />
    </template>

    <template v-else>
      <div class="rounded-2xl border border-accent-subtle  bg-accent-subtle/20 p-4">
        <div class="mb-2 flex items-center justify-between border-b border-accent-subtle pb-2">
          <span class="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
            <UIcon name="solar:box-minimalistic-bold" class="size-4 text-primary" />
            دسته‌بندی و برندهای اصلی
          </span>
          <span class="rounded-full bg-surface px-2 py-0.5 text-[10px] text-text-secondary">پایه‌ای</span>
        </div>

        <UiAccordion title="دسته‌بندی محصولات">
          <div class="flex max-h-56 flex-col gap-2 overflow-y-auto">
            <label v-for="category in filterStore.categories" :key="category.id" class="flex items-center justify-between rounded-lg px-1 py-1.5 text-sm text-text-secondary hover:bg-surface">
              <span>{{ category.name }}</span>
              <input type="checkbox" class="size-4 rounded border-border-strong accent-primary" :checked="filterStore.selectedCategoryIds.includes(category.id)" @change="filterStore.toggleCategory(category.id)" />
            </label>
          </div>
        </UiAccordion>

        <UiAccordion title="برندها (Brand)">
          <div class="flex flex-col gap-3">
            <div class="relative">
              <UIcon name="solar:magnifer-linear" class="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
              <input v-model="brandSearch" type="search" placeholder="جستجوی برند..." class="w-full rounded-xl border border-border-strong bg-surface py-2 pr-8 pl-3 text-xs outline-none focus:border-primary" />
            </div>
            <div class="flex max-h-40 flex-col gap-2 overflow-y-auto">
              <label v-for="brand in filteredBrands" :key="brand.id" class="flex items-center justify-between rounded-lg px-1 py-1.5 text-sm text-text-secondary hover:bg-surface">
                <span>{{ brand.name }}</span>
                <input type="checkbox" class="size-4 rounded border-border-strong accent-primary" :checked="filterStore.selectedBrandIds.includes(brand.id)" @change="filterStore.toggleBrand(brand.id)" />
              </label>
            </div>
          </div>
        </UiAccordion>
      </div>

      <FilterPriceRangeFilter />
      <FilterGroup v-for="filter in filterStore.definitions" :key="filter.slug" :filter="filter" />
    </template>

    <button type="button" class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover" @click="applyFilters">
      <UIcon name="solar:check-circle-broken" class="size-4" />
      اعمال فیلترها
    </button>
  </div>
</template>
