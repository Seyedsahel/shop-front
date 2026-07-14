<script setup lang="ts">
const navLinks = [
  { label: 'خانه', href: '/' },
  { label: 'دریافت نوبت', href: '/about' },
  { label: 'مشاوره', href: '/services' },
  { label: 'محصولات', href: '/contact' }
];
</script>
<template>
  <header class="sticky top-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-divider">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

      <!-- Logo -->
      <NuxtLink to="/" class="text-text-primary font-semibold tracking-wide">
        Fateme Beauty Lab
      </NuxtLink>

      <!-- Nav Links -->
      <ul class="hidden md:flex items-center gap-6">
        <li v-for="link in navLinks" :key="link.href">
          <NuxtLink
            :to="link.href"
            class="text-sm text-text-secondary hover:text-text-primary transition-colors"
            active-class="text-text-primary font-medium"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <NuxtLink to="/login" class="flex items-center gap-1" variant="ghost" size="sm"><span class="hidden sm:inline">ورود</span><UIcon name="solar:login-2-broken" class="size-5" /></NuxtLink>
        <NuxtLink to="/cart" class="flex items-center gap-1" variant="primary" size="sm"><span class="hidden sm:inline">سبد خرید</span><UIcon name="solar:cart-4-outline" class="size-5" /></NuxtLink>
      </div>

    </nav>
  </header>
</template>