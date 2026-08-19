import { describe, expect, it } from 'vitest'

import { postAuthRedirect } from '@/lib/post-auth-redirect'

describe('post-auth redirect', () => {
  it('resumes a signed OAuth authorization request', () => {
    expect(
      postAuthRedirect('?client_id=codex&scope=mcp%3Atools&sig=signed'),
    ).toBe(
      '/api/auth/oauth2/authorize?client_id=codex&scope=mcp%3Atools&sig=signed',
    )
  })

  it('accepts local redirects without allowing protocol-relative URLs', () => {
    expect(postAuthRedirect('?redirect=%2Fsettings')).toBe('/settings')
    expect(postAuthRedirect('?redirect=%2F%2Fexample.com')).toBe('/')
  })
})
