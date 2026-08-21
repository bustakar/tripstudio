import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/_app/')({ component: ProjectsPage })
const appRoute = getRouteApi('/_app')
const updatedAtFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

function ProjectsPage() {
  const plans = appRoute.useLoaderData()

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Plans shared between you and connected agents.
        </p>
      </div>
      {plans.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              Connect an agent to create your first project.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <a href={`/projects/${plan.id}`} key={plan.id}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{plan.title}</CardTitle>
                    <Badge variant="secondary">v{plan.version}</Badge>
                  </div>
                  <CardDescription>
                    {plan.planningBrief || 'No planning brief yet.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Updated {updatedAtFormatter.format(new Date(plan.updatedAt))}
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </main>
  )
}
