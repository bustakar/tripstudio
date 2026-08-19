import { describe, expect, it } from 'vitest'

import {
  oauthAuthorizationRedirect,
  postAuthRedirect,
} from '@/lib/post-auth-redirect'

describe('post-auth redirect', () => {
  it('resumes a signed OAuth authorization request', () => {
    expect(
      oauthAuthorizationRedirect(
        '?client_id=codex&scope=mcp%3Atools&sig=signed',
        'https://tripstudio.example',
      )?.toString(),
    ).toBe(
      'https://tripstudio.example/api/auth/oauth2/authorize?client_id=codex&scope=mcp%3Atools&sig=signed',
    )
    expect(
      oauthAuthorizationRedirect('?client_id=codex', 'https://example.com'),
    ).toBeNull()
  })

  it('accepts local redirects without allowing protocol-relative URLs', () => {
    expect(postAuthRedirect('?redirect=%2Fsettings')).toBe('/settings')
    expect(postAuthRedirect('?redirect=%2F%2Fexample.com')).toBe('/')
  })
})
