<script setup lang="ts">
const props = defineProps<{ product: ProductDetail }>()
const activeTab = ref<'description' | 'ingredients' | 'usage' | 'reviews'>('description')

const tabs = [
  { id: 'description', label: 'توضیحات محصول' },
  { id: 'ingredients', label: 'ترکیبات و ویژگی‌ها' },
  { id: 'usage', label: 'راهنمای استفاده' },
  { id: 'reviews', label: 'نظرات کاربران' },
] as const

// TODO: Replace this temporary tab content with product information returned by the backend.
const demoIngredients = [
  { label: 'اطلاعات محصول', title: 'ویژگی‌های کلیدی', description: 'ویژگی‌ها و مزایای کامل این محصول پس از اتصال اطلاعات تکمیلی از سرور نمایش داده می‌شود.' },
  { label: 'بسته‌بندی', title: 'جزئیات نگهداری', description: 'شرایط نگهداری، هشدارها و اطلاعات بسته‌بندی در این بخش از داده‌های محصول نمایش داده خواهد شد.' },
  { label: 'برند', title: 'استاندارد کیفیت', description: 'اطلاعات تکمیلی درباره فرمول، مواد تشکیل‌دهنده و استانداردهای سازنده در دسترس خواهد بود.' },
]

const demoUsage = [
  { title: 'برچسب محصول را بررسی کنید', description: 'پیش از استفاده، اطلاعات روی بسته‌بندی و هشدارهای سازنده را با دقت مطالعه کنید.' },
  { title: 'مطابق دستور سازنده استفاده کنید', description: 'میزان و روش استفاده را بر اساس راهنمای رسمی همان محصول انتخاب کنید.' },
  { title: 'در شرایط مناسب نگهداری کنید', description: 'محصول را دور از نور، گرما و دسترس کودکان، مطابق دستور بسته‌بندی نگهداری کنید.' },
]
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-border bg-card">
    <div class="flex gap-1 overflow-x-auto border-b border-divider bg-surface p-2" role="tablist" aria-label="اطلاعات تکمیلی محصول">
      <button
        v-for="tab in tabs"
        :id="`product-${tab.id}-tab`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-controls="`product-${tab.id}-panel`"
        :aria-selected="activeTab === tab.id"
        class="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
        :class="activeTab === tab.id ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:bg-card hover:text-text-primary'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="p-5 sm:p-6">
      <div v-if="activeTab === 'description'" id="product-description-panel" role="tabpanel" aria-labelledby="product-description-tab">
        <div>
          <h2 class="text-xl font-semibold text-text-primary">{{ product.name }}</h2>
          <p v-if="product.description" class="mt-3 whitespace-pre-line text-sm leading-8 text-text-secondary sm:text-base">{{ product.description }}</p>
          <p v-else class="mt-3 text-sm text-text-muted">توضیحاتی برای این محصول ثبت نشده است.</p>
        </div>
      </div>

      <div v-else-if="activeTab === 'ingredients'" id="product-ingredients-panel" role="tabpanel" aria-labelledby="product-ingredients-tab" class="space-y-4">
        <div class="grid gap-4 md:grid-cols-3">
          <article v-for="item in demoIngredients" :key="item.title" class="rounded-xl bg-surface p-4">
            <p class="text-xs font-medium text-primary">{{ item.label }}</p>
            <h2 class="mt-2 text-base font-semibold text-text-primary">{{ item.title }}</h2>
            <p class="mt-2 text-sm leading-6 text-text-secondary">{{ item.description }}</p>
          </article>
        </div>
      </div>

      <div v-else-if="activeTab === 'usage'" id="product-usage-panel" role="tabpanel" aria-labelledby="product-usage-tab" class="grid gap-6 md:grid-cols-3">
        <article v-for="(step, index) in demoUsage" :key="step.title" class="space-y-3">
          <span class="grid size-10 place-items-center rounded-full bg-primary-subtle text-sm font-bold text-primary">{{ (index + 1).toLocaleString('fa-IR') }}</span>
          <h2 class="text-base font-semibold text-text-primary">{{ step.title }}</h2>
          <p class="text-sm leading-7 text-text-secondary">{{ step.description }}</p>
        </article>
      </div>

      <div v-else id="product-reviews-panel" role="tabpanel" aria-labelledby="product-reviews-tab">
        <CommentList target-type="product" :target-id="product.id" />
      </div>
    </div>
  </section>
</template>
