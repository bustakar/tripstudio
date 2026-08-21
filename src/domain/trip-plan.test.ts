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

  it('retains legacy entities whose IDs were not unique', () => {
    const migrated = migrateTripPlanDocumentV1({
      schemaVersion: 1,
      travelers: [
        { id: 'traveler', name: 'Karel' },
        { id: 'traveler', name: 'Nikki' },
      ],
      destinations: [
        { id: 'stop', name: 'Tokyo' },
        { id: 'stop', name: 'Kyoto' },
      ],
      itinerary: [
        {
          date: '2026-11-03',
          items: [{ id: 'activity', title: 'Tokyo walk', place: 'Tokyo' }],
        },
        {
          date: '2026-11-04',
          items: [
            {
              id: 'activity',
              title: 'Kyoto walk',
              place: 'Kyoto',
              startTime: '',
            },
          ],
        },
      ],
      bookings: [
        {
          id: 'booking',
          kind: 'stay',
          title: 'Tokyo hotel',
          status: 'confirmed',
        },
        {
          id: 'booking',
          kind: 'stay',
          title: 'Kyoto hotel',
          status: 'confirmed',
        },
      ],
      sources: [
        { id: 'source', title: 'Tokyo guide' },
        { id: 'source', title: 'Kyoto guide' },
      ],
      constraints: [
        { id: 'constraint', text: 'One' },
        { id: 'constraint', text: 'Two' },
      ],
      decisions: [
        { id: 'decision', text: 'One' },
        { id: 'decision', text: 'Two' },
      ],
    })

    expect(new Set(migrated.travelers.map(({ id }) => id)).size).toBe(2)
    expect(new Set(migrated.stops.map(({ id }) => id)).size).toBe(2)
    expect(
      new Set(migrated.days.flatMap(({ items }) => items.map(({ id }) => id)))
        .size,
    ).toBe(2)
    expect(new Set(migrated.bookings.map(({ id }) => id)).size).toBe(2)
    expect(new Set(migrated.sources.map(({ id }) => id)).size).toBe(2)
    expect(new Set(migrated.constraints.map(({ id }) => id)).size).toBe(2)
    expect(new Set(migrated.decisions.map(({ id }) => id)).size).toBe(2)
    expect(migrated.days.map(({ stopId }) => stopId)).toEqual(
      migrated.stops.map(({ id }) => id),
    )
    expect(migrated.days[1]?.items[0]).not.toHaveProperty('startTime')
  })

  it('repairs blank IDs accepted by the legacy schema', () => {
    const migrated = migrateTripPlanDocumentV1({
      schemaVersion: 1,
      travelers: [{ id: '', name: 'Karel' }],
      destinations: [{ id: ' ', name: 'Tokyo' }],
      itinerary: [
        {
          date: '2026-11-03',
          items: [{ id: '', title: 'Tokyo walk', place: 'Tokyo' }],
        },
      ],
      bookings: [
        {
          id: ' ',
          kind: 'stay',
          title: 'Tokyo hotel',
          status: 'confirmed',
        },
      ],
      sources: [{ id: '', title: 'Tokyo guide' }],
      constraints: [{ id: ' ', text: 'Keep mornings relaxed' }],
      decisions: [{ id: '', text: 'Start in Tokyo' }],
    })

    const ids = [
      ...migrated.travelers,
      ...migrated.stops,
      ...migrated.days.flatMap(({ items }) => items),
      ...migrated.bookings,
      ...migrated.sources,
      ...migrated.constraints,
      ...migrated.decisions,
    ].map(({ id }) => id)
    expect(ids.every((id) => id.trim().length > 0)).toBe(true)
    expect(migrated.days[0]?.stopId).toBe(migrated.stops[0]?.id)
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

  it('rejects overnight stays belonging to another stop', () => {
    expect(() =>
      tripPlanDocumentSchema.parse({
        ...emptyTripPlanDocument(),
        stops: [
          { id: 'tokyo', position: 0, name: 'Tokyo', sourceIds: [] },
          { id: 'kyoto', position: 1, name: 'Kyoto', sourceIds: [] },
        ],
        days: [
          {
            id: 'day-1',
            stopId: 'tokyo',
            date: '2026-11-03',
            overnightStayId: 'kyoto-hotel',
            items: [],
            bookingIds: [],
            sourceIds: [],
          },
        ],
        stays: [
          {
            id: 'kyoto-hotel',
            stopId: 'kyoto',
            title: 'Kyoto hotel',
            sourceIds: [],
          },
        ],
      }),
    ).toThrow('Stay kyoto-hotel belongs to stop kyoto, not tokyo')
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
