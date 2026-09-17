export default defineEventHandler(async (event) => {
  const authToken = getCookie(event, 'auth_token')

  if (authToken) {
    // TODO(auth): Persist and send a dedicated refresh token once the verify
    // endpoint returns one. Until then, the single issued token is the only
    // credential available for the backend's required refresh_token field.
    const response = await backendFetch<BackendLogoutResponse>('api/auth/logout', {
      method: 'POST',
      body: { refresh_token: authToken } satisfies BackendLogoutPayload,
    }, event)

    deleteCookie(event, 'auth_token', { path: '/' })
    return response
  }

  deleteCookie(event, 'auth_token', { path: '/' })
  return { status: 'already_logged_out' } satisfies BackendLogoutResponse
})
