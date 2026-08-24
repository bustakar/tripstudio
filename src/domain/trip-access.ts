export const activeTripLimitMessage =
  'Free accounts can have one active trip. Archive it before activating another.'
export const activeTripOwnerLimitMessage =
  'This trip owner has reached their active trip limit. Ask them to archive a trip before activating another.'

export function activeTripIdsToArchive(activeTripIds: string[]) {
  return activeTripIds.slice(1)
}

export function canActivateTrip(input: {
  hasPaidAccess: boolean
  activeOwnedTripCount: number
}) {
  return input.hasPaidAccess || input.activeOwnedTripCount === 0
}
