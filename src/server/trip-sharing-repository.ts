import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, isNotNull, isNull, or } from 'drizzle-orm'

import type { CreateTripPlanInvitationInput } from '@/domain/trip-sharing'
import { db } from '@/lib/database'
import { env } from '@/lib/env'
import { tripPlanInvitations, tripPlanMembers, tripPlans } from '@/lib/schema'

const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1_000

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export class InvitationUnavailableError extends Error {
  constructor() {
    super(
      'This invitation is invalid, expired, or intended for another account.',
    )
  }
}

export class InvitationPermissionError extends Error {
  constructor() {
    super('Only the trip owner can invite collaborators.')
  }
}

export class TripSharingRepository {
  async createInvitation(
    invitedByUserId: string,
    input: CreateTripPlanInvitationInput,
  ) {
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + invitationLifetimeMs)

    return db.transaction(async (transaction) => {
      const plans = await transaction
        .select({ id: tripPlans.id, title: tripPlans.title })
        .from(tripPlans)
        .where(
          and(
            eq(tripPlans.id, input.tripPlanId),
            eq(tripPlans.ownerId, invitedByUserId),
          ),
        )
        .limit(1)
      if (plans.length === 0) throw new InvitationPermissionError()

      await transaction.insert(tripPlanInvitations).values({
        tripPlanId: input.tripPlanId,
        invitedByUserId,
        tokenHash: hashToken(token),
        expiresAt,
      })

      return {
        tripPlanId: input.tripPlanId,
        tripTitle: plans[0].title,
        expiresAt,
        inviteUrl: new URL(`/invitations/${token}`, env.APP_URL).toString(),
      }
    })
  }

  async getInvitation(userId: string, token: string) {
    const invitations = await db
      .select({
        tripPlanId: tripPlanInvitations.tripPlanId,
        tripTitle: tripPlans.title,
        expiresAt: tripPlanInvitations.expiresAt,
        acceptedAt: tripPlanInvitations.acceptedAt,
      })
      .from(tripPlanInvitations)
      .innerJoin(tripPlans, eq(tripPlanInvitations.tripPlanId, tripPlans.id))
      .where(
        and(
          eq(tripPlanInvitations.tokenHash, hashToken(token)),
          or(
            and(
              isNull(tripPlanInvitations.acceptedAt),
              gt(tripPlanInvitations.expiresAt, new Date()),
            ),
            and(
              isNotNull(tripPlanInvitations.acceptedAt),
              eq(tripPlanInvitations.acceptedByUserId, userId),
            ),
          ),
        ),
      )
      .limit(1)
    if (invitations.length === 0) return null
    const invitation = invitations[0]
    return { ...invitation, accepted: invitation.acceptedAt !== null }
  }

  async acceptInvitation(userId: string, token: string) {
    return db.transaction(async (transaction) => {
      const invitations = await transaction
        .select()
        .from(tripPlanInvitations)
        .where(eq(tripPlanInvitations.tokenHash, hashToken(token)))
        .for('update')
        .limit(1)
      if (invitations.length === 0) throw new InvitationUnavailableError()
      const invitation = invitations[0]

      if (
        (!invitation.acceptedAt && invitation.expiresAt <= new Date()) ||
        (invitation.acceptedAt && invitation.acceptedByUserId !== userId)
      )
        throw new InvitationUnavailableError()

      if (!invitation.acceptedAt) {
        await transaction
          .insert(tripPlanMembers)
          .values({ tripPlanId: invitation.tripPlanId, userId })
          .onConflictDoNothing()
        await transaction
          .update(tripPlanInvitations)
          .set({ acceptedAt: new Date(), acceptedByUserId: userId })
          .where(eq(tripPlanInvitations.id, invitation.id))
      }

      return { tripPlanId: invitation.tripPlanId }
    })
  }
}

export const tripSharingRepository = new TripSharingRepository()
