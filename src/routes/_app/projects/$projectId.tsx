import { createFileRoute, notFound } from '@tanstack/react-router'

import { TripDetail } from '@/components/trip-detail-variants'
import { getTripPlan } from '@/server/trip-plan-functions'

export const Route = createFileRoute('/_app/projects/$projectId')({
  loader: async ({ params }) => {
    const plan = await getTripPlan({ data: { id: params.projectId } })
    if (plan === null) throw notFound()
    return plan
  },
  component: ProjectPage,
})

function ProjectPage() {
  const plan = Route.useLoaderData()
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
    </main>
  )
}
