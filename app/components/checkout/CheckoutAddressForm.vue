<script setup lang="ts">
const draft = defineModel<AddressDraft>({ required: true })
const props = defineProps<{ pickup?: boolean }>()
const emit = defineEmits<{ chooseAddress: []; save: [] }>()

const isValid = computed(() => props.pickup
  ? Boolean(draft.value.recipientName.trim() && draft.value.phone.trim())
  : Boolean(draft.value.recipientName.trim() && draft.value.phone.trim() && draft.value.province && draft.value.city && draft.value.address.trim() && draft.value.plaque.trim() && draft.value.postalCode.trim()),
)
</script>

<template>
  <section class="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <template v-if="pickup">
      <div class="flex items-center gap-2"><UIcon name="solar:shop-2-outline" class="size-6 text-primary" /><h2 class="text-lg font-bold text-text-primary">اطلاعات تحویل‌گیرنده حضوری</h2></div>
      <p class="mt-2 text-sm leading-7 text-text-secondary">برای دریافت حضوری، ثبت آدرس پستی لازم نیست.</p>
      <div class="mt-5 rounded-xl bg-surface p-4 text-sm leading-7 text-text-secondary"><strong class="text-text-primary">فروشگاه مرکزی</strong><br>تهران، خیابان ولیعصر، بالاتر از میدان ونک · همه‌روزه ۹ تا ۲۱</div>
    </template>
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-2"><UIcon name="solar:map-point-outline" class="size-6 text-primary" /><h2 class="text-lg font-bold text-text-primary">مشخصات تحویل‌گیرنده و نشانی</h2></div><button type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-primary" @click="emit('chooseAddress')"><UIcon name="solar:book-outline" class="size-4" />انتخاب از آدرس‌های ذخیره‌شده</button></div>
      <p class="mt-2 text-sm leading-7 text-text-secondary">بسته شما با سلامت کامل به این مشخصات تحویل داده می‌شود.</p>
    </template>
    <form class="mt-5 space-y-4" @submit.prevent="isValid && emit('save')" novalidate>
      <div class="grid gap-4 sm:grid-cols-2"><UiInput v-model="draft.recipientName" label="نام و نام خانوادگی تحویل‌گیرنده *" placeholder="نام دریافت‌کننده" /><UiInput v-model="draft.phone" label="شماره موبایل *" inputmode="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" /></div>
      <template v-if="!pickup">
        <div class="grid gap-4 sm:grid-cols-2"><label class="flex flex-col gap-2 text-sm text-text-secondary">استان *<select v-model="draft.province" class="rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-text-primary outline-none"><option value="">انتخاب استان</option><option>تهران</option><option>البرز</option><option>اصفهان</option></select></label><label class="flex flex-col gap-2 text-sm text-text-secondary">شهر *<select v-model="draft.city" class="rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-text-primary outline-none"><option value="">انتخاب شهر</option><option>تهران</option><option>کرج</option><option>اصفهان</option></select></label></div>
        <UiTextarea v-model="draft.address" label="نشانی پستی دقیق *" :rows="3" placeholder="خیابان، کوچه، مشخصات دقیق محل تحویل" />
        <div class="grid gap-4 sm:grid-cols-3"><UiInput v-model="draft.plaque" label="پلاک *" inputmode="numeric" /><UiInput v-model="draft.unit" label="واحد / طبقه" /><UiInput v-model="draft.postalCode" label="کد پستی ۱۰ رقمی *" inputmode="numeric" /></div>
        <div class="grid gap-4 sm:grid-cols-2"><label class="flex flex-col gap-2 text-sm text-text-secondary">بازه تحویل<select class="rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-text-primary outline-none"><option>امروز عصر (۱۷ تا ۲۱)</option><option>فردا صبح (۹ تا ۱۳)</option><option>فردا عصر (۱۵ تا ۱۹)</option></select></label><UiInput v-model="draft.deliveryNote" label="توضیحات تحویل" placeholder="هماهنگی با نگهبانی (اختیاری)" /></div>
      </template>
      <!-- TODO: Replace local address save with Address API mutation. -->
      <button v-if="!pickup" type="submit" class="rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary-hover disabled:cursor-not-allowed disabled:bg-disabled-bg" :disabled="!isValid">ذخیره نشانی</button>
    </form>
  </section>
</template>
