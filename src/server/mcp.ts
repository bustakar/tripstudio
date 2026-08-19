import { createMcpHandler, McpServer } from '@modelcontextprotocol/server'
import { requireMcpAuth } from '@better-auth/mcp'
import { z } from 'zod'

import {
  createTripPlanInputSchema,
  updateTripPlanInputSchema,
} from '@/domain/trip-plan'
import { auth } from '@/lib/auth'
import { mcpResource } from '@/lib/env'
import { tripPlanRepository } from '@/server/postgres-trip-plan-repository'

function json(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

function toolResult(value: unknown) {
  const structuredContent = json(value)
  return {
    content: [
      { type: 'text' as const, text: JSON.stringify(structuredContent) },
    ],
    structuredContent,
  }
}

function createTripStudioServer(ownerId: string) {
  const server = new McpServer(
    { name: 'tripstudio', version: '1.0.0' },
    {
      instructions:
        "Trip Studio stores the user's evolving planning brief and confirmed structured trip data. Read the current project before updating it and use its version for optimistic concurrency.",
    },
  )

  server.registerTool(
    'list_trip_plans',
    {
      description: "List the current user's Trip Studio projects.",
      inputSchema: z.object({}),
    },
    async () => toolResult({ plans: await tripPlanRepository.list(ownerId) }),
  )

  server.registerTool(
    'get_trip_plan',
    {
      description:
        'Read one project, including its planning brief and structured trip document.',
      inputSchema: z.object({ id: z.uuid() }),
    },
    async ({ id }) => {
      const plan = await tripPlanRepository.get(ownerId, id)
      return plan
        ? toolResult({ plan })
        : {
            isError: true,
            content: [{ type: 'text', text: 'Project not found' }],
          }
    },
  )

  server.registerTool(
    'create_trip_plan',
    {
      description:
        'Create a project with an optional planning brief and structured trip document.',
      inputSchema: createTripPlanInputSchema,
    },
    async (input) =>
      toolResult({ plan: await tripPlanRepository.create(ownerId, input) }),
  )

  server.registerTool(
    'update_trip_plan',
    {
      description: 'Atomically update one current project version.',
      inputSchema: updateTripPlanInputSchema,
    },
    async (input) =>
      toolResult({ plan: await tripPlanRepository.update(ownerId, input) }),
  )

  return server
}

function subject(claims: { sub?: unknown }) {
  if (typeof claims.sub !== 'string' || claims.sub.length === 0)
    throw new Error('Access token has no subject')
  return claims.sub
}

export const handleMcpRequest = requireMcpAuth(
  auth,
  async (request, claims) => {
    const handler = createMcpHandler(
      () => createTripStudioServer(subject(claims)),
      { legacy: 'reject' },
    )
    return handler.fetch(request)
  },
  { resource: mcpResource, requiredScopes: ['mcp:tools'] },
)
