<script setup lang="ts">
const props = defineProps<{
  addresses: Address[]
  provinces: ShippingProvince[]
  disabled?: boolean
}>()
defineEmits<{ edit: [address: Address]; remove: [address: Address] }>()

function location(address: Address) {
  const province = props.provinces.find(item => item.code === address.province_code)
  const city = province?.cities.find(item => item.code === address.city_code)
  return [province?.title.trim(), city?.title.trim()].filter(Boolean).join('، ')
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <article v-for="address in addresses" :key="address.id" class="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2"><UIcon name="solar:map-point-outline" class="size-5 text-primary" /><div><h3 class="font-semibold text-text-primary">{{ address.name }}</h3><p class="text-xs text-text-secondary">{{ address.first_name }} {{ address.last_name }}</p></div></div>
        <div class="flex gap-3 text-sm">
          <button type="button" :disabled="disabled" class="text-primary disabled:opacity-50" :aria-label="`ویرایش نشانی ${address.name}`" @click="$emit('edit', address)">ویرایش</button>
          <button type="button" :disabled="disabled" class="text-danger disabled:opacity-50" :aria-label="`حذف نشانی ${address.name}`" @click="$emit('remove', address)">حذف</button>
        </div>
      </div>
      <p class="mt-3 flex-1 text-sm leading-7 text-text-secondary">{{ location(address) }}<span v-if="location(address)">، </span>{{ address.address }}</p>
      <div class="mt-4 space-y-1 border-t border-divider pt-3 text-xs text-text-secondary">
        <p>شماره تماس: <bdi>{{ address.phone_number }}</bdi></p>
        <p>کد پستی: <bdi>{{ address.postal_code }}</bdi></p>
      </div>
    </article>
  </div>
</template>
