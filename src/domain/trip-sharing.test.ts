import { describe, expect, it } from 'vitest'

import {
  createTripPlanInvitationInputSchema,
  invitationTokenSchema,
} from '@/domain/trip-sharing'

describe('trip sharing contract', () => {
  it('normalizes invitee emails', () => {
    expect(
      createTripPlanInvitationInputSchema.parse({
        tripPlanId: '93a58652-8754-4e7d-b46f-9f475315f84d',
        email: ' Wife@Example.COM ',
      }).email,
    ).toBe('wife@example.com')
  })

  it('accepts only complete base64url invitation tokens', () => {
    expect(() => invitationTokenSchema.parse('a'.repeat(43))).not.toThrow()
    expect(() => invitationTokenSchema.parse('too-short')).toThrow()
    expect(() => invitationTokenSchema.parse(`${'a'.repeat(42)}+`)).toThrow()
  })
})
