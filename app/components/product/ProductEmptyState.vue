<script setup lang="ts">
defineProps<{ filtered: boolean; resetTo: string }>()
</script>

<template>
  <section aria-labelledby="product-empty-title" class="overflow-hidden rounded-3xl border border-border bg-surface">
    <div class="grid items-center gap-5 p-6 sm:p-8 xl:grid-cols-[1.2fr_1fr] xl:gap-8 xl:p-10">
      <div class="order-2 text-center xl:order-1 xl:text-start">
        <span class="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <span class="h-px w-6 bg-primary/50" aria-hidden="true" />
          انتخاب خوب، با کمی جستجو
        </span>
        <h2 id="product-empty-title" class="mt-4 text-xl font-bold leading-relaxed text-text-primary sm:text-2xl">
          {{ filtered ? 'محصولی با این مشخصات پیدا نشد' : 'هنوز محصولی برای نمایش موجود نیست' }}
        </h2>
        <p class="mx-auto mt-3 max-w-md text-sm leading-8 text-text-secondary xl:mx-0">
          {{ filtered
            ? 'گاهی یک تغییر کوچک کافی است. فیلترها را کمتر کنید یا با عبارت دیگری جستجو کنید تا انتخاب‌های بیشتری ببینید.'
            : 'در حال حاضر این بخش محصولی ندارد. می‌توانید به صفحه اصلی برگردید و بخش‌های دیگر فروشگاه را ببینید.' }}
        </p>
        <div class="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row xl:justify-start">
          <NuxtLink v-if="filtered" :to="resetTo" class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto">
            <UIcon name="solar:restart-broken" class="size-4" aria-hidden="true" />
            پاک کردن فیلترها و جستجو
          </NuxtLink>
          <NuxtLink to="/" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm transition-colors" :class="filtered ? 'text-text-secondary hover:bg-background' : 'bg-primary text-primary-foreground hover:bg-primary-hover'">
            بازگشت به خانه
            <UIcon name="solar:arrow-left-broken" class="size-4" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>

      <div aria-hidden="true" class="relative order-1 flex h-44 items-center justify-center sm:h-52 xl:order-2 xl:h-64">
        <div class="absolute size-44 rounded-full border border-primary/10 sm:size-56" />
        <div class="absolute size-36 rounded-full bg-secondary/30 sm:size-44" />
        <div class="absolute h-32 w-28 -translate-x-3 rotate-[-12deg] rounded-2xl border border-border bg-background sm:h-40 sm:w-32" />
        <div class="relative flex h-32 w-28 rotate-[6deg] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card shadow-sm sm:h-40 sm:w-32">
          <span class="flex size-16 items-center justify-center rounded-2xl bg-success-subtle text-primary">
            <UIcon name="solar:bag-4-broken" class="size-10" />
          </span>
          <span class="h-1.5 w-14 rounded-full bg-border" />
        </div>
        <span class="absolute bottom-4 end-[15%] flex size-12 items-center justify-center rounded-full border border-border bg-background text-primary sm:bottom-6">
          <UIcon name="solar:magnifer-broken" class="size-6" />
        </span>
        <span class="absolute start-[15%] top-5 size-3 rounded-full bg-secondary" />
      </div>
    </div>
    <div class="flex items-center justify-center gap-2 border-t border-border px-5 py-4 text-center text-xs leading-6 text-text-secondary">
      <UIcon name="solar:leaf-broken" class="size-4 shrink-0 text-primary" aria-hidden="true" />
      <span>{{ filtered ? 'جستجوی کوتاه‌تر و فیلترهای کمتر، انتخاب‌های بیشتر' : 'سلامت، زیبایی و مراقبت از خود؛ همراه شما در هر انتخاب' }}</span>
    </div>
  </section>
</template>
