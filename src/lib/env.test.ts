import { afterEach, describe, expect, it, vi } from 'vitest'

describe('server environment', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('rejects missing Vercel secrets', async () => {
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('APP_URL', '')
    vi.stubEnv('BETTER_AUTH_SECRET', '')
    vi.stubEnv('DATABASE_URL', '')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(import('./env')).rejects.toThrow(
      'Invalid environment variables',
    )
  })

  it('uses the deployment URL for a PR preview', async () => {
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('TRIPSTUDIO_PR_PREVIEW', '1')
    vi.stubEnv('VERCEL_URL', 'preview.example.test')
    vi.stubEnv('BETTER_AUTH_SECRET', 'x'.repeat(32))
    vi.stubEnv('DATABASE_URL', 'postgres://localhost/tripstudio')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_example')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_example')
    vi.stubEnv('STRIPE_ANNUAL_PRICE_ID', 'price_example')

    const { env } = await import('./env')

    expect(env.APP_URL).toBe('https://preview.example.test')
  })

  it('rejects missing Stripe credentials in a PR preview', async () => {
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('TRIPSTUDIO_PR_PREVIEW', '1')
    vi.stubEnv('VERCEL_URL', 'preview.example.test')
    vi.stubEnv('BETTER_AUTH_SECRET', 'x'.repeat(32))
    vi.stubEnv('DATABASE_URL', 'postgres://localhost/tripstudio')
    vi.stubEnv('STRIPE_SECRET_KEY', '')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '')
    vi.stubEnv('STRIPE_ANNUAL_PRICE_ID', '')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(import('./env')).rejects.toThrow(
      'Invalid environment variables',
    )
  })

  it('rejects missing Stripe credentials in self-hosted production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('APP_URL', 'https://tripstudio.example.test')
    vi.stubEnv('BETTER_AUTH_SECRET', 'x'.repeat(32))
    vi.stubEnv('DATABASE_URL', 'postgres://localhost/tripstudio')
    vi.stubEnv('STRIPE_SECRET_KEY', '')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '')
    vi.stubEnv('STRIPE_ANNUAL_PRICE_ID', '')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(import('./env')).rejects.toThrow(
      'Invalid environment variables',
    )
  })
})
