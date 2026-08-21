import { describe, expect, it } from 'vitest'

import { tripPlanDocumentSchema } from '@/domain/trip-plan'
import { buildTripPlanView } from '@/domain/trip-plan-view'
import {
  completePreviewTrip,
  previewTrips,
  previewUser,
  sparsePreviewTrip,
} from '@/server/preview-fixtures'

describe('preview fixtures', () => {
  it('provides public preview credentials and two valid trips', () => {
    expect(previewUser).toEqual({
      name: 'Preview User',
      email: 'preview@tripstudio.test',
      password: 'tripstudio-preview',
    })
    expect(previewTrips).toHaveLength(2)
    previewTrips.forEach((trip) =>
      expect(() => tripPlanDocumentSchema.parse(trip.document)).not.toThrow(),
    )
  })

  it('covers every enum and relationship presentation state', () => {
    const document = completePreviewTrip.document
    const allTransports = [
      ...document.transports,
      ...document.days.flatMap((day) =>
        day.items.filter((item) => item.kind === 'transport'),
      ),
    ]

    expect(
      new Set(allTransports.flatMap(({ mode }) => (mode ? [mode] : []))),
    ).toEqual(
      new Set([
        'walk',
        'bike',
        'car',
        'taxi',
        'bus',
        'train',
        'flight',
        'ferry',
        'other',
      ]),
    )
    expect(new Set(document.bookings.map(({ kind }) => kind))).toEqual(
      new Set(['stay', 'transport', 'activity', 'other']),
    )
    expect(new Set(document.bookings.map(({ status }) => status))).toEqual(
      new Set(['considering', 'reserved', 'confirmed', 'cancelled']),
    )

    const sharedStayDays = document.days.filter(
      ({ overnightStayId }) => overnightStayId === 'stay-kiso',
    )
    const view = buildTripPlanView(document)
    expect(sharedStayDays).toHaveLength(2)
    expect(view.unassignedDays).toHaveLength(1)
    expect(view.unassignedStays).toHaveLength(1)
    expect(view.unassignedTransports).toHaveLength(1)
    expect(view.unlinkedBookings).toHaveLength(1)
    expect(view.unlinkedSources).toHaveLength(1)
  })

  it('keeps the sparse trip intentionally sparse', () => {
    expect(sparsePreviewTrip).not.toHaveProperty('startDate')
    expect(sparsePreviewTrip).not.toHaveProperty('endDate')
    expect(sparsePreviewTrip.planningBrief).toBe('')
    expect(sparsePreviewTrip.document).toMatchObject({
      travelers: [],
      stays: [],
      transports: [],
      bookings: [],
      sources: [],
      constraints: [],
      decisions: [],
    })
    expect(sparsePreviewTrip.document.stops).toHaveLength(1)
    expect(sparsePreviewTrip.document.days).toHaveLength(1)
    expect(sparsePreviewTrip.document.days[0]?.items).toHaveLength(1)
  })
})
