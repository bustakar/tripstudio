import { z } from 'zod'

const serverEnvironment = z.object({
  APP_URL: z.string().url().default('http://localhost:3000'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .default('development-secret-change-before-deploying'),
  DATABASE_URL: z.string().min(1).default('postgres://localhost/tripstudio'),
})

const previewUrl =
  process.env.TRIPSTUDIO_PR_PREVIEW === '1' && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined

export const env = serverEnvironment.parse({
  ...process.env,
  APP_URL: previewUrl ?? process.env.APP_URL,
})
export const mcpResource = new URL('/mcp', env.APP_URL).toString()
