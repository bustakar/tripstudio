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
import type { TripPlanRevisionRow } from '@/lib/schema'
import {
  getTripPlan,
  listTripPlanRevisions,
  restoreTripPlanRevision,
} from '@/server/trip-plan-functions'

export const Route = createFileRoute('/_app/projects/$projectId')({
  loader: async ({ params }) => {
    const [plan, revisions] = await Promise.all([
      getTripPlan({ data: { id: params.projectId } }),
      listTripPlanRevisions({ data: { id: params.projectId } }),
    ])
    if (plan === null) throw notFound()
    return { plan, revisions }
  },
  component: ProjectPage,
})

function ProjectPage() {
  const { plan, revisions } = Route.useLoaderData()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)

  async function restore(revisionVersion: number) {
    setRestoringVersion(revisionVersion)
    setError(null)
    try {
      await restoreTripPlanRevision({
        data: {
          id: plan.id,
          expectedVersion: plan.version,
          revisionVersion,
        },
      })
      await router.invalidate()
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The project version could not be restored.',
      )
    } finally {
      setRestoringVersion(null)
    }
  }

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
      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-8">
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertTitle>Restore failed</AlertTitle>
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
                currentVersion={plan.version}
                restoring={restoringVersion !== null}
                onRestore={restore}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function RevisionRow({
  revision,
  currentVersion,
  restoring,
  onRestore,
}: {
  revision: TripPlanRevisionRow
  currentVersion: number
  restoring: boolean
  onRestore: (version: number) => Promise<void>
}) {
  const current = revision.version === currentVersion

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">Version {revision.version}</span>
          {current && <Badge variant="secondary">Current</Badge>}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {revision.snapshot.title} ·{' '}
          {new Date(revision.createdAt).toLocaleString()}
        </p>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            View
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version {revision.version}</DialogTitle>
            <DialogDescription>
              Saved {new Date(revision.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
            {JSON.stringify(revision.snapshot, null, 2)}
          </pre>
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
