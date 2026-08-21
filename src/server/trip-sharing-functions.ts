import { createServerFn } from '@tanstack/react-start'

import {
  createTripPlanInvitationInputSchema,
  invitationTokenSchema,
} from '@/domain/trip-sharing'
import { requireSession } from '@/lib/auth-functions'
import { tripSharingRepository } from '@/server/trip-sharing-repository'

export const createTripPlanInvitation = createServerFn({ method: 'POST' })
  .validator(createTripPlanInvitationInputSchema)
  .handler(async ({ data }) => {
    const session = await requireSession()
    return tripSharingRepository.createInvitation(session.user.id, data)
  })

export const getTripPlanInvitation = createServerFn({ method: 'GET' })
  .validator(invitationTokenSchema)
  .handler(async ({ data: token }) => {
    const session = await requireSession()
    return tripSharingRepository.getInvitation(session.user.id, token)
  })

export const acceptTripPlanInvitation = createServerFn({ method: 'POST' })
  .validator(invitationTokenSchema)
  .handler(async ({ data: token }) => {
    const session = await requireSession()
    return tripSharingRepository.acceptInvitation(session.user.id, token)
  })
