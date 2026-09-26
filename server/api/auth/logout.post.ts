export default defineEventHandler(async (event) => {
  const authToken = getCookie(event, 'auth_token')

  if (authToken) {
    const response = await backendFetch<BackendLogoutResponse>('/auth/logout', {
      method: 'POST',
      authorization: 'user',
      retry: 0,
    }, event)

    clearSessionCookies(event)
    return response
  }

  clearSessionCookies(event)
  return { status: 'already_logged_out' } satisfies BackendLogoutResponse
})
