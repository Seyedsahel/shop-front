<script setup lang="ts">
const shop = useShopStore()
const navLinks = [
  { label: 'خانه', to: '/' },
  { label: 'مشاوره', to: '/consultation' },
  { label: 'محصولات', to: '/products' },
  { label: 'وبلاگ', to: '/blog' },
]

const currentYear = new Date().getFullYear()

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer class="bg-surface border-t border-divider mt-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-1 py-10 grid grid-cols-1 sm:grid-cols-2 gap-8" :class="shop.info?.enamadImageUrl ? 'lg:grid-cols-5' : 'lg:grid-cols-4'">

      <!-- Brand -->
      <div class="flex flex-col gap-3">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img v-if="shop.info?.logoImageUrl" :src="shop.info.logoImageUrl" :alt="`لوگوی ${shop.name}`" width="40" height="40" loading="lazy" class="size-10 object-contain" />
          <span class="text-text-primary font-semibold">{{ shop.name }}</span>
        </NuxtLink>
        <p v-if="shop.info?.description" class="text-xs text-text-secondary leading-relaxed">
          {{ shop.info.description }}
        </p>
        <p v-if="shop.error" role="alert" class="text-xs text-danger">
          {{ shop.error }} <button type="button" class="underline" :disabled="shop.isLoading" @click="shop.fetchShop()">تلاش دوباره</button>
        </p>
      </div>

      <!-- Navigation -->
      <div class="flex flex-col gap-3">
        <h3 class="text-sm font-semibold text-text-primary">دسترسی سریع</h3>
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          {{ link.label }}
        </NuxtLink>
      </div>

      <!-- Contact -->
      <div class="flex flex-col gap-3">
        <h3 class="text-sm font-semibold text-text-primary">تماس با ما</h3>
        <div v-if="shop.info?.address" class="flex items-start gap-2 text-xs text-text-secondary">
          <UIcon name="solar:map-point-broken" class="size-4 shrink-0 mt-0.5" />
          <span>{{ shop.info.address }}</span>
        </div>
        <a v-if="shop.info?.phoneNumber" :href="`tel:${shop.info.phoneNumber}`" class="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors">
          <UIcon name="solar:phone-broken" class="size-4 shrink-0" />
          <span dir="ltr">{{ shop.info.phoneNumber }}</span>
        </a>
        <a
          v-if="shop.instagramUrl"
          :href="shop.instagramUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <span dir="ltr">Instagram: {{ shop.info?.instagramId }}</span>
        </a>
        <a v-if="shop.telegramUrl" :href="shop.telegramUrl" target="_blank" rel="noopener noreferrer" class="text-xs text-text-secondary hover:text-text-primary transition-colors">
          <span dir="ltr">Telegram: {{ shop.info?.telegramId }}</span>
        </a>
        <a v-if="shop.info?.email" :href="`mailto:${shop.info.email}`" class="text-xs text-text-secondary hover:text-text-primary transition-colors">
          <span dir="ltr">{{ shop.info.email }}</span>
        </a>
      </div>

      <div v-if="shop.info?.enamadImageUrl" class="flex flex-col gap-3 items-start sm:items-end lg:items-start">
        <h3 class="text-sm font-semibold text-text-primary">نماد اعتماد</h3>
        <img :src="shop.info.enamadImageUrl" alt="نماد اعتماد الکترونیکی" width="96" height="96" loading="lazy" class="size-24 object-contain" />
      </div>

      <div>

        <div
          class="flex items-center justify-center border border-accent rounded-md py-2 gap-1 cursor-pointer"
          @click="scrollToTop"
        >
          بازگشت به بالا
          <UIcon name="solar:alt-arrow-up-broken" class="size-6 shrink-0" />
        </div>
      </div>


    </div>

    <div class="border-t border-divider py-4 px-4 sm:px-6 lg:px-8 text-center">
      <p class="text-xs text-text-muted">
      {{ shop.name }}. تمامی حقوق محفوظ است. © {{ currentYear }}
      </p>
    </div>
  </footer>
</template>
