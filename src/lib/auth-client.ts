import { oauthProviderClient } from '@better-auth/oauth-provider/client'
import { stripeClient } from '@better-auth/stripe/client'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  plugins: [oauthProviderClient(), stripeClient({ subscription: true })],
})
