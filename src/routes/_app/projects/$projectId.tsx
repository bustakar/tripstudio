import { useState } from 'react'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'

import { TripDetail } from '@/components/trip-detail-variants'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type {
  TripPlanRevisionPage,
  TripPlanRevisionSummary,
} from '@/domain/trip-plan-repository'
import type { TripPlanRevisionRow } from '@/lib/schema'
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
    <main className="min-w-0 flex-1 bg-muted/40">
      <TripDetail
        trip={{
          title: plan.title,
          startDate: plan.startDate,
          endDate: plan.endDate,
          planningBrief: plan.planningBrief,
          document: plan.document,
        }}
      />
      <VersionHistory
        key={plan.version}
        planId={plan.id}
        currentVersion={plan.version}
        initialPage={{ revisions, nextBeforeVersion }}
      />
    </main>
  )
}

function VersionHistory({
  planId,
  currentVersion,
  initialPage,
}: {
  planId: string
  currentVersion: number
  initialPage: TripPlanRevisionPage
}) {
  const router = useRouter()
  const [revisions, setRevisions] = useState(initialPage.revisions)
  const [nextBeforeVersion, setNextBeforeVersion] = useState(
    initialPage.nextBeforeVersion,
  )
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)
  const [refreshFailed, setRefreshFailed] = useState(false)

  async function loadMore() {
    if (nextBeforeVersion === null) return
    setLoadingMore(true)
    setError(null)
    try {
      const page = await listTripPlanRevisions({
        data: { id: planId, beforeVersion: nextBeforeVersion },
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

  async function restore(revisionVersion: number) {
    setRestoringVersion(revisionVersion)
    setError(null)
    try {
      await restoreTripPlanRevision({
        data: {
          id: planId,
          expectedVersion: currentVersion,
          revisionVersion,
        },
      })
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The project version could not be restored.',
      )
      setRestoringVersion(null)
      return
    }

    try {
      await router.invalidate()
    } catch {
      setRefreshFailed(true)
      setError('The version was restored, but the page could not refresh.')
    } finally {
      setRestoringVersion(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-8">
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertTitle>Version history</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Version history</CardTitle>
          <CardDescription>
            Every saved state is preserved. Restoring creates a new version.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {revisions.map((revision) => (
            <RevisionRow
              key={revision.id}
              revision={revision}
              currentVersion={currentVersion}
              restoring={restoringVersion !== null || refreshFailed}
              onRestore={restore}
            />
          ))}
          {nextBeforeVersion !== null && (
            <div className="flex justify-center px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={loadingMore}
                onClick={loadMore}
              >
                {loadingMore ? 'Loading…' : 'Load older versions'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RevisionRow({
  revision,
  currentVersion,
  restoring,
  onRestore,
}: {
  revision: TripPlanRevisionSummary
  currentVersion: number
  restoring: boolean
  onRestore: (version: number) => Promise<void>
}) {
  const [details, setDetails] = useState<TripPlanRevisionRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const current = revision.version === currentVersion
  const formattedTimestamp = revisionTimestamp.format(
    new Date(revision.createdAt),
  )

  async function loadDetails(open: boolean) {
    if (!open || details || loading) return
    setLoading(true)
    setLoadError(false)
    try {
      const loaded = await getTripPlanRevision({
        data: {
          id: revision.tripPlanId,
          revisionVersion: revision.version,
        },
      })
      if (loaded === null) throw new Error('Revision not found')
      setDetails(loaded)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">Version {revision.version}</span>
          {current && <Badge variant="secondary">Current</Badge>}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {revision.title} · {formattedTimestamp} UTC
        </p>
      </div>
      <Dialog onOpenChange={loadDetails}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            View
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version {revision.version}</DialogTitle>
            <DialogDescription>
              Saved {formattedTimestamp} UTC
            </DialogDescription>
          </DialogHeader>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {loadError && (
            <p className="text-sm text-destructive">
              This snapshot could not be loaded.
            </p>
          )}
          {details && (
            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
              {JSON.stringify(details.snapshot, null, 2)}
            </pre>
          )}
          <DialogFooter showCloseButton>
            {!current && (
              <DialogClose asChild>
                <Button
                  type="button"
                  disabled={restoring}
                  onClick={() => onRestore(revision.version)}
                >
                  {restoring ? 'Restoring…' : 'Restore this version'}
                </Button>
              </DialogClose>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
