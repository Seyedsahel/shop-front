export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const token = getCookie(event, 'auth_token')
  if (!token) return { isAuthenticated: false }

  try {
    const user = await backendFetch<User>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return { isAuthenticated: true, user }
  } catch {
    return { isAuthenticated: false }
  }
})