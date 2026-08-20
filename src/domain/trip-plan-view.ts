import type { TripPlanDocument } from '@/domain/trip-plan'

export function buildTripPlanView(document: TripPlanDocument) {
  const bookings = new Map(
    document.bookings.map((booking) => [booking.id, booking]),
  )
  const sources = new Map(document.sources.map((source) => [source.id, source]))
  const stays = new Map(document.stays.map((stay) => [stay.id, stay]))
  const linkedBookingIds = new Set<string>()
  const linkedSourceIds = new Set<string>()
  const linkedStayIds = new Set<string>()

  function resolveBookingIds(ids: string[]) {
    ids.forEach((id) => linkedBookingIds.add(id))
    return ids.flatMap((id) => {
      const booking = bookings.get(id)
      return booking ? [booking] : []
    })
  }

  function resolveSourceIds(ids: string[]) {
    ids.forEach((id) => linkedSourceIds.add(id))
    return ids.flatMap((id) => {
      const source = sources.get(id)
      return source ? [source] : []
    })
  }

  function resolveStay(id: string | undefined) {
    if (!id) return undefined
    linkedStayIds.add(id)
    const stay = stays.get(id)
    if (!stay) return undefined
    if (stay.bookingId) linkedBookingIds.add(stay.bookingId)
    return {
      ...stay,
      booking: stay.bookingId ? bookings.get(stay.bookingId) : undefined,
      sources: resolveSourceIds(stay.sourceIds),
    }
  }

  function resolveDay(day: TripPlanDocument['days'][number]) {
    return {
      ...day,
      overnightStay: resolveStay(day.overnightStayId),
      bookings: resolveBookingIds(day.bookingIds),
      sources: resolveSourceIds(day.sourceIds),
      items: day.items.map((item) => ({
        ...item,
        bookings: resolveBookingIds(item.bookingIds),
        sources: resolveSourceIds(item.sourceIds),
      })),
    }
  }

  function resolveTransport(transport: TripPlanDocument['transports'][number]) {
    return {
      ...transport,
      bookings: resolveBookingIds(transport.bookingIds),
      sources: resolveSourceIds(transport.sourceIds),
    }
  }

  const sortedStops = [...document.stops].sort(
    (left, right) => left.position - right.position,
  )
  const stops = sortedStops.map((stop) => ({
    ...stop,
    sources: resolveSourceIds(stop.sourceIds),
    days: document.days
      .filter((day) => day.stopId === stop.id)
      .sort((left, right) => left.date.localeCompare(right.date))
      .map(resolveDay),
    transportsToNext: document.transports
      .filter((transport) => transport.fromStopId === stop.id)
      .map(resolveTransport),
  }))

  const unassignedDays = document.days
    .filter((day) => !day.stopId)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map(resolveDay)
  const unassignedTransports = document.transports
    .filter((transport) => !transport.fromStopId)
    .map(resolveTransport)

  return {
    schemaVersion: document.schemaVersion,
    travelers: document.travelers,
    stops,
    unassignedDays,
    unassignedTransports,
    unassignedStays: document.stays.filter(
      (stay) => !linkedStayIds.has(stay.id),
    ),
    unlinkedBookings: document.bookings.filter(
      (booking) => !linkedBookingIds.has(booking.id),
    ),
    unlinkedSources: document.sources.filter(
      (source) => !linkedSourceIds.has(source.id),
    ),
    constraints: document.constraints,
    decisions: document.decisions,
  }
}
