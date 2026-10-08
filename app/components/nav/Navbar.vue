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
  { label: 'مشاوره', href: '/consultation' },
  { label: 'وبلاگ', href: '/blog' },
]

const { width } = useWindowSize()
const isDesktop = computed(() => width.value >= 768)

const categoriesSidebarOpen = ref(false)
const categoriesDropdownOpen = ref(false)
const linksOpen = ref(false)
const mobileSearchOpen = ref(false)
watch(isDesktop, desktop => {
  if (desktop) {
    categoriesSidebarOpen.value = false
    linksOpen.value = false
    mobileSearchOpen.value = false
  }
})
const desktopSearchOpen = ref(false)
const desktopSearchQuery = ref('')
const desktopSearchPanelTop = ref(56)

// Desktop dropdown — closes on any click outside this wrapper (button + panel together)
const categoriesWrapper = ref<HTMLElement>()
useClickOutside(categoriesWrapper, () => { categoriesDropdownOpen.value = false })
const searchWrapper = ref<HTMLElement>()
useClickOutside(searchWrapper, () => { desktopSearchOpen.value = false })

function toggleCategories() {
  if (isDesktop.value) {
    categoriesDropdownOpen.value = !categoriesDropdownOpen.value
  } else{
    categoriesSidebarOpen.value = true
  }
}

function submitDesktopSearch(query: string) {
  desktopSearchOpen.value = false
  navigateTo(`/products?search=${encodeURIComponent(query)}`)
}

function updateDesktopSearchPanelTop() {
  const rect = searchWrapper.value?.getBoundingClientRect()
  if (rect) desktopSearchPanelTop.value = rect.top
}

async function openDesktopSearch() {
  desktopSearchOpen.value = true
  await nextTick()
  updateDesktopSearchPanelTop()
}

watch(width, () => {
  if (desktopSearchOpen.value) updateDesktopSearchPanelTop()
})
</script>

<template>
  <header class="sticky top-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-divider">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="desktopSearchOpen && desktopSearchQuery.trim()" class="fixed inset-0 z-40 hidden bg-overlay backdrop-blur-[2px] md:block" />
    </Transition>

    <!-- Top row -->
    <div class="max-w-full md:max-w-4/5 mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 md:gap-4">
      <NuxtLink to="/" class="flex min-w-0 items-center gap-2 text-text-primary font-semibold tracking-wide md:shrink-0">
        <img v-if="shop.info?.logoImageUrl" :src="shop.info.logoImageUrl" :alt="`لوگوی ${shop.name}`" width="40" height="40" class="size-8 shrink-0 object-contain md:size-10" />
        <span class="truncate text-sm md:text-base">{{ shop.name }}</span>
      </NuxtLink>

      <div ref="searchWrapper" class="relative z-50 hidden flex-1 md:block md:max-w-2xl">
        <UiSearchBar
          v-model="desktopSearchQuery"
          :navigate-on-submit="false"
          placeholder="جستجوی محصولات، برندها و خدمات..."
          @focus="openDesktopSearch"
          @submit="submitDesktopSearch"
          @clear="desktopSearchOpen = false"
        />

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-2 scale-95"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="opacity-0 translate-y-2 scale-95"
        >
          <ProductSearchResultsPanel
            v-if="desktopSearchOpen && desktopSearchQuery.trim()"
            :query="desktopSearchQuery"
            mode="desktop"
            class="fixed left-1/2 z-50 w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2"
            :style="{ top: `${desktopSearchPanelTop}px` }"
            @close="desktopSearchOpen = false"
            @select="desktopSearchQuery = ''; desktopSearchOpen = false"
          />
        </Transition>
      </div>

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
          <NotificationDropdown v-if="badgesReady && authStore.isAuthenticated" />
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
            <UiCounterBadge :count="badgesReady ? cartStore.itemCount : 0" />
          </button>

          <NuxtLink to="/wishlist" class="relative inline-flex h-9 w-7 items-center justify-center rounded-md text-sm text-text-primary transition-colors hover:bg-surface-hover md:h-auto md:w-auto md:px-3 md:py-1.5" aria-label="علاقه‌مندی‌ها">
            <span class="flex items-center gap-2">
              <UIcon name="solar:heart-outline" class="size-5" />
              <span class="hidden md:inline">علاقه‌مندی‌ها</span>
              <UiCounterBadge :count="badgesReady ? wishlistStore.itemCount : 0" />
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
      <div ref="categoriesWrapper" class="relative">
        <button
          class="flex cursor-pointer items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
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
