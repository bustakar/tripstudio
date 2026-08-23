import { describe, expect, it } from 'vitest'

import {
  activeTripIdsToArchive,
  activeTripLimitMessage,
  activeTripOwnerLimitMessage,
  canActivateTrip,
} from '@/domain/trip-access'
import { ActiveTripLimitError } from '@/server/trip-access'

describe('trip access', () => {
  it('allows one active trip during free access', () => {
    expect(
      canActivateTrip({ hasPaidAccess: false, activeOwnedTripCount: 0 }),
    ).toBe(true)
    expect(
      canActivateTrip({ hasPaidAccess: false, activeOwnedTripCount: 1 }),
    ).toBe(false)
  })

  it('allows unlimited active trips during paid access', () => {
    expect(
      canActivateTrip({ hasPaidAccess: true, activeOwnedTripCount: 12 }),
    ).toBe(true)
  })

  it('keeps the first ordered trip active when free access is reconciled', () => {
    expect(activeTripIdsToArchive(['newest', 'older', 'oldest'])).toEqual([
      'older',
      'oldest',
    ])
    expect(activeTripIdsToArchive(['only'])).toEqual([])
  })

  it('only offers the owner an upgrade for an active trip limit', () => {
    expect(new ActiveTripLimitError(true)).toMatchObject({
      message: activeTripLimitMessage,
      canUpgrade: true,
    })
    expect(new ActiveTripLimitError(false)).toMatchObject({
      message: activeTripOwnerLimitMessage,
      canUpgrade: false,
    })
  })
})
