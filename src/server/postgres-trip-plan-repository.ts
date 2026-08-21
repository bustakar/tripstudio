import { and, desc, eq, sql } from 'drizzle-orm'

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
  TripPlanSnapshot,
  UpdateTripPlanInput,
} from '@/domain/trip-plan'
import {
  RevisionNotFoundError,
  VersionConflictError,
} from '@/domain/trip-plan-repository'
import type { TripPlanRepository } from '@/domain/trip-plan-repository'
import { db } from '@/lib/database'
import {
  tripPlanDocumentBackups,
  tripPlanRevisions,
  tripPlans,
} from '@/lib/schema'
import type { StoredTripPlanRow, TripPlanRow } from '@/lib/schema'

function normalizeRow(row: StoredTripPlanRow): TripPlanRow {
  return { ...row, document: normalizeTripPlanDocument(row.document) }
}

function snapshot(plan: TripPlanRow): TripPlanSnapshot {
  return {
    title: plan.title,
    startDate: plan.startDate,
    endDate: plan.endDate,
    status: plan.status === 'archived' ? 'archived' : 'active',
    planningBrief: plan.planningBrief,
    document: tripPlanDocumentSchema.parse(plan.document),
  }
}

export class PostgresTripPlanRepository implements TripPlanRepository {
  async list(ownerId: string) {
    const plans = await db
      .select()
      .from(tripPlans)
      .where(eq(tripPlans.ownerId, ownerId))
      .orderBy(desc(tripPlans.updatedAt))
    return plans.map(normalizeRow)
  }

  async get(ownerId: string, id: string) {
    const plans = await db
      .select()
      .from(tripPlans)
      .where(and(eq(tripPlans.ownerId, ownerId), eq(tripPlans.id, id)))
      .limit(1)
    return plans.length === 0 ? null : normalizeRow(plans[0])
  }

  async create(ownerId: string, input: CreateTripPlanInput) {
    return db.transaction(async (transaction) => {
      const plans = await transaction
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

      const plan = normalizeRow(plans[0])
      await transaction.insert(tripPlanRevisions).values({
        tripPlanId: plan.id,
        version: plan.version,
        snapshot: snapshot(plan),
      })
      return plan
    })
  }

  async update(ownerId: string, input: UpdateTripPlanInput) {
    const { id, expectedVersion, ...changes } = input
    return db.transaction(async (transaction) => {
      const current = await transaction
        .select({ document: tripPlans.document })
        .from(tripPlans)
        .where(
          and(
            eq(tripPlans.id, id),
            eq(tripPlans.ownerId, ownerId),
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
            eq(tripPlans.ownerId, ownerId),
            eq(tripPlans.version, expectedVersion),
          ),
        )
        .returning()
      if (plans.length === 0) throw new VersionConflictError()

      const plan = normalizeRow(plans[0])
      await transaction.insert(tripPlanRevisions).values({
        tripPlanId: plan.id,
        version: plan.version,
        snapshot: snapshot(plan),
      })
      return plan
    })
  }

  async listRevisions(ownerId: string, id: string) {
    return db
      .select({
        id: tripPlanRevisions.id,
        tripPlanId: tripPlanRevisions.tripPlanId,
        version: tripPlanRevisions.version,
        snapshot: tripPlanRevisions.snapshot,
        createdAt: tripPlanRevisions.createdAt,
      })
      .from(tripPlanRevisions)
      .innerJoin(tripPlans, eq(tripPlanRevisions.tripPlanId, tripPlans.id))
      .where(and(eq(tripPlans.id, id), eq(tripPlans.ownerId, ownerId)))
      .orderBy(desc(tripPlanRevisions.version))
  }

  async restoreRevision(ownerId: string, input: RestoreTripPlanRevisionInput) {
    return db.transaction(async (transaction) => {
      const current = await transaction
        .select({ document: tripPlans.document })
        .from(tripPlans)
        .where(
          and(
            eq(tripPlans.id, input.id),
            eq(tripPlans.ownerId, ownerId),
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
            eq(tripPlans.ownerId, ownerId),
            eq(tripPlans.version, input.expectedVersion),
          ),
        )
        .returning()
      if (plans.length === 0) throw new VersionConflictError()

      const plan = normalizeRow(plans[0])
      await transaction.insert(tripPlanRevisions).values({
        tripPlanId: plan.id,
        version: plan.version,
        snapshot: snapshot(plan),
      })
      return plan
    })
  }
}

export const tripPlanRepository = new PostgresTripPlanRepository()
