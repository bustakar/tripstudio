import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'

import {
  activeTripIdsToArchive,
  activeTripLimitMessage,
  canActivateTrip,
} from '@/domain/trip-access'
import { db } from '@/lib/database'
import { tripPlans } from '@/lib/schema'

type Executor = Pick<typeof db, 'execute' | 'select'>

async function hasPaidAccess(executor: Executor, ownerId: string) {
  const result = await executor.execute<{ paid: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1
      FROM "subscription"
      WHERE "referenceId" = ${ownerId}
        AND "status" IN ('active', 'trialing')
    ) AS "paid"
  `)
  return result.rows[0]?.paid === true
}

export async function assertCanActivateTrip(
  executor: Executor,
  ownerId: string,
) {
  await executor.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${'trip-active:' + ownerId}, 0))`,
  )

  const [activeTrips] = await executor
    .select({ count: count() })
    .from(tripPlans)
    .where(and(eq(tripPlans.ownerId, ownerId), eq(tripPlans.status, 'active')))

  if (
    !canActivateTrip({
      hasPaidAccess: await hasPaidAccess(executor, ownerId),
      activeOwnedTripCount: activeTrips.count,
    })
  ) {
    throw new ActiveTripLimitError()
  }
}

export async function reconcileFreeActiveTrips(ownerId: string) {
  return db.transaction(async (transaction) => {
    await transaction.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${'trip-active:' + ownerId}, 0))`,
    )
    if (await hasPaidAccess(transaction, ownerId)) return []

    const activeTrips = await transaction
      .select({ id: tripPlans.id })
      .from(tripPlans)
      .where(
        and(eq(tripPlans.ownerId, ownerId), eq(tripPlans.status, 'active')),
      )
      .orderBy(desc(tripPlans.updatedAt), desc(tripPlans.id))
    const ids = activeTripIdsToArchive(activeTrips.map(({ id }) => id))
    if (ids.length === 0) return ids

    await transaction
      .update(tripPlans)
      .set({
        status: 'archived',
        version: sql`${tripPlans.version} + 1`,
        updatedAt: new Date(),
      })
      .where(inArray(tripPlans.id, ids))
    return ids
  })
}

export class ActiveTripLimitError extends Error {
  constructor() {
    super(activeTripLimitMessage)
  }
}
