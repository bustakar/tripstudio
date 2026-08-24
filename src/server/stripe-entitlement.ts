import type Stripe from 'stripe'

import { pool } from '@/lib/database'
import { reconcileFreeActiveTrips } from '@/server/trip-access'

type SubscriptionEntitlementEvent =
  | Stripe.CustomerSubscriptionUpdatedEvent
  | Stripe.CustomerSubscriptionDeletedEvent

type EntitlementSubscription = Pick<
  Stripe.Subscription,
  'customer' | 'id' | 'metadata' | 'status'
>

function isSubscriptionEntitlementEvent(
  event: Stripe.Event,
): event is SubscriptionEntitlementEvent {
  return (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  )
}

async function findReferenceId(subscription: EntitlementSubscription) {
  const metadataReferenceId = subscription.metadata.referenceId
  if (metadataReferenceId) return metadataReferenceId

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id
  const result = await pool.query<{ referenceId: string }>(
    `
      SELECT "referenceId"
      FROM "subscription"
      WHERE "stripeSubscriptionId" = $1
      UNION ALL
      SELECT "id" AS "referenceId"
      FROM "user"
      WHERE "stripeCustomerId" = $2
      LIMIT 1
    `,
    [subscription.id, customerId],
  )
  return result.rows[0]?.referenceId
}

export async function reconcileStripeEntitlement(event: Stripe.Event) {
  if (!isSubscriptionEntitlementEvent(event)) return

  await reconcileStripeSubscription(event.data.object)
}

export async function reconcileStripeSubscription(
  subscription: EntitlementSubscription,
) {
  if (subscription.status === 'active' || subscription.status === 'trialing')
    return

  const referenceId = await findReferenceId(subscription)
  if (referenceId) await reconcileFreeActiveTrips(referenceId)
}
