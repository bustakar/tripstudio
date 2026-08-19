import { cimd } from '@better-auth/cimd'
import { fetchClientMetadataResource } from '@better-auth/cimd/node'
import { mcp } from '@better-auth/mcp'
import { betterAuth } from 'better-auth'
import { jwt } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { env, mcpResource } from '@/lib/env'
import { pool } from '@/lib/database'

export const auth = betterAuth({
  appName: 'TripStudio',
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
    tanstackStartCookies(),
  ],
})
