import { and, desc, eq, lt, sql } from 'drizzle-orm'

import {
  emptyTripPlanDocument,
  normalizeTripPlanDocument,
  tripPlanDocumentV1Schema,
  tripPlanDocumentSchema,
  tripPlanSnapshotSchema,
} from '@/domain/trip-plan'
import type {
  CreateTripPlanInput,
  RestoreTripPlanRevisionInput,
  UpdateTripPlanInput,
} from '@/domain/trip-plan'
import {
  RevisionNotFoundError,
  VersionConflictError,
} from '@/domain/trip-plan-repository'
import type {
  TripPlanRepository,
  TripPlanRevisionPage,
} from '@/domain/trip-plan-repository'
import { db } from '@/lib/database'
import {
  tripPlanDocumentBackups,
  tripPlanMembers,
  tripPlanRevisions,
  tripPlans,
} from '@/lib/schema'
import type { StoredTripPlanRow, TripPlanRow } from '@/lib/schema'

function normalizeRow(row: StoredTripPlanRow): TripPlanRow {
  return { ...row, document: normalizeTripPlanDocument(row.document) }
}

const revisionPageSize = 20

function canAccess(userId: string) {
  return sql<boolean>`(
    ${tripPlans.ownerId} = ${userId}
    OR EXISTS (
      SELECT 1 FROM ${tripPlanMembers}
      WHERE ${tripPlanMembers.tripPlanId} = ${tripPlans.id}
        AND ${tripPlanMembers.userId} = ${userId}
    )
  )`
}

const revisionSummaryColumns = {
  id: tripPlanRevisions.id,
  tripPlanId: tripPlanRevisions.tripPlanId,
  version: tripPlanRevisions.version,
  title: sql<string>`${tripPlanRevisions.snapshot}->>'title'`,
  createdAt: tripPlanRevisions.createdAt,
}

function pageFromRows(
  rows: Array<{
    id: string
    tripPlanId: string
    version: number
    title: string
    createdAt: Date
  }>,
): TripPlanRevisionPage {
  const revisions = rows.slice(0, revisionPageSize)
  return {
    revisions,
    nextBeforeVersion:
      rows.length > revisionPageSize
        ? revisions[revisions.length - 1].version
        : null,
  }
}

export class PostgresTripPlanRepository implements TripPlanRepository {
  async list(userId: string) {
    const plans = await db
      .select()
      .from(tripPlans)
      .where(canAccess(userId))
      .orderBy(desc(tripPlans.updatedAt))
    return plans.map(normalizeRow)
  }

  async get(userId: string, id: string) {
    const plans = await db
      .select()
      .from(tripPlans)
      .where(and(eq(tripPlans.id, id), canAccess(userId)))
      .limit(1)
    return plans.length === 0 ? null : normalizeRow(plans[0])
  }

  async create(ownerId: string, input: CreateTripPlanInput) {
    const plans = await db
      .insert(tripPlans)
      .values({
        ownerId,
        title: input.title,
        planningBrief: input.planningBrief,
        startDate: input.startDate,
        endDate: input.endDate,
        document: normalizeTripPlanDocument(
          input.document ?? emptyTripPlanDocument(),
        ),
      })
      .returning()
    if (plans.length !== 1) throw new Error('Trip plan was not created')
    return normalizeRow(plans[0])
  }

  async update(userId: string, input: UpdateTripPlanInput) {
    const { id, expectedVersion, ...changes } = input
    return db.transaction(async (transaction) => {
      const current = await transaction
        .select({ document: tripPlans.document })
        .from(tripPlans)
        .where(
          and(
            eq(tripPlans.id, id),
            canAccess(userId),
            eq(tripPlans.version, expectedVersion),
          ),
        )
        .for('update')
        .limit(1)
      if (current.length === 0) throw new VersionConflictError()

      const document = changes.document
        ? tripPlanDocumentSchema.parse(
            normalizeTripPlanDocument(changes.document),
          )
        : undefined

      if (document && current[0].document.schemaVersion === 1) {
        await transaction
          .insert(tripPlanDocumentBackups)
          .values({
            tripPlanId: id,
            fromSchemaVersion: 1,
            document: tripPlanDocumentV1Schema.parse(current[0].document),
          })
          .onConflictDoNothing()
      }

      const plans = await transaction
        .update(tripPlans)
        .set({
          ...changes,
          document,
          version: sql`${tripPlans.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tripPlans.id, id),
            canAccess(userId),
            eq(tripPlans.version, expectedVersion),
          ),
        )
        .returning()
      if (plans.length === 0) throw new VersionConflictError()
      return normalizeRow(plans[0])
    })
  }

  async getWithRevisionHistory(userId: string, id: string) {
    return db.transaction(
      async (transaction) => {
        const plans = await transaction
          .select()
          .from(tripPlans)
          .where(and(eq(tripPlans.id, id), canAccess(userId)))
          .limit(1)
        if (plans.length === 0)
          return { plan: null, revisions: [], nextBeforeVersion: null }

        const rows = await transaction
          .select(revisionSummaryColumns)
          .from(tripPlanRevisions)
          .where(eq(tripPlanRevisions.tripPlanId, id))
          .orderBy(desc(tripPlanRevisions.version))
          .limit(revisionPageSize + 1)

        return { plan: normalizeRow(plans[0]), ...pageFromRows(rows) }
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    )
  }

  async listRevisions(userId: string, id: string, beforeVersion?: number) {
    const access = and(eq(tripPlans.id, id), canAccess(userId))
    const rows = await db
      .select(revisionSummaryColumns)
      .from(tripPlanRevisions)
      .innerJoin(tripPlans, eq(tripPlanRevisions.tripPlanId, tripPlans.id))
      .where(
        beforeVersion
          ? and(access, lt(tripPlanRevisions.version, beforeVersion))
          : access,
      )
      .orderBy(desc(tripPlanRevisions.version))
      .limit(revisionPageSize + 1)
    return pageFromRows(rows)
  }

  async getRevision(userId: string, id: string, version: number) {
    const revisions = await db
      .select({
        id: tripPlanRevisions.id,
        tripPlanId: tripPlanRevisions.tripPlanId,
        version: tripPlanRevisions.version,
        snapshot: tripPlanRevisions.snapshot,
        createdAt: tripPlanRevisions.createdAt,
      })
      .from(tripPlanRevisions)
      .innerJoin(tripPlans, eq(tripPlanRevisions.tripPlanId, tripPlans.id))
      .where(
        and(
          eq(tripPlans.id, id),
          canAccess(userId),
          eq(tripPlanRevisions.version, version),
        ),
      )
      .limit(1)
    if (revisions.length === 0) return null
    return {
      ...revisions[0],
      snapshot: tripPlanSnapshotSchema.parse(revisions[0].snapshot),
    }
  }

  async restoreRevision(userId: string, input: RestoreTripPlanRevisionInput) {
    return db.transaction(async (transaction) => {
      const current = await transaction
        .select({ document: tripPlans.document })
        .from(tripPlans)
        .where(
          and(
            eq(tripPlans.id, input.id),
            canAccess(userId),
            eq(tripPlans.version, input.expectedVersion),
          ),
        )
        .for('update')
        .limit(1)
      if (current.length === 0) throw new VersionConflictError()

      const revisions = await transaction
        .select({ snapshot: tripPlanRevisions.snapshot })
        .from(tripPlanRevisions)
        .where(
          and(
            eq(tripPlanRevisions.tripPlanId, input.id),
            eq(tripPlanRevisions.version, input.revisionVersion),
          ),
        )
        .limit(1)
      if (revisions.length === 0) throw new RevisionNotFoundError()

      const restored = tripPlanSnapshotSchema.parse(revisions[0].snapshot)
      const document = tripPlanDocumentSchema.parse(
        normalizeTripPlanDocument(restored.document),
      )

      if (current[0].document.schemaVersion === 1) {
        await transaction
          .insert(tripPlanDocumentBackups)
          .values({
            tripPlanId: input.id,
            fromSchemaVersion: 1,
            document: tripPlanDocumentV1Schema.parse(current[0].document),
          })
          .onConflictDoNothing()
      }

      const plans = await transaction
        .update(tripPlans)
        .set({
          ...restored,
          document,
          version: sql`${tripPlans.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tripPlans.id, input.id),
            canAccess(userId),
            eq(tripPlans.version, input.expectedVersion),
          ),
        )
        .returning()
      if (plans.length === 0) throw new VersionConflictError()
      return normalizeRow(plans[0])
    })
  }
}

export const tripPlanRepository = new PostgresTripPlanRepository()
