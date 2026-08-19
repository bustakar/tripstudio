import { and, desc, eq, sql } from 'drizzle-orm'

import {
  emptyTripPlanDocument,
  tripPlanDocumentSchema,
} from '@/domain/trip-plan'
import type {
  CreateTripPlanInput,
  UpdateTripPlanInput,
} from '@/domain/trip-plan'
import { VersionConflictError } from '@/domain/trip-plan-repository'
import type { TripPlanRepository } from '@/domain/trip-plan-repository'
import { db } from '@/lib/database'
import { tripPlans } from '@/lib/schema'

export class PostgresTripPlanRepository implements TripPlanRepository {
  async list(ownerId: string) {
    return db
      .select()
      .from(tripPlans)
      .where(eq(tripPlans.ownerId, ownerId))
      .orderBy(desc(tripPlans.updatedAt))
  }

  async get(ownerId: string, id: string) {
    const plans = await db
      .select()
      .from(tripPlans)
      .where(and(eq(tripPlans.ownerId, ownerId), eq(tripPlans.id, id)))
      .limit(1)
    return plans.length === 0 ? null : plans[0]
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
        document: tripPlanDocumentSchema.parse(
          input.document ?? emptyTripPlanDocument(),
        ),
      })
      .returning()
    if (plans.length !== 1) throw new Error('Trip plan was not created')
    return plans[0]
  }

  async update(ownerId: string, input: UpdateTripPlanInput) {
    const { id, expectedVersion, ...changes } = input
    const plans = await db
      .update(tripPlans)
      .set({
        ...changes,
        document: changes.document
          ? tripPlanDocumentSchema.parse(changes.document)
          : undefined,
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
    return plans[0]
  }
}

export const tripPlanRepository = new PostgresTripPlanRepository()
