export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const token = getCookie(event, 'auth_token')
  if (!token) return { isAuthenticated: false }

  try {
    const validation = await backendFetch<BackendAuthValidateResponse>('api/auth/validate', {}, event)

    if (!validation.valid) {
      deleteCookie(event, 'auth_token', { path: '/' })
      return { isAuthenticated: false }
    }

    return {
      isAuthenticated: true,
      user: { id: validation.user_id, role: validation.role },
    }
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      deleteCookie(event, 'auth_token', { path: '/' })
      return { isAuthenticated: false }
    }

    throw error
  }
})
