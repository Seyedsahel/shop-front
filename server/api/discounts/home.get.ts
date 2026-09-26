export default defineEventHandler(async (): Promise<HomepageDiscount | null> => {
  const raw = await backendFetch<any>('/discounts/home')

  if (!raw) return null

  return {
    id: raw.id,
    name: raw.name ?? '',
    description: raw.description ?? '',
    type: raw.type ?? '',
    value: Number(raw.value ?? 0),
    scope: raw.scope ?? '',
    priority: Number(raw.priority ?? 0),
    stackable: Boolean(raw.stackable),
    isActive: Boolean(raw.is_active),
    showOnHome: Boolean(raw.show_on_home),
    startsAt: raw.starts_at ?? null,
    endsAt: raw.ends_at ?? null,
  }
})
