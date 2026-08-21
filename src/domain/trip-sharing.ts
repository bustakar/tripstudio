import { z } from 'zod'

export const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/)

export const createTripPlanInvitationInputSchema = z.object({
  tripPlanId: z.uuid(),
  email: z.string().trim().toLowerCase().pipe(z.email()),
})

export type CreateTripPlanInvitationInput = z.infer<
  typeof createTripPlanInvitationInputSchema
>
