import { describe, expect, it } from 'vitest'

import {
  billingStatusFromSubscriptions,
  formatRecurringPrice,
} from '@/domain/billing'

describe('billing', () => {
  it('formats the configured recurring Stripe price', () => {
    expect(
      formatRecurringPrice({
        currency: 'usd',
        unitAmount: 999,
        interval: 'year',
        intervalCount: 1,
      }),
    ).toBe('$9.99 / year')
    expect(
      formatRecurringPrice({
        currency: 'jpy',
        unitAmount: 1200,
        interval: 'month',
        intervalCount: 3,
      }),
    ).toBe('¥1,200 / 3 months')
    expect(
      formatRecurringPrice({
        currency: 'isk',
        unitAmount: 50_000,
        interval: 'year',
        intervalCount: 1,
      }),
    ).toBe('ISK 500 / year')
  })

  it('keeps existing Stripe customers on the management path', () => {
    expect(billingStatusFromSubscriptions([])).toBe('free')
    expect(billingStatusFromSubscriptions([{ status: 'past_due' }])).toBe(
      'manage',
    )
    expect(billingStatusFromSubscriptions([{ status: 'active' }])).toBe('pro')
  })
})
