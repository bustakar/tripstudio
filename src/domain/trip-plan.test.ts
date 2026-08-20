import { describe, expect, it } from 'vitest'

import {
  createTripPlanInputSchema,
  emptyTripPlanDocument,
  migrateTripPlanDocumentV1,
  planningBriefMaxLength,
  tripPlanDocumentSchema,
  updateTripPlanInputSchema,
} from '@/domain/trip-plan'

describe('Trip Plan contract', () => {
  it('creates a sparse but structured project', () => {
    expect(createTripPlanInputSchema.parse({ title: 'Japan' })).toEqual({
      title: 'Japan',
      planningBrief: '',
    })
    expect(emptyTripPlanDocument()).toMatchObject({
      schemaVersion: 2,
      stops: [],
      days: [],
    })
  })

  it('bounds the unstructured planning brief', () => {
    expect(() =>
      createTripPlanInputSchema.parse({
        title: 'Japan',
        planningBrief: 'x'.repeat(planningBriefMaxLength + 1),
      }),
    ).toThrow()
  })

  it('requires a real versioned change', () => {
    expect(() =>
      updateTripPlanInputSchema.parse({
        id: '93a58652-8754-4e7d-b46f-9f475315f84d',
        expectedVersion: 1,
      }),
    ).toThrow('Provide at least one change')
  })

  it('keeps lifecycle separate from derived trip dates', () => {
    expect(
      updateTripPlanInputSchema.parse({
        id: '93a58652-8754-4e7d-b46f-9f475315f84d',
        expectedVersion: 1,
        status: 'archived',
      }).status,
    ).toBe('archived')
  })

  it('migrates v1 without dropping user-authored data', () => {
    const migrated = migrateTripPlanDocumentV1({
      schemaVersion: 1,
      travelers: [{ id: 't1', name: 'Karel', notes: 'Window seat' }],
      destinations: [
        { id: 'tokyo', name: 'Tokyo', country: 'Japan' },
        { id: 'kyoto', name: 'Kyoto', notes: 'Four nights' },
      ],
      itinerary: [
        {
          date: '2026-11-03',
          items: [
            {
              id: 'ueno',
              title: 'Explore Ueno',
              place: 'Tokyo',
              startTime: '10:00',
              notes: 'Keep it relaxed',
            },
          ],
        },
        {
          date: '2026-11-04',
          items: [{ id: 'museum', title: 'Museum', place: 'Ueno' }],
        },
      ],
      bookings: [
        {
          id: 'b1',
          kind: 'stay',
          title: 'Tokyo hotel',
          status: 'confirmed',
          reference: 'ABC',
        },
      ],
      sources: [
        { id: 's1', title: 'Tokyo guide', url: 'https://example.com/tokyo' },
      ],
      constraints: [{ id: 'c1', text: 'Avoid rushed mornings' }],
      decisions: [{ id: 'd1', text: 'Stay in Kyoto' }],
    })

    expect(migrated).toMatchObject({
      schemaVersion: 2,
      travelers: [{ id: 't1', name: 'Karel', notes: 'Window seat' }],
      stops: [
        { id: 'tokyo', name: 'Tokyo', position: 0 },
        { id: 'kyoto', name: 'Kyoto', position: 1, notes: 'Four nights' },
      ],
      days: [
        {
          id: 'migrated-day-1-2026-11-03',
          stopId: 'tokyo',
          items: [
            {
              id: 'ueno',
              kind: 'activity',
              title: 'Explore Ueno',
              place: 'Tokyo',
              startTime: '10:00',
              notes: 'Keep it relaxed',
            },
          ],
        },
        {
          id: 'migrated-day-2-2026-11-04',
          items: [{ id: 'museum', place: 'Ueno' }],
        },
      ],
      bookings: [{ id: 'b1', reference: 'ABC' }],
      sources: [{ id: 's1', url: 'https://example.com/tokyo' }],
      constraints: [{ id: 'c1', text: 'Avoid rushed mornings' }],
      decisions: [{ id: 'd1', text: 'Stay in Kyoto' }],
    })
  })

  it('rejects dangling v2 relationships', () => {
    expect(() =>
      tripPlanDocumentSchema.parse({
        ...emptyTripPlanDocument(),
        days: [
          {
            id: 'day-1',
            stopId: 'missing',
            date: '2026-11-03',
            items: [],
            bookingIds: [],
            sourceIds: [],
          },
        ],
      }),
    ).toThrow('Unknown stop missing')
  })

  it('validates stop ordering and source links', () => {
    const stop = {
      id: 'kyoto',
      position: 0,
      name: 'Kyoto',
      sourceIds: ['missing'],
    }

    expect(() =>
      tripPlanDocumentSchema.parse({
        ...emptyTripPlanDocument(),
        stops: [stop],
      }),
    ).toThrow('Unknown source missing')

    expect(() =>
      tripPlanDocumentSchema.parse({
        ...emptyTripPlanDocument(),
        stops: [
          { ...stop, sourceIds: [] },
          { ...stop, id: 'tokyo', name: 'Tokyo', sourceIds: [] },
        ],
      }),
    ).toThrow('Duplicate stop position 0')
  })
})
