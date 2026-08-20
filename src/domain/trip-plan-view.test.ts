import { describe, expect, it } from 'vitest'

import { buildTripPlanView } from '@/domain/trip-plan-view'
import { tripPlanDocumentSchema } from '@/domain/trip-plan'

describe('Trip Plan view', () => {
  it('nests days under stops and resolves the shared overnight stay', () => {
    const document = tripPlanDocumentSchema.parse({
      schemaVersion: 2,
      travelers: [],
      stops: [
        {
          id: 'kyoto',
          position: 0,
          name: 'Kyoto',
          sourceIds: [],
        },
      ],
      days: [
        {
          id: 'day-1',
          stopId: 'kyoto',
          date: '2026-11-12',
          overnightStayId: 'ryokan',
          items: [],
          bookingIds: [],
          sourceIds: [],
        },
        {
          id: 'day-2',
          stopId: 'kyoto',
          date: '2026-11-13',
          overnightStayId: 'ryokan',
          items: [],
          bookingIds: [],
          sourceIds: [],
        },
      ],
      stays: [
        {
          id: 'ryokan',
          stopId: 'kyoto',
          title: 'Kyoto ryokan',
          bookingId: 'booking-1',
          sourceIds: [],
        },
      ],
      transports: [],
      bookings: [
        {
          id: 'booking-1',
          kind: 'stay',
          title: 'Kyoto ryokan',
          status: 'confirmed',
        },
      ],
      sources: [],
      constraints: [],
      decisions: [],
    })

    const view = buildTripPlanView(document)
    expect(view.stops[0]?.days).toHaveLength(2)
    expect(view.stops[0]?.days[0]?.overnightStay).toMatchObject({
      id: 'ryokan',
      booking: { id: 'booking-1', status: 'confirmed' },
    })
    expect(view.unassignedStays).toEqual([])
    expect(view.unlinkedBookings).toEqual([])
  })

  it('resolves links from stays that are not assigned to a night', () => {
    const document = tripPlanDocumentSchema.parse({
      schemaVersion: 2,
      travelers: [],
      stops: [{ id: 'kyoto', position: 0, name: 'Kyoto', sourceIds: [] }],
      days: [],
      stays: [
        {
          id: 'ryokan',
          stopId: 'kyoto',
          title: 'Kyoto ryokan',
          bookingId: 'booking-1',
          sourceIds: ['source-1'],
        },
      ],
      transports: [],
      bookings: [
        {
          id: 'booking-1',
          kind: 'stay',
          title: 'Kyoto ryokan',
          status: 'considering',
        },
      ],
      sources: [{ id: 'source-1', title: 'Ryokan website' }],
      constraints: [],
      decisions: [],
    })

    const view = buildTripPlanView(document)
    expect(view.unassignedStays[0]).toMatchObject({
      id: 'ryokan',
      booking: { id: 'booking-1' },
      sources: [{ id: 'source-1' }],
    })
    expect(view.unlinkedBookings).toEqual([])
    expect(view.unlinkedSources).toEqual([])
  })

  it('labels all transports leaving a stop as outbound', () => {
    const document = tripPlanDocumentSchema.parse({
      schemaVersion: 2,
      travelers: [],
      stops: [
        { id: 'a', position: 0, name: 'A', sourceIds: [] },
        { id: 'b', position: 1, name: 'B', sourceIds: [] },
        { id: 'c', position: 2, name: 'C', sourceIds: [] },
      ],
      days: [],
      stays: [],
      transports: [
        {
          id: 'a-to-c',
          kind: 'transport',
          fromStopId: 'a',
          toStopId: 'c',
          bookingIds: [],
          sourceIds: [],
        },
      ],
      bookings: [],
      sources: [],
      constraints: [],
      decisions: [],
    })

    expect(buildTripPlanView(document).stops[0]).toMatchObject({
      outboundTransports: [{ id: 'a-to-c', toStopId: 'c' }],
    })
  })
})
