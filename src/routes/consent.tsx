import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { getSession } from '@/lib/auth-functions'

export const Route = createFileRoute('/consent')({
  loader: () => getSession(),
  component: ConsentPage,
})

function ConsentPage() {
  const session = Route.useLoaderData()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function decide(accept: boolean) {
    setPending(true)
    const result = await authClient.oauth2.consent({ accept })
    setPending(false)
    if (result.error) setError(result.error.message ?? 'Authorization failed')
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect this agent?</CardTitle>
          <CardDescription>
            The agent will be able to read and update your Trip Studio projects.
            It cannot book or cancel travel.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {session && (
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="truncate text-sm font-medium">
                {session.user.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => void decide(false)}
          >
            Deny
          </Button>
          <Button disabled={pending} onClick={() => void decide(true)}>
            Allow access
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
