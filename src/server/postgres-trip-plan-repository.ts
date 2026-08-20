import { and, desc, eq, sql } from 'drizzle-orm'

import {
  emptyTripPlanDocument,
  normalizeTripPlanDocument,
  tripPlanDocumentV1Schema,
  tripPlanDocumentSchema,
} from '@/domain/trip-plan'
import type {
  CreateTripPlanInput,
  UpdateTripPlanInput,
} from '@/domain/trip-plan'
import { VersionConflictError } from '@/domain/trip-plan-repository'
import type { TripPlanRepository } from '@/domain/trip-plan-repository'
import { db } from '@/lib/database'
import { tripPlanDocumentBackups, tripPlans } from '@/lib/schema'
import type { StoredTripPlanRow, TripPlanRow } from '@/lib/schema'

function normalizeRow(row: StoredTripPlanRow): TripPlanRow {
  return { ...row, document: normalizeTripPlanDocument(row.document) }
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
      return normalizeRow(plans[0])
    })
  }
}

export const tripPlanRepository = new PostgresTripPlanRepository()
