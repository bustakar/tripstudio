import { cimd } from '@better-auth/cimd'
import { fetchClientMetadataResource } from '@better-auth/cimd/node'
import { mcp } from '@better-auth/mcp'
import { stripe } from '@better-auth/stripe'
import { betterAuth } from 'better-auth'
import { jwt } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import Stripe from 'stripe'

import { env, mcpResource } from '@/lib/env'
import { pool } from '@/lib/database'
import { reconcileFreeActiveTrips } from '@/server/trip-access'

const stripeClient = new Stripe(env.STRIPE_SECRET_KEY)

export const auth = betterAuth({
  appName: 'Trip Studio',
  baseURL: env.APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: pool,
  emailAndPassword: { enabled: true },
  plugins: [
    jwt(),
    mcp({
      loginPage: '/sign-in',
      consentPage: '/consent',
      resource: mcpResource,
      scopes: ['openid', 'profile', 'email', 'offline_access', 'mcp:tools'],
    }),
    cimd({
      fetchClientMetadataResource,
      metadataProfile: 'mcp-2026-07-28',
    }),
    stripe({
      stripeClient,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      subscription: {
        enabled: true,
        onSubscriptionUpdate: async ({ subscription }) => {
          if (
            subscription.status !== 'active' &&
            subscription.status !== 'trialing'
          ) {
            await reconcileFreeActiveTrips(subscription.referenceId)
          }
        },
        onSubscriptionDeleted: async ({ subscription }) => {
          await reconcileFreeActiveTrips(subscription.referenceId)
        },
        plans: [
          {
            name: 'pro',
            priceId: env.STRIPE_ANNUAL_PRICE_ID,
            limits: { activeTrips: 'unlimited' },
          },
        ],
      },
    }),
    tanstackStartCookies(),
  ],
})
