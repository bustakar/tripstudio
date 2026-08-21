import { pathToFileURL } from 'node:url'
import { eq } from 'drizzle-orm'

import {
  tripPlanDocumentSchema,
  tripPlanSnapshotSchema,
} from '@/domain/trip-plan'
import { auth } from '@/lib/auth'
import { db, pool } from '@/lib/database'
import { tripPlanRevisions, tripPlans } from '@/lib/schema'
import { previewTrips, previewUser } from '@/server/preview-fixtures'

function requirePreviewEnvironment() {
  if (process.env.TRIPSTUDIO_PR_PREVIEW !== '1')
    throw new Error(
      'Preview seeding requires TRIPSTUDIO_PR_PREVIEW=1 and an isolated database.',
    )
}

async function getOrCreatePreviewUser() {
  const existing = await pool.query<{ id: string }>(
    'select "id" from "user" where "email" = $1 limit 1',
    [previewUser.email],
  )
  if (existing.rows[0]) return existing.rows[0]

  const created = await auth.api.signUpEmail({ body: previewUser })
  return { id: created.user.id }
}

export async function seedPreview() {
  requirePreviewEnvironment()
  const user = await getOrCreatePreviewUser()
  const fixtures = previewTrips.map((trip) => ({
    ...trip,
    ownerId: user.id,
    document: tripPlanDocumentSchema.parse(trip.document),
  }))

  await db.transaction(async (transaction) => {
    await transaction.delete(tripPlans).where(eq(tripPlans.ownerId, user.id))
    const plans = await transaction
      .insert(tripPlans)
      .values(fixtures)
      .returning()
    await transaction.insert(tripPlanRevisions).values(
      plans.map((plan) => ({
        tripPlanId: plan.id,
        version: plan.version,
        snapshot: tripPlanSnapshotSchema.parse({
          title: plan.title,
          startDate: plan.startDate,
          endDate: plan.endDate,
          status: plan.status,
          planningBrief: plan.planningBrief,
          document: plan.document,
        }),
      })),
    )
  })

  const seeded = await db
    .select({ id: tripPlans.id })
    .from(tripPlans)
    .where(eq(tripPlans.ownerId, user.id))
  if (seeded.length !== fixtures.length)
    throw new Error(
      `Expected ${fixtures.length} preview trips, found ${seeded.length}.`,
    )

  return { email: previewUser.email, trips: seeded.length }
}

async function main() {
  try {
    const result = await seedPreview()
    process.stdout.write(
      `Seeded ${result.trips} preview trips for ${result.email}.\n`,
    )
  } finally {
    await pool.end()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main()
