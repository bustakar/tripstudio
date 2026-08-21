import {
  BedDouble,
  BookOpen,
  CalendarDays,
  CircleCheck,
  ExternalLink,
  MapPin,
  TicketCheck,
  TrainFront,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { TripPlanDocument } from '@/domain/trip-plan'
import { buildTripPlanView } from '@/domain/trip-plan-view'

export type TripDetailData = {
  title: string
  startDate: string | null
  endDate: string | null
  planningBrief: string
  document: TripPlanDocument
}

type TripView = ReturnType<typeof buildTripPlanView>
type StopView = TripView['stops'][number]
type DayView = StopView['days'][number]
type Booking = TripPlanDocument['bookings'][number]
type Source = TripPlanDocument['sources'][number]
type Stay = NonNullable<DayView['overnightStay']>
type Transport = StopView['outboundTransports'][number]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

function formatDay(value: string) {
  const date = new Date(`${value}T00:00:00Z`)
  return {
    weekday: new Intl.DateTimeFormat('en', {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(date),
    date: new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(date),
  }
}

function BookingBadges({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {bookings.map((booking) => (
        <Badge key={booking.id} variant="secondary">
          <TicketCheck /> {booking.title} · {booking.status}
        </Badge>
      ))}
    </div>
  )
}

function SourceLinks({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {sources.map((source) =>
        source.url ? (
          <a
            className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
            href={source.url}
            key={source.id}
            rel="noreferrer"
            target="_blank"
          >
            {source.title} <ExternalLink className="size-3" />
          </a>
        ) : (
          <span key={source.id}>{source.title}</span>
        ),
      )}
    </div>
  )
}

function StayRow({ stay }: { stay: Stay }) {
  return (
    <div className="grid gap-2 rounded-md border bg-muted/30 p-3">
      <div className="flex items-start gap-2">
        <BedDouble className="mt-0.5 size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Sleep at {stay.title}</p>
          {stay.place && (
            <p className="text-xs text-muted-foreground">{stay.place}</p>
          )}
        </div>
        {stay.booking && <Badge variant="outline">{stay.booking.status}</Badge>}
      </div>
      {stay.notes && (
        <p className="text-sm text-muted-foreground">{stay.notes}</p>
      )}
      <SourceLinks sources={stay.sources} />
    </div>
  )
}

function DayCard({ day }: { day: DayView }) {
  const formatted = formatDay(day.date)
  return (
    <Card className="gap-4 py-4 shadow-none">
      <CardHeader className="gap-1 px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{formatted.weekday}</Badge>
            <CardTitle className="text-sm">{formatted.date}</CardTitle>
          </div>
          {day.title && (
            <CardDescription className="text-foreground">
              {day.title}
            </CardDescription>
          )}
        </div>
        {day.notes && <CardDescription>{day.notes}</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-4 px-4">
        {day.items.length > 0 ? (
          <div className="grid gap-4">
            {day.items.map((item) => (
              <div
                className="grid gap-1 sm:grid-cols-[4.5rem_1fr]"
                key={item.id}
              >
                <div className="text-sm font-medium text-muted-foreground">
                  {item.startTime ?? 'Anytime'}
                </div>
                <div className="grid gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {item.kind === 'activity'
                        ? item.title
                        : item.title || item.mode || 'Local transport'}
                    </p>
                    {item.kind === 'transport' && (item.from || item.to) && (
                      <p className="text-sm text-muted-foreground">
                        {item.from ?? 'Origin not set'} →{' '}
                        {item.to ?? 'Destination not set'}
                      </p>
                    )}
                    {item.notes && (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <BookingBadges bookings={item.bookings} />
                  <SourceLinks sources={item.sources} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No plans yet.</p>
        )}
        <BookingBadges bookings={day.bookings} />
        <SourceLinks sources={day.sources} />
        {day.overnightStay && <StayRow stay={day.overnightStay} />}
      </CardContent>
    </Card>
  )
}

function TransportRow({
  transport,
  stopNames,
}: {
  transport: Transport
  stopNames: Map<string, string>
}) {
  const from = transport.fromStopId
    ? stopNames.get(transport.fromStopId)
    : transport.from
  const to = transport.toStopId
    ? stopNames.get(transport.toStopId)
    : transport.to
  return (
    <Card className="mx-3 gap-3 border-dashed bg-muted/30 py-4 shadow-none sm:mx-8">
      <CardHeader className="px-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="size-9 rounded-full p-0">
            <TrainFront />
          </Badge>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm">
              {transport.title || transport.mode || 'Travel'}
            </CardTitle>
            {(from || to) && (
              <CardDescription>
                {from ?? 'Origin not set'} → {to ?? 'Destination not set'}
              </CardDescription>
            )}
          </div>
          {(transport.date || transport.startTime) && (
            <Badge variant="outline">
              {transport.date ? formatDate(transport.date) : ''}
              {transport.date && transport.startTime ? ' · ' : ''}
              {transport.startTime ?? ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      {(transport.notes ||
        transport.bookings.length > 0 ||
        transport.sources.length > 0) && (
        <CardContent className="grid gap-2 px-4">
          {transport.notes && (
            <p className="text-sm text-muted-foreground">{transport.notes}</p>
          )}
          <BookingBadges bookings={transport.bookings} />
          <SourceLinks sources={transport.sources} />
        </CardContent>
      )}
    </Card>
  )
}

function StopCard({
  stop,
  possibleStays,
}: {
  stop: StopView
  possibleStays: TripView['unassignedStays']
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <MapPin className="size-5" /> {stop.name}
        </CardTitle>
        <CardDescription>
          {stop.days.length} {stop.days.length === 1 ? 'day' : 'days'}
          {stop.country ? ` · ${stop.country}` : ''}
        </CardDescription>
        <SourceLinks sources={stop.sources} />
      </CardHeader>
      <CardContent className="grid gap-4">
        {stop.notes && (
          <p className="text-sm text-muted-foreground">{stop.notes}</p>
        )}
        {stop.days.map((day) => (
          <DayCard day={day} key={day.id} />
        ))}
        {possibleStays.length > 0 && (
          <div className="grid gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Stay not assigned to a night
            </p>
            {possibleStays.map((stay) => (
              <StayRow key={stay.id} stay={stay} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TripOverview({ trip }: { trip: TripDetailData }) {
  const confirmed = trip.document.bookings.filter(
    ({ status }) => status === 'confirmed',
  ).length
  return (
    <Card className="gap-5">
      <CardHeader>
        <CardDescription>Trip plan</CardDescription>
        <CardTitle className="text-3xl tracking-tight sm:text-4xl">
          {trip.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {(trip.startDate || trip.endDate) && (
          <Badge variant="secondary">
            <CalendarDays />
            {trip.startDate ? formatDate(trip.startDate) : 'Start not set'}
            {trip.endDate && trip.endDate !== trip.startDate
              ? ` – ${formatDate(trip.endDate)}`
              : ''}
          </Badge>
        )}
        {trip.document.travelers.length > 0 && (
          <Badge variant="secondary">
            <Users />
            {trip.document.travelers.map(({ name }) => name).join(', ')}
          </Badge>
        )}
        {trip.document.stops.length > 0 && (
          <Badge variant="secondary">
            <MapPin /> {trip.document.stops.length}{' '}
            {trip.document.stops.length === 1 ? 'stop' : 'stops'}
          </Badge>
        )}
        {trip.document.bookings.length > 0 && (
          <Badge variant="secondary">
            <TicketCheck /> {trip.document.bookings.length}{' '}
            {trip.document.bookings.length === 1 ? 'booking' : 'bookings'}
            {confirmed > 0 ? ` · ${confirmed} confirmed` : ''}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

function Constraints({ document }: { document: TripPlanDocument }) {
  if (document.constraints.length === 0) return null
  return (
    <Card className="gap-4 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4" /> Keep in mind
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {document.constraints.map(({ id, text }) => (
          <p key={id}>• {text}</p>
        ))}
      </CardContent>
    </Card>
  )
}

function Decisions({ document }: { document: TripPlanDocument }) {
  if (document.decisions.length === 0) return null
  return (
    <Card className="gap-4 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CircleCheck className="size-4" /> Decisions
        </CardTitle>
        <CardDescription>Choices already made for this trip.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {document.decisions.map(({ id, text }) => (
          <p key={id}>• {text}</p>
        ))}
      </CardContent>
    </Card>
  )
}

function UnlinkedDetails({
  view,
  planningBrief,
}: {
  view: TripView
  planningBrief: string
}) {
  const hasUnlinked =
    view.unlinkedBookings.length > 0 ||
    view.unlinkedSources.length > 0 ||
    view.unassignedTransports.length > 0
  if (!hasUnlinked && !planningBrief.trim()) return null
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {planningBrief.trim() && (
        <Card className="gap-4 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Trip notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {planningBrief}
            </p>
          </CardContent>
        </Card>
      )}
      {hasUnlinked && (
        <Card className="gap-4 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Not linked yet</CardTitle>
            <CardDescription>
              Details saved to this trip but not assigned to a place or day.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <BookingBadges bookings={view.unlinkedBookings} />
            <SourceLinks sources={view.unlinkedSources} />
            {view.unassignedTransports.map((transport) => (
              <p className="text-sm" key={transport.id}>
                {transport.title || transport.mode || 'Transport'}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function TripDetail({ trip }: { trip: TripDetailData }) {
  const view = buildTripPlanView(trip.document)
  const stopNames = new Map(view.stops.map((stop) => [stop.id, stop.name]))
  return (
    <article className="min-h-full bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-6 sm:px-8 sm:py-10">
        <TripOverview trip={trip} />
        <Constraints document={trip.document} />
        <section className="grid gap-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Your route</h2>
            <p className="text-sm text-muted-foreground">
              Places, daily plans and travel in order
            </p>
          </div>
          <div className="grid gap-4">
            {view.stops.map((stop) => (
              <div className="grid gap-4" key={stop.id}>
                <StopCard
                  stop={stop}
                  possibleStays={view.unassignedStays.filter(
                    (stay) => stay.stopId === stop.id,
                  )}
                />
                {stop.outboundTransports.map((transport) => (
                  <TransportRow
                    key={transport.id}
                    stopNames={stopNames}
                    transport={transport}
                  />
                ))}
              </div>
            ))}
            {view.unassignedDays.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Place not set</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {view.unassignedDays.map((day) => (
                    <DayCard day={day} key={day.id} />
                  ))}
                </CardContent>
              </Card>
            )}
            {view.stops.length === 0 && view.unassignedDays.length === 0 && (
              <Card className="items-center py-12 text-center shadow-none">
                <MapPin className="size-5 text-muted-foreground" />
                <CardHeader>
                  <CardTitle>No days planned yet</CardTitle>
                  <CardDescription>
                    Places and days will appear here as the trip takes shape.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </section>
        <Decisions document={trip.document} />
        <Separator />
        <UnlinkedDetails planningBrief={trip.planningBrief} view={view} />
      </div>
    </article>
  )
}
