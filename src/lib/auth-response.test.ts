import { describe, expect, it } from 'vitest'

import { followOAuthDocumentRedirect } from '@/lib/auth-response'

describe('auth response', () => {
  it('follows serialized OAuth redirects during browser navigation', async () => {
    const request = new Request(
      'https://tripstudio.example/api/auth/oauth2/authorize?client_id=chatgpt',
      { headers: { 'sec-fetch-dest': 'document' } },
    )
    const headers = new Headers({ 'content-type': 'application/json' })
    headers.append('set-cookie', 'oauth-state=one; Path=/; HttpOnly')
    headers.append('set-cookie', 'oauth-code=two; Path=/; HttpOnly')
    const response = new Response(
      JSON.stringify({ redirect: true, url: '/sign-in?signed=1' }),
      { headers },
    )

    const result = await followOAuthDocumentRedirect(request, response)

    expect(result.status).toBe(302)
    expect(result.headers.get('location')).toBe(
      'https://tripstudio.example/sign-in?signed=1',
    )
    expect(result.headers.getSetCookie()).toEqual([
      'oauth-state=one; Path=/; HttpOnly',
      'oauth-code=two; Path=/; HttpOnly',
    ])
    expect(result.headers.get('content-type')).toBeNull()
  })

  it('preserves redirect JSON for fetch clients', async () => {
    const request = new Request(
      'https://tripstudio.example/api/auth/oauth2/authorize',
      { headers: { 'sec-fetch-mode': 'cors' } },
    )
    const response = Response.json({ redirect: true, url: '/sign-in' })

    expect(await followOAuthDocumentRedirect(request, response)).toBe(response)
  })
})
