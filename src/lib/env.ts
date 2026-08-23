import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const isVercel = process.env.VERCEL === '1'
const requiresBilling = isVercel && process.env.TRIPSTUDIO_PR_PREVIEW !== '1'

const stripeSecret = requiresBilling
  ? z.string().startsWith('sk_')
  : z.string().default('sk_test_development')

const stripeWebhookSecret = requiresBilling
  ? z.string().startsWith('whsec_')
  : z.string().default('whsec_development')

const stripePrice = requiresBilling
  ? z.string().startsWith('price_')
  : z.string().default('price_development')

const previewUrl =
  process.env.TRIPSTUDIO_PR_PREVIEW === '1' && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined

export const env = createEnv({
  server: {
    APP_URL: isVercel ? z.url() : z.url().default('http://localhost:3000'),
    BETTER_AUTH_SECRET: isVercel
      ? z.string().min(32)
      : z
          .string()
          .min(32)
          .default('development-secret-change-before-deploying'),
    DATABASE_URL: isVercel
      ? z.url()
      : z.url().default('postgres://localhost/tripstudio'),
    STRIPE_SECRET_KEY: stripeSecret,
    STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
    STRIPE_ANNUAL_PRICE_ID: stripePrice,
  },
  runtimeEnvStrict: {
    APP_URL: previewUrl ?? process.env.APP_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_ANNUAL_PRICE_ID: process.env.STRIPE_ANNUAL_PRICE_ID,
  },
  emptyStringAsUndefined: true,
})
export const mcpResource = new URL('/mcp', env.APP_URL).toString()
