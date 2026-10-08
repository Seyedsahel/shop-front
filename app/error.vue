<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const statusCode = computed(() => props.error.statusCode || 500)
const messages: Record<number, { title: string; description: string }> = {
  404: {
    title: 'صفحه یا محتوای مورد نظر پیدا نشد',
    description: 'ممکن است نشانی تغییر کرده باشد، محتوا حذف شده باشد یا آدرس را اشتباه وارد کرده باشید. از جستجو یا مسیرهای زیر برای ادامه استفاده کنید.',
  },
  500: {
    title: 'خطای داخلی سرور',
    description: 'سرور هنگام پردازش درخواست با مشکلی روبه‌رو شد. لطفاً کمی بعد دوباره تلاش کنید.',
  },
  502: {
    title: 'مشکل در ارتباط با سرویس فروشگاه',
    description: 'پاسخ معتبری از سرویس فروشگاه دریافت نشد. لطفاً کمی بعد دوباره تلاش کنید.',
  },
  503: {
    title: 'سرویس موقتاً در دسترس نیست',
    description: 'سرویس در حال حاضر امکان پاسخ‌گویی ندارد. لطفاً کمی بعد دوباره تلاش کنید.',
  },
}
const presentation = computed(() => messages[statusCode.value] ?? {
  title: 'مشکلی پیش آمده است',
  description: 'در بارگذاری این صفحه مشکلی پیش آمد. لطفاً دوباره تلاش کنید یا به صفحه اصلی برگردید.',
})

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <NuxtLayout name="default">
    <section lang="fa" dir="rtl" class="relative isolate flex min-h-[calc(100vh-var(--spacing-navbar))] items-center overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div class="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 text-center text-[clamp(9rem,28vw,22rem)] font-black leading-none tracking-tighter text-accent/10" aria-hidden="true">{{ statusCode }}</div>

      <div class="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <span class="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-text-secondary shadow-sm ring-1 ring-border">
          <span class="size-2 rounded-full bg-danger" />
          خطای {{ statusCode }}
        </span>

        <div class="mt-7 grid size-28 place-items-center rounded-full border-4 border-card bg-background text-primary shadow-lg sm:size-32">
          <UIcon name="solar:compass-big-bold-duotone" class="size-14 sm:size-16" />
        </div>

        <h1 class="mt-7 text-2xl font-black text-text-primary sm:text-4xl">{{ presentation.title }}</h1>
        <p class="mt-3 max-w-xl text-sm leading-7 text-text-secondary sm:text-base">{{ presentation.description }}</p>

        <div class="mt-7 w-full max-w-xl">
          <UiSearchBar placeholder="جستجوی محصول، برند یا مقاله آموزشی..." />
        </div>

        <div class="mt-5 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover" @click="goHome">
            <UIcon name="solar:home-2-linear" class="size-5" />
            بازگشت به صفحه اصلی
          </button>
          <NuxtLink to="/products" class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-secondary px-6 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary-hover">
            <UIcon name="solar:bag-3-linear" class="size-5 text-secondary-foreground" />
            مشاهده محصولات
          </NuxtLink>
        </div>

        <p class="mt-10 text-sm text-text-muted">
          به راهنمایی نیاز دارید؟
          <NuxtLink to="/consultation" class="font-bold text-primary transition-colors hover:text-primary-hover">با ما در تماس باشید</NuxtLink>
        </p>
      </div>
    </section>
  </NuxtLayout>
</template>
