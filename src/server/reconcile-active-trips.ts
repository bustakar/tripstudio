import { sql } from 'drizzle-orm'

import { db, pool } from '@/lib/database'
import { reconcileFreeActiveTrips } from '@/server/trip-access'

try {
  const candidates = await db.execute<{ ownerId: string }>(sql`
    SELECT "owner_id" AS "ownerId"
    FROM "trip_plans"
    WHERE "status" = 'active'
    GROUP BY "owner_id"
    HAVING COUNT(*) > 1
  `)

  let archived = 0
  for (const { ownerId } of candidates.rows) {
    archived += (await reconcileFreeActiveTrips(ownerId)).length
  }
  console.log(`Archived ${archived} excess active trip(s).`)
} finally {
  await pool.end()
}
