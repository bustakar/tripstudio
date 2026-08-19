import { z } from 'zod'

const serverEnvironment = z.object({
  APP_URL: z.string().url().default('http://localhost:3000'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .default('development-secret-change-before-deploying'),
  DATABASE_URL: z.string().min(1).default('postgres://localhost/tripstudio'),
})

export const env = serverEnvironment.parse(process.env)
export const mcpResource = new URL('/mcp', env.APP_URL).toString()
