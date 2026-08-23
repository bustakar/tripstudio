export const activeTripLimitMessage =
  'Free accounts can have one active trip. Archive it or upgrade.'

export function canActivateTrip(input: {
  hasPaidAccess: boolean
  activeOwnedTripCount: number
}) {
  return input.hasPaidAccess || input.activeOwnedTripCount === 0
}
