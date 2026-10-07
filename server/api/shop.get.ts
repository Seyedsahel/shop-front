export default defineEventHandler(async (event): Promise<ShopInfo> => {
  const raw = await backendFetch<unknown>('/shop', { authorization: 'none' }, event)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw createError({ statusCode: 502, message: 'Invalid shop response from backend' })
  }
  const data = raw as Record<string, unknown>
  if (typeof data.shop_name !== 'string' || !data.shop_name.trim()) {
    throw createError({ statusCode: 502, message: 'Invalid shop name from backend' })
  }
  const text = (key: string) => typeof data[key] === 'string' ? data[key].trim() : ''
  return {
    name: text('shop_name'), description: text('shop_description'),
    address: text('address'), phoneNumber: text('phone_number'), email: text('email'),
    instagramId: text('instagram_id'), telegramId: text('telegram_id'),
    logoImageId: text('logo_image_id'), enamadImageId: text('enamad_image_id'),
  }
})
