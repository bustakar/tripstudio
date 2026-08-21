import { createMcpHandler, McpServer } from '@modelcontextprotocol/server'
import { requireMcpAuth } from '@better-auth/mcp'
import { z } from 'zod'

import {
  createTripPlanInputSchema,
  restoreTripPlanRevisionInputSchema,
  updateTripPlanInputSchema,
} from '@/domain/trip-plan'
import {
  applyTripPlanChanges,
  applyTripPlanChangesInputSchema,
} from '@/domain/trip-plan-changes'
import { createTripPlanInvitationInputSchema } from '@/domain/trip-sharing'
import { buildTripPlanView } from '@/domain/trip-plan-view'
import { VersionConflictError } from '@/domain/trip-plan-repository'
import { auth } from '@/lib/auth'
import { mcpResource } from '@/lib/env'
import { tripPlanRepository } from '@/server/postgres-trip-plan-repository'
import { tripSharingRepository } from '@/server/trip-sharing-repository'

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

function agentPlan<
  T extends { document: Parameters<typeof buildTripPlanView>[0] },
>(plan: T) {
  const { document, ...project } = plan
  return { ...project, trip: buildTripPlanView(document) }
}

function createTripStudioServer(ownerId: string) {
  const server = new McpServer(
    { name: 'tripstudio', version: '1.0.0' },
    {
      instructions:
        "Trip Studio stores the user's evolving planning brief and confirmed structured trip data. Read the current project before updating it, use its version for optimistic concurrency, and prefer apply_trip_plan_changes for structured edits.",
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
        ? toolResult({ plan: agentPlan(plan) })
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
      toolResult({
        plan: agentPlan(await tripPlanRepository.create(ownerId, input)),
      }),
  )

  server.registerTool(
    'create_trip_plan_invitation',
    {
      description:
        'Create a seven-day, email-bound invitation link for a trip owned by the current user. Return the link to the user; Trip Studio does not deliver email yet.',
      inputSchema: createTripPlanInvitationInputSchema,
    },
    async (input) =>
      toolResult({
        invitation: await tripSharingRepository.createInvitation(
          ownerId,
          input,
        ),
      }),
  )

  server.registerTool(
    'update_trip_plan',
    {
      description:
        'Update project metadata or replace the complete advanced document. Prefer apply_trip_plan_changes for ordinary structured edits.',
      inputSchema: updateTripPlanInputSchema,
    },
    async (input) =>
      toolResult({
        plan: agentPlan(await tripPlanRepository.update(ownerId, input)),
      }),
  )

  server.registerTool(
    'apply_trip_plan_changes',
    {
      description:
        'Atomically put or remove individual trip entities in one current project version.',
      inputSchema: applyTripPlanChangesInputSchema,
    },
    async ({ id, expectedVersion, planningBrief, changes }) => {
      const plan = await tripPlanRepository.get(ownerId, id)
      if (!plan)
        return {
          isError: true,
          content: [{ type: 'text', text: 'Project not found' }],
        }
      if (plan.version !== expectedVersion) throw new VersionConflictError()

      return toolResult({
        plan: agentPlan(
          await tripPlanRepository.update(ownerId, {
            id,
            expectedVersion,
            planningBrief,
            document: applyTripPlanChanges(plan.document, changes),
          }),
        ),
      })
    },
  )

  server.registerTool(
    'list_trip_plan_revisions',
    {
      description:
        'List saved version summaries newest first, 20 at a time. Pass the returned nextBeforeVersion as beforeVersion to continue.',
      inputSchema: z.object({
        id: z.uuid(),
        beforeVersion: z.number().int().positive().optional(),
      }),
    },
    async ({ id, beforeVersion }) =>
      toolResult({
        ...(await tripPlanRepository.listRevisions(ownerId, id, beforeVersion)),
      }),
  )

  server.registerTool(
    'get_trip_plan_revision',
    {
      description:
        'Read the complete immutable snapshot for one saved version.',
      inputSchema: z.object({
        id: z.uuid(),
        revisionVersion: z.number().int().positive(),
      }),
    },
    async ({ id, revisionVersion }) => {
      const revision = await tripPlanRepository.getRevision(
        ownerId,
        id,
        revisionVersion,
      )
      return revision
        ? toolResult({ revision })
        : {
            isError: true,
            content: [{ type: 'text', text: 'Revision not found' }],
          }
    },
  )

  server.registerTool(
    'restore_trip_plan_revision',
    {
      description:
        'Restore a saved project version as a new current version without deleting later history.',
      inputSchema: restoreTripPlanRevisionInputSchema,
    },
    async (input) =>
      toolResult({
        plan: agentPlan(
          await tripPlanRepository.restoreRevision(ownerId, input),
        ),
      }),
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
