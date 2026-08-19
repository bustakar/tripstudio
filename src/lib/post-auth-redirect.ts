export function oauthAuthorizationRedirect(search: string, origin: string) {
  const params = new URLSearchParams(search)
  if (!params.has('client_id') || !params.has('sig')) return null

  const redirect = new URL('/api/auth/oauth2/authorize', origin)
  redirect.search = params.toString()
  return redirect
}

export function postAuthRedirect(search: string) {
  const params = new URLSearchParams(search)
  const redirect = params.get('redirect')

  if (redirect?.startsWith('/') && !redirect.startsWith('//')) return redirect
  return '/'
}
