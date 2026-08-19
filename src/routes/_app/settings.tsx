import { createFileRoute } from '@tanstack/react-router'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { user } = Route.useRouteContext()
  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your TripStudio account.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Authentication is managed by TripStudio.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-md gap-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={user.name} readOnly />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input value={user.email} readOnly />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
