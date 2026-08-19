import { createFileRoute } from '@tanstack/react-router'

import { handleMcpRequest } from '@/server/mcp'

export const Route = createFileRoute('/mcp')({
  server: {
    handlers: {
      POST: ({ request }) => handleMcpRequest(request),
    },
  },
})
