<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()
const categoryStore = useCategoryStore()
const productListStore = useProductListStore()
const search = ref('')
const selectedIds = ref<string[]>([])
const heading = ref<HTMLElement>()
const browseContent = ref<HTMLElement>()
const categoryLinkComponent = resolveComponent('NuxtLink')

onMounted(() => {
  void categoryStore.fetchCategories()
  void productListStore.fetchDiscountedAvailability()
})
const tree = computed(() => buildCategoryTree(categoryStore.items))
const path = computed(() => {
  const result: CategoryTreeNode[] = []
  let siblings = tree.value
  for (const id of selectedIds.value) {
    const node = siblings.find(item => item.id === id)
    if (!node) break
    result.push(node)
    siblings = node.children
  }
  return result
})
const current = computed(() => path.value.at(-1))
const children = computed(() => current.value?.children ?? tree.value)
const normalize = (value: string) => value.trim().toLocaleLowerCase('fa').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, ' ')
const searchTerm = computed(() => normalize(search.value))
const results = computed(() => searchTerm.value
  ? categoryStore.items.filter(category => normalize(category.name).includes(searchTerm.value)).map(category => ({
    ...category,
    ancestry: getCategoryPath(categoryStore.items, category.slug).slice(0, -1).map(parent => parent.name).join(' / '),
  })) : [])
const categoryLink = (slug: string) => ({ path: '/products', query: { category: slug } })

async function selectPath(ids: string[]) {
  selectedIds.value = ids
  search.value = ''
  await nextTick()
  if (browseContent.value) browseContent.value.scrollTop = 0
  heading.value?.focus({ preventScroll: true })
}
function openBranch(node: CategoryTreeNode) {
  void selectPath([...path.value.map(parent => parent.id), node.id])
}
</script>

<template>
  <nav aria-label="مرور دسته‌بندی محصولات" class="overflow-hidden rounded-2xl bg-card text-text-primary">
    <div class="flex items-center gap-3 border-b border-divider p-4 md:px-5">
      <span class="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary md:flex"><UIcon name="solar:widget-2-outline" class="size-5" /></span>
      <UiInput v-model="search" type="search" inputmode="search" aria-label="جستجو در دسته‌بندی‌ها" placeholder="دنبال چه دسته‌ای می‌گردید؟" class="min-w-0 text-sm" />
    </div>

    <div v-if="categoryStore.isLoading" role="status" aria-label="در حال دریافت دسته‌بندی‌ها" class="grid gap-3 p-5 md:grid-cols-2">
      <div v-for="n in 6" :key="n" class="h-20 animate-pulse rounded-xl bg-loading" />
    </div>
    <div v-else-if="categoryStore.error" role="alert" class="space-y-3 p-6 text-center text-sm">
      <p class="text-text-secondary">دریافت دسته‌بندی‌ها انجام نشد.</p>
      <button type="button" class="rounded-lg border border-border px-4 py-2 text-primary" @click="categoryStore.fetchCategories()">تلاش دوباره</button>
    </div>
    <div v-else-if="searchTerm" class="max-h-[55dvh] overflow-y-auto p-4">
      <p role="status" class="mb-3 text-xs text-text-muted">{{ results.length.toLocaleString('fa-IR') }} دسته‌بندی پیدا شد</p>
      <ul v-if="results.length" class="grid gap-2 md:grid-cols-2">
        <li v-for="category in results" :key="category.id">
          <NuxtLink :to="categoryLink(category.slug)" class="flex h-full items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary hover:bg-primary/5" @click="emit('close')">
            <span class="min-w-0"><span class="block text-sm font-medium wrap-anywhere">{{ category.name }}</span><span v-if="category.ancestry" class="mt-1 block text-xs leading-6 text-text-muted wrap-anywhere">{{ category.ancestry }}</span></span>
            <UIcon name="solar:alt-arrow-left-linear" class="size-4 shrink-0 text-primary" />
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="py-8 text-center text-sm text-text-secondary">دسته‌ای با این نام پیدا نشد.</p>
    </div>
    <div v-else class="md:grid md:grid-cols-[13rem_minmax(0,1fr)]">
      <aside class="hidden max-h-[55dvh] overflow-y-auto border-e border-divider bg-surface/50 p-3 md:block" aria-label="دسته‌بندی‌های اصلی">
        <button type="button" class="mb-2 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-start text-sm font-semibold transition-colors" :class="!current ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'" @click="selectPath([])">
          <UIcon name="solar:widget-2-outline" class="size-4 shrink-0" /> همه دسته‌بندی‌ها
        </button>
        <ul class="space-y-1">
          <li v-for="root in tree" :key="root.id">
            <button v-if="root.children.length" type="button" :aria-current="path[0]?.id === root.id ? 'true' : undefined" class="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-start text-sm transition-colors" :class="path[0]?.id === root.id ? 'bg-primary/10 font-semibold text-primary' : 'text-text-secondary hover:bg-primary/5'" @click="selectPath([root.id])">
              <span class="wrap-anywhere">{{ root.name }}</span><UIcon name="solar:alt-arrow-left-linear" class="size-4 shrink-0" />
            </button>
            <NuxtLink v-else :to="categoryLink(root.slug)" class="flex min-h-11 items-center rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-primary/5 hover:text-primary" @click="emit('close')">{{ root.name }}</NuxtLink>
          </li>
        </ul>
      </aside>

      <div class="min-w-0">
        <div class="border-b border-divider px-4 py-3 md:px-5">
          <div class="flex items-start gap-2">
            <button v-if="current" type="button" aria-label="بازگشت به دسته‌بندی بالاتر" class="grid size-8 shrink-0 place-items-center rounded-lg text-text-secondary hover:bg-surface" @click="selectPath(path.slice(0, -1).map(node => node.id))"><UIcon name="solar:arrow-right-outline" class="size-4" /></button>
            <ol aria-label="مسیر دسته‌بندی" class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-8 text-text-muted">
              <li><button type="button" class="hover:text-primary" @click="selectPath([])">همه دسته‌ها</button></li>
              <li v-for="(node, index) in path" :key="node.id" class="flex min-w-0 items-center gap-2">
                <UIcon name="solar:alt-arrow-left-linear" class="size-3 shrink-0" />
                <button type="button" :aria-current="index === path.length - 1 ? 'location' : undefined" class="text-start wrap-anywhere hover:text-primary" :class="{ 'font-semibold text-primary': index === path.length - 1 }" @click="selectPath(path.slice(0, index + 1).map(item => item.id))">{{ node.name }}</button>
              </li>
            </ol>
          </div>
          <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h2 ref="heading" tabindex="-1" class="min-w-0 text-base font-bold wrap-anywhere">{{ current?.name || 'دسته‌بندی محصولات' }}</h2>
            <NuxtLink v-if="current" :to="categoryLink(current.slug)" class="inline-flex min-h-9 items-center gap-1 rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/15" @click="emit('close')">مشاهده همه محصولات<UIcon name="solar:alt-arrow-left-linear" class="size-3" /></NuxtLink>
          </div>
        </div>

        <div ref="browseContent" class="max-h-[42dvh] overflow-y-auto p-4 md:max-h-[calc(55dvh-8rem)] md:p-5">
          <ul v-if="children.length" class="grid gap-3 md:grid-cols-2">
            <li v-for="node in children" :key="node.id" class="min-w-0">
              <component :is="node.children.length ? 'button' : categoryLinkComponent" :type="node.children.length ? 'button' : undefined" :to="node.children.length ? undefined : categoryLink(node.slug)" :aria-label="node.children.length ? `زیرمجموعه‌های ${node.name}` : `محصولات ${node.name}`" class="group flex h-full min-h-20 w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-start transition-colors hover:border-primary/50 hover:bg-primary/5" @click="node.children.length ? openBranch(node) : emit('close')">
                <span class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface text-primary">
                  <img v-if="node.imageUrl" :src="node.imageUrl" alt="" loading="lazy" class="size-full object-cover" />
                  <UIcon v-else :name="node.children.length ? 'solar:folder-with-files-outline' : 'solar:bag-4-outline'" class="size-5" />
                </span>
                <span class="min-w-0 flex-1"><span class="block text-sm font-semibold leading-6 wrap-anywhere">{{ node.name }}</span><span class="mt-1 block text-[11px] leading-5 text-text-muted">{{ node.children.length ? `${node.children.length.toLocaleString('fa-IR')} زیرمجموعه` : 'مشاهده محصولات' }}</span></span>
                <UIcon name="solar:alt-arrow-left-linear" class="size-4 shrink-0 text-text-muted group-hover:text-primary" />
              </component>
            </li>
          </ul>
          <p v-else class="py-8 text-center text-sm text-text-muted">هنوز دسته‌بندی‌ای ثبت نشده است.</p>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-divider bg-surface/40 px-4 py-3 text-xs md:px-5">
      <NuxtLink to="/products" class="inline-flex min-h-9 items-center gap-2 font-semibold text-primary hover:underline" @click="emit('close')">همه محصولات<UIcon name="solar:alt-arrow-left-linear" class="size-3" /></NuxtLink>
      <NuxtLink v-if="productListStore.hasDiscountedProducts" to="/discounts/products" class="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-danger/10 px-3 font-semibold text-danger hover:bg-danger/15" @click="emit('close')"><UIcon name="solar:tag-price-bold" class="size-4" />تخفیف‌ها</NuxtLink>
    </div>
  </nav>
</template>
