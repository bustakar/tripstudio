import { z } from 'zod'

export const planningBriefMaxLength = 12_000

const nonEmptyText = z.string().trim().min(1)
const date = z.iso.date()

export const tripPlanDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  travelers: z.array(
    z.object({
      id: z.string(),
      name: nonEmptyText,
      notes: z.string().optional(),
    }),
  ),
  destinations: z.array(
    z.object({
      id: z.string(),
      name: nonEmptyText,
      country: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  itinerary: z.array(
    z.object({
      date,
      items: z.array(
        z.object({
          id: z.string(),
          title: nonEmptyText,
          place: z.string().optional(),
          startTime: z.string().optional(),
          notes: z.string().optional(),
        }),
      ),
    }),
  ),
  bookings: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['stay', 'transport', 'activity', 'other']),
      title: nonEmptyText,
      status: z.enum(['considering', 'reserved', 'confirmed', 'cancelled']),
      reference: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  constraints: z.array(z.object({ id: z.string(), text: nonEmptyText })),
  decisions: z.array(z.object({ id: z.string(), text: nonEmptyText })),
  sources: z.array(
    z.object({
      id: z.string(),
      title: nonEmptyText,
      url: z.string().url().optional(),
    }),
  ),
})

export type TripPlanDocument = z.infer<typeof tripPlanDocumentSchema>

export const emptyTripPlanDocument = (): TripPlanDocument => ({
  schemaVersion: 1,
  travelers: [],
  destinations: [],
  itinerary: [],
  bookings: [],
  constraints: [],
  decisions: [],
  sources: [],
})

export const createTripPlanInputSchema = z.object({
  title: nonEmptyText.max(160),
  planningBrief: z.string().max(planningBriefMaxLength).default(''),
  startDate: date.optional(),
  endDate: date.optional(),
  document: tripPlanDocumentSchema.optional(),
})

export const updateTripPlanInputSchema = z
  .object({
    id: z.uuid(),
    expectedVersion: z.number().int().positive(),
    title: nonEmptyText.max(160).optional(),
    planningBrief: z.string().max(planningBriefMaxLength).optional(),
    startDate: date.nullable().optional(),
    endDate: date.nullable().optional(),
    status: z.enum(['active', 'archived']).optional(),
    document: tripPlanDocumentSchema.optional(),
  })
  .refine(
    ({ id: _id, expectedVersion: _version, ...changes }) =>
      Object.keys(changes).length > 0,
    'Provide at least one change',
  )

export type CreateTripPlanInput = z.infer<typeof createTripPlanInputSchema>
export type UpdateTripPlanInput = z.infer<typeof updateTripPlanInputSchema>
