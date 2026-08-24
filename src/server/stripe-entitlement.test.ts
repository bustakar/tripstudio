import { beforeEach, describe, expect, it, vi } from 'vitest'

import { reconcileStripeSubscription } from '@/server/stripe-entitlement'

const mocks = vi.hoisted(() => ({
  query:
    vi.fn<
      (
        text: string,
        values: unknown[],
      ) => Promise<{ rows: Array<{ referenceId: string }> }>
    >(),
  reconcile:
    vi.fn<
      (
        ownerId: string,
        excludedStripeSubscriptionId: string,
      ) => Promise<string[]>
    >(),
}))

vi.mock('@/lib/database', () => ({ pool: { query: mocks.query } }))
vi.mock('@/server/trip-access', () => ({
  reconcileFreeActiveTrips: mocks.reconcile,
}))

describe('Stripe entitlement reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.reconcile.mockResolvedValue([])
  })

  it('reconciles a canceled subscription from its signed metadata', async () => {
    await reconcileStripeSubscription(
      {
        customer: 'cus_example',
        id: 'sub_example',
        metadata: { referenceId: 'user_example' },
        status: 'canceled',
      },
      {
        eventType: 'customer.subscription.deleted',
      },
    )

    expect(mocks.query).not.toHaveBeenCalled()
    expect(mocks.reconcile).toHaveBeenCalledWith('user_example', 'sub_example')
  })

  it('falls back to persisted Stripe references', async () => {
    mocks.query.mockResolvedValue({
      rows: [{ referenceId: 'user_example' }],
    })

    await reconcileStripeSubscription(
      {
        customer: 'cus_example',
        id: 'sub_example',
        metadata: {},
        status: 'unpaid',
      },
      {
        eventType: 'customer.subscription.updated',
        previousStatus: 'active',
      },
    )

    expect(mocks.query).toHaveBeenCalledWith(expect.any(String), [
      'sub_example',
      'cus_example',
    ])
    expect(mocks.reconcile).toHaveBeenCalledWith('user_example', 'sub_example')
  })

  it('propagates reconciliation failures so Stripe retries the event', async () => {
    mocks.reconcile.mockRejectedValue(new Error('database unavailable'))

    await expect(
      reconcileStripeSubscription(
        {
          customer: 'cus_example',
          id: 'sub_example',
          metadata: { referenceId: 'user_example' },
          status: 'canceled',
        },
        {
          eventType: 'customer.subscription.updated',
          previousStatus: 'trialing',
        },
      ),
    ).rejects.toThrow('database unavailable')
  })

  it('keeps active subscriptions entitled', async () => {
    await reconcileStripeSubscription(
      {
        customer: 'cus_example',
        id: 'sub_example',
        metadata: { referenceId: 'user_example' },
        status: 'active',
      },
      {
        eventType: 'customer.subscription.updated',
        previousStatus: 'incomplete',
      },
    )

    expect(mocks.query).not.toHaveBeenCalled()
    expect(mocks.reconcile).not.toHaveBeenCalled()
  })

  it('keeps failed first-time checkouts grandfathered', async () => {
    await reconcileStripeSubscription(
      {
        customer: 'cus_example',
        id: 'sub_example',
        metadata: { referenceId: 'user_example' },
        status: 'incomplete_expired',
      },
      {
        eventType: 'customer.subscription.updated',
        previousStatus: 'incomplete',
      },
    )

    expect(mocks.query).not.toHaveBeenCalled()
    expect(mocks.reconcile).not.toHaveBeenCalled()
  })
})
