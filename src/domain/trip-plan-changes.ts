import { z } from 'zod'

import {
  bookingSchema,
  constraintSchema,
  dayItemSchema,
  decisionSchema,
  planningBriefMaxLength,
  routeTransportSchema,
  sourceSchema,
  staySchema,
  stopSchema,
  travelerSchema,
  tripDaySchema,
  tripPlanDocumentSchema,
} from '@/domain/trip-plan'
import type { TripPlanDocument } from '@/domain/trip-plan'

const entityId = z.string().trim().min(1)

export const tripPlanChangeSchema = z.discriminatedUnion('operation', [
  z.object({ operation: z.literal('put_stop'), stop: stopSchema }),
  z.object({ operation: z.literal('put_day'), day: tripDaySchema }),
  z.object({
    operation: z.literal('put_day_item'),
    dayId: entityId,
    item: dayItemSchema,
  }),
  z.object({ operation: z.literal('put_stay'), stay: staySchema }),
  z.object({
    operation: z.literal('set_overnight_stay'),
    dayId: entityId,
    stayId: entityId.nullable(),
  }),
  z.object({
    operation: z.literal('put_transport'),
    transport: routeTransportSchema,
  }),
  z.object({ operation: z.literal('put_booking'), booking: bookingSchema }),
  z.object({ operation: z.literal('put_source'), source: sourceSchema }),
  z.object({ operation: z.literal('put_traveler'), traveler: travelerSchema }),
  z.object({
    operation: z.literal('put_constraint'),
    constraint: constraintSchema,
  }),
  z.object({ operation: z.literal('put_decision'), decision: decisionSchema }),
  z.object({
    operation: z.literal('remove_entity'),
    entity: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('stop'), id: entityId }),
      z.object({ kind: z.literal('day'), id: entityId }),
      z.object({ kind: z.literal('day_item'), id: entityId }),
      z.object({ kind: z.literal('stay'), id: entityId }),
      z.object({ kind: z.literal('transport'), id: entityId }),
      z.object({ kind: z.literal('booking'), id: entityId }),
      z.object({ kind: z.literal('source'), id: entityId }),
      z.object({ kind: z.literal('traveler'), id: entityId }),
      z.object({ kind: z.literal('constraint'), id: entityId }),
      z.object({ kind: z.literal('decision'), id: entityId }),
    ]),
  }),
])

export const applyTripPlanChangesInputSchema = z.object({
  id: z.uuid(),
  expectedVersion: z.number().int().positive(),
  planningBrief: z.string().max(planningBriefMaxLength).optional(),
  changes: z.array(tripPlanChangeSchema).min(1),
})

export type TripPlanChange = z.infer<typeof tripPlanChangeSchema>

function put<T extends { id: string }>(values: T[], value: T) {
  const index = values.findIndex(({ id }) => id === value.id)
  if (index === -1) values.push(value)
  else values[index] = value
}

function remove<T extends { id: string }>(values: T[], id: string) {
  const index = values.findIndex((value) => value.id === id)
  if (index === -1) throw new Error(`Entity ${id} was not found`)
  values.splice(index, 1)
}

function findDay(document: TripPlanDocument, dayId: string) {
  const day = document.days.find(({ id }) => id === dayId)
  if (!day) throw new Error(`Day ${dayId} was not found`)
  return day
}

export function applyTripPlanChanges(
  document: TripPlanDocument,
  changes: TripPlanChange[],
) {
  const next = structuredClone(document)

  for (const change of changes) {
    switch (change.operation) {
      case 'put_stop':
        put(next.stops, change.stop)
        break
      case 'put_day':
        put(next.days, change.day)
        break
      case 'put_day_item':
        put(findDay(next, change.dayId).items, change.item)
        break
      case 'put_stay':
        put(next.stays, change.stay)
        break
      case 'set_overnight_stay': {
        const day = findDay(next, change.dayId)
        if (change.stayId === null) delete day.overnightStayId
        else day.overnightStayId = change.stayId
        break
      }
      case 'put_transport':
        put(next.transports, change.transport)
        break
      case 'put_booking':
        put(next.bookings, change.booking)
        break
      case 'put_source':
        put(next.sources, change.source)
        break
      case 'put_traveler':
        put(next.travelers, change.traveler)
        break
      case 'put_constraint':
        put(next.constraints, change.constraint)
        break
      case 'put_decision':
        put(next.decisions, change.decision)
        break
      case 'remove_entity':
        switch (change.entity.kind) {
          case 'stop':
            remove(next.stops, change.entity.id)
            break
          case 'day':
            remove(next.days, change.entity.id)
            break
          case 'day_item': {
            const day = next.days.find(({ items }) =>
              items.some(({ id }) => id === change.entity.id),
            )
            if (!day)
              throw new Error(`Entity ${change.entity.id} was not found`)
            remove(day.items, change.entity.id)
            break
          }
          case 'stay':
            remove(next.stays, change.entity.id)
            break
          case 'transport':
            remove(next.transports, change.entity.id)
            break
          case 'booking':
            remove(next.bookings, change.entity.id)
            break
          case 'source':
            remove(next.sources, change.entity.id)
            break
          case 'traveler':
            remove(next.travelers, change.entity.id)
            break
          case 'constraint':
            remove(next.constraints, change.entity.id)
            break
          case 'decision':
            remove(next.decisions, change.entity.id)
            break
        }
        break
    }
  }

  return tripPlanDocumentSchema.parse(next)
}
