import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  createTripPlanInputSchema,
  updateTripPlanInputSchema,
} from '@/domain/trip-plan'
import { requireSession } from '@/lib/auth-functions'
import { tripPlanRepository } from '@/server/postgres-trip-plan-repository'

export const listTripPlans = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireSession()
    return tripPlanRepository.list(session.user.id)
  },
)

export const getTripPlan = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.uuid() }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    return tripPlanRepository.get(session.user.id, data.id)
  })

export const createTripPlan = createServerFn({ method: 'POST' })
  .validator(createTripPlanInputSchema)
  .handler(async ({ data }) => {
    const session = await requireSession()
    return tripPlanRepository.create(session.user.id, data)
  })

export const updateTripPlan = createServerFn({ method: 'POST' })
  .validator(updateTripPlanInputSchema)
  .handler(async ({ data }) => {
    const session = await requireSession()
    return tripPlanRepository.update(session.user.id, data)
  })
