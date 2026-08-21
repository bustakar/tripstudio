import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import type {
  StoredTripPlanDocument,
  TripPlanDocument,
  TripPlanDocumentV1,
  TripPlanSnapshot,
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

export const tripPlanMembers = pgTable(
  'trip_plan_members',
  {
    tripPlanId: uuid('trip_plan_id')
      .notNull()
      .references(() => tripPlans.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    role: text('role').notNull().default('editor'),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tripPlanId, table.userId] }),
    index('trip_plan_members_user_idx').on(table.userId),
  ],
)

export const tripPlanInvitations = pgTable(
  'trip_plan_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripPlanId: uuid('trip_plan_id')
      .notNull()
      .references(() => tripPlans.id, { onDelete: 'cascade' }),
    invitedByUserId: text('invited_by_user_id').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    acceptedByUserId: text('accepted_by_user_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('trip_plan_invitations_token_hash_idx').on(table.tokenHash),
    index('trip_plan_invitations_plan_idx').on(table.tripPlanId),
  ],
)

export const tripPlanRevisions = pgTable(
  'trip_plan_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripPlanId: uuid('trip_plan_id')
      .notNull()
      .references(() => tripPlans.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    snapshot: jsonb('snapshot').$type<TripPlanSnapshot>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('trip_plan_revisions_plan_version_idx').on(
      table.tripPlanId,
      table.version,
    ),
  ],
)

export type TripPlanRevisionRow = typeof tripPlanRevisions.$inferSelect
