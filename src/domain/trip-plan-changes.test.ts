import { describe, expect, it } from 'vitest'

import {
  applyTripPlanChanges,
  applyTripPlanChangesInputSchema,
} from '@/domain/trip-plan-changes'
import { emptyTripPlanDocument } from '@/domain/trip-plan'

describe('Trip Plan changes', () => {
  it('applies related changes atomically', () => {
    const document = applyTripPlanChanges(emptyTripPlanDocument(), [
      {
        operation: 'put_stop',
        stop: {
          id: 'kyoto',
          position: 0,
          name: 'Kyoto',
          timezone: 'Asia/Tokyo',
          sourceIds: [],
        },
      },
      {
        operation: 'put_stay',
        stay: {
          id: 'ryokan',
          stopId: 'kyoto',
          title: 'Kyoto ryokan',
          sourceIds: [],
        },
      },
      {
        operation: 'put_day',
        day: {
          id: 'day-1',
          stopId: 'kyoto',
          date: '2026-11-12',
          items: [],
          bookingIds: [],
          sourceIds: [],
        },
      },
      {
        operation: 'set_overnight_stay',
        dayId: 'day-1',
        stayId: 'ryokan',
      },
      {
        operation: 'put_day_item',
        dayId: 'day-1',
        item: {
          id: 'fushimi-inari',
          kind: 'activity',
          title: 'Fushimi Inari',
          startTime: '06:30',
          bookingIds: [],
          sourceIds: [],
        },
      },
    ])

    expect(document.days[0]).toMatchObject({
      overnightStayId: 'ryokan',
      items: [{ id: 'fushimi-inari' }],
    })
  })

  it('rejects a batch that leaves dangling references', () => {
    const document = applyTripPlanChanges(emptyTripPlanDocument(), [
      {
        operation: 'put_stop',
        stop: {
          id: 'kyoto',
          position: 0,
          name: 'Kyoto',
          sourceIds: [],
        },
      },
      {
        operation: 'put_day',
        day: {
          id: 'day-1',
          stopId: 'kyoto',
          date: '2026-11-12',
          items: [],
          bookingIds: [],
          sourceIds: [],
        },
      },
    ])

    expect(() =>
      applyTripPlanChanges(document, [
        {
          operation: 'remove_entity',
          entity: { kind: 'stop', id: 'kyoto' },
        },
      ]),
    ).toThrow('Unknown stop kyoto')
  })

  it('requires optimistic concurrency metadata', () => {
    expect(() =>
      applyTripPlanChangesInputSchema.parse({ id: crypto.randomUUID() }),
    ).toThrow()
  })

  it('edits planning entities without replacing the document', () => {
    const document = applyTripPlanChanges(emptyTripPlanDocument(), [
      {
        operation: 'put_traveler',
        traveler: { id: 'karel', name: 'Karel' },
      },
      {
        operation: 'put_constraint',
        constraint: { id: 'pace', text: 'Keep mornings relaxed' },
      },
      {
        operation: 'put_decision',
        decision: { id: 'route', text: 'Tokyo before Kyoto' },
      },
    ])

    expect(document).toMatchObject({
      travelers: [{ id: 'karel' }],
      constraints: [{ id: 'pace' }],
      decisions: [{ id: 'route' }],
    })
  })
})
