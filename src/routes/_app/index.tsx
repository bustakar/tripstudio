import { useState } from 'react'
import { createFileRoute, getRouteApi, useRouter } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTripPlan } from '@/server/trip-plan-functions'

export const Route = createFileRoute('/_app/')({ component: ProjectsPage })
const appRoute = getRouteApi('/_app')

function ProjectsPage() {
  const plans = appRoute.useLoaderData()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const plan = await createTripPlan({ data: { title, planningBrief: '' } })
      await router.invalidate()
      await router.navigate({
        to: '/projects/$projectId',
        params: { projectId: plan.id },
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Plans shared between you and connected agents.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus />
              New project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>
                Give this trip a working title.
              </DialogDescription>
            </DialogHeader>
            <form className="grid gap-4" onSubmit={submit}>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  maxLength={160}
                />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? 'Creating…' : 'Create project'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {plans.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              Create a project here or let a connected agent create one.
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
                  Updated {new Date(plan.updatedAt).toLocaleDateString()}
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </main>
  )
}
