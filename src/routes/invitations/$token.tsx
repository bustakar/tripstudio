import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

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
import { getSession } from '@/lib/auth-functions'
import {
  acceptTripPlanInvitation,
  getTripPlanInvitation,
} from '@/server/trip-sharing-functions'

export const Route = createFileRoute('/invitations/$token')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session)
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
  },
  loader: ({ params }) => getTripPlanInvitation({ data: params.token }),
  component: InvitationPage,
})

function InvitationPage() {
  const invitation = Route.useLoaderData()
  const { token } = Route.useParams()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function accept() {
    setPending(true)
    setError(null)
    try {
      const result = await acceptTripPlanInvitation({ data: token })
      await navigate({
        to: '/projects/$projectId',
        params: { projectId: result.tripPlanId },
      })
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The invitation could not be accepted.',
      )
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {invitation
              ? `Join “${invitation.tripTitle}”`
              : 'Invite unavailable'}
          </CardTitle>
          <CardDescription>
            {invitation
              ? `This invitation gives ${invitation.email} shared editing access to the trip.`
              : 'This link is invalid, expired, or belongs to another account.'}
          </CardDescription>
        </CardHeader>
        {error && (
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}
        {invitation && (
          <CardFooter>
            <Button onClick={accept} disabled={pending}>
              {pending
                ? 'Joining…'
                : invitation.accepted
                  ? 'Open trip'
                  : 'Accept invitation'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  )
}
