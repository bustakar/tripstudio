import { describe, expect, it } from 'vitest'

import { formatRecurringPrice } from '@/domain/billing'

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
  })
})
