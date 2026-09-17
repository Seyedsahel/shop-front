<script setup lang="ts">
defineProps<{ addresses: AddressDraft[]; selectedId: string | null }>()
defineEmits<{ select: [id: string]; add: []; edit: [address: AddressDraft] }>()
</script>

<template>
  <div class="space-y-3 p-4">
    <!-- TODO: Replace saved address list and mutations with Address API. -->
    <article v-for="address in addresses" :key="address.id" class="rounded-xl border p-4 transition-colors" :class="address.id === selectedId ? 'border-primary bg-primary-subtle' : 'border-border bg-card'">
      <div class="flex items-center justify-between gap-3"><button type="button" class="text-sm font-semibold text-text-primary" @click="$emit('select', address.id)">{{ address.label }}</button><span class="inline-flex items-center gap-2"><button type="button" class="text-xs text-primary" @click="$emit('edit', address)">ویرایش</button><UIcon v-if="address.id === selectedId" name="solar:check-circle-bold" class="size-5 text-primary" /></span></div>
      <button type="button" class="mt-2 w-full text-start" @click="$emit('select', address.id)"><span class="block text-xs leading-6 text-text-secondary">{{ address.recipientName }} · {{ address.phone }}</span><span class="mt-1 block text-xs leading-6 text-text-secondary">{{ address.province }}، {{ address.city }}، {{ address.address }}</span></button>
    </article>
    <button type="button" class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary px-4 py-3 text-sm font-semibold text-primary" @click="$emit('add')"><UIcon name="solar:add-circle-outline" class="size-5" />افزودن آدرس جدید</button>
  </div>
</template>
