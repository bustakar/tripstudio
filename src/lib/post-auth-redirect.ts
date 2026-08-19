export function postAuthRedirect(search: string) {
  const params = new URLSearchParams(search)
  const redirect = params.get('redirect')

  if (redirect?.startsWith('/') && !redirect.startsWith('//')) return redirect
  if (params.has('client_id') && params.has('sig'))
    return `/api/auth/oauth2/authorize?${params}`
  return '/'
}
