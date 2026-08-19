import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const isVercel = process.env.VERCEL === '1'

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
  },
  runtimeEnvStrict: {
    APP_URL: previewUrl ?? process.env.APP_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  emptyStringAsUndefined: true,
})
export const mcpResource = new URL('/mcp', env.APP_URL).toString()
