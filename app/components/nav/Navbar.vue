<script setup lang="ts">
import MobileMenu from '~/components/nav/MobileMenu.vue'
const navLinks = [
  { label: "خانه", href: "/" },
  { label: "دریافت نوبت", href: "/" },
  { label: "مشاوره", href: "/consultation" },
  { label: "محصولات", href: "/" },
];

const mobileOpen = ref(false);
const authStore = useAuthStore()

</script>

<template>
  <header
    class="sticky top-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-divider"
  >
    <nav
      class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
    >
      <NuxtLink to="/" class="text-text-primary font-semibold tracking-wide">
        Fateme Beauty Lab
      </NuxtLink>

      <!-- Desktop links -->
      <ul class="hidden md:flex items-center gap-6">
        <li v-for="link in navLinks" :key="link.href">
          <NuxtLink
            :to="link.href"
            class="text-sm text-text-secondary hover:text-text-primary transition-colors"
            active-class="!text-text-primary font-medium"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>

      <div class="flex items-center gap-4">
        <NuxtLink
          v-if="authStore.isAuthenticated"
          to="/profile"
          class="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <span class="hidden sm:inline">پروفایل</span>
          <UIcon name="solar:user-rounded-broken" class="size-5" />
        </NuxtLink>
        <NuxtLink
          v-else
          to="/auth"
          class="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <span class="hidden sm:inline">ورود</span>
          <UIcon name="solar:login-2-broken" class="size-5" />
        </NuxtLink>
        <NuxtLink 
          to="/cart"
          class="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <span
            class="hidden sm:inline "
            >سبد خرید</span
          >
          <UIcon name="solar:cart-4-outline" class="size-5" />
        </NuxtLink>

        <!-- Hamburger — mobile only -->
        <UButton
          class="md:hidden mt-2 text-text-secondary hover:text-text-primary transition-colors"
          variant="ghost"
          size="lg"
          :icon="
            mobileOpen
              ? 'solar:close-circle-outline'
              : 'solar:hamburger-menu-outline'
          "
          @click="
            () => {
              mobileOpen = !mobileOpen;
            }
          "
        />
      </div>
    </nav>

    <MobileMenu v-model="mobileOpen" :links="navLinks" />
  </header>
</template>
