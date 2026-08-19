import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider'
import { createFileRoute } from '@tanstack/react-router'

import { auth } from '@/lib/auth'

export const handleOAuthAuthorizationServerMetadata =
  oauthProviderAuthServerMetadata(auth)

export const Route = createFileRoute(
  '/.well-known/oauth-authorization-server/api/auth',
)({
  server: {
    handlers: {
      GET: ({ request }) => handleOAuthAuthorizationServerMetadata(request),
    },
  },
})
