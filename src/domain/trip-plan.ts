import { z } from 'zod'

export const planningBriefMaxLength = 12_000

const nonEmptyText = z.string().trim().min(1)
const entityId = nonEmptyText
const date = z.iso.date()
// Planning often starts with values such as "morning" before an exact time exists.
const time = nonEmptyText
const ids = z.array(entityId)

export const travelerSchema = z.object({
  id: entityId,
  name: nonEmptyText,
  notes: z.string().optional(),
})
export const constraintSchema = z.object({ id: entityId, text: nonEmptyText })
export const decisionSchema = z.object({ id: entityId, text: nonEmptyText })

const bookingKindSchema = z.enum(['stay', 'transport', 'activity', 'other'])
const bookingStatusSchema = z.enum([
  'considering',
  'reserved',
  'confirmed',
  'cancelled',
])

export const bookingSchema = z.object({
  id: entityId,
  kind: bookingKindSchema,
  title: nonEmptyText,
  status: bookingStatusSchema,
  provider: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export const sourceSchema = z.object({
  id: entityId,
  title: nonEmptyText,
  url: z.string().url().optional(),
})

const linkedEntityFields = {
  bookingIds: ids,
  sourceIds: ids,
}

const transportModeSchema = z.enum([
  'walk',
  'bike',
  'car',
  'taxi',
  'bus',
  'train',
  'flight',
  'ferry',
  'other',
])

export const activitySchema = z.object({
  id: entityId,
  kind: z.literal('activity'),
  title: nonEmptyText,
  place: z.string().optional(),
  startTime: time.optional(),
  endTime: time.optional(),
  notes: z.string().optional(),
  ...linkedEntityFields,
})

export const transportSchema = z.object({
  id: entityId,
  kind: z.literal('transport'),
  title: z.string().optional(),
  mode: transportModeSchema.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  date: date.optional(),
  startTime: time.optional(),
  endTime: time.optional(),
  notes: z.string().optional(),
  ...linkedEntityFields,
})

export const routeTransportSchema = transportSchema.extend({
  fromStopId: entityId.optional(),
  toStopId: entityId.optional(),
})

export const dayItemSchema = z.discriminatedUnion('kind', [
  activitySchema,
  transportSchema,
])

export const stopSchema = z.object({
  id: entityId,
  position: z.number().int().nonnegative(),
  name: nonEmptyText,
  country: z.string().optional(),
  timezone: z.string().optional(),
  notes: z.string().optional(),
  sourceIds: ids,
})

export const staySchema = z.object({
  id: entityId,
  stopId: entityId,
  title: nonEmptyText,
  place: z.string().optional(),
  notes: z.string().optional(),
  bookingId: entityId.optional(),
  sourceIds: ids,
})

export const tripDaySchema = z.object({
  id: entityId,
  stopId: entityId.optional(),
  date,
  title: z.string().optional(),
  notes: z.string().optional(),
  overnightStayId: entityId.optional(),
  items: z.array(dayItemSchema),
  bookingIds: ids,
  sourceIds: ids,
})

function duplicateIds(values: string[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return duplicates
}

function addMissingReferenceIssue(
  context: z.RefinementCtx,
  path: PropertyKey[],
  kind: string,
  value: string,
) {
  context.addIssue({
    code: 'custom',
    path,
    message: `Unknown ${kind} ${value}`,
  })
}

export const tripPlanDocumentSchema = z
  .object({
    schemaVersion: z.literal(2),
    travelers: z.array(travelerSchema),
    stops: z.array(stopSchema),
    days: z.array(tripDaySchema),
    stays: z.array(staySchema),
    transports: z.array(routeTransportSchema),
    bookings: z.array(bookingSchema),
    sources: z.array(sourceSchema),
    constraints: z.array(constraintSchema),
    decisions: z.array(decisionSchema),
  })
  .superRefine((document, context) => {
    const stopIds = new Set(document.stops.map(({ id }) => id))
    const stayIds = new Set(document.stays.map(({ id }) => id))
    const bookingIds = new Set(document.bookings.map(({ id }) => id))
    const sourceIds = new Set(document.sources.map(({ id }) => id))

    for (const duplicate of duplicateIds(
      document.stops.map(({ position }) => String(position)),
    )) {
      context.addIssue({
        code: 'custom',
        path: ['stops'],
        message: `Duplicate stop position ${duplicate}`,
      })
    }

    const collections = [
      ['traveler', document.travelers.map(({ id }) => id)],
      ['stop', document.stops.map(({ id }) => id)],
      ['day', document.days.map(({ id }) => id)],
      ['stay', document.stays.map(({ id }) => id)],
      ['transport', document.transports.map(({ id }) => id)],
      ['booking', document.bookings.map(({ id }) => id)],
      ['source', document.sources.map(({ id }) => id)],
      ['constraint', document.constraints.map(({ id }) => id)],
      ['decision', document.decisions.map(({ id }) => id)],
      [
        'day item',
        document.days.flatMap(({ items }) => items.map(({ id }) => id)),
      ],
    ] as const

    for (const [kind, values] of collections) {
      for (const duplicate of duplicateIds(values)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate ${kind} id ${duplicate}`,
        })
      }
    }

    for (const [index, stay] of document.stays.entries()) {
      if (!stopIds.has(stay.stopId))
        addMissingReferenceIssue(
          context,
          ['stays', index, 'stopId'],
          'stop',
          stay.stopId,
        )
      if (stay.bookingId && !bookingIds.has(stay.bookingId))
        addMissingReferenceIssue(
          context,
          ['stays', index, 'bookingId'],
          'booking',
          stay.bookingId,
        )
      for (const sourceId of stay.sourceIds) {
        if (!sourceIds.has(sourceId))
          addMissingReferenceIssue(
            context,
            ['stays', index, 'sourceIds'],
            'source',
            sourceId,
          )
      }
    }

    for (const [index, stop] of document.stops.entries()) {
      for (const sourceId of stop.sourceIds) {
        if (!sourceIds.has(sourceId))
          addMissingReferenceIssue(
            context,
            ['stops', index, 'sourceIds'],
            'source',
            sourceId,
          )
      }
    }

    for (const [dayIndex, day] of document.days.entries()) {
      if (day.stopId && !stopIds.has(day.stopId))
        addMissingReferenceIssue(
          context,
          ['days', dayIndex, 'stopId'],
          'stop',
          day.stopId,
        )
      if (day.overnightStayId && !stayIds.has(day.overnightStayId))
        addMissingReferenceIssue(
          context,
          ['days', dayIndex, 'overnightStayId'],
          'stay',
          day.overnightStayId,
        )
      for (const bookingId of day.bookingIds) {
        if (!bookingIds.has(bookingId))
          addMissingReferenceIssue(
            context,
            ['days', dayIndex, 'bookingIds'],
            'booking',
            bookingId,
          )
      }
      for (const sourceId of day.sourceIds) {
        if (!sourceIds.has(sourceId))
          addMissingReferenceIssue(
            context,
            ['days', dayIndex, 'sourceIds'],
            'source',
            sourceId,
          )
      }

      for (const [itemIndex, item] of day.items.entries()) {
        for (const bookingId of item.bookingIds) {
          if (!bookingIds.has(bookingId))
            addMissingReferenceIssue(
              context,
              ['days', dayIndex, 'items', itemIndex, 'bookingIds'],
              'booking',
              bookingId,
            )
        }
        for (const sourceId of item.sourceIds) {
          if (!sourceIds.has(sourceId))
            addMissingReferenceIssue(
              context,
              ['days', dayIndex, 'items', itemIndex, 'sourceIds'],
              'source',
              sourceId,
            )
        }
      }
    }

    for (const [index, transport] of document.transports.entries()) {
      for (const [field, stopId] of [
        ['fromStopId', transport.fromStopId],
        ['toStopId', transport.toStopId],
      ] as const) {
        if (stopId && !stopIds.has(stopId))
          addMissingReferenceIssue(
            context,
            ['transports', index, field],
            'stop',
            stopId,
          )
      }
      for (const bookingId of transport.bookingIds) {
        if (!bookingIds.has(bookingId))
          addMissingReferenceIssue(
            context,
            ['transports', index, 'bookingIds'],
            'booking',
            bookingId,
          )
      }
      for (const sourceId of transport.sourceIds) {
        if (!sourceIds.has(sourceId))
          addMissingReferenceIssue(
            context,
            ['transports', index, 'sourceIds'],
            'source',
            sourceId,
          )
      }
    }
  })

export type TripPlanDocument = z.infer<typeof tripPlanDocumentSchema>
export type TripDay = TripPlanDocument['days'][number]
export type DayItem = TripDay['items'][number]

export const tripPlanDocumentV1Schema = z.object({
  schemaVersion: z.literal(1),
  travelers: z.array(travelerSchema),
  destinations: z.array(
    z.object({
      id: entityId,
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
          id: entityId,
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
      id: entityId,
      kind: bookingKindSchema,
      title: nonEmptyText,
      status: bookingStatusSchema,
      reference: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  constraints: z.array(constraintSchema),
  decisions: z.array(decisionSchema),
  sources: z.array(sourceSchema),
})

export type TripPlanDocumentV1 = z.infer<typeof tripPlanDocumentV1Schema>
export type StoredTripPlanDocument = TripPlanDocumentV1 | TripPlanDocument

function matchingStopId(
  document: TripPlanDocumentV1,
  day: TripPlanDocumentV1['itinerary'][number],
) {
  const stopsByName = new Map<string, string | null>()
  for (const destination of document.destinations) {
    const name = destination.name.trim().toLocaleLowerCase()
    stopsByName.set(name, stopsByName.has(name) ? null : destination.id)
  }

  const places = day.items.flatMap(({ place }) =>
    place?.trim() ? [place.trim().toLocaleLowerCase()] : [],
  )
  if (places.length === 0) return undefined

  const matches = places.map((place) => stopsByName.get(place))
  if (matches.some((match) => !match)) return undefined
  const uniqueMatches = new Set(matches)
  return uniqueMatches.size === 1 ? (matches[0] ?? undefined) : undefined
}

export function migrateTripPlanDocumentV1(
  input: TripPlanDocumentV1,
): TripPlanDocument {
  const document = tripPlanDocumentV1Schema.parse(input)
  return tripPlanDocumentSchema.parse({
    schemaVersion: 2,
    travelers: document.travelers,
    stops: document.destinations.map((destination, position) => ({
      ...destination,
      position,
      sourceIds: [],
    })),
    days: document.itinerary.map((day, index) => ({
      id: `migrated-day-${index + 1}-${day.date}`,
      stopId: matchingStopId(document, day),
      date: day.date,
      items: day.items.map((item) => ({
        ...item,
        kind: 'activity' as const,
        bookingIds: [],
        sourceIds: [],
      })),
      bookingIds: [],
      sourceIds: [],
    })),
    stays: [],
    transports: [],
    bookings: document.bookings,
    sources: document.sources,
    constraints: document.constraints,
    decisions: document.decisions,
  })
}

export function normalizeTripPlanDocument(input: unknown): TripPlanDocument {
  const version = z.object({ schemaVersion: z.number() }).parse(input)
  if (version.schemaVersion === 2) return tripPlanDocumentSchema.parse(input)
  if (version.schemaVersion === 1)
    return migrateTripPlanDocumentV1(tripPlanDocumentV1Schema.parse(input))
  throw new Error(`Unsupported trip document version ${version.schemaVersion}`)
}

export const emptyTripPlanDocument = (): TripPlanDocument => ({
  schemaVersion: 2,
  travelers: [],
  stops: [],
  days: [],
  stays: [],
  transports: [],
  bookings: [],
  sources: [],
  constraints: [],
  decisions: [],
})

const tripPlanDocumentInputSchema = z.union([
  tripPlanDocumentSchema,
  tripPlanDocumentV1Schema,
])

export const createTripPlanInputSchema = z.object({
  title: nonEmptyText.max(160),
  planningBrief: z.string().max(planningBriefMaxLength).default(''),
  startDate: date.optional(),
  endDate: date.optional(),
  document: tripPlanDocumentInputSchema.optional(),
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
    document: tripPlanDocumentInputSchema.optional(),
  })
  .refine(
    ({ id: _id, expectedVersion: _version, ...changes }) =>
      Object.keys(changes).length > 0,
    'Provide at least one change',
  )

export type CreateTripPlanInput = z.infer<typeof createTripPlanInputSchema>
export type UpdateTripPlanInput = z.infer<typeof updateTripPlanInputSchema>
