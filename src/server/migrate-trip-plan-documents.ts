import { pathToFileURL } from 'node:url'
import { and, eq, sql } from 'drizzle-orm'

import {
  migrateTripPlanDocumentV1,
  tripPlanDocumentV1Schema,
  tripPlanSnapshotSchema,
} from '@/domain/trip-plan'
import { db, pool } from '@/lib/database'
import {
  tripPlanDocumentBackups,
  tripPlanRevisions,
  tripPlans,
} from '@/lib/schema'
import { VersionConflictError } from '@/domain/trip-plan-repository'

export async function migrateTripPlanDocumentsV1() {
  const legacyPlans = await db
    .select()
    .from(tripPlans)
    .where(sql`${tripPlans.document}->>'schemaVersion' = '1'`)

  for (const plan of legacyPlans) {
    const legacyDocument = tripPlanDocumentV1Schema.parse(plan.document)
    const document = migrateTripPlanDocumentV1(legacyDocument)

    await db.transaction(async (transaction) => {
      await transaction
        .insert(tripPlanDocumentBackups)
        .values({
          tripPlanId: plan.id,
          fromSchemaVersion: 1,
          document: legacyDocument,
        })
        .onConflictDoNothing()

      const updated = await transaction
        .update(tripPlans)
        .set({
          document,
          version: sql`${tripPlans.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tripPlans.id, plan.id),
            eq(tripPlans.version, plan.version),
            sql`${tripPlans.document}->>'schemaVersion' = '1'`,
          ),
        )
        .returning()

      if (updated.length !== 1) throw new VersionConflictError()

      await transaction.insert(tripPlanRevisions).values({
        tripPlanId: updated[0].id,
        version: updated[0].version,
        snapshot: tripPlanSnapshotSchema.parse({
          title: updated[0].title,
          startDate: updated[0].startDate,
          endDate: updated[0].endDate,
          status: updated[0].status,
          planningBrief: updated[0].planningBrief,
          document: updated[0].document,
        }),
      })
    })
  }

  return { migrated: legacyPlans.length }
}

async function main() {
  try {
    const result = await migrateTripPlanDocumentsV1()
    process.stdout.write(`Migrated ${result.migrated} trip documents.\n`)
  } finally {
    await pool.end()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main()
