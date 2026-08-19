import { z } from 'zod'
import { describe, expect, it, vi } from 'vitest'

import { env } from '@/lib/env'
import { handleOAuthAuthorizationServerMetadata } from '@/routes/[.]well-known/oauth-authorization-server/api/auth'
import { handleMcpRequest } from '@/server/mcp'

vi.mock('@/lib/auth', () => {
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
  const issuer = new URL('/api/auth', appUrl).toString()

  return {
    auth: {
      $context: Promise.resolve({ baseURL: issuer, internalAdapter: {} }),
      api: {
        getOAuthServerConfig: async () => ({
          issuer,
          client_id_metadata_document_supported: true,
          token_endpoint_auth_methods_supported: ['none'],
          code_challenge_methods_supported: ['S256'],
        }),
      },
    },
  }
})

const metadataSchema = z.object({
  issuer: z.url(),
  client_id_metadata_document_supported: z.literal(true),
  token_endpoint_auth_methods_supported: z.array(z.string()),
  code_challenge_methods_supported: z.array(z.string()),
})

describe('OAuth authorization server metadata', () => {
  it('advertises protected resource metadata from the MCP endpoint', async () => {
    const response = await handleMcpRequest(
      new Request(new URL('/mcp', env.APP_URL)),
    )

    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toContain(
      `resource_metadata="${new URL('/.well-known/oauth-protected-resource/mcp', env.APP_URL)}"`,
    )
  })

  it('advertises CIMD at the issuer well-known URL', async () => {
    const response = await handleOAuthAuthorizationServerMetadata(
      new Request(
        new URL(
          '/.well-known/oauth-authorization-server/api/auth',
          env.APP_URL,
        ),
      ),
    )
    const metadata = metadataSchema.parse(await response.json())

    expect(response.status).toBe(200)
    expect(metadata.issuer).toBe(new URL('/api/auth', env.APP_URL).toString())
    expect(metadata.token_endpoint_auth_methods_supported).toContain('none')
    expect(metadata.code_challenge_methods_supported).toContain('S256')
  })
})
