import type { TripPlanDocument } from '@/domain/trip-plan'

// Public credentials for disposable, isolated PR previews only.
// Email: preview@tripstudio.test
// Password: tripstudio-preview
export const previewUser = {
  name: 'Preview User',
  email: 'preview@tripstudio.test',
  password: 'tripstudio-preview',
} as const

export type PreviewTripFixture = {
  id: string
  title: string
  startDate?: string
  endDate?: string
  planningBrief: string
  document: TripPlanDocument
}

export const completePreviewTrip = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Japan Autumn — Complete Demo',
  startDate: '2026-11-03',
  endDate: '2026-11-18',
  planningBrief:
    'A coverage-complete preview trip with linked and unlinked details, shared stays, daily plans and every supported transport mode.',
  document: {
    schemaVersion: 2,
    travelers: [
      { id: 'traveler-karel', name: 'Karel', notes: 'Prefers early starts.' },
      { id: 'traveler-alex', name: 'Alex' },
    ],
    stops: [
      {
        id: 'stop-tokyo',
        position: 0,
        name: 'Tokyo',
        country: 'Japan',
        timezone: 'Asia/Tokyo',
        notes: 'Arrival and city days.',
        sourceIds: ['source-tokyo'],
      },
      {
        id: 'stop-kiso',
        position: 1,
        name: 'Kiso',
        country: 'Japan',
        sourceIds: [],
      },
      {
        id: 'stop-kyoto',
        position: 2,
        name: 'Kyoto',
        sourceIds: [],
      },
    ],
    days: [
      {
        id: 'day-tokyo-1',
        stopId: 'stop-tokyo',
        date: '2026-11-03',
        title: 'Arrival and old Tokyo',
        notes: 'Keep the afternoon flexible.',
        overnightStayId: 'stay-tokyo',
        bookingIds: ['booking-day'],
        sourceIds: ['source-day'],
        items: [
          {
            id: 'activity-yanaka',
            kind: 'activity',
            title: 'Explore Yanaka and Ueno',
            place: 'Yanaka',
            startTime: '10:00',
            endTime: '15:00',
            notes: 'Start after dropping off luggage.',
            bookingIds: ['booking-activity'],
            sourceIds: ['source-activity'],
          },
          {
            id: 'transport-walk',
            kind: 'transport',
            title: 'Walk through Yanaka',
            mode: 'walk',
            from: 'Nippori Station',
            to: 'Ueno Park',
            startTime: '11:00',
            endTime: '12:00',
            notes: 'Use the quieter side streets.',
            bookingIds: [],
            sourceIds: [],
          },
          {
            id: 'transport-taxi',
            kind: 'transport',
            title: 'Taxi to hotel',
            mode: 'taxi',
            bookingIds: [],
            sourceIds: [],
          },
        ],
      },
      {
        id: 'day-tokyo-2',
        stopId: 'stop-tokyo',
        date: '2026-11-04',
        overnightStayId: 'stay-tokyo',
        bookingIds: [],
        sourceIds: [],
        items: [
          {
            id: 'transport-bike',
            kind: 'transport',
            title: 'Cycle the riverside',
            mode: 'bike',
            bookingIds: [],
            sourceIds: [],
          },
          {
            id: 'transport-bus',
            kind: 'transport',
            title: 'Bus to Shinjuku',
            mode: 'bus',
            bookingIds: [],
            sourceIds: [],
          },
          {
            id: 'activity-dinner',
            kind: 'activity',
            title: 'Dinner in Shinjuku',
            bookingIds: [],
            sourceIds: [],
          },
        ],
      },
      {
        id: 'day-kiso-1',
        stopId: 'stop-kiso',
        date: '2026-11-08',
        title: 'Nakasendo trail',
        overnightStayId: 'stay-kiso',
        bookingIds: [],
        sourceIds: [],
        items: [
          {
            id: 'activity-nakasendo',
            kind: 'activity',
            title: 'Walk from Magome to Tsumago',
            startTime: '09:00',
            bookingIds: [],
            sourceIds: ['source-kiso'],
          },
        ],
      },
      {
        id: 'day-kiso-2',
        stopId: 'stop-kiso',
        date: '2026-11-09',
        overnightStayId: 'stay-kiso',
        bookingIds: [],
        sourceIds: [],
        items: [
          {
            id: 'transport-other',
            kind: 'transport',
            title: 'Ropeway to the viewpoint',
            mode: 'other',
            bookingIds: [],
            sourceIds: [],
          },
        ],
      },
      {
        id: 'day-kyoto-1',
        stopId: 'stop-kyoto',
        date: '2026-11-12',
        title: 'Southern Kyoto',
        overnightStayId: 'stay-kyoto',
        bookingIds: [],
        sourceIds: [],
        items: [
          {
            id: 'activity-fushimi',
            kind: 'activity',
            title: 'Fushimi Inari',
            startTime: '06:30',
            bookingIds: [],
            sourceIds: [],
          },
        ],
      },
      {
        id: 'day-kyoto-2',
        stopId: 'stop-kyoto',
        date: '2026-11-13',
        bookingIds: [],
        sourceIds: [],
        items: [],
      },
      {
        id: 'day-unassigned',
        date: '2026-11-17',
        title: 'Flexible day',
        bookingIds: [],
        sourceIds: [],
        items: [],
      },
    ],
    stays: [
      {
        id: 'stay-tokyo',
        stopId: 'stop-tokyo',
        title: 'Tokyo hotel',
        place: 'Shinjuku',
        notes: 'Near the station.',
        bookingId: 'booking-stay',
        sourceIds: ['source-stay'],
      },
      {
        id: 'stay-kiso',
        stopId: 'stop-kiso',
        title: 'Kiso accommodation',
        sourceIds: [],
      },
      {
        id: 'stay-kyoto',
        stopId: 'stop-kyoto',
        title: 'Kyoto machiya',
        sourceIds: [],
      },
      {
        id: 'stay-unassigned',
        stopId: 'stop-kyoto',
        title: 'Alternative Kyoto hotel',
        sourceIds: [],
      },
    ],
    transports: [
      {
        id: 'route-train',
        kind: 'transport',
        title: 'Travel to Kiso',
        mode: 'train',
        from: 'Tokyo',
        to: 'Kiso',
        fromStopId: 'stop-tokyo',
        toStopId: 'stop-kiso',
        date: '2026-11-08',
        startTime: '07:00',
        endTime: '10:30',
        notes: 'Reserve seats on the limited express.',
        bookingIds: ['booking-transport'],
        sourceIds: ['source-transport'],
      },
      {
        id: 'route-car',
        kind: 'transport',
        title: 'Drive to Kyoto',
        mode: 'car',
        fromStopId: 'stop-kiso',
        toStopId: 'stop-kyoto',
        bookingIds: [],
        sourceIds: [],
      },
      {
        id: 'route-flight',
        kind: 'transport',
        title: 'Possible flight home',
        mode: 'flight',
        fromStopId: 'stop-kyoto',
        bookingIds: [],
        sourceIds: [],
      },
      {
        id: 'route-ferry',
        kind: 'transport',
        title: 'Optional island ferry',
        mode: 'ferry',
        fromStopId: 'stop-kyoto',
        bookingIds: [],
        sourceIds: [],
      },
      {
        id: 'route-unassigned',
        kind: 'transport',
        title: 'Transport not assigned yet',
        bookingIds: [],
        sourceIds: [],
      },
    ],
    bookings: [
      {
        id: 'booking-stay',
        kind: 'stay',
        title: 'Tokyo hotel',
        status: 'confirmed',
        provider: 'Example Hotels',
        reference: 'DEMO-STAY',
        notes: 'Breakfast included.',
      },
      {
        id: 'booking-transport',
        kind: 'transport',
        title: 'Tokyo to Kiso train',
        status: 'reserved',
      },
      {
        id: 'booking-activity',
        kind: 'activity',
        title: 'Yanaka walking tour',
        status: 'considering',
      },
      {
        id: 'booking-day',
        kind: 'other',
        title: 'Arrival-day luggage storage',
        status: 'confirmed',
      },
      {
        id: 'booking-unlinked',
        kind: 'other',
        title: 'Cancelled idea',
        status: 'cancelled',
      },
    ],
    sources: [
      {
        id: 'source-tokyo',
        title: 'Tokyo travel guide',
        url: 'https://www.japan.travel/en/destinations/kanto/tokyo/',
      },
      { id: 'source-day', title: 'Arrival notes' },
      {
        id: 'source-activity',
        title: 'Yanaka guide',
        url: 'https://www.gotokyo.org/en/destinations/northern-tokyo/yanaka-and-nezu/index.html',
      },
      {
        id: 'source-stay',
        title: 'Hotel website',
        url: 'https://example.com/hotel',
      },
      {
        id: 'source-kiso',
        title: 'Nakasendo guide',
        url: 'https://www.japan.travel/en/spot/1367/',
      },
      {
        id: 'source-transport',
        title: 'Rail timetable',
        url: 'https://global.jr-central.co.jp/en/',
      },
      { id: 'source-unlinked', title: 'Unsorted research note' },
    ],
    constraints: [
      { id: 'constraint-pace', text: 'Avoid changing hotels every night.' },
      { id: 'constraint-budget', text: 'Prefer rail over domestic flights.' },
    ],
    decisions: [
      { id: 'decision-kiso', text: 'Stay two nights in Kiso.' },
      { id: 'decision-kyoto', text: 'Use Kyoto as the final base.' },
    ],
  },
} satisfies PreviewTripFixture

export const sparsePreviewTrip = {
  id: '00000000-0000-4000-8000-000000000002',
  title: 'Minimal Weekend — Sparse Demo',
  planningBrief: '',
  document: {
    schemaVersion: 2,
    travelers: [],
    stops: [
      {
        id: 'stop-prague',
        position: 0,
        name: 'Prague',
        sourceIds: [],
      },
    ],
    days: [
      {
        id: 'day-prague',
        stopId: 'stop-prague',
        date: '2026-09-12',
        items: [
          {
            id: 'activity-walk',
            kind: 'activity',
            title: 'Walk through the old town',
            bookingIds: [],
            sourceIds: [],
          },
        ],
        bookingIds: [],
        sourceIds: [],
      },
    ],
    stays: [],
    transports: [],
    bookings: [],
    sources: [],
    constraints: [],
    decisions: [],
  },
} satisfies PreviewTripFixture

export const previewTrips = [completePreviewTrip, sparsePreviewTrip] as const
