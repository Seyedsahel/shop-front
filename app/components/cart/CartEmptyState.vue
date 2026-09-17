<template>
  <section class="flex min-h-90 flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-card p-8 text-center">
    <span class="grid size-18 place-items-center rounded-full bg-primary-subtle text-primary"><UIcon name="solar:cart-large-2-outline" class="size-9" /></span>
    <h1 class="mt-5 text-xl font-bold text-text-primary">سبد خرید شما خالی است</h1>
    <p class="mt-2 max-w-sm text-sm leading-7 text-text-secondary">محصولات مورد علاقه‌تان را به سبد اضافه کنید تا اینجا ببینید.</p>
    <NuxtLink to="/products" class="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">مشاهده محصولات</NuxtLink>
  </section>
</template>
