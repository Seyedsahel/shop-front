<template>
  <section aria-labelledby="blog-empty-title" class="overflow-hidden rounded-3xl border border-border bg-surface">
    <div class="grid items-center gap-6 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:p-14">
      <div class="order-2 text-center lg:order-1 lg:text-start">
        <span class="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <span class="h-px w-6 bg-primary/50" aria-hidden="true" />
          برای آگاهانه‌تر انتخاب کردن
        </span>
        <h2 id="blog-empty-title" class="mt-5 text-2xl font-bold leading-relaxed text-text-primary sm:text-3xl">
          هنوز مقاله‌ای منتشر نشده است
        </h2>
        <p class="mx-auto mt-4 max-w-md text-sm leading-8 text-text-secondary lg:mx-0">
          اینجا جایی برای خواندن درباره سلامت، زیبایی و مراقبت از خود است.
          تا انتشار اولین نوشته، می‌توانید سری به محصولات فروشگاه بزنید.
        </p>
        <div class="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
          <NuxtLink to="/products" class="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto">
            مشاهده محصولات
            <UIcon name="solar:arrow-left-broken" class="size-4" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink to="/" class="inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm text-text-secondary transition-colors hover:bg-background">
            بازگشت به خانه
          </NuxtLink>
        </div>
      </div>

      <div aria-hidden="true" class="relative order-1 flex h-52 items-center justify-center sm:h-64 lg:order-2 lg:h-80">
        <div class="absolute size-48 rounded-full border border-primary/10 sm:size-64" />
        <div class="absolute size-40 rounded-full bg-secondary/30 sm:size-52" />
        <div class="absolute h-40 w-32 -translate-x-3 rotate-[-12deg] rounded-2xl border border-border bg-background sm:h-48 sm:w-40" />
        <div class="relative flex h-40 w-32 rotate-[6deg] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card shadow-sm sm:h-48 sm:w-40">
          <span class="flex size-16 items-center justify-center rounded-2xl bg-success-subtle text-primary">
            <UIcon name="solar:book-2-broken" class="size-9" />
          </span>
          <div class="flex w-20 flex-col items-center gap-2">
            <span class="h-1.5 w-full rounded-full bg-border" />
            <span class="h-1.5 w-14 rounded-full bg-border/60" />
          </div>
        </div>
        <span class="absolute start-[12%] top-5 flex size-10 items-center justify-center rounded-full border border-border bg-background text-primary sm:top-8">
          <UIcon name="solar:leaf-broken" class="size-5" />
        </span>
        <span class="absolute bottom-5 end-[12%] size-3 rounded-full bg-secondary sm:bottom-8" />
      </div>
    </div>
    <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border px-6 py-4 text-xs text-text-secondary sm:gap-x-8">
      <span class="flex items-center gap-2"><UIcon name="solar:leaf-broken" class="size-4 text-primary" aria-hidden="true" /> سلامت و تندرستی</span>
      <span class="h-3 w-px bg-border-strong" aria-hidden="true" />
      <span class="flex items-center gap-2"><UIcon name="solar:heart-broken" class="size-4 text-primary" aria-hidden="true" /> زیبایی و مراقبت</span>
      <span class="h-3 w-px bg-border-strong" aria-hidden="true" />
      <span class="flex items-center gap-2"><UIcon name="solar:bag-4-broken" class="size-4 text-primary" aria-hidden="true" /> راهنمای انتخاب</span>
    </div>
  </section>
</template>
