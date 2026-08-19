const oauthAuthorizePath = '/api/auth/oauth2/authorize'

type RedirectBody = {
  redirect: true
  url: string
}

function isRedirectBody(value: unknown): value is RedirectBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'redirect' in value &&
    value.redirect === true &&
    'url' in value &&
    typeof value.url === 'string'
  )
}

export async function followOAuthDocumentRedirect(
  request: Request,
  response: Response,
) {
  const isOAuthDocument =
    request.method === 'GET' &&
    new URL(request.url).pathname === oauthAuthorizePath &&
    request.headers.get('sec-fetch-dest') === 'document'
  if (!isOAuthDocument) return response
  if (!response.headers.get('content-type')?.includes('application/json'))
    return response

  const body: unknown = await response
    .clone()
    .json()
    .catch(() => null)
  if (!isRedirectBody(body)) return response

  const location = new URL(body.url, request.url)
  if (location.protocol !== 'http:' && location.protocol !== 'https:')
    return response

  const headers = new Headers(response.headers)
  headers.delete('content-length')
  headers.delete('content-type')
  headers.set('location', location.toString())
  return new Response(null, { status: 302, headers })
}
