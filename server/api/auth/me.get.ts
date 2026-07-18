// server/api/auth/me.get.ts
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) return { isAuthenticated: false }

  const config = useRuntimeConfig()
  try {
    const user = await $fetch(`${config.backendUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return { isAuthenticated: true, user }
  } catch {
    return { isAuthenticated: false }
  }
})