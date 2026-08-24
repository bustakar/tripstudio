import { createServerFn } from '@tanstack/react-start'

import { formatRecurringPrice } from '@/domain/billing'
import { requireSession } from '@/lib/auth-functions'
import { stripeClient } from '@/lib/auth'
import { env } from '@/lib/env'

export const getProPlanPrice = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireSession()
    const price = await stripeClient.prices.retrieve(env.STRIPE_ANNUAL_PRICE_ID)
    if (
      !price.active ||
      price.type !== 'recurring' ||
      price.unit_amount === null ||
      price.recurring === null
    ) {
      throw new Error('The configured Pro price is unavailable.')
    }

    return formatRecurringPrice({
      currency: price.currency,
      unitAmount: price.unit_amount,
      interval: price.recurring.interval,
      intervalCount: price.recurring.interval_count,
    })
  },
)
