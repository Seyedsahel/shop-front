<script setup lang="ts">
definePageMeta({ layout: 'payment' })

const route = useRoute()
const auth = useAuthStore()
const orders = useOrderStore()
const orderId = computed(() => typeof route.query.order_id === 'string' ? route.query.order_id.trim() : '')
const order = computed(() => orders.current?.id === orderId.value ? orders.current : null)
const failureHint = computed(() => typeof route.query.error === 'string' ? route.query.error : '')
const referenceHint = computed(() => typeof route.query.ref_id === 'string' ? route.query.ref_id : '')

async function loadOrder() {
  if (!auth.isAuthenticated || !orderId.value) return
  await orders.fetchOne(orderId.value).catch(() => {})
}

watch(() => [orderId.value, auth.isAuthenticated], () => { void loadOrder() }, { immediate: true })
</script>

<template>
  <PaymentReturnResult :order-id="orderId" :order="order" :loading="orders.detailLoading" :error="orders.detailError" :authenticated="auth.isAuthenticated" :failure-hint="failureHint" :reference-hint="referenceHint" @retry="loadOrder" />
</template>
