import { and, count, eq, sql } from 'drizzle-orm'

import { activeTripLimitMessage, canActivateTrip } from '@/domain/trip-access'
import type { db } from '@/lib/database'
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

export class ActiveTripLimitError extends Error {
  constructor() {
    super(activeTripLimitMessage)
  }
}
