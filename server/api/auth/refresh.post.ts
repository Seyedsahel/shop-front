export default defineEventHandler(async (event) => {
  const response = await backendFetch<BackendRefreshResponse>('/api/auth/refresh', {
    method: 'POST',
    authorization: 'user',
    retry: 0,
  }, event)

  if (!response.token?.trim()) throw createError({ statusCode: 502, message: 'Invalid token refresh response' })

  setCookie(event, 'auth_token', response.token, sessionCookieOptions)
  return { success: true } satisfies RefreshTokenResponse
})
