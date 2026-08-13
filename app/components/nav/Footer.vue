<script setup lang="ts">
const navLinks = [
  { label: 'خانه', to: '/' },
  { label: 'مشاوره', to: '/consultation' },
  { label: 'محصولات', to: '/blog' },
  { label: 'وبلاگ', to: '/blog' },
]

const currentYear = new Date().getFullYear()

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer class="bg-surface border-t border-divider mt-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-1 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">

      <!-- Brand -->
      <div class="flex flex-col gap-3">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="https://placehold.co/40x40/png" alt="shop logo" class="size-10 rounded-full" />
          <span class="text-text-primary font-semibold">SHOP NAME</span>
        </NuxtLink>
        <p class="text-xs text-text-secondary leading-relaxed">
          مراقبت پوستی تخصصی با رویکردی متعادل میان علم و آرامش.
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
        <div class="flex items-start gap-2 text-xs text-text-secondary">
          <UIcon name="solar:map-point-broken" class="size-4 shrink-0 mt-0.5" />
          <span>آدرس، ادرس، ادرس ادرس ادرس</span>
        </div>
        <a href="tel:+982112345678" class="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors">
          <UIcon name="solar:phone-broken" class="size-4 shrink-0" />
          <span dir="ltr">034-12345678</span>
        </a>
        <a
          href="https://instagram.com/username"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <!-- <UIcon name="mdi:instagram" class="size-4 shrink-0" /> -->
          <span>instagram id</span>
        </a>
      </div>

      <!-- e-namad badge -->
      <div class="flex flex-col gap-3 items-start sm:items-end lg:items-start">
        <h3 class="text-sm font-semibold text-text-primary">نماد اعتماد</h3>
        <a href="#" target="_blank" rel="noopener noreferrer">
          <img src="https://placehold.co/100x100/png" alt="نماد اعتماد الکترونیکی" class="size-24" />
        </a>
      
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
      اسم سایت . تمامی حقوق محفوظ است.  © {{ currentYear }} 
      </p>
    </div>
  </footer>
</template>