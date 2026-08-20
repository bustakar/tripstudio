import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import type {
  StoredTripPlanDocument,
  TripPlanDocument,
  TripPlanDocumentV1,
} from '@/domain/trip-plan'

export const tripPlans = pgTable(
  'trip_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: text('owner_id').notNull(),
    version: integer('version').notNull().default(1),
    title: text('title').notNull(),
    startDate: text('start_date'),
    endDate: text('end_date'),
    status: text('status').notNull().default('active'),
    planningBrief: text('planning_brief').notNull().default(''),
    document: jsonb('document').$type<StoredTripPlanDocument>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('trip_plans_owner_updated_idx').on(table.ownerId, table.updatedAt),
  ],
)

export const tripPlanDocumentBackups = pgTable(
  'trip_plan_document_backups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripPlanId: uuid('trip_plan_id')
      .notNull()
      .references(() => tripPlans.id, { onDelete: 'cascade' }),
    fromSchemaVersion: integer('from_schema_version').notNull(),
    document: jsonb('document').$type<TripPlanDocumentV1>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('trip_plan_document_backups_plan_version_idx').on(
      table.tripPlanId,
      table.fromSchemaVersion,
    ),
  ],
)

export type StoredTripPlanRow = typeof tripPlans.$inferSelect
export type TripPlanRow = Omit<StoredTripPlanRow, 'document'> & {
  document: TripPlanDocument
}
