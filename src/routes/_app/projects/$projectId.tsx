import { useState } from 'react'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'

import { TripDetail } from '@/components/trip-detail-variants'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { normalizeTripPlanDocument } from '@/domain/trip-plan'
import type { TripPlanRevisionPage } from '@/domain/trip-plan-repository'
import type { TripPlanRevisionRow, TripPlanRow } from '@/lib/schema'
import {
  getTripPlanRevision,
  getTripPlanWithRevisionHistory,
  listTripPlanRevisions,
  restoreTripPlanRevision,
} from '@/server/trip-plan-functions'

const revisionTimestamp = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

export const Route = createFileRoute('/_app/projects/$projectId')({
  loader: async ({ params }) => {
    const history = await getTripPlanWithRevisionHistory({
      data: { id: params.projectId },
    })
    if (history.plan === null) throw notFound()
    return { ...history, plan: history.plan }
  },
  component: ProjectPage,
})

function ProjectPage() {
  const { plan, revisions, nextBeforeVersion } = Route.useLoaderData()
  return (
    <TripVersionView
      key={plan.version}
      plan={plan}
      initialPage={{ revisions, nextBeforeVersion }}
    />
  )
}

function TripVersionView({
  plan,
  initialPage,
}: {
  plan: TripPlanRow
  initialPage: TripPlanRevisionPage
}) {
  const router = useRouter()
  const [revisions, setRevisions] = useState(initialPage.revisions)
  const [nextBeforeVersion, setNextBeforeVersion] = useState(
    initialPage.nextBeforeVersion,
  )
  const [selectedVersion, setSelectedVersion] = useState(plan.version)
  const [selectedRevision, setSelectedRevision] =
    useState<TripPlanRevisionRow | null>(null)
  const [loadingVersion, setLoadingVersion] = useState<number | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedTrip = selectedRevision
    ? {
        title: selectedRevision.snapshot.title,
        startDate: selectedRevision.snapshot.startDate,
        endDate: selectedRevision.snapshot.endDate,
        planningBrief: selectedRevision.snapshot.planningBrief,
        document: normalizeTripPlanDocument(selectedRevision.snapshot.document),
      }
    : {
        title: plan.title,
        startDate: plan.startDate,
        endDate: plan.endDate,
        planningBrief: plan.planningBrief,
        document: plan.document,
      }

  async function selectVersion(version: number) {
    if (version === plan.version) {
      setSelectedVersion(version)
      setSelectedRevision(null)
      setError(null)
      return
    }

    setLoadingVersion(version)
    setError(null)
    try {
      const revision = await getTripPlanRevision({
        data: { id: plan.id, revisionVersion: version },
      })
      if (revision === null) throw new Error('Revision not found')
      setSelectedVersion(version)
      setSelectedRevision(revision)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'That version could not be loaded.',
      )
    } finally {
      setLoadingVersion(null)
    }
  }

  async function loadMore() {
    if (nextBeforeVersion === null) return
    setLoadingMore(true)
    setError(null)
    try {
      const page = await listTripPlanRevisions({
        data: { id: plan.id, beforeVersion: nextBeforeVersion },
      })
      setRevisions((current) => [...current, ...page.revisions])
      setNextBeforeVersion(page.nextBeforeVersion)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Older versions could not be loaded.',
      )
    } finally {
      setLoadingMore(false)
    }
  }

  async function restoreSelectedVersion() {
    if (selectedVersion === plan.version) return
    setRestoring(true)
    setError(null)
    try {
      await restoreTripPlanRevision({
        data: {
          id: plan.id,
          expectedVersion: plan.version,
          revisionVersion: selectedVersion,
        },
      })
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The project version could not be restored.',
      )
      setRestoring(false)
      return
    }

    try {
      await router.invalidate()
    } catch {
      setRefreshFailed(true)
      setError('The version was restored, but the page could not refresh.')
    } finally {
      setRestoring(false)
    }
  }

  const versionControl = (
    <div className="flex shrink-0 items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="outline">
            {loadingVersion === null
              ? `Version ${selectedVersion}`
              : 'Loading…'}
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 max-w-[calc(100vw-2rem)]"
        >
          <DropdownMenuLabel>Version history</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={String(selectedVersion)}
            onValueChange={(value) => selectVersion(Number(value))}
          >
            {revisions.map((revision) => (
              <DropdownMenuRadioItem
                key={revision.id}
                value={String(revision.version)}
              >
                <span className="grid min-w-0 flex-1">
                  <span className="font-medium">
                    Version {revision.version}
                    {revision.version === plan.version ? ' · Current' : ''}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {revision.title} ·{' '}
                    {revisionTimestamp.format(new Date(revision.createdAt))} UTC
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          {nextBeforeVersion !== null && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={loadingMore}
                onSelect={(event) => {
                  event.preventDefault()
                  loadMore()
                }}
              >
                {loadingMore ? 'Loading…' : 'Load older versions'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedVersion !== plan.version && (
        <Button
          type="button"
          size="sm"
          disabled={restoring || refreshFailed}
          onClick={restoreSelectedVersion}
        >
          {restoring ? 'Restoring…' : 'Restore'}
        </Button>
      )}
    </div>
  )

  return (
    <main className="min-w-0 flex-1 bg-muted/40">
      {error && (
        <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-8 sm:pt-10">
          <Alert variant="destructive">
            <AlertTitle>Version history</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      <TripDetail headerAction={versionControl} trip={selectedTrip} />
    </main>
  )
}
