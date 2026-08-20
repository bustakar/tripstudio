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
})
