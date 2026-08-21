import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TripDetail } from '@/components/trip-detail-variants'
import type { TripPlanDocument } from '@/domain/trip-plan'
import {
  completePreviewTrip,
  sparsePreviewTrip,
} from '@/server/preview-fixtures'

describe('TripDetail', () => {
  it('keeps supported linked and unassigned details visible', () => {
    const document: TripPlanDocument = {
      ...completePreviewTrip.document,
      travelers: [
        ...completePreviewTrip.document.travelers,
        {
          id: 'traveler-long-name',
          name: 'A traveler with a deliberately very long display name',
        },
      ],
      stops: completePreviewTrip.document.stops.map((stop) =>
        stop.id === 'stop-tokyo'
          ? { ...stop, notes: 'Stop line one\nStop line two' }
          : stop,
      ),
      constraints: [
        ...completePreviewTrip.document.constraints,
        { id: 'constraint-lines', text: 'First constraint\nSecond line' },
      ],
      decisions: [
        ...completePreviewTrip.document.decisions,
        { id: 'decision-lines', text: 'First decision\nSecond line' },
      ],
      stays: [
        ...completePreviewTrip.document.stays,
        {
          id: 'stay-cross-stop',
          stopId: 'stop-kyoto',
          title: 'Wrong-city hotel',
          notes: 'Stay line one\nStay line two',
          sourceIds: [],
        },
      ],
      days: completePreviewTrip.document.days.map((day) => ({
        ...day,
        overnightStayId:
          day.id === 'day-tokyo-1'
            ? 'stay-cross-stop'
            : day.id === 'day-unassigned'
              ? 'stay-unassigned'
              : day.overnightStayId,
        notes:
          day.id === 'day-tokyo-1' ? 'Day line one\nDay line two' : day.notes,
        items: day.items.map((item) =>
          item.id === 'transport-taxi'
            ? {
                ...item,
                title: 'Airport transfer',
                from: '   ',
                to: 'Hotel',
                date: '2026-11-05',
              }
            : item,
        ),
      })),
      transports: completePreviewTrip.document.transports.map(
        (transport): TripPlanDocument['transports'][number] =>
          transport.id === 'route-train'
            ? { ...transport, from: '   ' }
            : transport.id === 'route-car'
              ? {
                  ...transport,
                  startTime:
                    'after checking out and collecting all luggage from the hotel',
                }
              : transport.id === 'route-unassigned'
                ? {
                    ...transport,
                    mode: 'ferry',
                    from: 'Pier 1',
                    to: 'Island harbor',
                    date: '2026-11-17',
                    startTime: '16:00',
                    endTime: '17:00',
                    notes: 'Boarding closes early.',
                    bookingIds: ['booking-unlinked'],
                    sourceIds: ['source-unlinked'],
                  }
                : transport,
      ),
    }

    const markup = renderToStaticMarkup(
      <TripDetail
        headerAction={<button type="button">Version 1</button>}
        trip={{
          title: completePreviewTrip.title,
          startDate: completePreviewTrip.startDate,
          endDate: completePreviewTrip.endDate,
          document,
        }}
      />,
    )

    expect(markup).toContain('<h1')
    expect(markup).toContain('<h3')
    expect(markup).toContain('<h4')
    expect(markup).toMatch(/<h4[^>]*>Nov 3, 2026/)
    expect(markup).toMatch(/<h3[^>]*>Place not set<\/h3>/)
    expect(markup).toContain('Prefers early starts.')
    expect(markup).toContain('whitespace-normal')
    expect(markup).toContain('Asia/Tokyo')
    expect(markup).toContain('10:00–15:00')
    expect(markup).toContain('Yanaka')
    expect(markup).toMatch(/Airport transfer[\s\S]*?>taxi</)
    expect(markup).toContain('Nov 5, 2026 · Anytime')
    expect(markup).toContain('Origin not set → Hotel')
    expect(markup).toContain('Tokyo → Kiso')
    expect(markup).not.toContain('Origin not set → Kiso')
    expect(markup).toContain('Example Hotels')
    expect(markup).toContain('DEMO-STAY')
    expect(markup).toContain('Breakfast included.')
    expect(markup).toContain('This stay belongs to Kyoto, not this day’s stop.')
    expect(markup).toContain('Destination: Kyoto')
    expect(markup).toMatch(
      /data-slot="badge"[^>]*whitespace-normal[^>]*>after checking out and collecting all luggage from the hotel/,
    )
    expect(markup).toMatch(
      /whitespace-pre-wrap[^>]*>Stop line one\nStop line two/,
    )
    expect(markup).toMatch(
      /whitespace-pre-wrap[^>]*>Day line one\nDay line two/,
    )
    expect(markup).toMatch(
      /whitespace-pre-wrap[^>]*>Stay line one\nStay line two/,
    )
    expect(markup).toMatch(
      /whitespace-pre-wrap[^>]*>• First constraint\nSecond line/,
    )
    expect(markup).toMatch(
      /whitespace-pre-wrap[^>]*>• First decision\nSecond line/,
    )
    expect(markup).toContain('Pier 1')
    expect(markup).toContain('Island harbor')
    expect(markup).toContain('16:00–17:00')
    expect(markup).toContain('Boarding closes early.')
    expect(markup).toContain('Cancelled idea')
    expect(markup).toContain('Unsorted research note')
    expect(markup).toContain('Version 1')
  })

  it('uses singular summary labels', () => {
    const markup = renderToStaticMarkup(
      <TripDetail
        trip={{
          title: sparsePreviewTrip.title,
          startDate: null,
          endDate: null,
          document: sparsePreviewTrip.document,
        }}
      />,
    )

    expect(markup).toContain('1 stop')
    expect(markup).not.toContain('1 stops')
  })

  it('does not expose the agent planning brief', () => {
    const trip = {
      title: sparsePreviewTrip.title,
      startDate: null,
      endDate: null,
      planningBrief: 'Agent-only working context',
      document: sparsePreviewTrip.document,
    }

    const markup = renderToStaticMarkup(<TripDetail trip={trip} />)

    expect(markup).not.toContain('Trip notes')
    expect(markup).not.toContain('Agent-only working context')
  })

  it('renders relative days without inventing calendar dates', () => {
    const document: TripPlanDocument = {
      ...sparsePreviewTrip.document,
      days: [
        {
          id: 'relative-day',
          stopId: sparsePreviewTrip.document.stops[0]?.id,
          title: 'Nikko day trip',
          items: [],
          bookingIds: [],
          sourceIds: [],
        },
      ],
    }

    const markup = renderToStaticMarkup(
      <TripDetail
        trip={{
          title: sparsePreviewTrip.title,
          startDate: null,
          endDate: null,
          document,
        }}
      />,
    )

    expect(markup).toContain('Date TBD')
    expect(markup).toContain('Nikko day trip')
  })
})
