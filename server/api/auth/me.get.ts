export default defineEventHandler((event): Promise<SessionResponse> => {
  setHeader(event, 'Cache-Control', 'no-store')
  return readSession(event)
})
