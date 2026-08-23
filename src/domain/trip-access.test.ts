import { describe, expect, it } from 'vitest'

import { canActivateTrip } from '@/domain/trip-access'

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
})
