import type { H3Event } from 'h3'
import { backendFetch } from './backendFetch'
import { clearCredential, resolveCredential } from './session'

export async function readSession(event: H3Event): Promise<SessionResponse> {
  const credential = resolveCredential(event)
  if (!credential) return { identity: null, isAuthenticated: false, hasGuestSession: false }

  try {
    const validation = await backendFetch<BackendAuthValidateResponse>('/auth/validate', {}, event)
    const expectedRole = credential.kind === 'guest' ? 'guest' : 'user'
    if (!validation.valid || validation.role !== expectedRole) {
      clearCredential(event, credential.kind)
      return { identity: null, isAuthenticated: false, hasGuestSession: false }
    }
    return {
      identity: sessionIdentity(credential.token),
      isAuthenticated: credential.kind === 'user',
      hasGuestSession: credential.kind === 'guest',
      ...(credential.kind === 'user' ? { user: { id: validation.user_id, role: validation.role } } : {}),
    }
  } catch (error: any) {
    if ([401, 403].includes(error.statusCode ?? error.response?.status)) {
      clearCredential(event, credential.kind)
      return { identity: null, isAuthenticated: false, hasGuestSession: false }
    }
    throw error
  }
}
