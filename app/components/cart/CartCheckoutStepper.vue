<script setup lang="ts">
withDefaults(defineProps<{ step?: 1 | 2 | 3 }>(), { step: 1 })

const steps = [
  { id: 1, label: 'سبد خرید', icon: 'solar:cart-large-2-outline', to: '/cart' },
  { id: 2, label: 'مشخصات و آدرس', icon: 'solar:delivery-outline', to: '/checkout' },
  { id: 3, label: 'پرداخت نهایی', icon: 'solar:card-outline' },
]
</script>

<template>
  <section class="border-y border-divider bg-surface py-4 sm:py-5">
    <ol class="relative mx-auto flex max-w-2xl items-start justify-between px-4 sm:px-8">
      <div class="absolute top-5 inset-x-12 h-px bg-border-strong sm:inset-x-18" />
      <div class="absolute top-5 inset-s-12 h-px bg-primary transition-all sm:inset-s-18" :style="{ width: `${((step - 1) / 2) * 100}%` }" />
      <li v-for="item in steps" :key="item.id" class="relative z-10 w-20 text-center sm:w-28">
        <NuxtLink v-if="item.id < step && item.to" :to="item.to" class="flex flex-col items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
          <span class="grid size-10 place-items-center rounded-full border-4 border-surface bg-primary text-primary-foreground transition-colors">
            <UIcon name="solar:check-circle-bold" class="size-5" />
          </span>
          <span class="text-[11px] font-semibold leading-5 text-text-primary sm:text-xs">{{ item.id.toLocaleString('fa-IR') }}. {{ item.label }}</span>
        </NuxtLink>
        <span v-else class="flex flex-col items-center gap-2">
          <span class="grid size-10 place-items-center rounded-full border-4 border-surface transition-colors" :class="item.id === step ? 'bg-primary text-primary-foreground ring-2 ring-focus-ring' : 'bg-card text-text-muted'">
            <UIcon :name="item.icon" class="size-5" />
          </span>
          <span class="text-[11px] font-semibold leading-5 sm:text-xs" :class="item.id === step ? 'text-text-primary' : 'text-text-muted'">{{ item.id.toLocaleString('fa-IR') }}. {{ item.label }}</span>
        </span>
      </li>
    </ol>
  </section>
</template>
