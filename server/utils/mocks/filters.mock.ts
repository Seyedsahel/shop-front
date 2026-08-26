// server/utils/mocks/filters.mock.ts
export const mockFiltersResponse: FiltersResponse = {
  items: [
    { id: 'fast-shipping', label: 'ارسال سریع', type: 'toggle', description: 'دیجی‌کالا، فروشنده و ۳ ساعته', icon: 'solar:delivery-broken' },
    { id: 'color', label: 'رنگ', type: 'color', options: [
      { id: 'black', label: 'مشکی', hex: '#1a1a1a' },
      { id: 'blue', label: 'آبی', hex: '#3b6bd8' },
      { id: 'white', label: 'سفید', hex: '#f5f5f5' },
      { id: 'pink', label: 'صورتی', hex: '#e78ba0' },
    ]},
    { id: 'price', label: 'محدوده قیمت', type: 'range', min: 0, max: 5000000, step: 50000 },
    {id:'offer', label: 'پیشنهاد ویژه', type: 'toggle', description: 'کالاهای دارای تخفیف ویژه'},
    { id: 'seller-type', label: 'نوع فروشنده', type: 'radio', options: [
      { id: 'official', label: 'فروشنده رسمی' },
      { id: 'marketplace', label: 'سایر فروشندگان' },
    ]},
    { id: 'in-stock', label: 'فقط کالاهای موجود در انبار', type: 'toggle' },
    { id: 'seller-shipping', label: 'ارسال فروشنده', type: 'toggle', description: 'ارسال مستقیم و سریع‌تر', icon: 'solar:user-broken' },
    { id: 'available-only', label: 'فقط کالاهای موجود', type: 'toggle' },
    { id: 'pickup-tehran', label: 'خرید حضوری در تهران', type: 'toggle' },
  ],
}