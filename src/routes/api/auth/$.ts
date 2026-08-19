import { createFileRoute } from '@tanstack/react-router'

import { auth } from '@/lib/auth'
import { followOAuthDocumentRedirect } from '@/lib/auth-response'

async function handleAuthRequest(request: Request) {
  return followOAuthDocumentRedirect(request, await auth.handler(request))
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
})
