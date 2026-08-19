import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import type { TripPlanDocument } from '@/domain/trip-plan'

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
    document: jsonb('document').$type<TripPlanDocument>().notNull(),
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

export type TripPlanRow = typeof tripPlans.$inferSelect
