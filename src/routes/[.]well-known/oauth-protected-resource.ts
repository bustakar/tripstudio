import { createFileRoute } from '@tanstack/react-router'

import { auth } from '@/lib/auth'
import { env } from '@/lib/env'

export const Route = createFileRoute('/.well-known/oauth-protected-resource')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const target = new URL(
          '/.well-known/oauth-protected-resource',
          env.APP_URL,
        )
        return auth.handler(new Request(target, request))
      },
    },
  },
})
