import { describe, expect, it } from 'vitest'

import { followOAuthDocumentRedirect } from '@/lib/auth-response'

describe('auth response', () => {
  it('follows serialized OAuth redirects during browser navigation', async () => {
    const request = new Request(
      'https://tripstudio.example/api/auth/oauth2/authorize?client_id=chatgpt',
      { headers: { 'sec-fetch-dest': 'document' } },
    )
    const response = Response.json({ redirect: true, url: '/sign-in?signed=1' })

    const result = await followOAuthDocumentRedirect(request, response)

    expect(result.status).toBe(302)
    expect(result.headers.get('location')).toBe(
      'https://tripstudio.example/sign-in?signed=1',
    )
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
