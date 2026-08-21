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
      days: completePreviewTrip.document.days.map((day) => ({
        ...day,
        items: day.items.map((item) =>
          item.id === 'transport-taxi'
            ? { ...item, title: 'Airport transfer' }
            : item,
        ),
      })),
      transports: completePreviewTrip.document.transports.map(
        (transport): TripPlanDocument['transports'][number] =>
          transport.id === 'route-train'
            ? { ...transport, from: '   ' }
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
        trip={{
          title: completePreviewTrip.title,
          startDate: completePreviewTrip.startDate,
          endDate: completePreviewTrip.endDate,
          planningBrief: completePreviewTrip.planningBrief,
          document,
        }}
      />,
    )

    expect(markup).toContain('<h1')
    expect(markup).toContain('Prefers early starts.')
    expect(markup).toContain('Asia/Tokyo')
    expect(markup).toContain('10:00–15:00')
    expect(markup).toContain('Yanaka')
    expect(markup).toMatch(/Airport transfer[\s\S]*?>taxi</)
    expect(markup).toContain('Tokyo → Kiso')
    expect(markup).not.toContain('Origin not set → Kiso')
    expect(markup).toContain('Example Hotels')
    expect(markup).toContain('DEMO-STAY')
    expect(markup).toContain('Breakfast included.')
    expect(markup).toContain('Pier 1')
    expect(markup).toContain('Island harbor')
    expect(markup).toContain('16:00–17:00')
    expect(markup).toContain('Boarding closes early.')
    expect(markup).toContain('Cancelled idea')
    expect(markup).toContain('Unsorted research note')
  })

  it('uses singular summary labels', () => {
    const markup = renderToStaticMarkup(
      <TripDetail
        trip={{
          title: sparsePreviewTrip.title,
          startDate: null,
          endDate: null,
          planningBrief: sparsePreviewTrip.planningBrief,
          document: sparsePreviewTrip.document,
        }}
      />,
    )

    expect(markup).toContain('1 stop')
    expect(markup).not.toContain('1 stops')
  })
})
