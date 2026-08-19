import { describe, expect, it } from 'vitest'

import {
  createTripPlanInputSchema,
  emptyTripPlanDocument,
  planningBriefMaxLength,
  updateTripPlanInputSchema,
} from '@/domain/trip-plan'

describe('Trip Plan contract', () => {
  it('creates a sparse but structured project', () => {
    expect(createTripPlanInputSchema.parse({ title: 'Japan' })).toEqual({
      title: 'Japan',
      planningBrief: '',
    })
    expect(emptyTripPlanDocument()).toMatchObject({
      schemaVersion: 1,
      itinerary: [],
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
})
