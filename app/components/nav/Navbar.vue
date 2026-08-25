<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'

const authStore = useAuthStore()
const cartStore = useCartStore()
onMounted(() => cartStore.fetchCart())

const navLinks = [
  { label: 'خانه', href: '/' },
  { label: 'محصولات', href: '/products' },
  { label: 'مشاوره', href: '/consultation' },
  { label: 'وبلاگ', href: '/blog' },
]

const { width } = useWindowSize()
const isDesktop = computed(() => width.value >= 768)

const categoriesSidebarOpen = ref(false)
const categoriesDropdownOpen = ref(false)
const linksOpen = ref(false)
const mobileSearchOpen = ref(false)

// Desktop dropdown — closes on any click outside this wrapper (button + panel together)
const categoriesWrapper = ref<HTMLElement>()
useClickOutside(categoriesWrapper, () => { categoriesDropdownOpen.value = false })

function toggleCategories() {
  if (isDesktop.value) {
    categoriesDropdownOpen.value = !categoriesDropdownOpen.value
  } else{
    categoriesSidebarOpen.value = true
  }
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-divider">

    <!-- Top row -->
    <div class="max-w-4/5 mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <NuxtLink to="/" class="text-text-primary font-semibold tracking-wide shrink-0">
        SHOP LOGO 
      </NuxtLink>

      <div class="hidden md:block flex-1 max-w-md">
        <UiSearchBar />
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <button class="md:hidden text-text-secondary mt-2" @click="mobileSearchOpen = true">
          <UIcon name="solar:magnifer-linear" class="size-5" />
        </button>

        <UButton :to="authStore.isAuthenticated ? '/profile' : '/auth'" variant="ghost" size="sm" class="flex justify-center">
          <UIcon :name="authStore.isAuthenticated ? 'solar:user-outline' : 'solar:login-2-broken'" class="size-5" />
          <span class="hidden sm:inline">{{ authStore.isAuthenticated ? 'پروفایل' : 'ورود' }}</span>
        </UButton>

        <UButton to="/cart" variant="soft" size="sm" class="relative">
          <div class="flex items-center gap-2">
            <UIcon name="solar:cart-4-outline" class="size-5" />
            <span class="hidden sm:inline">سبد خرید</span>
            <UiCounterBadge :count="cartStore.itemCount" />
          </div>
        </UButton>
      </div>
    </div>

    <div class="max-w-4/5 mx-auto border-t border-divider" />

    <!-- Bottom row -->
    <div class="max-w-3/4 mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-4 relative">

      <!-- Categories: trigger + desktop dropdown share one click-outside boundary -->
      <div ref="categoriesWrapper" class="relative">
        <button
          class="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          @click="toggleCategories"
        >
          <UIcon name="solar:hamburger-menu-outline" class="size-4" />
          دسته‌بندی‌ها
        </button>

        <div
          v-if="categoriesDropdownOpen"
          class="hidden md:block absolute top-full inset-s-0 mt-1 w-72 max-h-96 overflow-y-auto bg-surface border border-divider rounded-xl shadow-lg z-50"
        >
          <NavCategoriesDropdown @close="categoriesDropdownOpen = false" />
        </div>
      </div>

      <div class="hidden md:block w-px h-5 bg-divider" />

      <ul class="hidden md:flex items-center gap-6">
        <li v-for="link in navLinks" :key="link.href">
          <NuxtLink :to="link.href" class="text-sm text-text-secondary hover:text-text-primary transition-colors" active-class="!text-text-primary font-medium">
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>

      <button
        class="md:hidden flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        @click="linksOpen = true"
      >
        <UIcon name="solar:hamburger-menu-outline" class="size-4" />
        منو
      </button>
    </div>
  </header>

  <!-- Mobile categories sidebar -->
  <UiSidebar v-model="categoriesSidebarOpen" title="دسته‌بندی‌ها" class="md:hidden">
    <NavCategoriesDropdown @close="categoriesSidebarOpen = false" />
  </UiSidebar>

  <!-- Mobile nav links sidebar -->
  <UiSidebar v-model="linksOpen" title="منو">
    <NavLinksDropdown :links="navLinks" @close="linksOpen = false" />
  </UiSidebar>

  <NavMobileSearchOverlay v-model="mobileSearchOpen" />
</template>