<script setup lang="ts">
const route = useRoute()

const navItems = [
  { label: 'خانه', to: '/', icon: 'solar:home-2-broken' },
  { label: 'دسته‌ها', to: '/consultation', icon: 'solar:widget-broken' },
  { label: 'سبد خرید', to: '/cart', icon: 'solar:cart-4-outline' },
  { label: 'پروفایل', to: '/consultation', icon: 'solar:user-broken' },
]

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
</script>

<template>
  <nav class="fixed m-5 rounded-2xl bottom-2 inset-x-0 z-50 sm:hidden bg-surface/90 backdrop-blur-sm border border-divider h-16 flex items-center justify-around">
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="flex flex-col items-center gap-1 text-text-secondary"
        active-class="!text-accent-foreground font-medium"

    >
      <UIcon :name="item.icon" class="size-5" />
      <span class="text-[11px]">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>