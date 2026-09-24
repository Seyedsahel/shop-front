<script setup lang="ts">
const props = defineProps<{ addresses: Address[]; provinces: ShippingProvince[]; selectedId: string | null; disabled?: boolean }>()
defineEmits<{ select: [id: string]; add: []; edit: [address: Address] }>()

function location(address: Address) {
  const province = props.provinces.find(item => item.code === address.province_code)
  const city = province?.cities.find(item => item.code === address.city_code)
  return [province?.title.trim(), city?.title.trim()].filter(Boolean).join('، ')
}
</script>

<template>
  <section class="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div class="flex items-center justify-between gap-3"><h2 class="text-lg font-bold text-text-primary">نشانی و اطلاعات تحویل‌گیرنده</h2><button type="button" :disabled="disabled" class="text-sm font-semibold text-primary disabled:opacity-50" @click="$emit('add')">افزودن نشانی</button></div>
    <div class="mt-4 space-y-3">
      <article v-for="address in addresses" :key="address.id" class="rounded-xl border p-4" :class="address.id === selectedId ? 'border-primary bg-primary-subtle' : 'border-border bg-card'">
        <div class="flex items-start gap-3">
          <input :id="`checkout-address-${address.id}`" type="radio" name="checkout-address" :checked="address.id === selectedId" :disabled="disabled" class="mt-1 accent-primary" @change="$emit('select', address.id)">
          <label :for="`checkout-address-${address.id}`" class="min-w-0 flex-1 cursor-pointer text-sm leading-7 text-text-secondary"><strong class="block text-text-primary">{{ address.name }} · <bdi>{{ address.phone_number }}</bdi></strong>{{ location(address) }}<span v-if="location(address)">، </span>{{ address.address }}<span v-if="address.postal_code" class="block">کد پستی: <bdi>{{ address.postal_code }}</bdi></span></label>
          <button type="button" :disabled="disabled" class="text-xs text-primary disabled:opacity-50" @click="$emit('edit', address)">ویرایش</button>
        </div>
      </article>
      <p v-if="!addresses.length" class="text-sm text-text-secondary">برای ثبت سفارش، یک نشانی و اطلاعات تماس اضافه کنید.</p>
    </div>
  </section>
</template>
