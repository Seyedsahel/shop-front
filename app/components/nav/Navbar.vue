<script setup lang="ts">
import { useEventListener, useWindowSize } from '@vueuse/core'

const authStore = useAuthStore()
const shop = useShopStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const notifications = useNotificationStore()
const badgesReady = ref(false)
onMounted(() => {
  badgesReady.value = true
  if (!cartStore.loaded) void cartStore.fetchCart().catch(() => {})
  if (!wishlistStore.loaded) void wishlistStore.fetchWishlist().catch(() => {})
  watch(() => authStore.isAuthenticated, authenticated => {
    if (authenticated) void notifications.fetchCounts(true).catch(() => {})
  }, { immediate: true })
})
useEventListener(import.meta.client ? document : undefined, 'visibilitychange', () => {
  if (document.visibilityState === 'visible' && authStore.isAuthenticated) void notifications.fetchCounts(true).catch(() => {})
})

const navLinks = [
  { label: 'خانه', href: '/' },
  { label: 'محصولات', href: '/products' },
  { label: 'وبلاگ', href: '/blog' },
]

const { width } = useWindowSize()
const isDesktop = computed(() => width.value >= 768)

const categoriesSidebarOpen = ref(false)
const categoriesDropdownOpen = ref(false)
const linksOpen = ref(false)
const mobileSearchOpen = ref(false)
const desktopSearchOpen = ref(false)
const desktopSearchQuery = ref('')
watch(isDesktop, desktop => {
  if (desktop) {
    categoriesSidebarOpen.value = false
    linksOpen.value = false
    mobileSearchOpen.value = false
  } else {
    desktopSearchOpen.value = false
    categoriesDropdownOpen.value = false
  }
})

// Desktop dropdown — closes on any click outside this wrapper (button + panel together)
const categoriesWrapper = ref<HTMLElement>()
const categoryTrigger = ref<HTMLButtonElement>()
const categoriesMenuId = useId()
useClickOutside(categoriesWrapper, () => { categoriesDropdownOpen.value = false })

function closeCategories() {
  categoriesDropdownOpen.value = false
  categoryTrigger.value?.focus({ preventScroll: true })
}
function leaveCategories(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && !categoriesWrapper.value?.contains(event.relatedTarget)) categoriesDropdownOpen.value = false
}
async function toggleCategories() {
  if (isDesktop.value) {
    categoriesDropdownOpen.value = !categoriesDropdownOpen.value
    if (categoriesDropdownOpen.value) {
      await nextTick()
      categoriesWrapper.value?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true })
    }
  } else{
    categoriesSidebarOpen.value = true
  }
}

function submitDesktopSearch(query: string) {
  desktopSearchOpen.value = false
  navigateTo(`/products?search=${encodeURIComponent(query)}`)
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-divider">
    <!-- Top row -->
    <div class="max-w-full md:max-w-4/5 mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 md:gap-4">
      <NuxtLink to="/" class="flex min-w-0 items-center gap-2 text-text-primary font-semibold tracking-wide md:shrink-0">
        <img v-if="shop.info?.logoImageUrl" :src="shop.info.logoImageUrl" :alt="`لوگوی ${shop.name}`" width="48" height="48" class="size-12 shrink-0 object-contain md:size-14" />
        <span class="truncate text-sm md:text-base" :class="{ 'translate-y-0.5': shop.info?.logoImageUrl }">{{ shop.name }}</span>
      </NuxtLink>

      <button
        type="button"
        aria-label="جستجوی محصولات"
        aria-haspopup="dialog"
        :aria-expanded="desktopSearchOpen"
        class="hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-border-strong bg-surface/60 px-4 py-2 text-start text-sm text-text-muted focus-visible:outline-2 focus-visible:outline-primary md:flex md:max-w-2xl"
        @click="desktopSearchOpen = true"
      >
        <UIcon name="solar:magnifer-linear" class="size-5 shrink-0" />
        <span class="truncate">{{ desktopSearchQuery || 'جستجوی محصولات، برندها و خدمات...' }}</span>
      </button>

      <div class="flex flex-row-reverse items-center gap-3 shrink-0 md:flex-row">
        <div class="order-2 flex flex-row-reverse items-center gap-1 md:order-1 md:flex-row md:gap-2">
          <button
            type="button"
            :aria-label="authStore.isAuthenticated ? 'پروفایل' : 'ورود'"
            class="inline-flex h-9 w-7 cursor-pointer items-center justify-center gap-2 rounded-md text-sm text-text-primary transition-colors hover:bg-surface-hover md:h-auto md:w-auto md:px-3 md:py-1.5"
            @click="navigateTo(authStore.isAuthenticated ? '/profile' : '/auth')"
          >
            <UIcon :name="authStore.isAuthenticated ? 'solar:user-outline' : 'solar:login-2-broken'" class="size-5" />
            <span class="hidden md:inline">{{ authStore.isAuthenticated ? 'پروفایل' : 'ورود' }}</span>
          </button>
          <UiOptionalSection><NotificationDropdown v-if="badgesReady && authStore.isAuthenticated" /></UiOptionalSection>
        </div>

        <div class="order-1 flex flex-row-reverse items-center gap-1 md:order-2 md:flex-row md:gap-2">
          <button
            type="button"
            aria-label="سبد خرید"
            class="relative inline-flex h-9 w-7 cursor-pointer items-center justify-center gap-2 rounded-md text-sm text-text-primary transition-colors hover:bg-surface-hover md:h-auto md:w-auto md:px-3 md:py-1.5"
            @click="navigateTo('/cart')"
          >
            <UIcon name="solar:cart-4-outline" class="size-5" />
            <span class="hidden md:inline">سبد خرید</span>
            <UiCounterBadge v-if="!cartStore.error && !cartStore.stale" :count="badgesReady ? cartStore.itemCount : 0" />
          </button>

          <NuxtLink to="/wishlist" class="relative inline-flex h-9 w-7 items-center justify-center rounded-md text-sm text-text-primary transition-colors hover:bg-surface-hover md:h-auto md:w-auto md:px-3 md:py-1.5" aria-label="علاقه‌مندی‌ها">
            <span class="flex items-center gap-2">
              <UIcon name="solar:heart-outline" class="size-5" />
              <span class="hidden md:inline">علاقه‌مندی‌ها</span>
              <UiCounterBadge v-if="!wishlistStore.error && !wishlistStore.stale" :count="badgesReady ? wishlistStore.itemCount : 0" />
            </span>
          </NuxtLink>
        </div>

        <button type="button" aria-label="جستجوی محصولات" class="order-3 inline-flex h-9 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover md:hidden" @click="mobileSearchOpen = true">
          <UIcon name="solar:magnifer-linear" class="size-5" />
        </button>
      </div>
    </div>

    <div class="max-w-4/5 mx-auto border-t border-divider" />

    <!-- Bottom row -->
    <div class="max-w-3/4 mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-4 relative">

      <!-- Categories: trigger + desktop dropdown share one click-outside boundary -->
      <div ref="categoriesWrapper" class="relative" @keydown.esc.stop.prevent="closeCategories" @focusout="leaveCategories">
        <button
          ref="categoryTrigger"
          type="button"
          :aria-expanded="isDesktop ? categoriesDropdownOpen : categoriesSidebarOpen"
          :aria-controls="isDesktop && categoriesDropdownOpen ? categoriesMenuId : undefined"
          class="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm transition-colors"
          :class="categoriesDropdownOpen ? 'bg-primary/10 font-semibold text-primary' : 'text-text-secondary hover:bg-primary/5 hover:text-primary'"
          @click="toggleCategories"
        >
          <UIcon name="solar:hamburger-menu-outline" class="size-4" />
          دسته‌بندی‌ها
          <UIcon name="solar:alt-arrow-down-linear" class="size-3 transition-transform" :class="{ 'rotate-180': categoriesDropdownOpen }" />
        </button>

        <div
          v-if="categoriesDropdownOpen"
          :id="categoriesMenuId"
          class="fixed inset-x-4 top-[7.5rem] z-50 mx-auto hidden max-h-[calc(100dvh-8.5rem)] max-w-5xl overflow-y-auto rounded-2xl border border-border bg-card shadow-xl md:block"
        >
          <UiOptionalSection><NavCategoriesDropdown @close="closeCategories" /></UiOptionalSection>
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
    <UiOptionalSection><NavCategoriesDropdown v-if="categoriesSidebarOpen" @close="categoriesSidebarOpen = false" /></UiOptionalSection>
  </UiSidebar>

  <!-- Mobile nav links sidebar -->
  <UiSidebar v-model="linksOpen" title="منو">
    <NavLinksDropdown :links="navLinks" @close="linksOpen = false" />
  </UiSidebar>

  <NavMobileSearchOverlay v-model="mobileSearchOpen" />

  <UiModal v-model="desktopSearchOpen" title="جستجوی محصولات" class="md:max-w-4xl">
    <template #header="{ titleId, close }">
      <h2 :id="titleId" class="sr-only">جستجوی محصولات</h2>
      <div class="mb-4 flex items-center gap-3">
        <UiSearchBar
          v-model="desktopSearchQuery"
          autofocus
          :navigate-on-submit="false"
          placeholder="جستجوی محصولات، برندها و خدمات..."
          class="min-w-0 flex-1"
          @submit="submitDesktopSearch"
        />
        <button type="button" aria-label="بستن جستجو" class="flex size-6 shrink-0 items-center justify-center text-text-secondary focus-visible:outline-2 focus-visible:outline-primary" @click="close">
          <UIcon name="solar:close-circle-broken" class="size-6" />
        </button>
      </div>
    </template>
    <ProductSearchResultsPanel
      v-if="desktopSearchOpen"
      :query="desktopSearchQuery"
      mode="desktop"
      @close="desktopSearchOpen = false"
      @select="desktopSearchQuery = ''; desktopSearchOpen = false"
    />
  </UiModal>
</template>
