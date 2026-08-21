import type { ReactNode } from 'react'
import {
  BedDouble,
  Bike,
  BookOpen,
  BusFront,
  CalendarDays,
  CarFront,
  CircleCheck,
  ExternalLink,
  Footprints,
  MapPin,
  Plane,
  Route,
  Ship,
  TicketCheck,
  TrainFront,
  Users,
} from 'lucide-react'
import Markdown from 'react-markdown'

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
type DayItemView = DayView['items'][number]
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
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date),
  }
}

function formatTimeRange(startTime?: string, endTime?: string) {
  if (startTime && endTime) return `${startTime}–${endTime}`
  if (startTime) return startTime
  if (endTime) return `Until ${endTime}`
  return 'Anytime'
}

function nonBlank(value?: string) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function formatDayItemSchedule(item: DayItemView) {
  const time = formatTimeRange(item.startTime, item.endTime)
  return item.kind === 'transport' && item.date
    ? `${formatDate(item.date)} · ${time}`
    : time
}

function BookingDetails({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) return null
  return (
    <div className="grid gap-2">
      {bookings.map((booking) => (
        <Card
          className="gap-2 rounded-md bg-muted/30 p-3 py-3 shadow-none"
          key={booking.id}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <TicketCheck className="size-4 text-muted-foreground" />
              {booking.title}
            </p>
            <Badge className="capitalize" variant="outline">
              {booking.status}
            </Badge>
          </div>
          <p className="text-xs capitalize text-muted-foreground">
            {booking.kind} booking
            {booking.provider ? ` · ${booking.provider}` : ''}
          </p>
          {booking.reference && (
            <p className="text-sm">
              <span className="font-medium">Reference:</span>{' '}
              {booking.reference}
            </p>
          )}
          {booking.notes && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {booking.notes}
            </p>
          )}
        </Card>
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
      </div>
      {stay.notes && (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {stay.notes}
        </p>
      )}
      {stay.showStopName && stay.stopName && (
        <p className="text-sm text-muted-foreground">
          Destination: {stay.stopName}
        </p>
      )}
      {stay.stopMismatch && (
        <p className="text-sm font-medium text-destructive">
          This stay belongs to {stay.stopName ?? stay.stopId}, not this day’s
          stop.
        </p>
      )}
      <BookingDetails bookings={stay.booking ? [stay.booking] : []} />
      <SourceLinks sources={stay.sources} />
    </div>
  )
}

function DayItemRow({ item }: { item: DayItemView }) {
  const from = item.kind === 'transport' ? nonBlank(item.from) : undefined
  const to = item.kind === 'transport' ? nonBlank(item.to) : undefined

  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
      <div className="text-sm font-medium text-muted-foreground">
        {formatDayItemSchedule(item)}
      </div>
      <div className="grid gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">
              {item.kind === 'activity'
                ? item.title
                : item.title || item.mode || 'Local transport'}
            </p>
            {item.kind === 'transport' && item.title && item.mode && (
              <Badge className="capitalize" variant="outline">
                {item.mode}
              </Badge>
            )}
          </div>
          {item.kind === 'activity' && item.place && (
            <p className="text-sm text-muted-foreground">{item.place}</p>
          )}
          {item.kind === 'transport' && (from || to) && (
            <p className="text-sm text-muted-foreground">
              {from ?? 'Origin not set'} → {to ?? 'Destination not set'}
            </p>
          )}
          {item.notes && (
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {item.notes}
            </p>
          )}
        </div>
        <BookingDetails bookings={item.bookings} />
        <SourceLinks sources={item.sources} />
      </div>
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
            <h4 className="text-sm font-semibold leading-none">
              {formatted.date}
              {day.title ? ` · ${day.title}` : ''}
            </h4>
          </div>
        </div>
        {day.notes && (
          <CardDescription className="whitespace-pre-wrap">
            {day.notes}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 px-4">
        {day.items.length > 0 ? (
          <div className="grid gap-4">
            {day.items.map((item) => (
              <DayItemRow item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No plans yet.</p>
        )}
        <BookingDetails bookings={day.bookings} />
        <SourceLinks sources={day.sources} />
        {day.overnightStay && <StayRow stay={day.overnightStay} />}
      </CardContent>
    </Card>
  )
}

function TransportModeIcon({ mode }: { mode: Transport['mode'] }) {
  const className = 'size-4'
  switch (mode) {
    case 'walk':
      return <Footprints className={className} />
    case 'bike':
      return <Bike className={className} />
    case 'car':
    case 'taxi':
      return <CarFront className={className} />
    case 'bus':
      return <BusFront className={className} />
    case 'train':
      return <TrainFront className={className} />
    case 'flight':
      return <Plane className={className} />
    case 'ferry':
      return <Ship className={className} />
    default:
      return <Route className={className} />
  }
}

function TransportRow({
  transport,
  stopNames,
  embedded = false,
}: {
  transport: Transport
  stopNames: Map<string, string>
  embedded?: boolean
}) {
  const from =
    nonBlank(transport.from) ??
    (transport.fromStopId ? stopNames.get(transport.fromStopId) : undefined)
  const to =
    nonBlank(transport.to) ??
    (transport.toStopId ? stopNames.get(transport.toStopId) : undefined)
  const schedule = [
    transport.date ? formatDate(transport.date) : undefined,
    transport.startTime || transport.endTime
      ? formatTimeRange(transport.startTime, transport.endTime)
      : undefined,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <Card
      className={`${embedded ? '' : 'mx-3 sm:mx-8'} gap-3 border-dashed bg-muted/30 py-4 shadow-none`}
    >
      <CardHeader className="px-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="size-9 rounded-full p-0">
            <TransportModeIcon mode={transport.mode} />
          </Badge>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-sm">
                {transport.title || transport.mode || 'Travel'}
              </CardTitle>
              {transport.mode && (
                <Badge className="capitalize" variant="outline">
                  {transport.mode}
                </Badge>
              )}
            </div>
            {(from || to) && (
              <CardDescription>
                {from ?? 'Origin not set'} → {to ?? 'Destination not set'}
              </CardDescription>
            )}
          </div>
          {schedule && (
            <Badge
              className="h-auto max-w-full min-w-0 shrink whitespace-normal text-left"
              variant="outline"
            >
              {schedule}
            </Badge>
          )}
        </div>
      </CardHeader>
      {(transport.notes ||
        transport.bookings.length > 0 ||
        transport.sources.length > 0) && (
        <CardContent className="grid gap-2 px-4">
          {transport.notes && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {transport.notes}
            </p>
          )}
          <BookingDetails bookings={transport.bookings} />
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
        <h3 className="flex items-center gap-2 text-xl font-semibold leading-none">
          <MapPin className="size-5" /> {stop.name}
        </h3>
        <CardDescription>
          {stop.days.length} {stop.days.length === 1 ? 'day' : 'days'}
          {stop.country ? ` · ${stop.country}` : ''}
          {stop.timezone ? ` · ${stop.timezone}` : ''}
        </CardDescription>
        <SourceLinks sources={stop.sources} />
      </CardHeader>
      <CardContent className="grid gap-4">
        {stop.notes && (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {stop.notes}
          </p>
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

function TripOverview({
  trip,
  headerAction,
}: {
  trip: TripDetailData
  headerAction?: ReactNode
}) {
  const confirmed = trip.document.bookings.filter(
    ({ status }) => status === 'confirmed',
  ).length
  return (
    <Card className="gap-5">
      <CardHeader>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="min-w-0">
            <CardDescription>Trip plan</CardDescription>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {trip.title}
            </h1>
          </div>
          {headerAction}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
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
            <Badge
              className="h-auto max-w-full min-w-0 shrink whitespace-normal"
              variant="secondary"
            >
              <Users className="shrink-0" />
              <span className="min-w-0 break-words text-left">
                {trip.document.travelers.map(({ name }) => name).join(', ')}
              </span>
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
        </div>
        {trip.document.travelers.some(({ notes }) => notes) && (
          <div className="grid gap-2 border-t pt-4">
            {trip.document.travelers.map((traveler) =>
              traveler.notes ? (
                <div className="flex gap-2 text-sm" key={traveler.id}>
                  <Users className="mt-0.5 size-4 text-muted-foreground" />
                  <p>
                    <span className="font-medium">{traveler.name}:</span>{' '}
                    <span className="whitespace-pre-wrap text-muted-foreground">
                      {traveler.notes}
                    </span>
                  </p>
                </div>
              ) : null,
            )}
          </div>
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
        <h2 className="flex items-center gap-2 text-base font-semibold leading-none">
          <BookOpen className="size-4" /> Keep in mind
        </h2>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {document.constraints.map(({ id, text }) => (
          <p className="whitespace-pre-wrap" key={id}>
            • {text}
          </p>
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
        <h2 className="flex items-center gap-2 text-base font-semibold leading-none">
          <CircleCheck className="size-4" /> Decisions
        </h2>
        <CardDescription>Choices already made for this trip.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {document.decisions.map(({ id, text }) => (
          <p className="whitespace-pre-wrap" key={id}>
            • {text}
          </p>
        ))}
      </CardContent>
    </Card>
  )
}

function PlanningBrief({ children }: { children: string }) {
  return (
    <Markdown
      components={{
        h1: ({ children: content }) => (
          <h3 className="text-base font-semibold">{content}</h3>
        ),
        h2: ({ children: content }) => (
          <h3 className="text-base font-semibold">{content}</h3>
        ),
        h3: ({ children: content }) => (
          <h4 className="text-sm font-semibold">{content}</h4>
        ),
        h4: ({ children: content }) => (
          <h5 className="text-sm font-semibold">{content}</h5>
        ),
        h5: ({ children: content }) => (
          <h6 className="text-sm font-semibold">{content}</h6>
        ),
        h6: ({ children: content }) => (
          <h6 className="text-sm font-semibold">{content}</h6>
        ),
        p: ({ children: content }) => (
          <p className="text-sm leading-6 text-muted-foreground">{content}</p>
        ),
        ul: ({ children: content }) => (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {content}
          </ul>
        ),
        ol: ({ children: content }) => (
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {content}
          </ol>
        ),
        a: ({ children: content, href }) => (
          <a
            className="font-medium text-foreground underline underline-offset-4"
            href={href}
            rel="noreferrer"
            target="_blank"
          >
            {content}
          </a>
        ),
        blockquote: ({ children: content }) => (
          <blockquote className="border-l-2 pl-3 text-muted-foreground">
            {content}
          </blockquote>
        ),
        hr: () => <Separator />,
      }}
      skipHtml
    >
      {children}
    </Markdown>
  )
}

function UnlinkedDetails({
  view,
  planningBrief,
  stopNames,
}: {
  view: TripView
  planningBrief: string
  stopNames: Map<string, string>
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
            <h2 className="text-lg font-semibold leading-none">Trip notes</h2>
          </CardHeader>
          <CardContent className="grid gap-3">
            <PlanningBrief>{planningBrief}</PlanningBrief>
          </CardContent>
        </Card>
      )}
      {hasUnlinked && (
        <Card className="gap-4 shadow-none">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-none">
              Not linked yet
            </h2>
            <CardDescription>
              Details saved to this trip but not assigned to a place or day.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <BookingDetails bookings={view.unlinkedBookings} />
            <SourceLinks sources={view.unlinkedSources} />
            {view.unassignedTransports.map((transport) => (
              <TransportRow
                embedded
                key={transport.id}
                stopNames={stopNames}
                transport={transport}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function TripDetail({
  trip,
  headerAction,
}: {
  trip: TripDetailData
  headerAction?: ReactNode
}) {
  const view = buildTripPlanView(trip.document)
  const stopNames = new Map(view.stops.map((stop) => [stop.id, stop.name]))
  return (
    <article className="min-h-full bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-6 sm:px-8 sm:py-10">
        <TripOverview headerAction={headerAction} trip={trip} />
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
                  <h3 className="text-lg font-semibold leading-none">
                    Place not set
                  </h3>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {view.unassignedDays.map((day) => (
                    <DayCard day={day} key={day.id} />
                  ))}
                </CardContent>
              </Card>
            )}
            {view.stops.length === 0 && view.unassignedDays.length === 0 && (
              <Card className="items-center gap-3 px-6 py-10 text-center shadow-none">
                <MapPin className="size-5 text-muted-foreground" />
                <CardHeader className="w-full max-w-sm gap-1 px-0">
                  <h3 className="font-semibold leading-none">
                    No days planned yet
                  </h3>
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
        <UnlinkedDetails
          planningBrief={trip.planningBrief}
          stopNames={stopNames}
          view={view}
        />
      </div>
    </article>
  )
}
