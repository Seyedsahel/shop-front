<script setup lang="ts">
const cartStore = useCartStore()
const deliveryMethod = ref<DeliveryMethod>('courier')
const addressSheetOpen = ref(false)
const savedAddresses = ref<AddressDraft[]>([
  { id: 'address-home', label: 'خانه', recipientName: 'سارا محمدی‌راد', phone: '۰۹۱۲۳۴۵۶۷۸۹', province: 'تهران', city: 'تهران', address: 'خیابان ولیعصر، بالاتر از میدان ونک، خیابان دامن افشار', plaque: '۴۲', unit: 'واحد ۵، طبقه ۳', postalCode: '۱۹۶۹۷۴۵۱۱۲', deliveryNote: 'هماهنگی با نگهبانی' },
  { id: 'address-work', label: 'محل کار', recipientName: 'سارا محمدی‌راد', phone: '۰۹۱۲۳۴۵۶۷۸۹', province: 'تهران', city: 'تهران', address: 'خیابان شریعتی، نزدیک میرداماد', plaque: '۱۱۴', unit: 'طبقه ۲', postalCode: '۱۹۱۹۶۵۴۳۲۱', deliveryNote: '' },
])
const selectedAddressId = ref<string | null>('address-home')
const draft = ref<AddressDraft>({ ...savedAddresses.value[0]! })

const deliveryFee = computed(() => ({ courier: 45000, pickup: 0, post: 35000 })[deliveryMethod.value])
const methodLabel = computed(() => ({ courier: 'پیک فوری', pickup: 'تحویل حضوری', post: 'پست پیشتاز' })[deliveryMethod.value])

function selectAddress(id: string) {
  const address = savedAddresses.value.find(item => item.id === id)
  if (!address) return
  selectedAddressId.value = id
  draft.value = { ...address }
  addressSheetOpen.value = false
}

function addAddress() {
  selectedAddressId.value = null
  draft.value = { id: `address-${Date.now()}`, label: 'نشانی جدید', recipientName: '', phone: '', province: '', city: '', address: '', plaque: '', unit: '', postalCode: '', deliveryNote: '' }
  addressSheetOpen.value = false
}

function editAddress(address: AddressDraft) {
  selectedAddressId.value = address.id
  draft.value = { ...address }
  addressSheetOpen.value = false
}

function saveAddress() {
  if (deliveryMethod.value === 'pickup') return
  const index = savedAddresses.value.findIndex(address => address.id === draft.value.id)
  if (index >= 0) savedAddresses.value[index] = { ...draft.value }
  else savedAddresses.value.push({ ...draft.value })
  selectedAddressId.value = draft.value.id
  useAppToast().success('نشانی برای ادامه خرید آماده است.')
}

function continueToPayment() {
  // TODO: Replace with Checkout/Payment API and navigation to gateway.
  useAppToast().info('درگاه پرداخت پس از اتصال API فعال می‌شود.')
}

onMounted(() => { if (!cartStore.items.length) navigateTo('/cart') })
</script>

<template>
  <div>
    <CartCheckoutStepper :step="2" />
    <div class="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <div class="grid items-start gap-6 lg:grid-cols-12">
        <main class="space-y-6 lg:col-span-8"><CheckoutDeliveryMethods v-model="deliveryMethod" /><CheckoutAddressForm v-model="draft" :pickup="deliveryMethod === 'pickup'" @choose-address="addressSheetOpen = true" @save="saveAddress" /></main>
        <div class="lg:col-span-4 lg:sticky lg:top-24"><CheckoutOrderSummary :items="cartStore.items" :subtotal="cartStore.subtotal" :discount="cartStore.discount" :delivery-fee="deliveryFee" :method-label="methodLabel" @continue="continueToPayment" /></div>
      </div>
    </div>
    <UiBottomSheet v-model="addressSheetOpen" title="آدرس‌های ذخیره‌شده"><CheckoutAddressList :addresses="savedAddresses" :selected-id="selectedAddressId" @select="selectAddress" @add="addAddress" @edit="editAddress" /></UiBottomSheet>
  </div>
</template>
