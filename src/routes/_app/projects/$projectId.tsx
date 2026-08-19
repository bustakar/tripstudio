import { useState } from 'react'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getTripPlan, updateTripPlan } from '@/server/trip-plan-functions'

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
  const router = useRouter()
  const [title, setTitle] = useState(plan.title)
  const [brief, setBrief] = useState(plan.planningBrief)
  const [document, setDocument] = useState(
    JSON.stringify(plan.document, null, 2),
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await updateTripPlan({
        data: {
          id: plan.id,
          expectedVersion: plan.version,
          title,
          planningBrief: brief,
          document: JSON.parse(document),
        },
      })
      await router.invalidate()
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The project could not be saved.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{plan.title}</h1>
          <p className="text-sm text-muted-foreground">
            Edit the same project agents read through MCP.
          </p>
        </div>
        <Badge variant="outline">Version {plan.version}</Badge>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Save failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form className="grid gap-6" onSubmit={save}>
        <Card>
          <CardHeader>
            <CardTitle>Project</CardTitle>
            <CardDescription>Searchable project information.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Planning brief</CardTitle>
            <CardDescription>
              Working notes, preferences, possibilities and reactions. Markdown
              is supported.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-72 font-mono"
              value={brief}
              maxLength={12000}
              onChange={(event) => setBrief(event.target.value)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Structured trip</CardTitle>
            <CardDescription>
              The validated canonical document. A friendlier editor can come
              later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-96 font-mono text-xs"
              value={document}
              onChange={(event) => setDocument(event.target.value)}
            />
          </CardContent>
        </Card>
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </main>
  )
}
